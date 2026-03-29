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

// ── Phone mockup — real frame + live wallpaper + iOS chrome ──
// Frame: apple-iphone-15-pro-black-titanium-portrait.png
// Native frame: 1419×2796  |  Screen bounds: left=120 top=120 right=1299 bottom=2676
const FRAME_W = 1419, FRAME_H = 2796;
const SCR_L = 120, SCR_T = 120, SCR_R = 1299, SCR_B = 2676;

const DEMO_WALLPAPER =
  '/api/wallpaper?type=year&width=1179&height=2556' +
  '&bg=050505&dotFilled=ffffff&dotEmpty=ffffff' +
  '&dotCurrent=ff5722&dotFilledOpacity=88&dotEmptyOpacity=10' +
  '&widgetPosition=none&dotShape=circle&dotStyle=flat&dotGapScale=1';

// iOS lock screen chrome overlay (Dynamic Island, clock, status bar, bottom buttons)
function IOSChrome({ w, h }: { w: number; h: number }) {
  const s = w / 393; // scale relative to standard 393pt width

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', overflow: 'hidden', borderRadius: 38 }}>

      {/* Dynamic Island */}
      <div style={{
        position: 'absolute', top: Math.round(10 * s), left: '50%',
        transform: 'translateX(-50%)',
        width: Math.round(120 * s), height: Math.round(34 * s),
        background: '#000', borderRadius: 20,
      }} />

      {/* Status bar — right of DI */}
      <div style={{
        position: 'absolute', top: Math.round(13 * s),
        right: Math.round(14 * s),
        display: 'flex', alignItems: 'center', gap: Math.round(4 * s),
      }}>
        {/* Signal dots */}
        {[1,0.85,0.7,0.4].map((o, i) => (
          <div key={i} style={{ width: Math.round(4*s), height: Math.round(4*s), borderRadius: '50%', background: `rgba(255,255,255,${o})` }} />
        ))}
        {/* WiFi */}
        <svg width={Math.round(14*s)} height={Math.round(11*s)} viewBox="0 0 14 11" fill="none">
          <path d="M7 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" fill="white"/>
          <path d="M3.5 6C4.8 4.7 6.3 4 7 4s2.2.7 3.5 2" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
          <path d="M1 3.5C2.9 1.4 4.9 0 7 0s4.1 1.4 6 3.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.55"/>
        </svg>
        {/* Battery */}
        <div style={{ position: 'relative', width: Math.round(20*s), height: Math.round(10*s), border: '1px solid rgba(255,255,255,0.5)', borderRadius: 2 }}>
          <div style={{ position: 'absolute', top: 1, left: 1, width: `${0.78 * 100}%`, height: `calc(100% - 2px)`, background: 'white', borderRadius: 1 }} />
          <div style={{ position: 'absolute', right: -3, top: '25%', width: 2, height: '50%', background: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />
        </div>
      </div>

      {/* Lock icon */}
      <div style={{ position: 'absolute', top: Math.round(62*s), left: '50%', transform: 'translateX(-50%)' }}>
        <svg width={Math.round(16*s)} height={Math.round(20*s)} viewBox="0 0 16 20" fill="white">
          <rect x="1" y="9" width="14" height="10" rx="2.5"/>
          <path d="M4 9V6a4 4 0 018 0v3" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Clock */}
      <div style={{
        position: 'absolute', top: Math.round(82*s), left: '50%', transform: 'translateX(-50%)',
        fontSize: Math.round(72*s), fontWeight: 300, color: '#fff',
        letterSpacing: -1, lineHeight: 1, whiteSpace: 'nowrap',
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        textShadow: '0 1px 8px rgba(0,0,0,0.4)',
      }}>
        9:41
      </div>

      {/* Date */}
      <div style={{
        position: 'absolute', top: Math.round(165*s), left: '50%', transform: 'translateX(-50%)',
        fontSize: Math.round(16*s), fontWeight: 500, color: 'rgba(255,255,255,0.85)',
        whiteSpace: 'nowrap', letterSpacing: 0.1,
        textShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }}>
        Sunday, March 29
      </div>

      {/* Bottom buttons (flashlight + camera) */}
      <div style={{
        position: 'absolute', bottom: Math.round(36*s),
        left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between',
        padding: `0 ${Math.round(28*s)}px`,
      }}>
        {/* Flashlight */}
        <div style={{
          width: Math.round(52*s), height: Math.round(52*s),
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width={Math.round(18*s)} height={Math.round(22*s)} viewBox="0 0 18 22" fill="white">
            <path d="M6 0h6l-1 8h4L6 22l2-10H4L6 0z"/>
          </svg>
        </div>
        {/* Camera */}
        <div style={{
          width: Math.round(52*s), height: Math.round(52*s),
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width={Math.round(22*s)} height={Math.round(18*s)} viewBox="0 0 22 18" fill="white">
            <path d="M7 2l1.5-2h5L15 2h4a1 1 0 011 1v13a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1h5z"/>
            <circle cx="11" cy="9.5" r="3.5" fill="#050505"/>
            <circle cx="11" cy="9.5" r="2" fill="none" stroke="white" strokeWidth="0.8"/>
          </svg>
        </div>
      </div>

      {/* Home indicator */}
      <div style={{
        position: 'absolute', bottom: Math.round(10*s), left: '50%',
        transform: 'translateX(-50%)',
        width: Math.round(120*s), height: Math.round(4*s),
        background: 'rgba(255,255,255,0.5)', borderRadius: 3,
      }} />
    </div>
  );
}

function PhoneMockup() {
  const DISPLAY_W = 260;
  const scale     = DISPLAY_W / FRAME_W;
  const DISPLAY_H = Math.round(FRAME_H * scale);
  const scrLeft   = Math.round(SCR_L * scale);
  const scrTop    = Math.round(SCR_T * scale);
  const scrW      = Math.round((SCR_R - SCR_L) * scale);
  const scrH      = Math.round((SCR_B - SCR_T) * scale);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Glow behind phone */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,87,34,0.18) 0%, transparent 68%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Phone container */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: DISPLAY_W, height: DISPLAY_H,
        filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.8))',
      }}>
        {/* Screen area wrapper — clips iOS chrome to screen bounds */}
        <div style={{
          position: 'absolute',
          top: scrTop, left: scrLeft,
          width: scrW, height: scrH,
          borderRadius: 38, overflow: 'hidden',
          zIndex: 1,
        }}>
          {/* Wallpaper */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={DEMO_WALLPAPER}
            alt="wallpaper preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* iOS chrome overlay */}
          <IOSChrome w={scrW} h={scrH} />
        </div>

        {/* Frame overlay — on top of everything */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/frames/apple-iphone-15-pro-black-titanium-portrait.png"
          alt=""
          style={{
            position: 'absolute', top: 0, left: 0,
            width: DISPLAY_W, height: DISPLAY_H,
            zIndex: 2, pointerEvents: 'none',
          }}
        />
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
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setUserCount(d.count)).catch(() => {});
  }, []);

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", minHeight: '100vh' }}>
      <style>{`
        .lp-hero        { flex-direction: row; }
        .lp-phone       { display: flex; }
        .lp-section-pad { padding-left: 40px; padding-right: 40px; }
        .lp-stats       { gap: 32px; }
        .lp-quote       { font-size: 28px; }
        @media (max-width: 640px) {
          .lp-hero        { flex-direction: column !important; align-items: flex-start !important; padding: 40px 20px 48px !important; gap: 40px !important; }
          .lp-phone       { justify-content: center; width: 100%; }
          .lp-section-pad { padding-left: 20px !important; padding-right: 20px !important; }
          .lp-stats       { gap: 24px !important; flex-wrap: wrap !important; justify-content: center !important; }
          .lp-quote       { font-size: 20px !important; }
          .lp-nav         { padding: 0 20px !important; }
          .lp-footer      { padding: 20px !important; flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .lp-cta-section { padding: 60px 20px !important; }
          .lp-h2          { font-size: 30px !important; }
          .lp-stats-bar   { padding: 28px 20px !important; }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="lp-nav" style={{
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
      <section className="lp-hero" style={{
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
        <div className="lp-phone"><PhoneMockup /></div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="lp-stats lp-stats-bar" style={{
          maxWidth: 800, margin: '0 auto',
          padding: '32px 40px',
          display: 'flex', justifyContent: 'space-around', gap: 32, flexWrap: 'wrap',
        }}>
          <Counter end={4160} label="weeks in 80 years" />
          <Counter end={1} label="dot = 1 week of your life" />
          {userCount !== null && userCount > 0
            ? <Counter end={userCount} label="wallpapers created" />
            : <Counter end="∞" label="reasons to make them count" />
          }
        </div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section id="how" className="lp-section-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
          How it works
        </div>
        <h2 className="lp-h2" style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.2, marginBottom: 48 }}>
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
      <section className="lp-section-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 80px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
          Features
        </div>
        <h2 className="lp-h2" style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.2, marginBottom: 40 }}>
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
          <div className="lp-quote" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.4, color: C.text, marginBottom: 12 }}>
            &ldquo;The two most important days in your life are the day you are born and the day you find out why.&rdquo;
          </div>
          <div style={{ fontSize: 13, color: C.textLow }}>— Mark Twain</div>
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="lp-cta-section" style={{ textAlign: 'center', padding: '88px 40px' }}>
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
      <footer className="lp-footer" style={{ borderTop: `1px solid ${C.border}`, padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>
          counted<span style={{ color: C.accent }}>.</span>
        </span>
        <span style={{ fontSize: 13, color: C.textLow }}>Your life, counted.</span>
        <Link href="/editor" style={{ fontSize: 13, color: C.textLow, textDecoration: 'none' }}>Open editor →</Link>
      </footer>

    </div>
  );
}
