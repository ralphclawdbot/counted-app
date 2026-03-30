'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { WallpaperConfig, PhotoLayer } from '@/types';
import { DEVICES, ANDROID_DEVICES } from '@/lib/devices';
import { configToWallpaperParams } from '@/lib/buildConfig';
import DotGrid from './DotGrid';
import CanvasLayer from './CanvasLayer';

// Build today's date string for the iOS overlay
function getTodayLabel(): string {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getTimeLabel(): string {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

interface CanvasProps {
  config: WallpaperConfig;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<PhotoLayer>) => void;
  onDragEnd: () => void;
  onDotClick?: (weekIndex: number) => void;
  /** Override the default 350px frame display width (e.g. for mobile) */
  displayWidth?: number;
}

export default function Canvas({
  config,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onDragEnd,
  onDotClick,
  displayWidth = 350,
}: CanvasProps) {
  // Resolve the device frame — check both iOS and Android device lists
  const isAndroid = (config.platform || 'ios') === 'android';
  const device = useMemo(() => {
    if (isAndroid) {
      return ANDROID_DEVICES.find((d) => d.name === config.deviceName) ?? ANDROID_DEVICES[2];
    }
    return DEVICES.find((d) => d.name === config.deviceName) ?? DEVICES[3];
  }, [config.deviceName, isAndroid]);
  const frame = device.frame;

  // Scale the frame image to displayWidth css-px wide
  // For Android (no frame PNG), synthesize bezel/screen bounds from device aspect ratio
  const DISPLAY_FRAME_W = displayWidth;
  const ANDROID_BEZEL = Math.round(displayWidth * 0.04);
  const displayScale  = frame ? DISPLAY_FRAME_W / frame.fw : 1;
  const frameW   = DISPLAY_FRAME_W;
  const frameH   = frame
    ? Math.round(frame.fh * displayScale)
    : Math.round(displayWidth * (config.height / config.width) + ANDROID_BEZEL * 2);

  // Screen area in CSS px
  const bezelLeft = frame ? Math.round(frame.scl * displayScale) : ANDROID_BEZEL;
  const bezelTop  = frame ? Math.round(frame.sct * displayScale) : ANDROID_BEZEL;
  const screenW   = frame ? Math.round((frame.scr - frame.scl) * displayScale) : (displayWidth - ANDROID_BEZEL * 2);
  const screenH   = frame ? Math.round((frame.scb - frame.sct) * displayScale) : Math.round((displayWidth - ANDROID_BEZEL * 2) * (config.height / config.width));

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

  // (hasBgLayer removed — bg image is now baked into the PNG by the API)

  // ── Live PNG preview — fetches actual /api/wallpaper with 400ms debounce ──
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [liveTime, setLiveTime] = useState(getTimeLabel);
  const [liveDate, setLiveDate] = useState(getTodayLabel);
  useEffect(() => {
    const t = setInterval(() => { setLiveTime(getTimeLabel()); setLiveDate(getTodayLabel()); }, 10000);
    return () => clearInterval(t);
  }, []);
  const [previewStale, setPreviewStale] = useState(false);

  useEffect(() => {
    setPreviewStale(true);
    const timer = setTimeout(async () => {
      try {
        const params = configToWallpaperParams(config);
        const res = await fetch(`/api/wallpaper?${params.toString()}`);
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url; });
      } catch { /* keep showing last good frame */ }
      finally { setPreviewStale(false); }
    }, 150);
    return () => clearTimeout(timer);
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

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
          {/* ── Actual wallpaper PNG — exact match of the exported file ── */}
          {/* PNG — full-quality render, fades in when ready */}
          {previewUrl && (
            <img
              src={previewUrl}
              alt=""
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: canvasWidth,
                height: canvasHeight,
                objectFit: 'fill',
                display: 'block',
                pointerEvents: 'none',
                opacity: previewStale ? 0 : 1,
                transition: 'opacity 0.2s ease',
                zIndex: 10,
              }}
            />
          )}

          {/* Small loading dot in corner — only on very first load before any PNG exists */}
          {!previewUrl && (
            <div style={{
              position: 'absolute', bottom: 8, right: 8,
              pointerEvents: 'none', zIndex: 15,
            }}>
              <style>{`@keyframes _canvas_spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{
                width: 16, height: 16,
                border: '2px solid rgba(255,255,255,0.12)',
                borderTopColor: 'rgba(255,255,255,0.6)',
                borderRadius: '50%',
                animation: '_canvas_spin 0.7s linear infinite',
              }} />
            </div>
          )}

          {/* Photo layer interaction handles — on top of PNG for drag/resize */}
          {sortedLayers.map((layer) => {
            // bg layers are now baked into the PNG by the API — only render CSS layer
            // as a placeholder when the PNG hasn't loaded yet (first render).
            // Cutout layers remain as CSS overlays for drag/resize interaction.
            if (layer.type === 'bg' && previewUrl) return null;
            return (
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
            );
          })}

          {/* DotGrid — instant CSS preview (visible while PNG is loading), invisible once PNG ready */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            opacity: previewStale || !previewUrl ? 1 : 0,
            transition: 'opacity 0.2s ease',
            zIndex: 5, pointerEvents: 'none',
          }}>
            <DotGrid
              config={config}
              canvasScale={canvasScale}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              onDotClick={undefined}
            />
          </div>

          {/* Invisible DotGrid overlay — purely for dot-click interaction */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            opacity: 0, zIndex: 20, pointerEvents: 'auto',
          }}>
            <DotGrid
              config={config}
              canvasScale={canvasScale}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              onDotClick={onDotClick}
            />
          </div>
        </div>

        {/* Lock screen UI overlay — iOS or Android depending on platform */}
        {isAndroid ? (() => {
          // ── Android overlay: punch-hole camera, status bar, clock, gesture bar ──
          const safeTopFrac = config.widgetPosition === 'top' ? 0.38 : 0.28;
          const dotStartPx  = Math.round(screenH * safeTopFrac);
          const dateFontPx  = Math.round(canvasWidth * 0.052);
          const timeFontPx  = Math.min(
            Math.round(canvasWidth * 0.30),
            Math.round((dotStartPx - Math.round(screenH * 0.08) - 4) * 0.55)
          );
          const timeTop = dotStartPx - timeFontPx - 4;
          const dateTop = timeTop - dateFontPx - 5;
          return (
            <div style={{ position: 'absolute', top: bezelTop, left: bezelLeft, width: canvasWidth, height: screenH, pointerEvents: 'none', zIndex: 150, overflow: 'hidden' }}>
              {/* Punch-hole camera */}
              <div style={{ position: 'absolute', top: '1.5%', left: '50%', transform: 'translateX(-50%)', width: Math.round(canvasWidth * 0.035), height: Math.round(canvasWidth * 0.035), background: '#000', borderRadius: '50%' }} />
              {/* Status bar */}
              <div style={{ position: 'absolute', top: '1.5%', left: 0, right: 0, height: Math.round(screenH * 0.04), display: 'flex', alignItems: 'center', padding: `0 ${Math.round(canvasWidth * 0.05)}px` }}>
                <span style={{ fontSize: Math.round(canvasWidth * 0.038), color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontFamily: 'sans-serif' }}>{liveDate.split(',')[0]}</span>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {[0.3,0.55,0.75,0.95].map((op, i) => <div key={i} style={{ width: 3, borderRadius: 1, height: 4 + i * 2, background: `rgba(255,255,255,${op})` }} />)}
                  <svg width="12" height="9" viewBox="0 0 24 18" fill="none" style={{ marginLeft: 2 }}>
                    <path d="M1 7 Q12 -1 23 7" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                    <path d="M5 12 Q12 6 19 12" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                    <circle cx="12" cy="17" r="2.5" fill="rgba(255,255,255,0.9)"/>
                  </svg>
                  <svg width="22" height="11" viewBox="0 0 44 22" fill="none" style={{ marginLeft: 2 }}>
                    <rect x="1" y="1" width="37" height="20" rx="5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none"/>
                    <rect x="3" y="3" width="24" height="16" rx="3" fill="rgba(255,255,255,0.85)"/>
                    <path d="M40 8 Q44 8 44 11 Q44 14 40 14" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              {/* Date */}
              <div style={{ position: 'absolute', top: dateTop, width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.88)', fontSize: dateFontPx, fontWeight: 400, fontFamily: 'sans-serif' }}>{liveDate}</div>
              {/* Time */}
              <div style={{ position: 'absolute', top: timeTop, width: '100%', textAlign: 'center', color: '#fff', fontSize: timeFontPx, fontWeight: 300, letterSpacing: -1, lineHeight: 1, fontFamily: 'sans-serif' }}>{liveTime}</div>
              {/* Gesture bar */}
              <div style={{ position: 'absolute', bottom: '2%', left: '50%', transform: 'translateX(-50%)', width: Math.round(canvasWidth * 0.30), height: 4, background: 'rgba(255,255,255,0.5)', borderRadius: 3 }} />
            </div>
          );
        })() : (() => {
          // ── Dynamic positioning: clock must sit above where the dots start ──
          // Mirror the same safeTop fraction used in DotGrid/renderWallpaper
          const safeTopFrac = config.widgetPosition === 'top' ? 0.38 : 0.28;
          const dotStartPx  = Math.round(screenH * safeTopFrac);

          // Clock area: from status bar bottom (~7% of screenH) to dotStartPx - 4px gap
          const clockAreaTop = Math.round(screenH * 0.07);
          const clockAreaH   = dotStartPx - clockAreaTop - 4;

          // Font sizes that fill the available area proportionally
          const dateFontPx   = Math.round(canvasWidth * 0.052);
          const timeFontPx   = Math.min(
            Math.round(canvasWidth * 0.32),          // never wider than 32% of canvas
            Math.round(clockAreaH * 0.55)            // fill ~55% of available clock area
          );
          const lockSize     = Math.max(13, Math.round(timeFontPx * 0.22));

          // Stack upward from dotStartPx
          const timeTop = dotStartPx - timeFontPx - 4;
          const dateTop = timeTop - dateFontPx - 5;
          const lockTop = dateTop - lockSize - 6;

          const btnSize = Math.round(canvasWidth * 0.155);

          return (
            <div style={{
              position: 'absolute',
              top: bezelTop,
              left: bezelLeft,
              width: canvasWidth,
              height: screenH,
              pointerEvents: 'none',
              zIndex: 150,
              overflow: 'hidden',
            }}>
              {/* DI + status bar row */}
              <div style={{
                position: 'absolute', top: '2%', left: 0, right: 0,
                height: Math.round(screenH * 0.04),
                display: 'flex', alignItems: 'center',
                padding: `0 ${Math.round(canvasWidth * 0.04)}px`,
              }}>
                <div style={{ flex: 1 }} />
                <div style={{
                  width: Math.round(canvasWidth * 0.26),
                  height: Math.round(screenH * 0.032),
                  background: '#000', borderRadius: 99, flexShrink: 0,
                }} />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, paddingLeft: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
                    {[0.25,0.45,0.65,0.85].map((op, i) => (
                      <div key={i} style={{ width: 3, borderRadius: 1, height: 4 + i * 2, background: `rgba(255,255,255,${op})` }} />
                    ))}
                  </div>
                  <svg width="12" height="9" viewBox="0 0 24 18" fill="none" style={{ marginLeft: 1 }}>
                    <path d="M1 7 Q12 -1 23 7" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                    <path d="M5 12 Q12 6 19 12" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                    <circle cx="12" cy="17" r="2.5" fill="rgba(255,255,255,0.9)"/>
                  </svg>
                  <svg width="22" height="11" viewBox="0 0 44 22" fill="none" style={{ marginLeft: 1 }}>
                    <rect x="1" y="1" width="37" height="20" rx="5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none"/>
                    <rect x="3" y="3" width="24" height="16" rx="3" fill="rgba(255,255,255,0.85)"/>
                    <path d="M40 8 Q44 8 44 11 Q44 14 40 14" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              {/* Lock icon — stacked above date */}
              <div style={{ position: 'absolute', top: lockTop, width: '100%', display: 'flex', justifyContent: 'center' }}>
                <svg width={lockSize} height={Math.round(lockSize * 1.2)} viewBox="0 0 28 34" fill="none">
                  <path d="M6 14V9C6 4.6 9.6 1 14 1s8 3.6 8 8v5" stroke="rgba(255,255,255,0.9)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                  <rect x="1" y="14" width="26" height="19" rx="5" fill="rgba(255,255,255,0.9)"/>
                </svg>
              </div>

              {/* Date */}
              <div style={{
                position: 'absolute', top: dateTop, width: '100%', textAlign: 'center',
                color: 'rgba(255,255,255,0.88)',
                fontSize: dateFontPx, fontWeight: 400, letterSpacing: 0.1,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
              }}>
                {liveDate}
              </div>

              {/* Time — sized to fill available space above dots */}
              <div style={{
                position: 'absolute', top: timeTop, width: '100%', textAlign: 'center',
                color: '#ffffff', fontSize: timeFontPx, fontWeight: 400,
                letterSpacing: -1, lineHeight: 1,
                fontFamily: '"Helvetica Neue", -apple-system, BlinkMacSystemFont, sans-serif',
              }}>
                {liveTime}
              </div>

              {/* Flashlight + Camera buttons — frosted glass, bottom */}
              {(['left','right'] as const).map((side) => {
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
          );
        })()}

        {/* Phone frame — iOS uses PNG, Android uses CSS generic frame */}
        {frame ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frame.path}
            alt=""
            style={{ position: 'absolute', top: 0, left: 0, width: frameW, height: frameH, pointerEvents: 'none', zIndex: 200 }}
          />
        ) : (
          // Android: dark rounded rect with punch-hole camera cutout
          <div style={{
            position: 'absolute', top: 0, left: 0, width: frameW, height: frameH,
            borderRadius: Math.round(frameW * 0.1), border: '2px solid #2a2a2a',
            background: 'transparent', pointerEvents: 'none', zIndex: 200,
            boxShadow: '0 0 0 2px #111 inset',
          }} />
        )}
      </div>
    </div>
  );
}
