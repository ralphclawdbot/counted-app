'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Paintbrush, Link2, Zap, CalendarDays, Sliders, RefreshCw, MessageSquareQuote } from 'lucide-react';

// ── Color tokens ─────────────────────────────────────────────
const C = {
  bg:          '#050505',
  surface:     '#0d0d0d',
  border:      '#1c1c1c',
  borderHi:    '#2a2a2a',
  accent:      '#ffffff',
  accentDim:   'rgba(255,255,255,0.06)',
  accentBorder:'rgba(255,255,255,0.14)',
  text:        '#ffffff',
  textMid:     'rgba(255,255,255,0.55)',
  textLow:     'rgba(255,255,255,0.3)',
  dotFilled:   'rgba(255,255,255,0.88)',
  dotEmpty:    'rgba(255,255,255,0.11)',
  dotCurrent:  '#ffffff',
};

// ── Phone mockup — real frame + live wallpaper + iOS chrome ──
// Frame: apple-iphone-15-pro-black-titanium-portrait.png
// Native frame: 1419×2796  |  Screen bounds: left=120 top=120 right=1299 bottom=2676
const FRAME_W = 1419, FRAME_H = 2796;
const SCR_L = 120, SCR_T = 120, SCR_R = 1299, SCR_B = 2676;

const DEMO_WALLPAPER =
  '/api/wallpaper?type=year&width=1179&height=2556' +
  '&bg=050505&dotFilled=ffffff&dotEmpty=ffffff' +
  '&dotCurrent=ffffff&dotFilledOpacity=88&dotEmptyOpacity=10' +
  '&widgetPosition=none&dotShape=circle&dotStyle=flat&dotGapScale=1';

