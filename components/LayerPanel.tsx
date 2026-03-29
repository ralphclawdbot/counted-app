'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  const dragItem = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Suppress unused
  void dragOverIdx;

  useEffect(() => {
    return () => {
      dragItem.current = null;
    };
  }, []);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>Layers</span>
        <button
          onClick={onAddPhoto}
          style={{
            padding: '4px 10px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sortedLayers.map((layer, idx) => (
            <div
              key={layer.id}
              draggable
              onDragStart={() => { dragItem.current = idx; }}
              onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
              onDrop={() => {
                if (dragItem.current !== null && dragItem.current !== idx) {
                  onReorder(dragItem.current, idx);
                }
                dragItem.current = null;
                setDragOverIdx(null);
              }}
              onDragEnd={() => { dragItem.current = null; setDragOverIdx(null); }}
              onClick={() => onSelectLayer(layer.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                background: selectedLayerId === layer.id ? '#1a2a4a' : '#111',
                border: selectedLayerId === layer.id ? '1px solid #2563eb' : '1px solid #222',
                borderRadius: 4,
                cursor: 'grab',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: '#222',
                  flexShrink: 0,
                }}
              >
                <img
                  src={layer.url}
                  alt=""
                  style={{ width: 36, height: 36, objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#ddd' }}>
                  {layer.type === 'bg' ? 'Background' : 'Cutout'}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: layer.visible ? '#888' : '#444',
                  padding: 4,
                }}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? '👁' : '👁‍🗨'}
              </button>
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
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#666',
                  padding: 4,
                }}
                title="Delete layer"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
