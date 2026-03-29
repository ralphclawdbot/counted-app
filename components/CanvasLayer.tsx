'use client';

import React, { useRef, useCallback, useState } from 'react';
import { PhotoLayer, BgLayer, CutoutLayer } from '@/types';

interface CanvasLayerProps {
  layer: PhotoLayer;
  canvasWidth: number;
  canvasHeight: number;
  canvasScale: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<PhotoLayer>) => void;
  onDragEnd: () => void;
}

function BgLayerComponent({
  layer,
  canvasWidth,
  canvasHeight,
  isSelected,
  onSelect,
  onUpdate,
  onDragEnd,
}: {
  layer: BgLayer;
  canvasWidth: number;
  canvasHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<BgLayer>) => void;
  onDragEnd: () => void;
}) {
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: layer.zIndex,
        cursor: isSelected ? 'grab' : 'pointer',
        outline: isSelected ? '2px dashed rgba(255,255,255,0.7)' : 'none',
        overflow: 'hidden',
        opacity: layer.visible ? layer.opacity / 100 : 0,
        // Prevent browser scroll/zoom interference during drag on touch
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={(e) => {
        if (!isSelected) return;
        e.preventDefault();
        e.stopPropagation();
        dragStartRef.current = { startX: e.clientX, startY: e.clientY, origX: layer.panX, origY: layer.panY };

        const handleMove = (ev: PointerEvent) => {
          if (!dragStartRef.current) return;
          const dx = ev.clientX - dragStartRef.current.startX;
          const dy = ev.clientY - dragStartRef.current.startY;
          const newPanX = Math.max(0, Math.min(100, dragStartRef.current.origX - (dx / canvasWidth) * 100));
          const newPanY = Math.max(0, Math.min(100, dragStartRef.current.origY - (dy / canvasHeight) * 100));
          onUpdate({ panX: newPanX, panY: newPanY });
        };
        const handleUp = () => {
          dragStartRef.current = null;
          onDragEnd();
          window.removeEventListener('pointermove', handleMove);
          window.removeEventListener('pointerup', handleUp);
        };
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
      }}
    >
      {!imgLoaded && (
        <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 12 }}>
          Loading...
        </div>
      )}
      <img
        src={layer.url}
        alt=""
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${layer.panX}% ${layer.panY}%`,
          display: imgLoaded ? 'block' : 'none',
        }}
      />
    </div>
  );
}

function CutoutLayerComponent({
  layer,
  canvasWidth,
  canvasHeight,
  isSelected,
  onSelect,
  onUpdate,
  onDragEnd,
}: {
  layer: CutoutLayer;
  canvasWidth: number;
  canvasHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CutoutLayer>) => void;
  onDragEnd: () => void;
}) {
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeStartRef = useRef<{ startX: number; startY: number; origSize: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const cssW = canvasWidth * (layer.layerSize / 100);
  const cssH = layer.naturalW > 0 ? cssW * (layer.naturalH / layer.naturalW) : cssW;
  const left = (layer.x / 100) * canvasWidth - cssW / 2;
  const top = (layer.y / 100) * canvasHeight - cssH / 2;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isResizing) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, origX: layer.x, origY: layer.y };

    const handleMove = (ev: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = ev.clientX - dragStartRef.current.startX;
      const dy = ev.clientY - dragStartRef.current.startY;
      const newX = dragStartRef.current.origX + (dx / canvasWidth) * 100;
      const newY = dragStartRef.current.origY + (dy / canvasHeight) * 100;
      onUpdate({ x: newX, y: newY });
    };
    const handleUp = () => {
      dragStartRef.current = null;
      onDragEnd();
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [layer.x, layer.y, canvasWidth, canvasHeight, onUpdate, onDragEnd, onSelect, isResizing]);

  const handleResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = { startX: e.clientX, startY: e.clientY, origSize: layer.layerSize };

    const handleMove = (ev: PointerEvent) => {
      if (!resizeStartRef.current) return;
      const dx = ev.clientX - resizeStartRef.current.startX;
      const dy = ev.clientY - resizeStartRef.current.startY;
      const delta = (dx + dy) / 2;
      const newSize = Math.max(10, Math.min(200, resizeStartRef.current.origSize + (delta / canvasWidth) * 100));
      onUpdate({ layerSize: newSize });
    };
    const handleUp = () => {
      resizeStartRef.current = null;
      setIsResizing(false);
      onDragEnd();
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [layer.layerSize, canvasWidth, onUpdate, onDragEnd]);

  // 44px hit target wrapper around the visible 8px handle dot
  const resizeHandle = (corner: string) => {
    const wrapPos: React.CSSProperties = {};
    const dotPos: React.CSSProperties = {};
    if (corner.includes('top')) { wrapPos.top = -22; dotPos.top = 14; }
    if (corner.includes('bottom')) { wrapPos.bottom = -22; dotPos.bottom = 14; }
    if (corner.includes('left')) { wrapPos.left = -22; dotPos.left = 14; }
    if (corner.includes('right')) { wrapPos.right = -22; dotPos.right = 14; }
    return (
      <div
        key={corner}
        onPointerDown={handleResize}
        style={{
          position: 'absolute',
          ...wrapPos,
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'nwse-resize',
          zIndex: 10,
          touchAction: 'none',
        }}
      >
        <div style={{
          width: 10,
          height: 10,
          background: 'white',
          border: '1.5px solid #666',
          borderRadius: 3,
        }} />
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: cssW,
        height: cssH,
        zIndex: layer.zIndex,
        cursor: 'move',
        outline: isSelected ? '2px dashed rgba(255,255,255,0.7)' : 'none',
        opacity: layer.visible ? layer.opacity / 100 : 0,
        pointerEvents: layer.visible ? 'auto' : 'none',
        // Prevent scroll hijacking on touch during drag
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
    >
      {!imgLoaded && (
        <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 10, borderRadius: 4 }}>
          Loading...
        </div>
      )}
      <img
        src={layer.url}
        alt=""
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgLoaded(true)}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: imgLoaded ? 'block' : 'none',
          pointerEvents: 'none',
        }}
      />
      {isSelected && (
        <>
          {resizeHandle('top-left')}
          {resizeHandle('top-right')}
          {resizeHandle('bottom-left')}
          {resizeHandle('bottom-right')}
        </>
      )}
    </div>
  );
}

export default function CanvasLayer({
  layer,
  canvasWidth,
  canvasHeight,
  canvasScale,
  isSelected,
  onSelect,
  onUpdate,
  onDragEnd,
}: CanvasLayerProps) {
  void canvasScale;

  if (layer.type === 'bg') {
    return (
      <BgLayerComponent
        layer={layer}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        isSelected={isSelected}
        onSelect={onSelect}
        onUpdate={onUpdate as (updates: Partial<BgLayer>) => void}
        onDragEnd={onDragEnd}
      />
    );
  }

  return (
    <CutoutLayerComponent
      layer={layer as CutoutLayer}
      canvasWidth={canvasWidth}
      canvasHeight={canvasHeight}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate as (updates: Partial<CutoutLayer>) => void}
      onDragEnd={onDragEnd}
    />
  );
}
