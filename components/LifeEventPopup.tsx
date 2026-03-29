'use client';

import React, { useState } from 'react';

const ICONS = [
  { id: 'heart', label: '❤️' },
  { id: 'star', label: '⭐' },
  { id: 'leaf', label: '🍃' },
  { id: 'flower', label: '🌸' },
  { id: 'moon', label: '🌙' },
  { id: 'snow', label: '❄️' },
];

interface LifeEventPopupProps {
  weekIndex: number;
  weekDate: string;     // formatted date
  existingIcon?: string;
  onSave: (weekIndex: number, icon: string) => void;
  onRemove: (weekIndex: number) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export default function LifeEventPopup({
  weekIndex,
  weekDate,
  existingIcon,
  onSave,
  onRemove,
  onClose,
  position,
}: LifeEventPopupProps) {
  const [selectedIcon, setSelectedIcon] = useState(existingIcon || 'star');

  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 8,
        padding: 16,
        zIndex: 10000,
        minWidth: 200,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Week {weekIndex}</div>
      <div style={{ fontSize: 14, color: '#ccc', marginBottom: 12 }}>{weekDate}</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {ICONS.map((icon) => (
          <button
            key={icon.id}
            onClick={() => setSelectedIcon(icon.id)}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              border: selectedIcon === icon.id ? '2px solid #FFD700' : '2px solid #333',
              borderRadius: 6,
              background: selectedIcon === icon.id ? 'rgba(255,215,0,0.1)' : '#222',
              cursor: 'pointer',
            }}
          >
            {icon.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onSave(weekIndex, selectedIcon)}
          style={{
            flex: 1,
            padding: '6px 12px',
            background: '#FFD700',
            color: '#000',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Save
        </button>
        {existingIcon && (
          <button
            onClick={() => onRemove(weekIndex)}
            style={{
              padding: '6px 12px',
              background: '#333',
              color: '#f66',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Remove
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            padding: '6px 12px',
            background: '#333',
            color: '#aaa',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
