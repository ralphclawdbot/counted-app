'use client';

import React, { useState } from 'react';
import { WallpaperConfig, CalendarType, DotShape, DotStyle, DotMode, LifeEvent } from '@/types';
import { DEVICES } from '@/lib/devices';
import { THEME_PRESETS } from '@/lib/presets';
import ColorPicker from './ColorPicker';
import LayerPanel from './LayerPanel';
import { PhotoLayer } from '@/types';

interface StylePanelProps {
  config: WallpaperConfig;
  onConfigChange: (updates: Partial<WallpaperConfig>) => void;
  layers: PhotoLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onReorderLayers: (fromIdx: number, toIdx: number) => void;
  onAddPhoto: () => void;
  lifeEvents: LifeEvent[];
  onRemoveEvent: (weekIndex: number) => void;
  onSave: () => void;
  saveState: { token: string | null; url: string | null; saving: boolean; copied: boolean };
  /** Mobile: hide layers section (rendered separately in its own tab) */
  hideLayers?: boolean;
  /** Mobile: hide save button (shown in sticky header instead) */
  hideSaveButton?: boolean;
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: '12px',
  background: '#111',
  borderRadius: 8,
  border: '1px solid #1a1a1a',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 6,
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 4,
  color: '#ddd',
  // 16px minimum prevents iOS Safari from auto-zooming the page on input focus
  fontSize: 16,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const btnStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 12px',
  background: active ? '#2563eb' : '#222',
  color: active ? 'white' : '#aaa',
  border: active ? '1px solid #3b82f6' : '1px solid #333',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  minHeight: 44,
  minWidth: 44,
});

