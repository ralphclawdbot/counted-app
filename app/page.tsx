'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// ── Color tokens (match app defaults) ────────────────────────
const C = {
  bg:         '#050505',
  surface:    '#0d0d0d',
  border:     '#1c1c1c',
  borderHi:   '#2a2a2a',
  accent:     '#ff5722',
  accentDim:  'rgba(255,87,34,0.12)',
  accentBorder:'rgba(255,87,34,0.28)',
  text:       '#ffffff',
  textMid:    'rgba(255,255,255,0.55)',
  textLow:    'rgba(255,255,255,0.3)',
  dotFilled:  'rgba(255,255,255,0.88)',
  dotEmpty:   'rgba(255,255,255,0.11)',
  dotCurrent: '#ff5722',
};

// ── Dot grid for phone mockup ─────────────────────────────────
function PhoneDotGrid({ total = 300, lived = 188 }: { total?: number; lived?: number }) {
  const COLS = 18;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 5px)`, gap: '3px', padding: '0 8px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 5, height: 5, borderRadius: '50%',
            background: i < lived - 1 ? C.dotFilled : i === lived - 1 ? C.dotCurrent : C.dotEmpty,
            boxShadow: i === lived - 1 ? `0 0 5px ${C.dotCurrent}` : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ── Phone mockup ──────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div style={{ position: 'relative', width: 200, flexShrink: 0 }}>
      {/* Glow */}
      <div style={{ position: 'absolute', inset: -60, background: `radial-gradient(circle, rgba(255,87,34,0.15) 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0 }} />

      {/* Frame */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 200, aspectRatio: '9 / 19.5',
        background: '#080808',
        borderRadius: 38,
        border: `1.5px solid #2a2a2a`,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px #1a1a1a',
      }}>
        {/* Dynamic island */}
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 78, height: 22, background: '#000', borderRadius: 20, zIndex: 10 }} />

        {/* Screen */}
        <div style={{ width: '100%', height: '100%', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 52 }}>
          <div style={{ fontSize: 46, fontWeight: 300, color: C.text, letterSpacing: -1, lineHeight: 1 }}>9:41</div>
          <div style={{ fontSize: 11, color: C.textMid, marginBottom: 16 }}>Sunday, March 29</div>
          <PhoneDotGrid />
          <div style={{ marginTop: 10, fontSize: 8, color: C.textLow, letterSpacing: 0.2 }}>1,456 weeks lived · 704 left</div>
        </div>
      </div>
    </div>
  );
}

