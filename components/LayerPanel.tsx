'use client';

import React from 'react';
import { PhotoLayer } from '@/types';

interface LayerPanelProps {
  layers: PhotoLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
  onAddPhoto: () => void;
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function IconChevronUp({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function IconChevronDown({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconEye({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconTrash({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function IconImage({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconScissors({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LayerPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onDeleteLayer,
  onToggleVisibility,
  onReorder,
  onAddPhoto,
}: LayerPanelProps) {
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>Layers</span>
        <button
          onClick={onAddPhoto}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            minHeight: 44,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Photo
        </button>
      </div>

      {sortedLayers.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#555', fontSize: 13, background: '#111', borderRadius: 6 }}>
          No photos yet. Add a background or portrait.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sortedLayers.map((layer, idx) => {
            const isSelected = selectedLayerId === layer.id;
            const isFirst = idx === 0;
            const isLast = idx === sortedLayers.length - 1;

            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px',
                  background: isSelected ? '#1a2a4a' : '#111',
                  border: isSelected ? '1px solid #2563eb' : '1px solid #222',
                  borderRadius: 6,
                  cursor: 'pointer',
                  minHeight: 52,
                }}
              >
                {/* Thumbnail */}
                <div style={{ width: 36, height: 36, borderRadius: 4, overflow: 'hidden', background: '#222', flexShrink: 0 }}>
                  <img src={layer.url} alt="" style={{ width: 36, height: 36, objectFit: 'cover' }} />
                </div>

                {/* Label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: '#ddd' }}>
                    {layer.type === 'bg'
                      ? <IconImage color="#888" />
                      : <IconScissors color="#888" />}
                    {layer.type === 'bg' ? 'Background' : 'Cutout'}
                  </div>
                  <div style={{ fontSize: 11, color: '#555' }}>z:{layer.zIndex}</div>
                </div>

                {/* ↑↓ reorder */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (!isFirst) onReorder(idx, idx - 1); }}
                    disabled={isFirst}
                    style={{
                      width: 28, height: 22,
                      background: isFirst ? '#1a1a1a' : '#2a2a2a',
                      border: 'none', borderRadius: 3,
                      cursor: isFirst ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Move up"
                  >
                    <IconChevronUp color={isFirst ? '#444' : '#aaa'} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (!isLast) onReorder(idx, idx + 1); }}
                    disabled={isLast}
                    style={{
                      width: 28, height: 22,
                      background: isLast ? '#1a1a1a' : '#2a2a2a',
                      border: 'none', borderRadius: 3,
                      cursor: isLast ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Move down"
                  >
                    <IconChevronDown color={isLast ? '#444' : '#aaa'} />
                  </button>
                </div>

                {/* Visibility toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                  style={{
                    width: 36, height: 36,
                    background: 'none', border: 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: layer.visible ? 1 : 0.4,
                  }}
                  title={layer.visible ? 'Hide' : 'Show'}
                >
                  {layer.visible
                    ? <IconEye color="#888" />
                    : <IconEyeOff color="#666" />}
                </button>

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (layer.type === 'bg') {
                      if (confirm('Remove background layer?')) onDeleteLayer(layer.id);
                    } else {
                      onDeleteLayer(layer.id);
                    }
                  }}
                  style={{
                    width: 36, height: 36,
                    background: 'none', border: 'none',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Delete"
                >
                  <IconTrash color="#666" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
