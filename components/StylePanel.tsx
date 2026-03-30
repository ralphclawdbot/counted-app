'use client';

import React from 'react';
import { WallpaperConfig, CalendarType, DotShape, DotStyle, DotMode, LifeEvent } from '@/types';
import { DEVICES, ANDROID_DEVICES, DEFAULT_ANDROID_DEVICE } from '@/lib/devices';
import { SYMBOL_PATHS } from '@/lib/symbols';
// Apple and Android SVG icons (inline — no external dependency)
const AppleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 814 1000" fill="currentColor">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.5 269-317.5 70.1 0 128.4 46.4 172.5 46.4 43.2 0 111.1-49 192.6-49 34.2 0 124.4 3.2 186.7 96.3zm-161.3-180.3c32.5-38.7 55.8-92.4 55.8-146.1 0-7.5-.6-15.1-1.9-22-.5-2.6-1.1-5.3-1.8-8-36.2 14-78.1 37.2-103.2 67.4-26.5 31.5-54.9 85.2-54.9 139.7 0 8.2.9 15.9 1.5 18.3 1.4.4 2.9.6 4.4.6 31.8 0 72.5-21.3 99.6-49.9z"/>
  </svg>
);
const AndroidIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.18 15.64a2.18 2.18 0 0 1-2.18 2.18C2.9 17.82 2 16.92 2 15.64V8.36a2.18 2.18 0 0 1 4.36 0v7.28zm11.64 0a2.18 2.18 0 0 0 4.36 0V8.36a2.18 2.18 0 0 0-4.36 0v7.28zM3.31 7.43A8.69 8.69 0 0 1 20.69 7.43v11.75a1.13 1.13 0 0 1-1.13 1.13H4.44a1.13 1.13 0 0 1-1.13-1.13V7.43zM8.5 2.82l-1.36-1.36a.38.38 0 0 0-.54.54L8 3.4a8.59 8.59 0 0 1 8 0L17.4 2a.38.38 0 0 0-.54-.54L15.5 2.82A8.45 8.45 0 0 0 12 2a8.45 8.45 0 0 0-3.5.82zM9 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
  </svg>
);
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
  onSaveAndSetup?: () => void;
  saveState: { token: string | null; url: string | null; saving: boolean; copied: boolean };
  hideLayers?: boolean;
  hideSaveButton?: boolean;
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: '#555',
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  marginBottom: 8,
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: '#111',
  border: '1px solid #222',
  borderRadius: 8,
  color: '#ddd',
  fontSize: 16,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