// Live time + date helpers (same as Canvas.tsx)
function getTimeLabel() {
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}
function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// iOS lock screen chrome — exact replica of Canvas.tsx overlay
function IOSChrome({ w, h }: { w: number; h: number }) {
  const [time, setTime] = useState(getTimeLabel);
  const [date, setDate] = useState(getTodayLabel);
  useEffect(() => {
    const t = setInterval(() => { setTime(getTimeLabel()); setDate(getTodayLabel()); }, 10000);
    return () => clearInterval(t);
  }, []);

  // Mirror same layout math as Canvas.tsx
  const safeTopFrac = 0.28;
  const dotStartPx  = Math.round(h * safeTopFrac);
  const dateFontPx  = Math.round(w * 0.052);
  const timeFontPx  = Math.min(Math.round(w * 0.32), Math.round((dotStartPx - Math.round(h * 0.07) - 4) * 0.55));
  const lockSize    = Math.max(10, Math.round(timeFontPx * 0.22));
  const timeTop     = dotStartPx - timeFontPx - 4;
  const dateTop     = timeTop - dateFontPx - 5;
  const lockTop     = dateTop - lockSize - 6;
  const btnSize     = Math.round(w * 0.155);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', overflow: 'hidden' }}>

      {/* DI + status bar row */}
      <div style={{
        position: 'absolute', top: '2%', left: 0, right: 0,
        height: Math.round(h * 0.04),
        display: 'flex', alignItems: 'center',
        padding: `0 ${Math.round(w * 0.04)}px`,
      }}>
        <div style={{ flex: 1 }} />
        {/* Dynamic Island */}
        <div style={{ width: Math.round(w * 0.26), height: Math.round(h * 0.032), background: '#000', borderRadius: 99, flexShrink: 0 }} />
        {/* Status icons */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, paddingLeft: 6 }}>
          {/* Signal bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
            {[0.25,0.45,0.65,0.85].map((op, i) => (
              <div key={i} style={{ width: 3, borderRadius: 1, height: 4 + i * 2, background: `rgba(255,255,255,${op})` }} />
            ))}
          </div>
          {/* WiFi */}
          <svg width="12" height="9" viewBox="0 0 24 18" fill="none" style={{ marginLeft: 1 }}>
            <path d="M1 7 Q12 -1 23 7" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <path d="M5 12 Q12 6 19 12" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="12" cy="17" r="2.5" fill="rgba(255,255,255,0.9)"/>
          </svg>
          {/* Battery */}
          <svg width="22" height="11" viewBox="0 0 44 22" fill="none" style={{ marginLeft: 1 }}>
            <rect x="1" y="1" width="37" height="20" rx="5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none"/>
            <rect x="3" y="3" width="24" height="16" rx="3" fill="rgba(255,255,255,0.85)"/>
            <path d="M40 8 Q44 8 44 11 Q44 14 40 14" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Lock icon */}
      <div style={{ position: 'absolute', top: lockTop, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <svg width={lockSize} height={Math.round(lockSize * 1.2)} viewBox="0 0 28 34" fill="none">
          <path d="M6 14V9C6 4.6 9.6 1 14 1s8 3.6 8 8v5" stroke="rgba(255,255,255,0.9)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <rect x="1" y="14" width="26" height="19" rx="5" fill="rgba(255,255,255,0.9)"/>
        </svg>
      </div>

      {/* Date */}
      <div style={{
        position: 'absolute', top: dateTop, width: '100%', textAlign: 'center',
        color: 'rgba(255,255,255,0.88)', fontSize: dateFontPx, fontWeight: 400, letterSpacing: 0.1,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
      }}>{date}</div>

      {/* Time */}
      <div style={{
        position: 'absolute', top: timeTop, width: '100%', textAlign: 'center',
        color: '#ffffff', fontSize: timeFontPx, fontWeight: 400,
        letterSpacing: -1, lineHeight: 1,
        fontFamily: '"Helvetica Neue", -apple-system, BlinkMacSystemFont, sans-serif',
      }}>{time}</div>

      {/* Flashlight + Camera buttons */}
      {(['left','right'] as const).map((side) => {
        const isFlash = side === 'left';
        return (
          <div key={side} style={{
            position: 'absolute', bottom: '9%',
            [side]: Math.round(w * 0.07),
            width: btnSize, height: btnSize, borderRadius: '50%',
            background: 'rgba(80,80,80,0.55)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isFlash ? (
              <svg width={btnSize * 0.42} height={btnSize * 0.42} viewBox="0 0 100 100" fill="white">
                <line x1="50" y1="4" x2="50" y2="10" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                <line x1="72" y1="10" x2="67" y2="15" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                <line x1="28" y1="10" x2="33" y2="15" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                <circle cx="50" cy="30" r="16" fill="white"/>
                <circle cx="50" cy="30" r="9" fill="rgba(0,0,0,0.35)"/>
                <path d="M34 44 L40 90 Q50 96 60 90 L66 44 Z" fill="white"/>
                <rect x="38" y="60" width="24" height="4" rx="2" fill="rgba(0,0,0,0.2)"/>
                <rect x="38" y="70" width="24" height="4" rx="2" fill="rgba(0,0,0,0.2)"/>
              </svg>
            ) : (
              <svg width={btnSize * 0.46} height={btnSize * 0.42} viewBox="0 0 100 80" fill="white">
                <path d="M35 6 L40 0 L60 0 L65 6 Z" fill="white"/>
                <rect x="33" y="4" width="34" height="8" rx="3" fill="white"/>
                <rect x="0" y="10" width="100" height="70" rx="14" fill="white"/>
                <circle cx="50" cy="46" r="22" fill="rgba(40,40,40,0.75)"/>
                <circle cx="50" cy="46" r="14" fill="rgba(20,20,20,0.9)"/>
                <circle cx="44" cy="40" r="4" fill="rgba(255,255,255,0.15)"/>
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
        width: Math.round(w * 0.35), height: 4,
        background: 'rgba(255,255,255,0.55)', borderRadius: 3,
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
        background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 68%)',
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

// ── Days remaining in the current year ───────────────────────
function daysLeftInYear(): number {
  const now = new Date();
  const end = new Date(now.getFullYear(), 11, 31);
  return Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

// ── Main landing page ─────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const daysLeft = daysLeftInYear();

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
          background: C.accent, color: '#000',
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
        background: 'none',
      }}>
        {/* Left text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: C.accentDim, border: `1px solid ${C.accentBorder}`,
            color: C.textMid, fontSize: 11, fontWeight: 600,
            padding: '4px 12px', borderRadius: 20, marginBottom: 24,
            textTransform: 'uppercase', letterSpacing: 0.8,
          }}>
            Free · No sign-up · iPhone & Android
          </div>
          <h1 style={{ fontSize: 'clamp(44px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.03, letterSpacing: -2.5, marginBottom: 20 }}>
            Your year,<br />
            <span style={{ color: C.accent }}>counted.</span>
          </h1>
          <p style={{ fontSize: 18, color: C.textMid, lineHeight: 1.65, maxWidth: 400, marginBottom: 36 }}>
            A dot for every day. See exactly how many days you have left this year — and make every one count. Auto-updates on your lock screen every morning.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/editor" style={{
              background: C.accent, color: '#000',
              padding: '13px 28px', borderRadius: 12,
              fontSize: 15, fontWeight: 700, textDecoration: 'none',
            }}>
              See my year →
            </Link>
            <a href="#how" style={{ fontSize: 14, color: C.textMid, textDecoration: 'none' }}>
              How it works ↓
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
          <Counter end={365} label="days in a year" />
          <Counter end={daysLeft} label="days left in this year" />
          {userCount !== null && userCount > 0
            ? <Counter end={userCount} label="wallpapers created" />
            : <Counter end={1} label="dot = 1 day of your year" />
          }
        </div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section id="how" className="lp-section-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
          How it works
        </div>
        <h2 className="lp-h2" style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.2, marginBottom: 48 }}>
          Up in two minutes.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { num: '01', Icon: Paintbrush, title: 'Build your year view', body: 'Pick your colors, dot style, and theme. 365 dots — one for each day of the year. Filled dots are gone. The bright one is today. The canvas updates live.' },
            { num: '02', Icon: Link2, title: 'Save your permanent link', body: 'Hit save and get a permanent URL. That link always returns your latest wallpaper, freshly generated every morning from your config.' },
            { num: '03', Icon: Zap, title: 'Wake up to today\'s count', body: 'iOS Shortcuts or MacroDroid fetches your URL at midnight and sets it as your lock screen. Every morning you see exactly how many days are left. No app, no login, no friction.' },
          ].map((s) => (
            <div key={s.num} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
              <s.Icon size={22} strokeWidth={1.5} color={C.textMid} style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textLow, marginBottom: 8, letterSpacing: 0.5 }}>{s.num}</div>
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
            { Icon: CalendarDays, title: '365 days, one dot each', body: 'Every dot is one day of your year. Filled = gone. Bright = today. Empty = still yours. It\'s the clearest possible picture of where you are in the year.' },
            { Icon: Sliders, title: 'Make it yours', body: 'Color themes, photo backdrop layers, dot styles, gradient fills. Live PNG preview so you see exactly what your lock screen will look like before you save.' },
            { Icon: RefreshCw, title: 'One fewer dot every morning', body: 'At midnight, your wallpaper pulls a fresh render. You wake up and one more dot is filled. No manual updates, no stale numbers — always accurate.' },
            { Icon: MessageSquareQuote, title: 'Daily quote', body: 'A rotating quote between the flashlight and camera buttons. One fresh line of perspective every morning to go with your day count.' },
          ].map((f) => (
            <div key={f.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: C.accentDim, border: `1px solid ${C.accentBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <f.Icon size={18} strokeWidth={1.5} color={C.textMid} />
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
            &ldquo;A year from now you may wish you had started today.&rdquo;
          </div>
          <div style={{ fontSize: 13, color: C.textLow }}>Karen Lamb</div>
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="lp-cta-section" style={{ textAlign: 'center', padding: '88px 40px' }}>
        <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 16 }}>
          {daysLeft} days left.<br />Make them count.
        </h2>
        <p style={{ fontSize: 16, color: C.textMid, marginBottom: 36 }}>
          Free. No account. Works on iPhone & Android, forever.
        </p>
        <Link href="/editor" style={{
          display: 'inline-block',
          background: C.accent, color: '#000',
          padding: '15px 44px', borderRadius: 14,
          fontSize: 17, fontWeight: 700, textDecoration: 'none',
        }}>
          See my year →
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
        <span style={{ fontSize: 13, color: C.textLow }}>Your year, counted.</span>
        <Link href="/editor" style={{ fontSize: 13, color: C.textLow, textDecoration: 'none' }}>Open editor →</Link>
      </footer>

    </div>
  );
}
