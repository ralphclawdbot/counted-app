'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const SHORTCUT_ICLOUD_URL = 'https://www.icloud.com/shortcuts/PLACEHOLDER_UPDATE_AFTER_PUBLISHING';

const stepStyle: React.CSSProperties = {
  padding: '16px 20px',
  background: '#111',
  borderRadius: 8,
  border: '1px solid #222',
  marginBottom: 12,
};

function InstallContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const wallpaperUrl = token ? `${appUrl}/api/w/${token}` : '';

  const [copied, setCopied] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');

  const handleCopy = () => {
    navigator.clipboard.writeText(wallpaperUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Setup Your Wallpaper</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>Get your life calendar updating automatically every morning.</p>

      {!token && (
        <div style={{ padding: 20, background: '#1a0800', border: '1px solid #663300', borderRadius: 8, marginBottom: 24 }}>
          <p style={{ color: '#ffaa44' }}>No token found. Save your design first from the editor to get a wallpaper URL.</p>
          <Link href="/editor" style={{ color: '#2563eb', fontSize: 14 }}>← Back to Editor</Link>
        </div>
      )}

      {token && (
        <>
          {/* Step 1: Your URL */}
          <div style={stepStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ background: '#2563eb', color: 'white', width: 24, height: 24, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>1</span>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Your Wallpaper URL</span>
              <span style={{ color: '#16a34a', fontSize: 12 }}>✓ Ready</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#aaa', wordBreak: 'break-all', padding: '8px 12px', background: '#0a0a0a', borderRadius: 4, marginBottom: 8 }}>
              {wallpaperUrl}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCopy} style={{ padding: '6px 14px', background: copied ? '#16a34a' : '#2563eb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {copied ? 'Copied! ✓' : 'Copy URL'}
              </button>
              <a href={wallpaperUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 14px', background: '#333', color: '#aaa', borderRadius: 4, fontSize: 13, textDecoration: 'none' }}>
                Test in Browser →
              </a>
            </div>
          </div>

          {/* Platform tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            <button onClick={() => setActiveTab('ios')} style={{ padding: '6px 16px', background: activeTab === 'ios' ? '#2563eb' : '#222', color: activeTab === 'ios' ? 'white' : '#888', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              iPhone
            </button>
            <button onClick={() => setActiveTab('android')} style={{ padding: '6px 16px', background: activeTab === 'android' ? '#2563eb' : '#222', color: activeTab === 'android' ? 'white' : '#888', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Android
            </button>
          </div>

          {activeTab === 'ios' ? (
            <>
              {/* Step 2: Setup Shortcut */}
              <div style={stepStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ background: '#333', color: '#aaa', width: 24, height: 24, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>2</span>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>Add Setup Shortcut</span>
                </div>
                <a
                  href={SHORTCUT_ICLOUD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '14px 20px',
                    background: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: 8,
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  📱 Add Shortcut to iPhone
                </a>
                <p style={{ fontSize: 12, color: '#666' }}>
                  Opens the Shortcuts app → Tap &quot;Add Shortcut&quot; → Then open it and paste your URL when prompted.
                </p>
              </div>

              {/* Step 3: Automation */}
              <div style={stepStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ background: '#333', color: '#aaa', width: 24, height: 24, borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>3</span>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>Create Daily Automation</span>
                </div>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                  Apple doesn&apos;t allow automations to be shared — you&apos;ll need to create this one yourself. Takes about 2 minutes.
                </p>
                <ol style={{ paddingLeft: 20, fontSize: 13, color: '#bbb', lineHeight: 1.8 }}>
                  <li>Open <strong>Shortcuts</strong> → <strong>Automation</strong> tab → <strong>+</strong> → New Automation</li>
                  <li><strong>Time of Day</strong> → 6:00 AM → Daily → <strong>Run Immediately</strong> (turn off &quot;Ask Before Running&quot;)</li>
                  <li>Add: <strong>Get File</strong> → iCloud Drive / Shortcuts / <code style={{ background: '#222', padding: '1px 4px', borderRadius: 2 }}>counted-url.txt</code></li>
                  <li>Add: <strong>Get Contents of URL</strong> → use file contents as URL</li>
                  <li>Add: <strong>Set Wallpaper Photo</strong> → Lock Screen → tap <strong>→</strong> → <strong>Crop to Subject: OFF</strong> + <strong>Show Preview: OFF</strong></li>
                  <li>Tap <strong>Done</strong></li>
                </ol>
              </div>

              {/* Manual setup accordion */}
              <div style={stepStyle}>
                <button
                  onClick={() => setShowManual(!showManual)}
                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 500 }}
                >
                  Do it manually instead {showManual ? '↑' : '↓'}
                </button>
                {showManual && (
                  <ol style={{ paddingLeft: 20, fontSize: 13, color: '#999', lineHeight: 1.8, marginTop: 12 }}>
                    <li>Open <strong>Shortcuts</strong> app</li>
                    <li>Tap <strong>+</strong> to create a new shortcut</li>
                    <li>Add: <strong>URL</strong> → paste your wallpaper URL</li>
                    <li>Add: <strong>Get Contents of URL</strong></li>
                    <li>Add: <strong>Set Wallpaper Photo</strong> → Lock Screen</li>
                    <li>Name it &quot;Counted Wallpaper&quot; → Done</li>
                    <li>Go to Automation tab → <strong>+</strong> → Time of Day → 6:00 AM → Run Immediately → Add: Run Shortcut &quot;Counted Wallpaper&quot;</li>
                  </ol>
                )}
              </div>

              {/* Troubleshooting */}
              <div style={stepStyle}>
                <button
                  onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 500 }}
                >
                  Troubleshooting {showTroubleshooting ? '↑' : '↓'}
                </button>
                {showTroubleshooting && (
                  <div style={{ marginTop: 12, fontSize: 13, color: '#999' }}>
                    <p style={{ marginBottom: 8 }}>
                      <strong style={{ color: '#bbb' }}>&quot;Shortcut asks me every morning&quot;</strong><br />
                      Settings → Shortcuts → [shortcut name] → Allow Running Without Asking
                    </p>
                    <p style={{ marginBottom: 8 }}>
                      <strong style={{ color: '#bbb' }}>&quot;Wallpaper looks cropped&quot;</strong><br />
                      Crop to Subject must be OFF in the Set Wallpaper action.
                    </p>
                    <p style={{ marginBottom: 8 }}>
                      <strong style={{ color: '#bbb' }}>&quot;Shortcut stopped working&quot;</strong><br />
                      Re-run the setup shortcut once manually to re-authorize.
                    </p>
                    <p>
                      <strong style={{ color: '#bbb' }}>&quot;I changed my settings — update needed?&quot;</strong><br />
                      No. Same URL, new wallpaper auto-generates. Just save in the editor.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={stepStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Android — MacroDroid</h3>
              <p style={{ fontSize: 13, color: '#999', lineHeight: 1.6 }}>
                Install <strong>MacroDroid</strong> from the Play Store. Create a macro triggered by Time of Day (6:00 AM) that downloads the image from your wallpaper URL and sets it as your lock screen. Full guide coming soon.
              </p>
            </div>
          )}
        </>
      )}
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
