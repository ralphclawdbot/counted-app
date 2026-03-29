'use client';

import React, { useMemo } from 'react';
import { WallpaperConfig, PhotoLayer } from '@/types';
import { DEVICES } from '@/lib/devices';
import DotGrid from './DotGrid';
import CanvasLayer from './CanvasLayer';

// Build today's date string for the iOS overlay
function getTodayLabel(): string {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getTimeLabel(): string {
  const d = new Date();
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
}

interface CanvasProps {
  config: WallpaperConfig;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<PhotoLayer>) => void;
  onDragEnd: () => void;
  onDotClick?: (weekIndex: number) => void;
}

// Frame display width in CSS px — all other dimensions derived per-device
const DISPLAY_FRAME_W = 350;

export default function Canvas({
  config,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDragEnd,
  onDotClick,
}: CanvasProps) {
  // Resolve the device frame — falls back to first device if not found
  const device = useMemo(
    () => DEVICES.find((d) => d.name === config.deviceName) ?? DEVICES[3],
    [config.deviceName]
  );
  const frame = device.frame;

  // Scale the frame image to DISPLAY_FRAME_W css-px wide
  const displayScale = DISPLAY_FRAME_W / frame.fw;
  const frameW   = DISPLAY_FRAME_W;
  const frameH   = Math.round(frame.fh * displayScale);

  // Screen area in CSS px — directly from per-device pixel measurements
  const bezelLeft = Math.round(frame.scl * displayScale);
  const bezelTop  = Math.round(frame.sct * displayScale);
  const screenW   = Math.round((frame.scr - frame.scl) * displayScale);
  const screenH   = Math.round((frame.scb - frame.sct) * displayScale);

  // Canvas fills the screen WIDTH exactly; height from wallpaper aspect ratio.
  // If canvasHeight > screenH the overflow is clipped — no gaps.
  const canvasWidth  = screenW;
  const canvasScale  = canvasWidth / config.width;
  const canvasHeight = useMemo(
    () => Math.round(canvasWidth * config.height / config.width),
    [canvasWidth, config.width, config.height]
  );

  const sortedLayers = useMemo(() => {
    if (!config.layers) return [];
    return [...config.layers].filter((l) => l.visible).sort((a, b) => a.zIndex - b.zIndex);
  }, [config.layers]);

  // BG dim overlay
  const hasBgLayer = config.layers?.some((l) => l.type === 'bg' && l.visible);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Phone mockup: real SwarmPost frame image, canvas inside the screen area */}
      <div style={{ position: 'relative', width: frameW, height: frameH, flexShrink: 0 }}>

        {/* Canvas content — positioned inside the screen area */}
        <div
          onClick={() => onSelectLayer(null)}
          style={{
            position: 'absolute',
            top: bezelTop,
            left: bezelLeft,
            width: canvasWidth,
            height: screenH,
            background: `#${config.bg}`,
            overflow: 'hidden',
          }}
        >
          {/* Photo layers */}
          {sortedLayers.map((layer) => (
            <CanvasLayer
              key={layer.id}
              layer={layer}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              canvasScale={canvasScale}
              isSelected={selectedLayerId === layer.id}
              onSelect={() => onSelectLayer(layer.id)}
              onUpdate={(updates) => onUpdateLayer(layer.id, updates)}
              onDragEnd={onDragEnd}
            />
          ))}

          {/* BG dim overlay */}
          {hasBgLayer && config.bgDim && config.bgDim > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `rgba(0,0,0,${config.bgDim / 100})`,
                zIndex: 50,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* BG blur visual indicator */}
          {hasBgLayer && config.bgBlur && config.bgBlur > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backdropFilter: `blur(${config.bgBlur * canvasScale}px)`,
                zIndex: 49,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Dot grid */}
          <DotGrid
            config={config}
            canvasScale={canvasScale}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onDotClick={onDotClick}
          />

          {/* Daily quote — mirrors renderWallpaper.tsx placement */}
          {config.showQuote && (() => {
            const q = [
              "Make it count.",
              "Every day is a gift.",
              "Live with intention.",
              "Time is the only currency.",
              "Be here now.",
            ][new Date().getDate() % 5];
            return (
              <div style={{
                position: 'absolute',
                bottom: Math.round(canvasHeight * 0.11),
                left: 0, right: 0,
                display: 'flex', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <span style={{
                  color: `rgba(255,255,255,0.65)`,
                  fontSize: Math.round(canvasWidth * 0.028),
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '0 12px',
                  fontFamily: '-apple-system, sans-serif',
                }}>{q}</span>
              </div>
            );
          })()}
        </div>

        {/* iOS lock screen UI overlay — makes preview match real lock screen */}
        <div
          style={{
            position: 'absolute',
            top: bezelTop,
            left: bezelLeft,
            width: canvasWidth,
            height: screenH,
            pointerEvents: 'none',
            zIndex: 150,
            overflow: 'hidden',
          }}
        >
          {/* ── iOS 26 Lock Screen — pixel-matched to reference screenshot ──
               Layout: [DI pill] + [status bar right of DI] on same row
                       lock icon → date → huge thin time → (content) → buttons      */}

          {/* Top row: Dynamic Island centered + status bar to its right */}
          <div style={{
            position: 'absolute', top: '2%', left: 0, right: 0,
            height: Math.round(screenH * 0.04),
            display: 'flex', alignItems: 'center',
            padding: `0 ${Math.round(canvasWidth * 0.04)}px`,
          }}>
            {/* Left spacer (mirror of status bar width) */}
            <div style={{ flex: 1 }} />

            {/* Dynamic Island pill */}
            <div style={{
              width: Math.round(canvasWidth * 0.26),
              height: Math.round(screenH * 0.032),
              background: '#000', borderRadius: 99,
              flexShrink: 0,
            }} />

            {/* Status bar — right of DI, vertically centered with pill */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'flex-end', gap: 3,
              paddingLeft: 6,
            }}>
              {/* Signal: 4 rounded bars increasing in height (SF-style) */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
                {[0.25,0.45,0.65,0.85].map((op, i) => (
                  <div key={i} style={{
                    width: 3, borderRadius: 1,
                    height: 4 + i * 2,
                    background: `rgba(255,255,255,${op})`,
                  }} />
                ))}
              </div>
              {/* WiFi — 3 concentric arcs (SF Symbol style) */}
              <svg width="12" height="9" viewBox="0 0 24 18" fill="none" style={{ marginLeft: 1 }}>
                <path d="M1 7 Q12 -1 23 7" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M5 12 Q12 6 19 12" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <circle cx="12" cy="17" r="2.5" fill="rgba(255,255,255,0.9)"/>
              </svg>
              {/* Battery — outline + fill + nub */}
              <svg width="22" height="11" viewBox="0 0 44 22" fill="none" style={{ marginLeft: 1 }}>
                <rect x="1" y="1" width="37" height="20" rx="5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none"/>
                <rect x="3" y="3" width="24" height="16" rx="3" fill="rgba(255,255,255,0.85)"/>
                <path d="M40 8 Q44 8 44 11 Q44 14 40 14" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Lock icon — simple white filled padlock (SF Symbol lock.fill) */}
          <div style={{
            position: 'absolute', top: '9%', width: '100%',
            display: 'flex', justifyContent: 'center',
          }}>
            <svg width="14" height="17" viewBox="0 0 28 34" fill="none">
              {/* Shackle arch */}
              <path d="M6 14V9C6 4.6 9.6 1 14 1s8 3.6 8 8v5" stroke="rgba(255,255,255,0.9)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              {/* Lock body */}
              <rect x="1" y="14" width="26" height="19" rx="5" fill="rgba(255,255,255,0.9)"/>
            </svg>
          </div>

          {/* Date — centered, above time (~12% from top) */}
          <div style={{
            position: 'absolute',
            top: '13%', width: '100%', textAlign: 'center',
            color: 'rgba(255,255,255,0.88)',
            fontSize: Math.round(canvasWidth * 0.052),
            fontWeight: 400,
            letterSpacing: 0.1,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
          }}>
            {getTodayLabel()}
          </div>

          {/* Time — smaller + heavier weight, solid clean numerals */}
          <div style={{
            position: 'absolute',
            top: '16%', width: '100%', textAlign: 'center',
            color: '#ffffff',
            fontSize: Math.round(canvasWidth * 0.32),
            fontWeight: 400,
            letterSpacing: -1,
            fontFamily: '"Helvetica Neue", -apple-system, BlinkMacSystemFont, sans-serif',
            lineHeight: 1,
          }}>
            {getTimeLabel()}
          </div>

          {/* Flashlight + Camera buttons — frosted glass, bottom */}
          {(['left','right'] as const).map((side) => {
            const btnSize = Math.round(canvasWidth * 0.155);
            const isFlash = side === 'left';
            return (
              <div key={side} style={{
                position: 'absolute',
                bottom: '9%',
                [side]: Math.round(canvasWidth * 0.07),
                width: btnSize, height: btnSize, borderRadius: '50%',
                background: 'rgba(80,80,80,0.55)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isFlash ? (
                  /* flashlight.on.fill — SF Symbol: tapered barrel + wide lens head + beam rays */
                  <svg width={btnSize * 0.42} height={btnSize * 0.42} viewBox="0 0 100 100" fill="white">
                    {/* Beam rays radiating from top */}
                    <line x1="50" y1="4" x2="50" y2="10" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                    <line x1="72" y1="10" x2="67" y2="15" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                    <line x1="28" y1="10" x2="33" y2="15" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                    {/* Lens housing (wide circle at top) */}
                    <circle cx="50" cy="30" r="16" fill="white"/>
                    <circle cx="50" cy="30" r="9" fill="rgba(0,0,0,0.35)"/>
                    {/* Barrel — tapers from wide to narrow */}
                    <path d="M34 44 L40 90 Q50 96 60 90 L66 44 Z" fill="white"/>
                    {/* Grip ridges */}
                    <rect x="38" y="60" width="24" height="4" rx="2" fill="rgba(0,0,0,0.2)"/>
                    <rect x="38" y="70" width="24" height="4" rx="2" fill="rgba(0,0,0,0.2)"/>
                  </svg>
                ) : (
                  /* camera.fill — SF Symbol: body + viewfinder bump + lens ring */
                  <svg width={btnSize * 0.46} height={btnSize * 0.42} viewBox="0 0 100 80" fill="white">
                    {/* Viewfinder bump — centered top */}
                    <path d="M35 6 L40 0 L60 0 L65 6 Z" fill="white"/>
                    <rect x="33" y="4" width="34" height="8" rx="3" fill="white"/>
                    {/* Camera body */}
                    <rect x="0" y="10" width="100" height="70" rx="14" fill="white"/>
                    {/* Outer lens ring */}
                    <circle cx="50" cy="46" r="22" fill="rgba(40,40,40,0.75)"/>
                    {/* Inner lens */}
                    <circle cx="50" cy="46" r="14" fill="rgba(20,20,20,0.9)"/>
                    {/* Lens highlight dot */}
                    <circle cx="44" cy="40" r="4" fill="rgba(255,255,255,0.15)"/>
                    {/* Flash / indicator dot — top right */}
                    <circle cx="84" cy="24" r="5" fill="rgba(40,40,40,0.7)"/>
                  </svg>
                )}
              </div>
            );
          })}

          {/* Home indicator */}
          <div style={{
            position: 'absolute', bottom: '2%', left: '50%',
            transform: 'translateX(-50%)',
            width: Math.round(canvasWidth * 0.35), height: 4,
            background: 'rgba(255,255,255,0.55)', borderRadius: 3,
          }} />
        </div>

        {/* Phone frame — switches with the selected device */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame.path}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: frameW,
            height: frameH,
            pointerEvents: 'none',
            zIndex: 200,
          }}
        />
      </div>
    </div>
  );
}
