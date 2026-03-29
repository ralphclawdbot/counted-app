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
          + Add Photo
        </button>
      </div>

      {sortedLayers.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', color: '#555', fontSize: 13, background: '#111', borderRadius: 6 }}>
          No photos yet. Add a background or portrait.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sortedLayers.map((layer, idx) => (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px',
                background: selectedLayerId === layer.id ? '#1a2a4a' : '#111',
                border: selectedLayerId === layer.id ? '1px solid #2563eb' : '1px solid #222',
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
                <div style={{ fontSize: 12, fontWeight: 500, color: '#ddd' }}>
                  {layer.type === 'bg' ? '🖼 Background' : '✂️ Cutout'}
                </div>
                <div style={{ fontSize: 11, color: '#555' }}>z:{layer.zIndex}</div>
              </div>

              {/* ↑↓ reorder — replaces HTML5 drag (which doesn't work on touch) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); if (idx > 0) onReorder(idx, idx - 1); }}
                  disabled={idx === 0}
                  style={{
                    width: 28, height: 22,
                    background: idx === 0 ? '#1a1a1a' : '#333',
                    color: idx === 0 ? '#444' : '#aaa',
                    border: 'none', borderRadius: 3,
                    cursor: idx === 0 ? 'default' : 'pointer',
                    fontSize: 12, lineHeight: 1,
                  }}
                  title="Move up"
                >▲</button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (idx < sortedLayers.length - 1) onReorder(idx, idx + 1); }}
                  disabled={idx === sortedLayers.length - 1}
                  style={{
                    width: 28, height: 22,
                    background: idx === sortedLayers.length - 1 ? '#1a1a1a' : '#333',
                    color: idx === sortedLayers.length - 1 ? '#444' : '#aaa',
                    border: 'none', borderRadius: 3,
                    cursor: idx === sortedLayers.length - 1 ? 'default' : 'pointer',
                    fontSize: 12, lineHeight: 1,
                  }}
                  title="Move down"
                >▼</button>
              </div>

              {/* Visibility toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                style={{
                  width: 36, height: 36,
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 16,
                  color: layer.visible ? '#888' : '#444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title={layer.visible ? 'Hide' : 'Show'}
              >
                {layer.visible ? '👁' : '👁‍🗨'}
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
                  cursor: 'pointer', fontSize: 16, color: '#666',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Delete"
              >🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
