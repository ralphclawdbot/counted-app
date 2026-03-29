'use client';

import React from 'react';

interface ColorPickerProps {
  label: string;
  value: string; // hex without #
  onChange: (hex: string) => void;
}

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <input
        type="color"
        value={`#${value}`}
        onChange={(e) => onChange(e.target.value.replace('#', ''))}
        style={{
          width: 28,
          height: 28,
          border: '2px solid #333',
          borderRadius: 4,
          cursor: 'pointer',
          background: 'none',
          padding: 0,
        }}
      />
      <span style={{ fontSize: 13, color: '#aaa' }}>{label}</span>
    </label>
  );
}
