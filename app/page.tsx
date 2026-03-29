'use client';

import React, { useReducer, useCallback, useState, useEffect, useRef } from 'react';
import { WallpaperConfig, PhotoLayer, BgLayer, CutoutLayer, LifeEvent } from '@/types';
import { DEFAULT_DEVICE } from '@/lib/devices';
import StylePanel from '@/components/StylePanel';
import Canvas from '@/components/Canvas';
import LayerPanel from '@/components/LayerPanel';
import LifeEventPopup from '@/components/LifeEventPopup';
import { nanoid } from 'nanoid';

// ── Default Config ──

const DEFAULT_CONFIG: WallpaperConfig = {
  type: 'year',
  width: DEFAULT_DEVICE.width,
  height: DEFAULT_DEVICE.height,
  deviceName: DEFAULT_DEVICE.name,
  birthday: '',
  lifespan: 80,
  bg: '000000',
  dotFilled: 'FFFFFF',
  dotEmpty: '888888',
  dotCurrent: 'FF5722',
  dotFilledOpacity: 100,
  dotEmptyOpacity: 35,
  dotShape: 'circle',
  dotStyle: 'flat',
  dotMode: 'standard',
  bgBlur: 0,
  bgDim: 0,
  dotGapScale: 1,
  lifeEvents: [],
  layers: [],
};

// ── Undo/Redo State ──

interface EditorState {
  config: WallpaperConfig;
}

interface HistoryState {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
}

type HistoryAction =
  | { type: 'SET'; state: EditorState }
  | { type: 'DRAFT'; state: EditorState }
  | { type: 'COMMIT' }
  | { type: 'PUSH_PAST'; state: EditorState }
  | { type: 'UNDO' }
  | { type: 'REDO' };

const MAX_HISTORY = 30;

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'SET':
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: action.state,
        future: [],
      };
    case 'DRAFT':
      // Update present without adding to history (for drag moves)
      return { ...state, present: action.state };
    case 'COMMIT':
      return state;
    case 'PUSH_PAST':
      // Push a specific state to past without changing present (used to save pre-drag snapshot)
      return {
        past: [...state.past, action.state].slice(-MAX_HISTORY),
        present: state.present,
        future: [],
      };
    case 'UNDO':
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future].slice(0, MAX_HISTORY),
      };
    case 'REDO':
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: state.future[0],
        future: state.future.slice(1),
      };
    default:
      return state;
  }
}

// ── Upload Modal ──

function UploadModal({
  onClose,
  onUpload,
  hasBg,
}: {
  onClose: () => void;
  onUpload: (type: 'bg' | 'cutout', file: File) => void;
  hasBg: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'bg' | 'cutout' | null>(null);

  const handleFile = (type: 'bg' | 'cutout') => {
    setUploadType(type);
    fileRef.current?.click();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 24,
          minWidth: 320,
          border: '1px solid #333',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#fff' }}>Add Photo</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => handleFile('bg')}
            style={{
              padding: '12px 16px',
              background: '#222',
              color: '#ddd',
              border: '1px solid #333',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              textAlign: 'left',
            }}
          >
            {hasBg ? '🔄 Replace Background' : '🖼 Add as Background'}
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Fills the entire wallpaper</div>
          </button>
          <button
            onClick={() => handleFile('cutout')}
            style={{
              padding: '12px 16px',
              background: '#222',
              color: '#ddd',
              border: '1px solid #333',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              textAlign: 'left',
            }}
          >
            ✂️ Add as Cutout
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Removes background automatically</div>
          </button>
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '8px',
            background: '#333',
            color: '#aaa',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Cancel
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && uploadType) {
              onUpload(uploadType, file);
              onClose();
            }
          }}
        />
      </div>
    </div>
  );
}

// ── Main Page ──

