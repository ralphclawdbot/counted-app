'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const SHORTCUT_ICLOUD_URL = 'https://www.icloud.com/shortcuts/PLACEHOLDER_UPDATE_AFTER_PUBLISHING';

const C = {
  bg:       '#050505',
  surface:  '#0d0d0d',
  border:   '#1c1c1c',
  accent:   '#ff5722',
  text:     '#ffffff',
  textMid:  'rgba(255,255,255,0.55)',
  textLow:  'rgba(255,255,255,0.3)',
};

const step: React.CSSProperties = {
  padding: '20px 24px',
  background: C.surface,
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  marginBottom: 12,
};

function StepNum({ n }: { n: number }) {
  return (
    <div style={{ width: 26, height: 26, borderRadius: 13, background: C.accent, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
      {n}
    </div>
  );
}

function InstallContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const platformParam = searchParams.get('platform') as 'ios' | 'android' | null;
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const wallpaperUrl = token ? `${appUrl}/api/w/${token}` : '';

  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(platformParam || null);
  const [showManual, setShowManual] = useState(false);
  const [showTrouble, setShowTrouble] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(wallpaperUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: "-apple-system, 'Helvetica Neue', sans-serif" }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* Back */}
        <Link href="/editor" style={{ fontSize: 13, color: C.textLow, textDecoration: 'none', display: 'inline-block', marginBottom: 28 }}>
          ← Back to editor
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>Set up your wallpaper</h1>
        <p style={{ fontSize: 15, color: C.textMid, marginBottom: 32 }}>Get your life calendar updating automatically every morning.</p>

        {/* No token warning */}
        {!token && (
          <div style={{ padding: 20, background: 'rgba(255,87,34,0.08)', border: `1px solid rgba(255,87,34,0.25)`, borderRadius: 12, marginBottom: 24 }}>
            <p style={{ color: '#ff7043', fontSize: 14, marginBottom: 8 }}>No wallpaper saved yet.</p>
            <Link href="/editor" style={{ fontSize: 13, color: C.accent }}>← Build your calendar first</Link>
          </div>
        )}

        {token && (
          <>
            {/* Wallpaper URL */}
            <div style={step}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <StepNum n={1} />
                <span style={{ fontWeight: 600, fontSize: 15 }}>Your wallpaper URL</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Ready</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.textMid, wordBreak: 'break-all', padding: '10px 12px', background: '#080808', borderRadius: 8, marginBottom: 10, border: `1px solid ${C.border}` }}>
                {wallpaperUrl}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCopy} style={{ padding: '7px 16px', background: copied ? '#16a34a' : C.accent, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  {copied ? '✓ Copied' : 'Copy URL'}
                </button>
                <a href={wallpaperUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '7px 14px', background: '#1a1a1a', color: C.textMid, borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>
                  Preview →
                </a>
              </div>
            </div>

            {/* Device picker */}
            <div style={step}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <StepNum n={2} />
                <span style={{ fontWeight: 600, fontSize: 15 }}>Choose your device</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* iPhone */}
                <button
                  onClick={() => setPlatform('ios')}
                  style={{
                    padding: '24px 16px', borderRadius: 12, cursor: 'pointer',
                    background: platform === 'ios' ? 'rgba(255,87,34,0.1)' : '#111',
                    border: platform === 'ios' ? `1.5px solid ${C.accent}` : `1.5px solid ${C.border}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Apple logo */}
                  <svg width="32" height="38" viewBox="0 0 814 1000" fill="white">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-37.3-148.3-109.8L14.1 695.5c-14.8-25.4-22.2-54.1-22.1-83.1 0-89.8 65-173.1 145.2-173.1 75.4 0 110.9 53.4 165.9 53.4 52.4 0 84.3-53.4 165.9-53.4 70.4 0 138.3 76.3 154.8 115.4C691 624.9 729.5 624.9 729.5 624.9c-13.3-30.7-23.1-57.8-30.3-80.5z M534.8 233.5c30.3-35.5 51.3-86.3 51.3-137 0-7-0.7-14-2-20.9-47.8 1.7-104.5 31.8-138.2 73.7-25.3 29.6-51.3 78.3-51.3 130.2 0 7.6 1.3 15.1 1.9 17.5 3.2 0.6 8.3 1.3 13.4 1.3 43.4 0 97.9-28.9 125.2-64.8z"/>
                  </svg>
                  <div>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>iPhone</div>
                    <div style={{ color: C.textLow, fontSize: 12, marginTop: 2 }}>iOS Shortcuts</div>
                  </div>
                </button>

                {/* Android */}
                <button
                  onClick={() => setPlatform('android')}
                  style={{
                    padding: '24px 16px', borderRadius: 12, cursor: 'pointer',
                    background: platform === 'android' ? 'rgba(255,87,34,0.1)' : '#111',
                    border: platform === 'android' ? `1.5px solid ${C.accent}` : `1.5px solid ${C.border}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Android logo */}
                  <svg width="34" height="38" viewBox="0 0 576 512" fill="white">
                    <path d="M420.55 301.93a24 24 0 1 1 24-24 24 24 0 0 1-24 24m-265.1 0a24 24 0 1 1 24-24 24 24 0 0 1-24 24m273.7-144.48 47.94-83a10 10 0 1 0-17.27-10h0l-48.54 84.07a301.25 301.25 0 0 0-246.56 0L116.18 64.45a10 10 0 1 0-17.27 10h0l47.94 83C64.53 202.22 8.24 285.55 0 384h576c-8.24-98.45-64.54-181.78-146.85-226.55"/>
                  </svg>
                  <div>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>Android</div>
                    <div style={{ color: C.textLow, fontSize: 12, marginTop: 2 }}>MacroDroid</div>
                  </div>
                </button>
              </div>
            </div>

            {/* ── iOS Instructions ── */}
            {platform === 'ios' && (
              <>
                <div style={step}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <StepNum n={3} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Add the Shortcut</span>
                  </div>
                  <a
                    href={SHORTCUT_ICLOUD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', padding: '14px 20px', background: C.accent, color: 'white', textDecoration: 'none', borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 10, boxShadow: '0 4px 20px rgba(255,87,34,0.3)' }}
                  >
                    📱 Add Shortcut to iPhone
                  </a>
                  <p style={{ fontSize: 12, color: C.textLow }}>Opens Shortcuts app → Tap &quot;Add Shortcut&quot; → Open it and paste your URL when prompted.</p>
                </div>

                <div style={step}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <StepNum n={4} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Create the daily automation</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.textMid, marginBottom: 12 }}>Apple doesn&apos;t allow sharing automations — takes 2 minutes to set up manually.</p>
                  <ol style={{ paddingLeft: 20, fontSize: 13, color: '#bbb', lineHeight: 2, margin: 0 }}>
                    <li>Open <strong>Shortcuts</strong> → <strong>Automation</strong> tab → <strong>+</strong></li>
                    <li><strong>Time of Day</strong> → 6:00 AM → Daily → <strong>Run Immediately</strong></li>
                    <li>Turn off &quot;Ask Before Running&quot;</li>
                    <li>Add action: <strong>Get File</strong> (from iCloud / Shortcuts / <code style={{ background: '#1a1a1a', padding: '1px 5px', borderRadius: 3 }}>counted-url.txt</code>)</li>
                    <li>Add action: <strong>Get Contents of URL</strong></li>
                    <li>Add action: <strong>Set Wallpaper Photo</strong> → Lock Screen → Crop to Subject: <strong>OFF</strong></li>
                    <li>Tap <strong>Done</strong></li>
                  </ol>
                </div>

                {/* Manual */}
                <div style={step}>
                  <button onClick={() => setShowManual(!showManual)} style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 500 }}>
                    Set up manually instead {showManual ? '↑' : '↓'}
                  </button>
                  {showManual && (
                    <ol style={{ paddingLeft: 20, fontSize: 13, color: '#999', lineHeight: 1.9, marginTop: 12 }}>
                      <li>Open <strong>Shortcuts</strong> → tap <strong>+</strong></li>
                      <li>Add: <strong>URL</strong> → paste your wallpaper URL</li>
                      <li>Add: <strong>Get Contents of URL</strong></li>
                      <li>Add: <strong>Set Wallpaper Photo</strong> → Lock Screen</li>
                      <li>Name it &quot;Counted&quot; → Done</li>
                      <li>Automation tab → + → Time of Day → 6 AM → Run Immediately → Run Shortcut &quot;Counted&quot;</li>
                    </ol>
                  )}
                </div>

                {/* Troubleshooting */}
                <div style={step}>
                  <button onClick={() => setShowTrouble(!showTrouble)} style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 500 }}>
                    Troubleshooting {showTrouble ? '↑' : '↓'}
                  </button>
                  {showTrouble && (
                    <div style={{ marginTop: 12, fontSize: 13, color: '#999' }}>
                      {[
                        ['Shortcut asks every morning', 'Settings → Shortcuts → [name] → Allow Running Without Asking'],
                        ['Wallpaper looks cropped', 'Crop to Subject must be OFF in the Set Wallpaper action.'],
                        ['Shortcut stopped working', 'Re-run the setup shortcut manually once to re-authorize.'],
                        ['I updated my design — do I need to redo this?', 'No. Same URL, wallpaper regenerates automatically.'],
                      ].map(([q, a]) => (
                        <div key={q} style={{ marginBottom: 12 }}>
                          <div style={{ color: '#ccc', fontWeight: 600, marginBottom: 2 }}>&quot;{q}&quot;</div>
                          <div>{a}</div>
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
                <div style={step}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <StepNum n={3} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Install MacroDroid</span>
                  </div>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', padding: '14px 20px', background: '#1a7c3e', color: 'white', textDecoration: 'none', borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 10, boxShadow: '0 4px 20px rgba(26,124,62,0.3)' }}
                  >
                    ▶ Download MacroDroid (Free)
                  </a>
                  <p style={{ fontSize: 12, color: C.textLow }}>Free on the Google Play Store. No subscription needed for this use case.</p>
                </div>

                <div style={step}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <StepNum n={4} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Create the macro</span>
                  </div>
                  <ol style={{ paddingLeft: 20, fontSize: 13, color: '#bbb', lineHeight: 2, margin: 0 }}>
                    <li>Open MacroDroid → tap <strong>+ Add Macro</strong></li>
                    <li>Tap <strong>Triggers</strong> → <strong>Clock / Timer</strong> → <strong>Specific Time</strong></li>
                    <li>Set time to <strong>6:00 AM</strong> → Daily → tap <strong>OK</strong></li>
                    <li>Tap <strong>Actions</strong> → <strong>Files/Media</strong> → <strong>Download File</strong></li>
                    <li>URL: paste your wallpaper URL. Save path: <code style={{ background: '#1a1a1a', padding: '1px 5px', borderRadius: 3 }}>Downloads/counted.jpg</code></li>
                    <li>Tap <strong>+</strong> again → <strong>Device</strong> → <strong>Set Wallpaper</strong></li>
                    <li>File path: <code style={{ background: '#1a1a1a', padding: '1px 5px', borderRadius: 3 }}>Downloads/counted.jpg</code> → Lock Screen</li>
                    <li>Name macro <strong>&quot;Counted&quot;</strong> → tap <strong>Save</strong></li>
                  </ol>
                </div>

                <div style={step}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <StepNum n={5} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Grant permissions</span>
                  </div>
                  <ul style={{ paddingLeft: 20, fontSize: 13, color: '#bbb', lineHeight: 2, margin: 0 }}>
                    <li>Allow MacroDroid to <strong>run in the background</strong> (battery exemption)</li>
                    <li>Allow <strong>Storage</strong> permission to download the image</li>
                    <li>Allow <strong>Set Wallpaper</strong> permission</li>
                    <li>Tap <strong>Run</strong> once to test — wallpaper should update immediately</li>
                  </ul>
                </div>

                <div style={step}>
                  <button onClick={() => setShowTrouble(!showTrouble)} style={{ background: 'none', border: 'none', color: C.textMid, cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 500 }}>
                    Troubleshooting {showTrouble ? '↑' : '↓'}
                  </button>
                  {showTrouble && (
                    <div style={{ marginTop: 12, fontSize: 13, color: '#999' }}>
                      {[
                        ['Macro doesn\'t run at 6AM', 'Go to Settings → Battery → MacroDroid → disable battery optimization. Android kills background apps aggressively.'],
                        ['Download fails', 'Check your internet connection and verify the wallpaper URL works in a browser first.'],
                        ['Wallpaper doesn\'t update', 'Make sure the Set Wallpaper action targets Lock Screen (not Home Screen).'],
                        ['I updated my design', 'No changes needed. Same URL, new wallpaper regenerates daily.'],
                      ].map(([q, a]) => (
                        <div key={q} style={{ marginBottom: 12 }}>
                          <div style={{ color: '#ccc', fontWeight: 600, marginBottom: 2 }}>&quot;{q}&quot;</div>
                          <div>{a}</div>
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
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' }}>Loading...</div>}>
      <InstallContent />
    </Suspense>
  );
}