export default function StylePanel({
  config,
  onConfigChange,
  layers,
  selectedLayerId,
  onSelectLayer,
  onDeleteLayer,
  onToggleVisibility,
  onReorderLayers,
  onAddPhoto,
  lifeEvents,
  onRemoveEvent,
  onSave,
  saveState,
  hideLayers = false,
  hideSaveButton = false,
}: StylePanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedDevice = DEVICES.find((d) => d.width === config.width && d.height === config.height) || DEVICES[3];

  return (
    <div style={{ width: 360, height: '100vh', overflowY: 'auto', padding: '16px', borderRight: '1px solid #1a1a1a', background: '#0a0a0a' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#fff' }}>Counted</h1>
      <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>Your life, counted.</p>

      {/* Calendar Type */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Calendar Type</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['life', 'year', 'goal'] as CalendarType[]).map((t) => (
            <button key={t} style={btnStyle(config.type === t)} onClick={() => onConfigChange({ type: t })}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Device */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Device</span>
        <select
          style={selectStyle}
          value={`${selectedDevice.width}x${selectedDevice.height}`}
          onChange={(e) => {
            const [w, h] = e.target.value.split('x').map(Number);
            onConfigChange({ width: w, height: h });
          }}
        >
          {DEVICES.map((d) => (
            <option key={d.name} value={`${d.width}x${d.height}`}>{d.name} ({d.width}×{d.height})</option>
          ))}
        </select>
      </div>

      {/* Birthday / Lifespan (Life only) */}
      {config.type === 'life' && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Birthday</span>
          <input
            type="date"
            style={inputStyle}
            value={config.birthday || ''}
            onChange={(e) => onConfigChange({ birthday: e.target.value })}
          />
          <span style={{ ...labelStyle, marginTop: 8 }}>Lifespan (years)</span>
          <input
            type="number"
            min={50}
            max={100}
            style={inputStyle}
            value={config.lifespan || 80}
            onChange={(e) => onConfigChange({ lifespan: parseInt(e.target.value) || 80 })}
          />
        </div>
      )}

      {/* Goal dates */}
      {config.type === 'goal' && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Goal Start</span>
          <input
            type="date"
            style={inputStyle}
            value={config.goalStart || ''}
            onChange={(e) => onConfigChange({ goalStart: e.target.value })}
          />
          <span style={{ ...labelStyle, marginTop: 8 }}>Deadline</span>
          <input
            type="date"
            style={inputStyle}
            value={config.deadline || ''}
            onChange={(e) => {
              const deadline = e.target.value;
              if (config.goalStart) {
                const diff = (new Date(deadline).getTime() - new Date(config.goalStart).getTime()) / (24 * 60 * 60 * 1000);
                if (diff > 1825) {
                  alert('Goal deadline must be within 5 years of start date.');
                  return;
                }
              }
              onConfigChange({ deadline });
            }}
          />
        </div>
      )}

      {/* Dot Mode */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Dot Mode</span>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {(['standard', 'emoji', 'symbol'] as DotMode[]).map((m) => (
            <button key={m} style={btnStyle(config.dotMode === m)} onClick={() => onConfigChange({ dotMode: m })}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        {config.dotMode === 'emoji' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>Lived Emoji</span>
              <input style={inputStyle} value={config.emojiLived || '🌳'} onChange={(e) => onConfigChange({ emojiLived: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={labelStyle}>Empty Emoji</span>
              <input style={inputStyle} value={config.emojiEmpty || '🌑'} onChange={(e) => onConfigChange({ emojiEmpty: e.target.value })} />
            </div>
          </div>
        )}
        {config.dotMode === 'symbol' && (
          <>
            <span style={labelStyle}>Symbol</span>
            <select style={selectStyle} value={config.dotSymbol || 'heart'} onChange={(e) => onConfigChange({ dotSymbol: e.target.value })}>
              {['heart', 'star', 'leaf', 'flower', 'moon', 'snow'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Colors */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Colors</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <ColorPicker label="Background" value={config.bg} onChange={(v) => onConfigChange({ bg: v })} />
          <ColorPicker label="Filled" value={config.dotFilled} onChange={(v) => onConfigChange({ dotFilled: v })} />
          <ColorPicker label="Empty" value={config.dotEmpty} onChange={(v) => onConfigChange({ dotEmpty: v })} />
          <ColorPicker label="Current" value={config.dotCurrent} onChange={(v) => onConfigChange({ dotCurrent: v })} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <span style={labelStyle}>Filled Opacity ({config.dotFilledOpacity}%)</span>
            <input type="range" min={0} max={100} value={config.dotFilledOpacity} onChange={(e) => onConfigChange({ dotFilledOpacity: parseInt(e.target.value) })} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={labelStyle}>Empty Opacity ({config.dotEmptyOpacity}%)</span>
            <input type="range" min={0} max={100} value={config.dotEmptyOpacity} onChange={(e) => onConfigChange({ dotEmptyOpacity: parseInt(e.target.value) })} style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Dot Shape & Style */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Dot Shape</span>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {(['circle', 'square', 'rounded', 'diamond'] as DotShape[]).map((s) => (
            <button key={s} style={btnStyle(config.dotShape === s)} onClick={() => onConfigChange({ dotShape: s })}>
              {s}
            </button>
          ))}
        </div>
        <span style={labelStyle}>Dot Style</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['flat', 'glow', 'neon', 'outlined'] as DotStyle[]).map((s) => (
            <button key={s} style={btnStyle(config.dotStyle === s)} onClick={() => onConfigChange({ dotStyle: s })}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Presets */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Theme Presets</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onConfigChange({
                bg: preset.bg,
                dotFilled: preset.dotFilled,
                dotEmpty: preset.dotEmpty,
                dotCurrent: preset.dotCurrent,
                dotFilledOpacity: preset.dotFilledOpacity,
                dotEmptyOpacity: preset.dotEmptyOpacity,
              })}
              style={{
                padding: '4px 10px',
                background: `#${preset.bg}`,
                color: `#${preset.dotFilled}`,
                border: '1px solid #333',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* BG Controls */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Background Blur ({config.bgBlur || 0}px)</span>
        <input type="range" min={0} max={20} value={config.bgBlur || 0} onChange={(e) => onConfigChange({ bgBlur: parseInt(e.target.value) })} style={{ width: '100%' }} />
        <span style={{ ...labelStyle, marginTop: 8 }}>Background Dim ({config.bgDim || 0}%)</span>
        <input type="range" min={0} max={100} value={config.bgDim || 0} onChange={(e) => onConfigChange({ bgDim: parseInt(e.target.value) })} style={{ width: '100%' }} />
      </div>

      {/* Advanced */}
      <div style={sectionStyle}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            padding: 0,
          }}
        >
          Advanced {showAdvanced ? '▲' : '▼'}
        </button>
        {showAdvanced && (
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#aaa', marginBottom: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={config.gradientMode || false} onChange={(e) => onConfigChange({ gradientMode: e.target.checked })} />
              Gradient Mode
            </label>
            {config.gradientMode && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <ColorPicker label="Start" value={config.gradientStart || 'FF0000'} onChange={(v) => onConfigChange({ gradientStart: v })} />
                <ColorPicker label="End" value={config.gradientEnd || '0000FF'} onChange={(v) => onConfigChange({ gradientEnd: v })} />
              </div>
            )}
            {/* Row alignment */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Last Row Alignment</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['left', 'center', 'right'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => onConfigChange({ dotRowAlign: a })}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      background: (config.dotRowAlign || 'left') === a ? '#2563eb' : '#1a1a1a',
                      color: (config.dotRowAlign || 'left') === a ? '#fff' : '#888',
                      border: '1px solid #333',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >{a === 'left' ? '⬅ Left' : a === 'center' ? '⟺ Center' : 'Right ➡'}</button>
                ))}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#aaa', cursor: 'pointer' }}>
              <input type="checkbox" checked={config.showQuote || false} onChange={(e) => onConfigChange({ showQuote: e.target.checked })} />
              Show Daily Quote
            </label>
            {/* Widget position */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Lock Screen Widgets</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {([['none', 'None'], ['bottom', 'Bottom'], ['top', 'Top (iOS 26)']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => onConfigChange({ widgetPosition: val })}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      background: (config.widgetPosition || 'none') === val ? '#2563eb' : '#1a1a1a',
                      color: (config.widgetPosition || 'none') === val ? '#fff' : '#888',
                      border: '1px solid #333',
                      borderRadius: 6,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layer Panel — hidden on mobile (rendered in its own tab) */}
      {!hideLayers && (
        <LayerPanel
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={onSelectLayer}
          onDeleteLayer={onDeleteLayer}
          onToggleVisibility={onToggleVisibility}
          onReorder={onReorderLayers}
          onAddPhoto={onAddPhoto}
        />
      )}

      {/* Life Events (life type only) */}
      {config.type === 'life' && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Life Events</span>
          {lifeEvents.length === 0 ? (
            <p style={{ fontSize: 12, color: '#555' }}>Click any dot on the canvas to mark a milestone.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {lifeEvents
                .sort((a, b) => a.weekIndex - b.weekIndex)
                .map((evt) => {
                  const iconMap: Record<string, string> = { heart: '❤️', star: '⭐', leaf: '🍃', flower: '🌸', moon: '🌙', snow: '❄️' };
                  const d = new Date(evt.date);
                  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <div key={evt.weekIndex} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#ccc' }}>
                      <span>{iconMap[evt.icon] || '⭐'}</span>
                      <span style={{ flex: 1 }}>Week of {dateStr}</span>
                      <button
                        onClick={() => onRemoveEvent(evt.weekIndex)}
                        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14 }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Save Button — hidden on mobile (in sticky header) */}
      {!hideSaveButton && <div style={{ marginTop: 16, marginBottom: 32 }}>
        <button
          onClick={onSave}
          disabled={saveState.saving}
          style={{
            width: '100%',
            padding: '12px',
            background: saveState.saving ? '#333' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: saveState.saving ? 'not-allowed' : 'pointer',
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {saveState.saving ? 'Saving...' : 'Save & Get My URL'}
        </button>

        {saveState.url && (
          <div style={{ marginTop: 12, padding: 12, background: '#111', borderRadius: 8, border: '1px solid #2563eb' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Your wallpaper URL:</div>
            <div style={{ fontSize: 12, color: '#ddd', wordBreak: 'break-all', marginBottom: 8, fontFamily: 'monospace' }}>
              {saveState.url}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(saveState.url!);
                }}
                style={{
                  padding: '6px 14px',
                  background: saveState.copied ? '#16a34a' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {saveState.copied ? 'Copied! ✓' : 'Copy'}
              </button>
              <a
                href={saveState.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '6px 14px',
                  background: '#333',
                  color: '#aaa',
                  borderRadius: 4,
                  fontSize: 12,
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Test →
              </a>
              <a
                href={`/install?token=${saveState.token}`}
                style={{
                  padding: '6px 14px',
                  background: '#333',
                  color: '#aaa',
                  borderRadius: 4,
                  fontSize: 12,
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Setup Instructions →
              </a>
            </div>
          </div>
        )}
      </div>}
    </div>
  );
}