export default function EditorPage() {
  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: { config: DEFAULT_CONFIG },
    future: [],
  });

  const config = history.present.config;
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [popupState, setPopupState] = useState<{
    weekIndex: number;
    position: { x: number; y: number };
  } | null>(null);
  const [saveState, setSaveState] = useState<{
    token: string | null;
    url: string | null;
    saving: boolean;
    copied: boolean;
  }>({ token: null, url: null, saving: false, copied: false });
  const [mobileTab, setMobileTab] = useState<'style' | 'layers'>('style');
  const preDragRef = useRef<WallpaperConfig | null>(null);

  // Load token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('counted_token');
    if (token) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      setSaveState((s) => ({ ...s, token, url: `${appUrl}/api/w/${token}` }));
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          dispatch({ type: 'REDO' });
        } else {
          dispatch({ type: 'UNDO' });
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          deleteLayer(selectedLayerId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayerId]);

  // ── Config update (with undo) ──

  const updateConfig = useCallback((updates: Partial<WallpaperConfig>) => {
    dispatch({
      type: 'SET',
      state: { config: { ...config, ...updates } },
    });
  }, [config]);

  // ── Layer operations ──

  const updateLayer = useCallback((id: string, updates: Partial<PhotoLayer>) => {
    // Save pre-drag state on the FIRST update of a drag gesture (before any DRAFT dispatches)
    if (!preDragRef.current) {
      preDragRef.current = config;
    }
    const newLayers = (config.layers || []).map((l) => {
      if (l.id !== id) return l;
      if (l.type === 'bg') return { ...l, ...updates } as BgLayer;
      return { ...l, ...updates } as CutoutLayer;
    });
    dispatch({
      type: 'DRAFT',
      state: { config: { ...config, layers: newLayers } },
    });
  }, [config]);

  const commitDrag = useCallback(() => {
    // Push the pre-drag state into history so Undo correctly reverts to before the drag started.
    // (DRAFT dispatches update present without touching past — past still has pre-drag state)
    if (preDragRef.current) {
      dispatch({ type: 'PUSH_PAST', state: { config: preDragRef.current } });
      preDragRef.current = null;
    }
  }, []);

  const deleteLayer = useCallback((id: string) => {
    const newLayers = (config.layers || []).filter((l) => l.id !== id);
    dispatch({
      type: 'SET',
      state: { config: { ...config, layers: newLayers } },
    });
    if (selectedLayerId === id) setSelectedLayerId(null);
  }, [config, selectedLayerId]);

  const toggleVisibility = useCallback((id: string) => {
    const newLayers = (config.layers || []).map((l) =>
      l.id === id ? { ...l, visible: !l.visible } : l
    );
    dispatch({
      type: 'SET',
      state: { config: { ...config, layers: newLayers } },
    });
  }, [config]);

  const reorderLayers = useCallback((fromIdx: number, toIdx: number) => {
    const sorted = [...(config.layers || [])].sort((a, b) => b.zIndex - a.zIndex);
    const [moved] = sorted.splice(fromIdx, 1);
    sorted.splice(toIdx, 0, moved);
    // Reassign zIndex
    const updated = sorted.map((l, i) => ({ ...l, zIndex: sorted.length - 1 - i }));
    dispatch({
      type: 'SET',
      state: { config: { ...config, layers: updated } },
    });
  }, [config]);

  // ── Upload handler ──

  const handleUpload = useCallback(async (type: 'bg' | 'cutout', file: File) => {
    setUploadProgress(type === 'cutout' ? 'Removing background...' : 'Uploading...');

    let uploadFile = file;

    if (type === 'cutout') {
      try {
        const { removeBackground } = await import('@imgly/background-removal');
        const blob = await removeBackground(file, {
          output: { format: 'image/png' },
        });
        uploadFile = new File([blob], 'cutout.png', { type: 'image/png' });
      } catch (err) {
        console.error('BG removal failed, using original:', err);
      }
    }

    setUploadProgress('Uploading...');

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Upload failed');
        setUploadProgress(null);
        return;
      }
      const data = await res.json();

      const maxZ = (config.layers || []).reduce((max, l) => Math.max(max, l.zIndex), -1);

      let newLayer: PhotoLayer;
      if (type === 'bg') {
        // Replace existing bg layer
        const existingLayers = (config.layers || []).filter((l) => l.type !== 'bg');
        newLayer = {
          id: nanoid(),
          type: 'bg',
          url: data.url,
          layerSize: 100,
          opacity: 100,
          naturalW: data.width,
          naturalH: data.height,
          zIndex: 0,
          visible: true,
          panX: 50,
          panY: 50,
        } as BgLayer;
        // Ensure bg is always lowest z
        const updated = existingLayers.map((l) => ({ ...l, zIndex: l.zIndex + 1 }));
        dispatch({
          type: 'SET',
          state: { config: { ...config, layers: [newLayer, ...updated] } },
        });
      } else {
        newLayer = {
          id: nanoid(),
          type: 'cutout',
          url: data.url,
          layerSize: 60,
          opacity: 100,
          naturalW: data.width,
          naturalH: data.height,
          zIndex: maxZ + 1,
          visible: true,
          x: 50,
          y: 50,
        } as CutoutLayer;
        dispatch({
          type: 'SET',
          state: { config: { ...config, layers: [...(config.layers || []), newLayer] } },
        });
      }

      setSelectedLayerId(newLayer.id);
      setUploadProgress('Done ✓');
      setTimeout(() => setUploadProgress(null), 1500);
    } catch {
      alert('Upload failed');
      setUploadProgress(null);
    }
  }, [config]);

  // ── Life Events ──

  const handleDotClick = useCallback((weekIndex: number) => {
    if (config.type !== 'life') return;
    if (!config.birthday) {
      alert('Enter your birthday first to place life events');
      return;
    }
    if ((config.lifeEvents || []).length >= 50) {
      alert('Maximum 50 life events');
      return;
    }
    // On mobile: center the popup. On desktop: position near canvas.
    const isMobileNow = window.innerWidth < 768;
    const popupW = 220;
    const popupH = 220;
    const x = isMobileNow
      ? (window.innerWidth - popupW) / 2
      : Math.min(window.innerWidth - popupW - 16, 520);
    const y = isMobileNow
      ? (window.innerHeight - popupH) / 2
      : Math.min(window.innerHeight - popupH - 16, 300);
    setPopupState({ weekIndex, position: { x, y } });
  }, [config.type, config.birthday, config.lifeEvents]);

  const saveEvent = useCallback((weekIndex: number, icon: string) => {
    if (!config.birthday) return;
    const birth = new Date(config.birthday + 'T00:00:00');
    const eventDate = new Date(birth.getTime() + weekIndex * 7 * 24 * 60 * 60 * 1000);
    const dateStr = eventDate.toISOString().split('T')[0];

    const existing = (config.lifeEvents || []).filter((e) => e.weekIndex !== weekIndex);
    const newEvent: LifeEvent = { weekIndex, icon, date: dateStr };
    updateConfig({ lifeEvents: [...existing, newEvent] });
    setPopupState(null);
  }, [config.birthday, config.lifeEvents, updateConfig]);

  const removeEvent = useCallback((weekIndex: number) => {
    const updated = (config.lifeEvents || []).filter((e) => e.weekIndex !== weekIndex);
    updateConfig({ lifeEvents: updated });
    setPopupState(null);
  }, [config.lifeEvents, updateConfig]);

  // ── Save ──

  const handleSave = useCallback(async () => {
    setSaveState((s) => ({ ...s, saving: true }));

    const body = saveState.token
      ? { token: saveState.token, config }
      : { config };

    const method = saveState.token ? 'PUT' : 'POST';

    try {
      const res = await fetch('/api/configs', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (data.token) {
        localStorage.setItem('counted_token', data.token);
        setSaveState({ token: data.token, url: data.url, saving: false, copied: false });
      } else {
        setSaveState((s) => ({ ...s, saving: false }));
      }
    } catch {
      alert('Save failed');
      setSaveState((s) => ({ ...s, saving: false }));
    }
  }, [config, saveState.token]);

  const handleCopy = useCallback(() => {
    if (saveState.url) {
      navigator.clipboard.writeText(saveState.url);
      setSaveState((s) => ({ ...s, copied: true }));
      setTimeout(() => setSaveState((s) => ({ ...s, copied: false })), 2000);
    }
  }, [saveState.url]);

  const existingEvent = popupState
    ? (config.lifeEvents || []).find((e) => e.weekIndex === popupState.weekIndex)
    : undefined;

  const weekDate = popupState && config.birthday
    ? (() => {
        const birth = new Date(config.birthday + 'T00:00:00');
        const d = new Date(birth.getTime() + popupState.weekIndex * 7 * 24 * 60 * 60 * 1000);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      })()
    : '';

  // Shared canvas + modals (used in both desktop and mobile layouts)
  const canvasEl = (
    <Canvas
      config={config}
      selectedLayerId={selectedLayerId}
      onSelectLayer={setSelectedLayerId}
      onUpdateLayer={updateLayer}
      onDragEnd={commitDrag}
      onDotClick={handleDotClick}
    />
  );

  const modals = (
    <>
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          hasBg={(config.layers || []).some((l) => l.type === 'bg')}
        />
      )}
      {popupState && (
        <LifeEventPopup
          weekIndex={popupState.weekIndex}
          weekDate={weekDate}
          existingIcon={existingEvent?.icon}
          onSave={saveEvent}
          onRemove={removeEvent}
          onClose={() => setPopupState(null)}
          position={popupState.position}
        />
      )}
    </>
  );

  return (
    <>
      {/* ── DESKTOP LAYOUT (≥768px) ── */}
      <div className="desktop-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid #1a1a1a' }}>
            <button
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={history.past.length === 0}
              style={{ padding: '4px 10px', background: '#222', color: history.past.length === 0 ? '#444' : '#aaa', border: '1px solid #333', borderRadius: 4, cursor: history.past.length === 0 ? 'not-allowed' : 'pointer', fontSize: 12 }}
            >Undo</button>
            <button
              onClick={() => dispatch({ type: 'REDO' })}
              disabled={history.future.length === 0}
              style={{ padding: '4px 10px', background: '#222', color: history.future.length === 0 ? '#444' : '#aaa', border: '1px solid #333', borderRadius: 4, cursor: history.future.length === 0 ? 'not-allowed' : 'pointer', fontSize: 12 }}
            >Redo</button>
            <div style={{ flex: 1 }} />
            {uploadProgress && <span style={{ fontSize: 12, color: '#888' }}>{uploadProgress}</span>}
            <button
              onClick={() => { if (confirm('Reset all settings to defaults?')) { dispatch({ type: 'SET', state: { config: DEFAULT_CONFIG } }); setSelectedLayerId(null); } }}
              style={{ padding: '4px 10px', background: '#222', color: '#888', border: '1px solid #333', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
            >Reset</button>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: 24 }}>
            {canvasEl}
          </div>
        </div>

        <StylePanel
          config={config}
          onConfigChange={updateConfig}
          layers={config.layers || []}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onDeleteLayer={deleteLayer}
          onToggleVisibility={toggleVisibility}
          onReorderLayers={reorderLayers}
          onAddPhoto={() => setShowUploadModal(true)}
          lifeEvents={config.lifeEvents || []}
          onRemoveEvent={removeEvent}
          onSave={handleSave}
          saveState={saveState}
        />

        {modals}
      </div>

      {/* ── MOBILE LAYOUT (<768px) ── */}
      <div className="mobile-layout" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
        {/* Sticky header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderBottom: '1px solid #1a1a1a', background: '#0a0a0a',
          flexShrink: 0,
        }}>
          <div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Counted</span>
            {uploadProgress && <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>{uploadProgress}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={history.past.length === 0}
              style={{ padding: '6px 10px', background: '#222', color: history.past.length === 0 ? '#444' : '#aaa', border: '1px solid #333', borderRadius: 6, fontSize: 13, minHeight: 36 }}
            >↩</button>
            <button
              onClick={handleSave}
              disabled={saveState.saving}
              style={{ padding: '6px 16px', background: saveState.saving ? '#333' : '#2563eb', color: 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, minHeight: 36 }}
            >{saveState.saving ? '...' : 'Save'}</button>
          </div>
        </div>

        {/* Preview strip — shows a quick-preview button instead of the full phone frame
            (phone frame = same dimensions as the screen, can't meaningfully scale it) */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          background: '#0f0f0f',
          borderBottom: '1px solid #1a1a1a',
        }}>
          <div style={{ flex: 1, fontSize: 12, color: '#555' }}>
            {config.birthday ? `Life calendar · ${config.type}` : 'Set your birthday to preview your calendar'}
          </div>
          <a
            href={`/api/wallpaper?type=${config.type}&birthday=${config.birthday || ''}&width=${config.width}&height=${config.height}&bg=${config.bg}&dotFilled=${config.dotFilled}&dotEmpty=${config.dotEmpty}&dotCurrent=${config.dotCurrent}&dotFilledOpacity=${config.dotFilledOpacity}&dotEmptyOpacity=${config.dotEmptyOpacity}&dotShape=${config.dotShape}&dotStyle=${config.dotStyle}&dotMode=${config.dotMode}${config.showQuote ? '&showQuote=true' : ''}${config.goalName ? `&goalName=${encodeURIComponent(config.goalName)}` : ''}${config.fontFamily ? `&fontFamily=${encodeURIComponent(config.fontFamily)}` : ''}${config.dotGapScale && config.dotGapScale !== 1 ? `&dotGapScale=${config.dotGapScale}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 14px',
              background: '#222',
              color: '#aaa',
              border: '1px solid #333',
              borderRadius: 6,
              fontSize: 13,
              textDecoration: 'none',
              flexShrink: 0,
              minHeight: 36,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            👁 Preview PNG
          </a>
        </div>

        {/* Saved URL strip */}
        {saveState.url && (
          <div style={{ padding: '8px 16px', background: '#0a1628', borderTop: '1px solid #1a3a6a', borderBottom: '1px solid #1a3a6a', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: '#4a9eff', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{saveState.url}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(saveState.url!); }}
              style={{ padding: '4px 10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, flexShrink: 0, minHeight: 32 }}
            >{saveState.copied ? '✓' : 'Copy'}</button>
            <a href={`/install?token=${saveState.token}`} style={{ padding: '4px 10px', background: '#333', color: '#aaa', borderRadius: 4, fontSize: 12, textDecoration: 'none', flexShrink: 0 }}>
              Setup →
            </a>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', background: '#0a0a0a', flexShrink: 0 }}>
          {(['style', 'layers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              style={{
                flex: 1, padding: '10px', border: 'none', background: 'none',
                color: mobileTab === tab ? '#fff' : '#555',
                borderBottom: mobileTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                fontSize: 13, fontWeight: mobileTab === tab ? 600 : 400, cursor: 'pointer',
              }}
            >
              {tab === 'style' ? '🎨 Style' : '📷 Layers'}
            </button>
          ))}
        </div>

        {/* Scrollable panel content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {mobileTab === 'style' ? (
            <StylePanel
              config={config}
              onConfigChange={updateConfig}
              layers={config.layers || []}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onDeleteLayer={deleteLayer}
              onToggleVisibility={toggleVisibility}
              onReorderLayers={reorderLayers}
              onAddPhoto={() => setShowUploadModal(true)}
              lifeEvents={config.lifeEvents || []}
              onRemoveEvent={removeEvent}
              onSave={handleSave}
              saveState={saveState}
              hideLayers
              hideSaveButton
            />
          ) : (
            <LayerPanel
              layers={config.layers || []}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onDeleteLayer={deleteLayer}
              onToggleVisibility={toggleVisibility}
              onReorder={reorderLayers}
              onAddPhoto={() => setShowUploadModal(true)}
            />
          )}
        </div>

        {modals}
      </div>

      {/* CSS to show/hide layouts based on screen width */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-layout { display: flex !important; }
          .mobile-layout { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-layout { display: none !important; }
          .mobile-layout { display: flex !important; }
          :root {
            --mobile-canvas-scale: calc((100vw - 32px) / 398);
          }
        }
      `}</style>
    </>
  );
}
