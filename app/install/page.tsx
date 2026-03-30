'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { WallpaperConfig } from '@/types';
import { configToWallpaperParams } from '@/lib/buildConfig';

const SHORTCUT_ICLOUD_URL = 'https://www.icloud.com/shortcuts/PLACEHOLDER_UPDATE_AFTER_PUBLISHING';

const C = {
  bg:          '#050505',
  surface:     '#0d0d0d',
  surfaceHi:   '#111111',
  border:      '#1c1c1c',
  borderHi:    '#2a2a2a',
  accent:      '#ffffff',
  text:        '#ffffff',
  textMid:     'rgba(255,255,255,0.55)',
  textLow:     'rgba(255,255,255,0.28)',
};

// ── Icons ────────────────────────────────────────────────────
const AppleIcon = () => (
  <svg width="15" height="18" viewBox="0 0 814 1000" fill="currentColor">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-37.3-148.3-109.8L14.1 695.5c-14.8-25.4-22.2-54.1-22.1-83.1 0-89.8 65-173.1 145.2-173.1 75.4 0 110.9 53.4 165.9 53.4 52.4 0 84.3-53.4 165.9-53.4 70.4 0 138.3 76.3 154.8 115.4C691 624.9 729.5 624.9 729.5 624.9c-13.3-30.7-23.1-57.8-30.3-80.5zM534.8 233.5c30.3-35.5 51.3-86.3 51.3-137 0-7-0.7-14-2-20.9-47.8 1.7-104.5 31.8-138.2 73.7-25.3 29.6-51.3 78.3-51.3 130.2 0 7.6 1.3 15.1 1.9 17.5 3.2 0.6 8.3 1.3 13.4 1.3 43.4 0 97.9-28.9 125.2-64.8z"/>
  </svg>
);

const AndroidIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.18 15.64a2.18 2.18 0 0 1-2.18 2.18C2.9 17.82 2 16.92 2 15.64V8.36a2.18 2.18 0 0 1 4.36 0v7.28zm11.64 0a2.18 2.18 0 0 0 4.36 0V8.36a2.18 2.18 0 0 0-4.36 0v7.28zM3.31 7.43A8.69 8.69 0 0 1 20.69 7.43v11.75a1.13 1.13 0 0 1-1.13 1.13H4.44a1.13 1.13 0 0 1-1.13-1.13V7.43zM8.5 2.82l-1.36-1.36a.38.38 0 0 0-.54.54L8 3.4a8.59 8.59 0 0 1 8 0L17.4 2a.38.38 0 0 0-.54-.54L15.5 2.82A8.45 8.45 0 0 0 12 2a8.45 8.45 0 0 0-3.5.82zM9 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
  </svg>
);

function StepNum({ n }: { n: number }) {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%',
      background: '#fff', color: '#000',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 800, flexShrink: 0,
    }}>
      {n}
    </div>
  );
}

// ── Human-readable config spec labels ───────────────────────
function specLabel(key: string, val: unknown): string | null {
  if (val === undefined || val === null) return null;
  switch (key) {
    case 'type': return ({ life: 'Life calendar', year: 'Year calendar', goal: 'Goal countdown' } as Record<string, string>)[val as string] ?? String(val);
    case 'dotShape': return ({ circle: 'Circle dots', square: 'Square dots', rounded: 'Rounded dots', diamond: 'Diamond dots' } as Record<string, string>)[val as string] ?? String(val);
    case 'dotStyle': return ({ flat: 'Flat style', glow: 'Glow style', neon: 'Neon style', outlined: 'Outlined style' } as Record<string, string>)[val as string] ?? String(val);
    case 'showQuote': return val ? 'Daily quote on' : null;
    case 'gradientMode': return val ? 'Gradient bg' : null;
    case 'platform': return null; // shown separately
    default: return null;
  }
}

function SpecsBar({ config }: { config: WallpaperConfig }) {
  const specs: string[] = [];
  (['type', 'dotShape', 'dotStyle', 'showQuote', 'gradientMode'] as const).forEach((k) => {
    const label = specLabel(k, config[k]);
    if (label) specs.push(label);
  });
  if (config.layers?.some((l) => l.type === 'bg' && l.visible)) specs.push('Custom photo');

  if (!specs.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px', marginTop: 14 }}>
      {specs.map((s) => (
        <span key={s} style={{
          fontSize: 11, fontWeight: 600,
          padding: '3px 9px', borderRadius: 20,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: 0.2,
        }}>{s}</span>
      ))}
    </div>
  );
}