function pillBtn(active: boolean): React.CSSProperties {
  return {
    padding: '6px 16px',
    borderRadius: 20,
    background: active ? '#fff' : '#1a1a1a',
    color: active ? '#000' : '#555',
    border: 'none',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

const separatorStyle: React.CSSProperties = {
  borderBottom: '1px solid #1a1a1a',
  paddingBottom: 16,
  marginBottom: 16,
};

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
  onSaveAndSetup,
  saveState,
  hideLayers = false,
  hideSaveButton = false,
}: StylePanelProps) {
  const platform = config.platform || 'ios';
  const deviceList = platform === 'android' ? ANDROID_DEVICES : DEVICES;
  const selectedDevice = deviceList.find((d) => d.name === config.deviceName) ||
    deviceList.find((d) => d.width === config.width && d.height === config.height) ||
    deviceList[0];

  const isPresetActive = (p: typeof THEME_PRESETS[0]) =>
    config.bg === p.bg && config.dotFilled === p.dotFilled && config.dotEmpty === p.dotEmpty &&
    config.dotCurrent === p.dotCurrent;

  return (
    <div style={{ width: 360, height: '100vh', overflowY: 'auto', padding: '16px', borderLeft: '1px solid #1a1a1a', background: '#0a0a0a' }}>
      {/* Calendar Type */}
      <div style={separatorStyle}>
        <span style={sectionLabelStyle}>Calendar Type</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['life', 'year', 'goal'] as CalendarType[]).map((t) => (
            <button key={t} style={pillBtn(config.type === t)} onClick={() => onConfigChange({ type: t })}>
              {t === 'life' ? 'Life' : t === 'year' ? 'Year' : 'Goal'}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional inputs for Life */}
      {config.type === 'life' && (
        <div style={separatorStyle}>
          <span style={sectionLabelStyle}>Birthday</span>
          <input
            type="date"
            style={inputStyle}
            value={config.birthday || ''}
            onChange={(e) => onConfigChange({ birthday: e.target.value })}
          />
          <span style={{ ...sectionLabelStyle, marginTop: 10 }}>Lifespan (years)</span>
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

      {/* Conditional inputs for Goal */}
      {config.type === 'goal' && (
        <div style={separatorStyle}>
          <span style={sectionLabelStyle}>Goal Name</span>
          <input
            type="text"
            style={inputStyle}
            placeholder="e.g. Marathon training"
            value={config.goalName || ''}
            onChange={(e) => onConfigChange({ goalName: e.target.value })}
          />
          <span style={{ ...sectionLabelStyle, marginTop: 10 }}>Goal Start</span>
          <input
            type="date"
            style={inputStyle}
            value={config.goalStart || ''}
            onChange={(e) => onConfigChange({ goalStart: e.target.value })}
          />
          <span style={{ ...sectionLabelStyle, marginTop: 10 }}>Deadline</span>
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

      {/* Device — platform toggle + model selector */}
      <div style={separatorStyle}>
        <span style={sectionLabelStyle}>Device</span>

        {/* iOS / Android toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {(['ios', 'android'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                const newDevice = p === 'android' ? DEFAULT_ANDROID_DEVICE : DEVICES[3];
                onConfigChange({ platform: p, width: newDevice.width, height: newDevice.height, deviceName: newDevice.name });
              }}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer',
                background: platform === p ? '#ffffff' : '#1a1a1a',
                border: platform === p ? '1px solid #ffffff' : '1px solid #333',
                color: platform === p ? '#000' : '#888',
                fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {p === 'ios' ? <AppleIcon /> : <AndroidIcon />}
              {p === 'ios' ? 'iPhone' : 'Android'}
            </button>
          ))}
        </div>

        {/* Model selector */}
        <select
          style={selectStyle}
          value={selectedDevice.name}
          onChange={(e) => {
            const device = deviceList.find((d) => d.name === e.target.value);
            if (device) onConfigChange({ width: device.width, height: device.height, deviceName: device.name });
          }}
        >
          {deviceList.map((d) => (
            <option key={d.name} value={d.name}>{d.name} ({d.width}×{d.height})</option>
          ))}
        </select>
      </div>

      {/* Dot Mode */}
      <div style={separatorStyle}>
        <span style={sectionLabelStyle}>Dot Mode</span>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {(['standard', 'emoji', 'symbol'] as DotMode[]).map((m) => (
            <button key={m} style={pillBtn(config.dotMode === m)} onClick={() => onConfigChange({ dotMode: m })}>
              {m === 'standard' ? 'Standard' : m === 'emoji' ? 'Emoji' : 'Symbol'}
            </button>
          ))}
        </div>
        {config.dotMode === 'emoji' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <span style={sectionLabelStyle}>Lived Emoji</span>
              <input style={inputStyle} value={config.emojiLived || '🌳'} onChange={(e) => onConfigChange({ emojiLived: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={sectionLabelStyle}>Empty Emoji</span>
              <input style={inputStyle} value={config.emojiEmpty || '🌑'} onChange={(e) => onConfigChange({ emojiEmpty: e.target.value })} />
            </div>
          </div>
        )}
        {config.dotMode === 'symbol' && (
          <>
            <span style={sectionLabelStyle}>Symbol</span>
            <select style={selectStyle} value={config.dotSymbol || 'heart'} onChange={(e) => onConfigChange({ dotSymbol: e.target.value })}>
              {['heart', 'star', 'leaf', 'flower', 'moon', 'snow'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Theme Presets — visual thumbnails */}
      <div style={separatorStyle}>
        <span style={sectionLabelStyle}>Theme Presets</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {THEME_PRESETS.map((preset) => {
            const active = isPresetActive(preset);
            return (
              <div
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
                  width: 'calc(33.33% - 6px)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: 6,
                  borderRadius: 8,
                  border: active ? '2px solid #fff' : '2px solid transparent',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.borderColor = '#333'; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; }}
              >
                {/* Mini preview square */}
                <div style={{
                  width: 48,
                  height: 48,
                  background: `#${preset.bg}`,
                  borderRadius: 6,
                  margin: '0 auto 4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                  padding: 8,
                }}>
                  {/* 3x3 dot grid preview */}
                  {[0,1,2,3,4,5,6,7,8].map((i) => {
                    const color = i < 5 ? preset.dotFilled : i === 5 ? preset.dotCurrent : preset.dotEmpty;
                    const opacity = i < 5 ? preset.dotFilledOpacity / 100 : i === 5 ? 1 : preset.dotEmptyOpacity / 100;
                    return (
                      <div key={i} style={{
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background: `#${color}`,
                        opacity,
                      }} />
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{preset.emoji} {preset.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div style={separatorStyle}>
        <span style={sectionLabelStyle}>Colors</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <ColorPicker label="Background" value={config.bg} onChange={(v) => onConfigChange({ bg: v })} />
          <ColorPicker label="Filled" value={config.dotFilled} onChange={(v) => onConfigChange({ dotFilled: v })} />
          <ColorPicker label="Empty" value={config.dotEmpty} onChange={(v) => onConfigChange({ dotEmpty: v })} />
          <ColorPicker label="Current" value={config.dotCurrent} onChange={(v) => onConfigChange({ dotCurrent: v })} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <span style={sectionLabelStyle}>Filled Opacity ({config.dotFilledOpacity}%)</span>
            <input type="range" min={0} max={100} value={config.dotFilledOpacity} onChange={(e) => onConfigChange({ dotFilledOpacity: parseInt(e.target.value) })} style={{ width: '100%', accentColor: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={sectionLabelStyle}>Empty Opacity ({config.dotEmptyOpacity}%)</span>
            <input type="range" min={0} max={100} value={config.dotEmptyOpacity} onChange={(e) => onConfigChange({ dotEmptyOpacity: parseInt(e.target.value) })} style={{ width: '100%', accentColor: '#fff' }} />

            <span style={sectionLabelStyle}>Dot Gap ({((config.dotGapScale ?? 1) * 100).toFixed(0)}%)</span>
            <input type="range" min={30} max={300} step={10} value={Math.round((config.dotGapScale ?? 1) * 100)} onChange={(e) => onConfigChange({ dotGapScale: parseInt(e.target.value) / 100 })} style={{ width: '100%', accentColor: '#fff' }} />
          </div>
        </div>
      </div>

      {/* Dot Shape */}
      <div style={separatorStyle}>
        <span style={sectionLabelStyle}>Dot Shape</span>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['circle', 'square', 'rounded', 'diamond'] as DotShape[]).map((s) => (
            <button key={s} style={pillBtn(config.dotShape === s)} onClick={() => onConfigChange({ dotShape: s })}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <span style={sectionLabelStyle}>Dot Style</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['flat', 'glow', 'neon', 'outlined'] as DotStyle[]).map((s) => (
            <button key={s} style={pillBtn(config.dotStyle === s)} onClick={() => onConfigChange({ dotStyle: s })}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Background — only show blur/dim when a bg photo layer exists */}
      {layers.some((l) => l.type === 'bg' && l.visible) && (
        <div style={separatorStyle}>
          <span style={sectionLabelStyle}>Background</span>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#666' }}>Blur ({config.bgBlur || 0}px)</span>
            <input type="range" min={0} max={20} value={config.bgBlur || 0} onChange={(e) => onConfigChange({ bgBlur: parseInt(e.target.value) })} style={{ width: '100%', accentColor: '#fff' }} />
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#666' }}>Dim ({config.bgDim || 0}%)</span>
            <input type="range" min={0} max={100} value={config.bgDim || 0} onChange={(e) => onConfigChange({ bgDim: parseInt(e.target.value) })} style={{ width: '100%', accentColor: '#fff' }} />
          </div>
        </div>
      )}

      {/* Row Alignment */}
      <div style={separatorStyle}>
        <span style={sectionLabelStyle}>Row Alignment</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => onConfigChange({ dotRowAlign: a })}
              style={pillBtn((config.dotRowAlign || 'left') === a)}
            >
              {a === 'left' ? '⬅ Left' : a === 'center' ? '⟺ Center' : 'Right ➡'}
            </button>
          ))}
        </div>
      </div>

      {/* Widget Space */}
      <div style={separatorStyle}>
        <span style={sectionLabelStyle}>Widget Space</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {([['none', 'None'], ['bottom', 'Bottom'], ['top', 'Top (iOS 26)']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => onConfigChange({ widgetPosition: val })}
              style={pillBtn((config.widgetPosition || 'none') === val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Quote */}
      <div style={separatorStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#aaa', cursor: 'pointer' }}>
          <input type="checkbox" checked={config.showQuote || false} onChange={(e) => onConfigChange({ showQuote: e.target.checked })} />
          Daily Quote
        </label>
      </div>

      {/* Timezone */}
      <div style={separatorStyle}>
        <span style={sectionLabelStyle}>Timezone</span>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>
          Used to calculate the correct day on your wallpaper.
        </div>
        <select
          value={config.timezone || (typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC')}
          onChange={(e) => onConfigChange({ timezone: e.target.value })}
          style={{
            width: '100%', padding: '10px 12px',
            background: '#111', border: '1px solid #333', borderRadius: 6,
            color: '#ddd', fontSize: 16, // 16px prevents iOS zoom
            appearance: 'none', WebkitAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: 32,
          }}
        >
          {[
            ['Pacific/Midway', 'UTC−11 — Midway Island'],
            ['Pacific/Honolulu', 'UTC−10 — Hawaii'],
            ['America/Anchorage', 'UTC−9 — Alaska'],
            ['America/Los_Angeles', 'UTC−8 — Los Angeles / Seattle'],
            ['America/Denver', 'UTC−7 — Denver / Phoenix'],
            ['America/Chicago', 'UTC−6 — Chicago / Dallas'],
            ['America/New_York', 'UTC−5 — New York / Miami'],
            ['America/Halifax', 'UTC−4 — Halifax / Puerto Rico'],
            ['America/Sao_Paulo', 'UTC−3 — São Paulo / Buenos Aires'],
            ['Atlantic/South_Georgia', 'UTC−2 — South Georgia'],
            ['Atlantic/Azores', 'UTC−1 — Azores'],
            ['UTC', 'UTC±0 — London (winter) / Reykjavik'],
            ['Europe/London', 'UTC+0/+1 — London'],
            ['Europe/Paris', 'UTC+1/+2 — Paris / Berlin / Rome'],
            ['Europe/Helsinki', 'UTC+2/+3 — Helsinki / Athens / Cairo'],
            ['Europe/Moscow', 'UTC+3 — Moscow / Istanbul'],
            ['Asia/Dubai', 'UTC+4 — Dubai / Abu Dhabi'],
            ['Asia/Karachi', 'UTC+5 — Karachi / Islamabad'],
            ['Asia/Kolkata', 'UTC+5:30 — India'],
            ['Asia/Dhaka', 'UTC+6 — Dhaka / Almaty'],
            ['Asia/Bangkok', 'UTC+7 — Bangkok / Jakarta'],
            ['Asia/Singapore', 'UTC+8 — Singapore / Beijing / Perth'],
            ['Asia/Seoul', 'UTC+9 — Seoul / Tokyo'],
            ['Australia/Sydney', 'UTC+10/+11 — Sydney / Melbourne'],
            ['Pacific/Noumea', 'UTC+11 — Noumea'],
            ['Pacific/Auckland', 'UTC+12/+13 — Auckland'],
          ].map(([tz, label]) => (
            <option key={tz} value={tz}>{label}</option>
          ))}
        </select>
      </div>

      {/* Font */}
      <div style={separatorStyle}>
        <span style={sectionLabelStyle}>Font</span>
        <select
          style={selectStyle}
          value={config.fontFamily || 'Inter'}
          onChange={(e) => onConfigChange({ fontFamily: e.target.value })}
        >
          {[
            { value: 'Inter',           label: 'Inter — modern sans' },
            { value: 'Space Grotesk',   label: 'Space Grotesk — geometric' },
            { value: 'Playfair Display',label: 'Playfair Display — elegant serif' },
            { value: 'DM Mono',         label: 'DM Mono — minimal mono' },
            { value: 'Bebas Neue',      label: 'Bebas Neue — bold display' },
          ].map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Layer Panel */}
      {!hideLayers && (
        <div style={separatorStyle}>
          <LayerPanel
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
            onDeleteLayer={onDeleteLayer}
            onToggleVisibility={onToggleVisibility}
            onReorder={onReorderLayers}
            onAddPhoto={onAddPhoto}
          />
        </div>
      )}

      {/* Life Events */}
      {config.type === 'life' && (
        <div style={separatorStyle}>
          <span style={sectionLabelStyle}>Life Events</span>
          {lifeEvents.length === 0 ? (
            <p style={{ fontSize: 12, color: '#555', margin: 0 }}>Click any dot on the canvas to mark a milestone.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {lifeEvents
                .sort((a, b) => a.weekIndex - b.weekIndex)
                .map((evt) => {
                  const pathD = SYMBOL_PATHS[evt.icon] || SYMBOL_PATHS.star;
                  const d = new Date(evt.date);
                  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <div key={evt.weekIndex} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#ccc' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                        <path d={pathD} fill="#aaa" />
                      </svg>
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

      {/* Save Buttons */}
      {!hideSaveButton && (
        <div style={{ marginBottom: 32 }}>
          {/* Two-button row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: saveState.url ? 12 : 0 }}>
            <button
              onClick={onSave}
              disabled={saveState.saving}
              style={{
                flex: 1,
                padding: '11px 12px',
                background: '#1a1a1a',
                color: saveState.saving ? '#555' : '#aaa',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                cursor: saveState.saving ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {saveState.saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={onSaveAndSetup}
              disabled={saveState.saving}
              style={{
                flex: 2,
                padding: '11px 12px',
                background: saveState.saving ? '#333' : '#fff',
                color: saveState.saving ? '#888' : '#000',
                border: 'none',
                borderRadius: 10,
                cursor: saveState.saving ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {saveState.saving ? 'Saving…' : 'Save & Setup →'}
            </button>
          </div>

          {/* URL strip shown after first save */}
          {saveState.url && (
            <div style={{ padding: '10px 12px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1c1c1c' }}>
              <div style={{ fontSize: 11, color: '#444', marginBottom: 6, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Your link</div>
              <div style={{ fontSize: 11, color: '#666', wordBreak: 'break-all', marginBottom: 8, fontFamily: 'monospace', lineHeight: 1.5 }}>
                {saveState.url}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { navigator.clipboard.writeText(saveState.url!); }}
                  style={{
                    padding: '5px 12px',
                    background: saveState.copied ? '#1a1a1a' : '#ffffff',
                    color: saveState.copied ? '#22c55e' : '#000',
                    border: saveState.copied ? '1px solid rgba(34,197,94,0.35)' : 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {saveState.copied ? '✓ Copied' : 'Copy'}
                </button>
                <a
                  href={saveState.token ? `/api/w/${saveState.token}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '5px 12px', background: '#1a1a1a', color: '#666', borderRadius: 6, fontSize: 12, textDecoration: 'none', fontWeight: 500, border: '1px solid #222' }}
                >
                  Preview ↗
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
