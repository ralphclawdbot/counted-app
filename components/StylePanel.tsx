'use client';

import React from 'react';
import { WallpaperConfig, CalendarType, DotShape, DotStyle, DotMode, LifeEvent } from '@/types';
import { DEVICES, ANDROID_DEVICES, DEFAULT_ANDROID_DEVICE } from '@/lib/devices';
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
      {/* Header */}
      <div style={separatorStyle}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2, color: '#fff' }}>Counted</h1>
        <p style={{ fontSize: 12, color: '#555', margin: 0 }}>Your life, counted.</p>
      </div>

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
                background: platform === p ? '#ff5722' : '#1a1a1a',
                border: platform === p ? '1px solid #ff5722' : '1px solid #333',
                color: platform === p ? '#fff' : '#888',
                fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {p === 'ios' ? '🍎' : '🤖'} {p === 'ios' ? 'iPhone' : 'Android'}
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

      {/* Background */}
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

      {/* Gradient Mode */}
      <div style={separatorStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#aaa', cursor: 'pointer', marginBottom: config.gradientMode ? 10 : 0 }}>
          <input type="checkbox" checked={config.gradientMode || false} onChange={(e) => onConfigChange({ gradientMode: e.target.checked })} />
          Gradient Mode
        </label>
        {config.gradientMode && (
          <div style={{ display: 'flex', gap: 8 }}>
            <ColorPicker label="Start" value={config.gradientStart || 'FF0000'} onChange={(v) => onConfigChange({ gradientStart: v })} />
            <ColorPicker label="End" value={config.gradientEnd || '0000FF'} onChange={(v) => onConfigChange({ gradientEnd: v })} />
          </div>
        )}
      </div>

      {/* Daily Quote */}
      <div style={separatorStyle}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#aaa', cursor: 'pointer' }}>
          <input type="checkbox" checked={config.showQuote || false} onChange={(e) => onConfigChange({ showQuote: e.target.checked })} />
          Daily Quote
        </label>
      </div>

      {/* Font */}
      <div style={separatorStyle}>
        <span style={sectionLabelStyle}>Font</span>
        <select
          style={selectStyle}
          value={config.fontFamily || 'Inter'}
          onChange={(e) => onConfigChange({ fontFamily: e.target.value })}
        >
          {['Inter', 'Georgia', 'Helvetica Neue', 'Courier New'].map((f) => (
            <option key={f} value={f}>{f}</option>
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

      {/* Save Button */}
      {!hideSaveButton && (
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={onSave}
            disabled={saveState.saving}
            style={{
              width: '100%',
              padding: '12px',
              background: saveState.saving ? '#333' : '#fff',
              color: saveState.saving ? '#888' : '#000',
              border: 'none',
              borderRadius: 20,
              cursor: saveState.saving ? 'not-allowed' : 'pointer',
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {saveState.saving ? 'Saving...' : 'Save & Get My URL'}
          </button>

          {saveState.url && (
            <div style={{ marginTop: 12, padding: 12, background: '#111', borderRadius: 8, border: '1px solid #222' }}>
              <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Your Counted link:</div>
              <div style={{ fontSize: 12, color: '#ddd', wordBreak: 'break-all', marginBottom: 8, fontFamily: 'monospace' }}>
                {saveState.url}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { navigator.clipboard.writeText(saveState.url!); }}
                  style={{
                    padding: '6px 14px',
                    background: saveState.copied ? '#16a34a' : '#1a1a1a',
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
                  href={saveState.token ? `/api/w/${saveState.token}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '6px 14px', background: '#1a1a1a', color: '#aaa', borderRadius: 4, fontSize: 12, textDecoration: 'none', fontWeight: 500 }}
                >
                  Preview PNG →
                </a>
                <a
                  href={`/install?token=${saveState.token}&platform=${config.platform || 'ios'}`}
                  style={{ padding: '6px 14px', background: '#1a1a1a', color: '#aaa', borderRadius: 4, fontSize: 12, textDecoration: 'none', fontWeight: 500 }}
                >
                  Setup →
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