// ── Main content ─────────────────────────────────────────────
function InstallContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const platformParam = searchParams.get('platform') as 'ios' | 'android' | null;
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const wallpaperUrl = token ? `${appUrl}/api/w/${token}` : '';

  const [copied, setCopied] = useState(false);
  const [platform] = useState<'ios' | 'android'>(platformParam ?? 'ios');
  const [config, setConfig] = useState<WallpaperConfig | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showTrouble, setShowTrouble] = useState(false);

  // Fetch config for preview + specs
  useEffect(() => {
    if (!token) return;
    fetch(`/api/configs?token=${token}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.config && setConfig(d.config))
      .catch(() => {});
  }, [token]);

  const handleCopy = () => {
    navigator.clipboard.writeText(wallpaperUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build wallpaper preview URL (trimmed to phone thumbnail height)
  const previewSrc = config
    ? `/api/wallpaper?${configToWallpaperParams(config).toString()}`
    : token ? wallpaperUrl : null;

  const stepStyle: React.CSSProperties = {
    padding: '20px 24px',
    background: C.surface,
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    marginBottom: 10,
  };

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: "-apple-system, 'Helvetica Neue', sans-serif" }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* Back */}
        <Link href="/editor" style={{ fontSize: 13, color: C.textLow, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 28 }}>
          ← Back to editor
        </Link>

        {/* ── Hero: wallpaper thumbnail + summary ── */}
        {token && (
          <div style={{
            display: 'flex', gap: 20, alignItems: 'flex-start',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 16, padding: '20px 20px 24px',
            marginBottom: 28,
          }}>
            {/* Thumbnail */}
            {previewSrc && (
              <div style={{
                flexShrink: 0,
                width: 72, height: 130,
                borderRadius: 12, overflow: 'hidden',
                border: `1px solid ${C.borderHi}`,
                background: '#0a0a0a',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewSrc}
                  alt="Your wallpaper"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                />
              </div>
            )}

            {/* Summary */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600, color: C.textMid,
                }}>
                  {platform === 'ios' ? <AppleIcon /> : <AndroidIcon />}
                  {platform === 'ios' ? 'iPhone' : 'Android'}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: '#22c55e',
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  padding: '2px 8px', borderRadius: 20,
                  letterSpacing: 0.3,
                }}>✓ Saved</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, marginBottom: 2 }}>
                Your wallpaper is ready
              </div>
              <div style={{ fontSize: 13, color: C.textLow, lineHeight: 1.5 }}>
                Updates automatically every morning.
              </div>
              {config && <SpecsBar config={config} />}
            </div>
          </div>
        )}

        {/* No token warning */}
        {!token && (
          <div style={{ padding: 20, background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 12, marginBottom: 24 }}>
            <p style={{ color: C.textMid, fontSize: 14, marginBottom: 8 }}>No wallpaper saved yet.</p>
            <Link href="/editor" style={{ fontSize: 13, color: C.text }}>← Build your calendar first</Link>
          </div>
        )}

        {token && (
          <>
            {/* ── Step 1: URL ── */}
            <div style={stepStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <StepNum n={1} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Copy your wallpaper URL</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(34,197,94,0.9)', fontWeight: 700, letterSpacing: 0.3 }}>✓ Ready</span>
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: 11, color: C.textMid,
                wordBreak: 'break-all', padding: '10px 12px',
                background: '#080808', borderRadius: 8, marginBottom: 10,
                border: `1px solid ${C.border}`,
              }}>
                {wallpaperUrl}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCopy}
                  style={{ padding: '8px 18px', background: copied ? '#1a1a1a' : '#ffffff', color: copied ? '#22c55e' : '#000', border: copied ? '1px solid rgba(34,197,94,0.4)' : 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s' }}
                >
                  {copied ? '✓ Copied' : 'Copy URL'}
                </button>
                <a
                  href={wallpaperUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '8px 14px', background: C.surfaceHi, color: C.textMid, borderRadius: 8, fontSize: 13, textDecoration: 'none', border: `1px solid ${C.border}` }}
                >
                  Preview ↗
                </a>
              </div>
            </div>

            {/* ── iOS Instructions ── */}
            {platform === 'ios' && (
              <>
                <div style={stepStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <StepNum n={2} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Add the Shortcut</span>
                  </div>
                  <a
                    href={SHORTCUT_ICLOUD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', padding: '13px 20px', background: '#ffffff', color: '#000', textDecoration: 'none', borderRadius: 10, textAlign: 'center', fontSize: 15, fontWeight: 800, marginBottom: 10, letterSpacing: -0.2 }}
                  >
                    Add Shortcut to iPhone →
                  </a>
                  <p style={{ fontSize: 12, color: C.textLow, lineHeight: 1.6 }}>Opens Shortcuts app → Tap &quot;Add Shortcut&quot; → Open it and paste your URL when prompted.</p>
                </div>

                <div style={stepStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <StepNum n={3} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Create the daily automation</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.textMid, marginBottom: 12, lineHeight: 1.6 }}>Apple doesn&apos;t allow sharing automations — takes 2 minutes to set up manually.</p>
                  <ol style={{ paddingLeft: 20, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 2.1, margin: 0 }}>
                    <li>Open <strong style={{ color: '#fff' }}>Shortcuts</strong> → <strong style={{ color: '#fff' }}>Automation</strong> tab → <strong style={{ color: '#fff' }}>+</strong></li>
                    <li><strong style={{ color: '#fff' }}>Time of Day</strong> → 12:00 AM (midnight) → Daily → <strong style={{ color: '#fff' }}>Run Immediately</strong></li>
                    <li>Turn off &quot;Ask Before Running&quot;</li>
                    <li>Add action: <strong style={{ color: '#fff' }}>Get File</strong> (from iCloud / Shortcuts / <code style={{ background: '#1a1a1a', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>counted-url.txt</code>)</li>
                    <li>Add action: <strong style={{ color: '#fff' }}>Get Contents of URL</strong></li>
                    <li>Add action: <strong style={{ color: '#fff' }}>Set Wallpaper Photo</strong> → Lock Screen → Crop to Subject: <strong style={{ color: '#fff' }}>OFF</strong></li>
                    <li>Tap <strong style={{ color: '#fff' }}>Done</strong></li>
                  </ol>
                </div>

                <div style={{ ...stepStyle, background: 'transparent', border: `1px solid ${C.border}` }}>
                  <button
                    onClick={() => setShowManual(!showManual)}
                    style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>Set up manually instead</span>
                    <span style={{ fontSize: 10 }}>{showManual ? '▲' : '▼'}</span>
                  </button>
                  {showManual && (
                    <ol style={{ paddingLeft: 20, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 2, marginTop: 14 }}>
                      <li>Open <strong style={{ color: '#ccc' }}>Shortcuts</strong> → tap <strong style={{ color: '#ccc' }}>+</strong></li>
                      <li>Add: <strong style={{ color: '#ccc' }}>URL</strong> → paste your wallpaper URL</li>
                      <li>Add: <strong style={{ color: '#ccc' }}>Get Contents of URL</strong></li>
                      <li>Add: <strong style={{ color: '#ccc' }}>Set Wallpaper Photo</strong> → Lock Screen</li>
                      <li>Name it &quot;Counted&quot; → Done</li>
                      <li>Automation tab → + → Time of Day → 12:00 AM → Run Immediately → Run Shortcut &quot;Counted&quot;</li>
                    </ol>
                  )}
                </div>

                <div style={{ ...stepStyle, background: 'transparent', border: `1px solid ${C.border}` }}>
                  <button
                    onClick={() => setShowTrouble(!showTrouble)}
                    style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>Troubleshooting</span>
                    <span style={{ fontSize: 10 }}>{showTrouble ? '▲' : '▼'}</span>
                  </button>
                  {showTrouble && (
                    <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                      {[
                        ['Shortcut asks every morning', 'Settings → Shortcuts → [name] → Allow Running Without Asking'],
                        ['Wallpaper looks cropped', 'Crop to Subject must be OFF in the Set Wallpaper action.'],
                        ['Shortcut stopped working', 'Re-run the setup shortcut manually once to re-authorize.'],
                        ['I updated my design — do I need to redo this?', 'No. Same URL, wallpaper regenerates automatically.'],
                      ].map(([q, a]) => (
                        <div key={q} style={{ marginBottom: 14 }}>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 3 }}>&quot;{q}&quot;</div>
                          <div style={{ lineHeight: 1.6 }}>{a}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Android Instructions ── */}
            {platform === 'android' && (
              <>
                <div style={stepStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <StepNum n={2} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Install MacroDroid</span>
                  </div>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', padding: '13px 20px', background: '#ffffff', color: '#000', textDecoration: 'none', borderRadius: 10, textAlign: 'center', fontSize: 15, fontWeight: 800, marginBottom: 10, letterSpacing: -0.2 }}
                  >
                    Download MacroDroid (Free) →
                  </a>
                  <p style={{ fontSize: 12, color: C.textLow, lineHeight: 1.6 }}>Free on the Google Play Store. No subscription needed for this use case.</p>
                </div>

                <div style={stepStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <StepNum n={3} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Create the macro</span>
                  </div>
                  <ol style={{ paddingLeft: 20, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 2.1, margin: 0 }}>
                    <li>Open MacroDroid → tap <strong style={{ color: '#fff' }}>+ Add Macro</strong></li>
                    <li>Tap <strong style={{ color: '#fff' }}>Triggers</strong> → <strong style={{ color: '#fff' }}>Clock / Timer</strong> → <strong style={{ color: '#fff' }}>Specific Time</strong></li>
                    <li>Set time to <strong style={{ color: '#fff' }}>12:00 AM (midnight)</strong> → Daily → tap <strong style={{ color: '#fff' }}>OK</strong></li>
                    <li>Tap <strong style={{ color: '#fff' }}>Actions</strong> → <strong style={{ color: '#fff' }}>Files/Media</strong> → <strong style={{ color: '#fff' }}>Download File</strong></li>
                    <li>URL: paste your wallpaper URL. Save path: <code style={{ background: '#1a1a1a', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>Downloads/counted.jpg</code></li>
                    <li>Tap <strong style={{ color: '#fff' }}>+</strong> again → <strong style={{ color: '#fff' }}>Device</strong> → <strong style={{ color: '#fff' }}>Set Wallpaper</strong></li>
                    <li>File path: <code style={{ background: '#1a1a1a', padding: '1px 5px', borderRadius: 3, fontSize: 11 }}>Downloads/counted.jpg</code> → Lock Screen</li>
                    <li>Name macro <strong style={{ color: '#fff' }}>&quot;Counted&quot;</strong> → tap <strong style={{ color: '#fff' }}>Save</strong></li>
                  </ol>
                </div>

                <div style={stepStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <StepNum n={4} />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Grant permissions</span>
                  </div>
                  <ul style={{ paddingLeft: 20, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 2.1, margin: 0 }}>
                    <li>Allow MacroDroid to <strong style={{ color: '#fff' }}>run in the background</strong> (battery exemption)</li>
                    <li>Allow <strong style={{ color: '#fff' }}>Storage</strong> permission to download the image</li>
                    <li>Allow <strong style={{ color: '#fff' }}>Set Wallpaper</strong> permission</li>
                    <li>Tap <strong style={{ color: '#fff' }}>Run</strong> once to test — wallpaper should update immediately</li>
                  </ul>
                </div>

                <div style={{ ...stepStyle, background: 'transparent', border: `1px solid ${C.border}` }}>
                  <button
                    onClick={() => setShowTrouble(!showTrouble)}
                    style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>Troubleshooting</span>
                    <span style={{ fontSize: 10 }}>{showTrouble ? '▲' : '▼'}</span>
                  </button>
                  {showTrouble && (
                    <div style={{ marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                      {[
                        ["Macro doesn't run at midnight", 'Settings → Battery → MacroDroid → disable battery optimization. Android kills background apps aggressively.'],
                        ['Download fails', 'Check your internet connection and verify the wallpaper URL works in a browser first.'],
                        ["Wallpaper doesn't update", 'Make sure the Set Wallpaper action targets Lock Screen (not Home Screen).'],
                        ['I updated my design', 'No changes needed. Same URL, new wallpaper regenerates daily.'],
                      ].map(([q, a]) => (
                        <div key={q} style={{ marginBottom: 14 }}>
                          <div style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 3 }}>&quot;{q}&quot;</div>
                          <div style={{ lineHeight: 1.6 }}>{a}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function InstallPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#555', fontFamily: 'system-ui' }}>Loading…</div>}>
      <InstallContent />
    </Suspense>
  );
}