// ── Animated counter ──────────────────────────────────────────
function Counter({ end, label }: { end: number | string; label: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (typeof end !== 'number') return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = Math.ceil(end / 60);
        const t = setInterval(() => {
          start = Math.min(start + step, end);
          setVal(start);
          if (start >= end) clearInterval(t);
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 36, fontWeight: 800, color: C.text, letterSpacing: -1 }}>
        {typeof end === 'number' ? val.toLocaleString() : end}
      </div>
      <div style={{ fontSize: 13, color: C.textLow, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Main landing page ─────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", minHeight: '100vh' }}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 40px', height: 56,
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(5,5,5,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'background 0.2s, border-color 0.2s',
      }}>
        <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5 }}>
          counted<span style={{ color: C.accent }}>.</span>
        </span>
        <Link href="/editor" style={{
          background: C.accent, color: '#fff',
          padding: '7px 18px', borderRadius: 20,
          fontSize: 13, fontWeight: 700, textDecoration: 'none',
          letterSpacing: 0.1,
        }}>
          Start for free
        </Link>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section style={{
        maxWidth: 1100, margin: '0 auto',
        padding: '72px 40px 80px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 48,
        background: 'radial-gradient(ellipse 55% 60% at 68% 48%, rgba(255,87,34,0.07) 0%, transparent 70%)',
      }}>
        {/* Left text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: C.accentDim, border: `1px solid ${C.accentBorder}`,
            color: '#ff7043', fontSize: 11, fontWeight: 700,
            padding: '4px 12px', borderRadius: 20, marginBottom: 24,
            textTransform: 'uppercase', letterSpacing: 0.8,
          }}>
            ✦ Free · No sign-up · Works on iPhone
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.03, letterSpacing: -2.5, marginBottom: 20 }}>
            Your life,<br />
            <span style={{ color: C.accent }}>counted.</span>
          </h1>
          <p style={{ fontSize: 18, color: C.textMid, lineHeight: 1.65, maxWidth: 400, marginBottom: 36 }}>
            A dot for every week. See exactly how much time you have left — and make it mean something. Auto-updates on your lock screen every morning.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/editor" style={{
              background: C.accent, color: '#fff',
              padding: '13px 28px', borderRadius: 12,
              fontSize: 15, fontWeight: 700, textDecoration: 'none',
              boxShadow: `0 4px 24px rgba(255,87,34,0.3)`,
            }}>
              Build my calendar →
            </Link>
            <a href="#how" style={{ fontSize: 14, color: C.textMid, textDecoration: 'none' }}>
              See how it works ↓
            </a>
          </div>
        </div>

        {/* Right: phone */}
        <PhoneMockup />
      </section>

      {/* ── STATS BAR ───────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          padding: '32px 40px',
          display: 'flex', justifyContent: 'space-around', gap: 32, flexWrap: 'wrap',
        }}>
          <Counter end={4160} label="weeks in 80 years" />
          <Counter end={1} label="dot = 1 week of your life" />
          <Counter end="∞" label="reasons to make them count" />
        </div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section id="how" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
          How it works
        </div>
        <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.2, marginBottom: 48 }}>
          Three steps to clarity.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { num: '01', icon: '🎨', title: 'Design your calendar', body: 'Pick life, year, or goal mode. Choose colors, photo layers, dot style, and theme. The canvas updates live — what you see is what hits your lock screen.' },
            { num: '02', icon: '🔗', title: 'Save your permanent link', body: 'Hit save and get a permanent URL. That link always returns your latest wallpaper, freshly generated every morning from your config.' },
            { num: '03', icon: '⚡', title: 'Set up iOS Shortcut', body: 'One-tap setup. An automation fetches your URL at 6AM and sets it as your lock screen. No app download, no login, no friction.' },
          ].map((s) => (
            <div key={s.num} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
              <div style={{ fontSize: 26, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 8, letterSpacing: 0.5 }}>{s.num}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
          Features
        </div>
        <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.2, marginBottom: 40 }}>
          Everything you need.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { icon: '📅', title: 'Three calendar modes', body: 'Life (every week from birth to 80), Year (days left this year), or Goal (custom countdown to any deadline). Each dot tells a different story.' },
            { icon: '🎨', title: 'Full visual editor', body: 'Color themes, photo backdrop layers, dot styles, gradient fills. Live PNG preview so you see exactly what your lock screen will look like.' },
            { icon: '🔄', title: 'Auto-updates daily', body: 'Your dot count changes every single day. The iOS Shortcut pulls a fresh render at 6AM — your wallpaper is always accurate, always current.' },
            { icon: '💬', title: 'Daily quotes', body: 'Optional rotating quote on your lock screen. A fresh line of perspective every day, sitting right between the flashlight and camera buttons.' },
          ].map((f) => (
            <div key={f.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: C.accentDim, border: `1px solid ${C.accentBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, marginBottom: 14,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUOTE STRIP ─────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '56px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.4, color: C.text, marginBottom: 12 }}>
            &ldquo;The two most important days in your life are the day you are born and the day you find out why.&rdquo;
          </div>
          <div style={{ fontSize: 13, color: C.textLow }}>— Mark Twain</div>
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '88px 40px' }}>
        <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 16 }}>
          Start counting<br />your weeks.
        </h2>
        <p style={{ fontSize: 16, color: C.textMid, marginBottom: 36 }}>
          Free. No account. Works on your iPhone, forever.
        </p>
        <Link href="/editor" style={{
          display: 'inline-block',
          background: C.accent, color: '#fff',
          padding: '15px 44px', borderRadius: 14,
          fontSize: 17, fontWeight: 700, textDecoration: 'none',
          boxShadow: `0 6px 32px rgba(255,87,34,0.35)`,
        }}>
          Build my calendar →
        </Link>
        <div style={{ fontSize: 13, color: C.textLow, marginTop: 14 }}>
          Takes about 2 minutes to set up.
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>
          counted<span style={{ color: C.accent }}>.</span>
        </span>
        <span style={{ fontSize: 13, color: C.textLow }}>Your life, counted.</span>
        <Link href="/editor" style={{ fontSize: 13, color: C.textLow, textDecoration: 'none' }}>Open editor →</Link>
      </footer>

    </div>
  );
}
