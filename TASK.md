**READ THIS FIRST — This is the full build spec.**

Below is the complete PRD. Build every story end-to-end. When done, run the QA audit and fix any issues found.

---

# PRD: Counted — Your Life, Counted.

**Project:** Counted (standalone)
**Tagline:** Your life, counted.
**Source of truth:** Implementation Guide — ralph_documents ID 43d462b4-819c-490a-81b9-d72b761ee181
**Date:** 2026-03-29
**Status:** Ready for implementation

---

## Introduction

Counted is a standalone web app that visualizes your life as a grid of dots (weeks, days, or goal countdown) and delivers an auto-updating iPhone lock screen wallpaper via iOS Shortcuts.

The core interaction is a **full canvas editor** — the right panel is a live, interactive design surface (like a simplified Canva), not a preview image. Users drag photo layers directly on the canvas, click on dots to pin life events, pan the background, resize cutouts, and reorder layers. When happy with the result, they save once and receive a permanent URL that auto-generates a fresh PNG on their lock screen every morning.

**This project is completely standalone.** No Supabase. No connection to SwarmPost or zigzag.

---

## Goals

- Build a full canvas-based wallpaper editor — drag, drop, resize, reposition elements directly on the preview
- Match thelifecalendar.com's default visual quality, with zero configuration required out of the box
- Support three calendar types: Life (4,160 weeks), Year (365 days), Goal (custom countdown)
- Multiple photo layers: background image + unlimited cutout photos, each independently positioned and sized
- Life events placed by clicking directly on dots in the canvas
- Token-based persistent URL (user pastes into iOS Shortcut once, never touches it again)
- $0/month at launch (Vercel free tier: Edge Functions + Blob 5GB + KV 30K ops)

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router) |
| Image generation | Satori + @resvg/resvg-js (JSX → SVG → PNG) |
| API runtime | Vercel Edge Functions |
| Image storage | Vercel Blob (5GB free) |
| Config storage | Vercel KV (Redis-based, 30K ops/month free) |
| Background removal | @imgly/background-removal (in-browser WASM) |
| Canvas drag & drop | @dnd-kit/core + @dnd-kit/modifiers |
| Image dimensions | image-size (Node.js, no native binaries) |
| Deploy | Vercel (free hobby tier) |

**No Supabase. No auth. No external database.**

---

## Repo & Deployment

- **GitHub repo:** `counted-app` (new, standalone)
- **Vercel project:** new project connected to `counted-app` repo
- **Vercel integrations needed:** KV (auto-injects env vars) + Blob (auto-injects env vars)
- **Manual env var:** `NEXT_PUBLIC_APP_URL=https://[vercel-deploy-domain]` (no custom domain at launch)

---

## Canvas Editor Architecture

This is the foundational design decision. Everything else flows from it.

### Two-Panel Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  LEFT PANEL (360px)            │  RIGHT PANEL (flex 1)          │
│                                │                                 │
│  Style controls:               │  ┌──── Interactive Canvas ────┐ │
│  - Calendar type tabs          │  │                             │ │
│  - Device dropdown             │  │  [Background photo]         │ │
│  - Dot customization           │  │  [Dot grid — CSS divs]      │ │
│  - Color pickers               │  │  [Cutout photo 1] ←drag    │ │
│  - Theme presets               │  │  [Cutout photo 2] ←drag    │ │
│  - bgBlur / bgDim sliders      │  │                             │ │
│                                │  └─────────────────────────────┘ │
│  Layer Panel:                  │                                 │
│  - Layer list (z-order)        │  Canvas Toolbar:                │
│  - Upload photo button         │  [Undo] [Redo] [Fit] [Reset]   │
│  - Delete layer                │                                 │
│                                │  [Save & Get My URL]           │
│  Life Events (type=life only): │                                 │
│  - Click a dot on canvas       │                                 │
│    to add an event             │                                 │
│  - Event list with × delete    │                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Canvas Scale

The canvas renders the wallpaper at a reduced scale so it fits the screen:
```
canvasWidth  = 390px (fixed)
canvasHeight = Math.round(390 * deviceHeight / deviceWidth)  // ~844px for iPhone 16
scale        = 390 / deviceWidth  // e.g., 390/1179 = 0.3308
```

All CSS positions and sizes in the canvas use canvas-space pixels. When serializing for the API, multiply by `(1 / scale)` to get full-resolution coordinates.

### Layer System

Each photo (background or cutout) is a **layer** stored in state. **Discriminated union — `bg` and `cutout` have different positional semantics, so they use distinct field names:**

```typescript
interface BaseLayer {
  id: string            // nanoid
  url: string           // Vercel Blob URL
  layerSize: number     // % of full device width this layer occupies (10–200)
  opacity: number       // 0–100
  naturalW: number      // original image width (for aspect ratio)
  naturalH: number      // original image height
  zIndex: number        // layer order (0 = bottom)
  visible: boolean
}

interface BgLayer extends BaseLayer {
  type: 'bg'
  panX: number          // background pan X (0–100, default 50 = center)
  panY: number          // background pan Y (0–100, default 50 = center)
}

interface CutoutLayer extends BaseLayer {
  type: 'cutout'
  x: number             // center anchor % from left (0–100)
  y: number             // center anchor % from top (0–100)
}

type PhotoLayer = BgLayer | CutoutLayer
```

- `bg` layer: fills canvas 100%; panning via `panX/panY` sets `objectPosition`
- `cutout` layers: free-positioned (center anchor at `x/y`), draggable, resizable
- Multiple cutouts allowed (UX cap: 10, with warning)

> ⚠️ **Naming rule:** `canvasScale` = the canvas shrink factor (`390 / deviceWidth`). `layer.layerSize` = the photo layer's size as % of device width. Never use the bare word `scale` for either — always qualify it.

### Canvas Rendering (CSS, not `<img>`)

The canvas is a `position: relative` div. Each layer is `position: absolute`. The dot grid is rendered as actual HTML/CSS divs (same formula as the API, but CSS-based) so users can:
- See the real dot pattern live
- **Click on any dot** to open a life event popup

When "Save & Get My URL" is clicked, the full config (including all layers) is JSON-serialized and stored in Vercel KV. The token URL reads that JSON and passes it to the image generation function.

### Satori Multi-Layer Rendering

The API route reads the `layers` array from KV config and renders each in z-order. Note: **when rendering via `/api/w/[token]`, all photo data and life events come from KV JSON only — never from URL params** (avoids iOS 2000-char URL limit).

```typescript
// In shared renderWallpaper(config) function
layers.sort((a, b) => a.zIndex - b.zIndex).map(layer => {
  if (layer.type === 'bg') {
    // panX/panY → objectPosition (Satori supports this)
    return <img src={dataUri} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${layer.panX}% ${layer.panY}%` }} />
  }
  if (layer.type === 'cutout') {
    const w    = fullWidth * (layer.layerSize / 100)
    const h    = w * (layer.naturalH / layer.naturalW)
    const left = (layer.x / 100 * fullWidth) - w / 2    // can be negative (partially off-screen — allowed)
    const top  = (layer.y / 100 * fullHeight) - h / 2   // can be negative — allowed
    return <img src={dataUri} style={{ position: 'absolute', left, top, width: w, height: h, opacity: layer.opacity / 100 }} />
  }
})
```

> **Note:** Satori does not support `transform: translate()`. All positioning must use pixel-based `left`/`top`. Negative values are valid and intentional (partially off-screen cutouts).

---

## User Stories

### US-CT-001: Project Scaffold
**Description:** As a developer, I need the project scaffolded with the correct packages, folder structure, and font so that all subsequent stories build on a working foundation.

**Acceptance Criteria:**
- [ ] `npx create-next-app counted-app --typescript --app` creates the project
- [ ] All packages installed: `satori`, `@vercel/blob`, `@vercel/kv`, `@imgly/background-removal`, `nanoid`, `@dnd-kit/core`, `@dnd-kit/modifiers`, `image-size`
  - Note: **do NOT add `@resvg/resvg-js`** — the image generation uses `ImageResponse` from `next/og` which bundles Satori internally. `@resvg/resvg-js` is not called directly and will add unnecessary WASM weight.
- [ ] `public/fonts/inter.ttf` exists (Inter font for Satori)
- [ ] Folder structure:
  ```
  app/
    page.tsx                   # Main editor
    install/page.tsx
    layout.tsx
    api/
      wallpaper/route.ts       # URL-params PNG endpoint (Edge)
      upload/route.ts          # Vercel Blob upload (Node)
      configs/route.ts         # KV save/update
      w/[token]/route.ts       # Token → PNG (Edge)
  components/
    Canvas.tsx                 # Interactive canvas editor
    CanvasLayer.tsx            # Single draggable/resizable layer
    DotGrid.tsx                # CSS dot grid (canvas-side rendering)
    LayerPanel.tsx             # Layer list + upload button
    LifeEventPopup.tsx         # Popup when user clicks a dot
    StylePanel.tsx             # Left panel style controls
    ColorPicker.tsx
    Preview.tsx                # Static preview fallback (mobile)
  lib/
    buildConfig.ts             # Serialize/deserialize full config
    buildUrl.ts                # Simple wallpaper URL builder
    calculations.ts            # Date math
    emoji.ts
    devices.ts
    presets.ts
  types/
    index.ts                   # WallpaperConfig, PhotoLayer, LifeEvent types
  ```
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` passes typecheck

---

### US-CT-002: /api/wallpaper — Life Calendar Core
**Description:** As a developer, I need a working PNG generation endpoint for the Life Calendar so that the token system can render wallpapers.

**Acceptance Criteria:**
- [ ] `GET /api/wallpaper?type=life&birthday=1990-01-15&width=1179&height=2556` returns a valid PNG
- [ ] `export const runtime = 'edge'`
- [ ] 4,160 dots (80yr × 52wk) by default
- [ ] Filled dots = white, 85% opacity. Empty dots = white, 10% opacity. Current week = outlined hollow ring (2px white border, transparent fill)
- [ ] Dot shape default: square with `borderRadius: '2px'`
- [ ] Dot size **auto-calculated** (never hardcoded):
  ```typescript
  const hPad   = Math.round(width * 0.05)
  const availW = width - hPad * 2
  const cellW  = availW / 52
  const dotSize = Math.floor(cellW * 0.55)
  const gap     = cellW - dotSize
  ```
- [ ] Grid **vertically centered** in safe zone:
  ```typescript
  const safeTop  = Math.round(height * 0.12)
  const safeBot  = Math.round(height * 0.06)
  const usable   = height - safeTop - safeBot
  const totalRows = Math.ceil(totalDots / 52)
  const gridH    = totalRows * dotSize + (totalRows - 1) * gap
  const topOffset = safeTop + Math.max(0, Math.floor((usable - gridH) / 2))
  ```
- [ ] Vertical positioning uses a spacer `<div style={{ height: topOffset }}>` — NOT padding-top (Satori requirement)
- [ ] Background: `#000000`. No text. No labels.
- [ ] Inter font loaded as ArrayBuffer before ImageResponse call
- [ ] `lifespan` param supported (default 80)
- [ ] `npm run build` passes

---

### US-CT-003: /api/wallpaper — Year Calendar + Goal Calendar
**Description:** As a user, I want Year (365 days) and Goal (countdown) calendar types.

**Acceptance Criteria:**
- [ ] `type=year`: 365 dots in **25 columns**. Dot size: `cellW = availW/25`, `dotSize = floor(cellW*0.55)`. Today = outlined ring.
- [ ] `type=goal`: countdown from `goalStart` to `deadline`. 25 columns. `goalProgress()` from `lib/calculations.ts`.
  - **Max goal duration: 5 years (1,825 dots).** If `deadline - goalStart > 5 years`, return a 400 error with message "Goal deadline must be within 5 years of start date." — prevents Satori timeout from rendering 10,000+ dots.
  - Frontend validates the same limit and shows an inline error on the deadline field.
- [ ] `lib/calculations.ts` exports: `weeksLived`, `dayOfYear`, `goalProgress`
- [ ] All three types render without errors
- [ ] `npm run build` passes

---

### US-CT-004: /api/wallpaper — Full Dot Customization
**Description:** As a user, I want to control colors, shapes, styles, emoji, symbols, gradients, life events, and quotes via URL params.

**Acceptance Criteria:**

**Colors:** `bg`, `dotFilled`, `dotEmpty`, `dotCurrent` (hex, no `#`). `dotFilledOpacity`, `dotEmptyOpacity` (0–100). `hexToRgba()` helper.

**Dot shape:** `circle` → `50%` | `square` (default) → `2px` | `rounded` → `${dotSize*0.28}px` | `diamond` → `30% 0`

**Dot style:** `flat` (default, no shadow) | `glow` (soft shadow) | `neon` (double shadow) | `outlined` (border on empty dots)

**Emoji mode:** `dotMode=emoji&emojiLived=🌳&emojiEmpty=🌑` — Twemoji CDN + `loadAdditionalAsset`. `lib/emoji.ts` exports `getIconCode`, `loadEmoji`.

**Symbol mode:** `dotMode=symbol&dotSymbol=heart|star|leaf|flower|moon|snow` — inline SVG `SYMBOLS` map, `symbolSvgUri()` helper.

**Gradient:** `gradientMode=true&gradientStart=FF0000&gradientEnd=0000FF`. `lerpHex(a, b, t)` helper.

**Life events:** `lifeEvents=YYYY-MM-DD:star,...` — `parseLifeEvents()` returns `Map<weekIndex, symbol>`. Event dots render gold (`#FFD700`).

**Daily quote:** `showQuote=true` — deterministic by day index from 2026-01-01. Italic, 22px, centered, 50% white opacity. Min 10 quotes in array.

- [ ] `npm run build` passes

---

### US-CT-005: /api/wallpaper — Multi-Layer Photo Rendering
**Description:** As a developer, I need the image generation API to support multiple independently-positioned photo layers (background + cutouts) so that the canvas editor's output matches the generated PNG.

**Acceptance Criteria:**

**Background layer:**
- [ ] `bgImage=<url-encoded-blob-url>` fills screen with `<img objectFit='cover'>`
- [ ] `bgOffsetX=50` (0–100, default 50) + `bgOffsetY=50` (0–100, default 50) control `objectPosition: '${x}% ${y}%'` — enables background panning
- [ ] `bgBlur=0–20` applies `filter: blur(${n}px)`
- [ ] `bgDim=0–100` renders semi-transparent black overlay

**Cutout layers (up to 5 via URL params, unlimited via KV config):**
- [ ] `cutout1Url`, `cutout1X`, `cutout1Y`, `cutout1Scale`, `cutout1Opacity`, `cutout1W`, `cutout1H` — positions cutout 1
  - `cutout1X/Y` = % from left/top (0–100), the anchor point is the center of the cutout
  - `cutout1Scale` = % of full image width the cutout occupies (10–200)
  - `cutout1W/H` = natural image dimensions (for aspect ratio calc without re-fetching)
  - Pixel calc: `w = fullWidth*(scale/100)`, `h = w*(naturalH/naturalW)`, `left = (x/100*fullWidth) - w/2`, `top = (y/100*fullHeight) - h/2`
- [ ] `cutout2Url...cutout5Url` follow same param pattern
- [ ] Cutouts rendered in ascending index order (cutout1 below cutout2, etc.)
- [ ] For KV-based configs: `layers` array in JSON config is used directly (bypasses URL param limit)
- [ ] All image URLs fetched to base64 via `Promise.all` BEFORE `ImageResponse` call
- [ ] `fetchAsDataUri(url): Promise<string|null>` helper

**Layering order (back to front):** bg image → bg dim → cutout layers (by zIndex) → dot grid → quote

- [ ] `npm run build` passes

---

### US-CT-006: Token System — Vercel KV (Full JSON Config)
**Description:** As a user, I want a permanent short URL that stores my full wallpaper config (including all layer positions) so my iOS Shortcut never needs updating.

**Acceptance Criteria:**
- [ ] `POST /api/configs` accepts full config JSON (including `layers` array)
  - Generates 8-char token via `nanoid(8)`
  - Stored as `config:{token}` with 1-year TTL (`ex: 31536000`)
  - Returns `{ token, url: "${APP_URL}/api/w/${token}" }`
- [ ] `PUT /api/configs` with `{ token, config }` updates existing config (same TTL refresh)
- [ ] `GET /api/w/[token]`:
  - `export const runtime = 'edge'`
  - Reads full JSON config from KV
  - Calls shared `renderWallpaper(config, width, height)` function that accepts the config object directly (not URL params)
  - Returns PNG directly. 404 if token not found.
- [ ] `renderWallpaper()` is a shared function used by both `/api/wallpaper` (URL param parsing → config object → render) and `/api/w/[token]` (KV config → render directly)
- [ ] KV integration enabled in Vercel dashboard
- [ ] `npm run build` passes

---

### US-CT-007: Image Upload — Vercel Blob
**Description:** As a user, I want to upload photos that are stored permanently and return their dimensions so the canvas can position them correctly.

**Acceptance Criteria:**
- [ ] `POST /api/upload` accepts `multipart/form-data` with `file` field
  - `export const runtime = 'nodejs'`
  - Validates: `image/jpeg`, `image/png`, `image/webp` only → 400 on invalid
  - Validates: max 10MB → 400 on exceed
  - Stores to Vercel Blob: `uploads/{uuid}.{ext}`, `access: 'public'`
  - Returns `{ url, width, height }` — **natural image dimensions required** for aspect ratio preservation in canvas + Satori
  - Width/height extracted from image buffer using the `image-size` npm package (lightweight, no native binaries, works in Node.js runtime)
- [ ] Blob integration enabled in Vercel dashboard
- [ ] `npm run build` passes

---

### US-CT-008: Left Panel — Style Controls
**Description:** As a user, I want a left sidebar for all style controls (colors, dot style, calendar type) while photo placement happens directly on the canvas.

**Acceptance Criteria:**
- [ ] Left panel (360px wide, scrollable) contains:
  - **Calendar type tabs:** Life | Year | Goal
  - **Device dropdown:** all models from `lib/devices.ts` (updates canvas dimensions)
  - **Birthday** (date input, Life only) + **Lifespan** (50–100, Life only)
  - **Deadline** + **Goal start** (date inputs, Goal only)
  - **Dot mode:** Standard | Emoji | Symbol (with appropriate sub-controls per mode)
  - **Color pickers:** bg color, dotFilled, dotEmpty, dotCurrent
  - **Opacity sliders:** dotFilledOpacity + dotEmptyOpacity (0–100)
  - **Dot shape:** circle | square | rounded | diamond
  - **Dot style:** flat | glow | neon | outlined
  - **Theme presets row:** dark / light / amoled / cosmic / warm / minimal (one-click apply)
  - **bgBlur slider** (0–20) + **bgDim slider** (0–100) — affects background layer
  - **Advanced toggle** (collapsed by default): safe layout, gradient mode + pickers, show quote, week start
  - **Layer Panel** (see US-CT-014)
  - **Life Events section** (see US-CT-013, Life type only)
- [ ] All controls update global `config` state immediately → canvas re-renders live
- [ ] "Save & Get My URL" button → `POST /api/configs` → stores token → shows token URL + Copy button + "Setup Instructions →" link
- [ ] Token stored in `localStorage` on save — on page reload, token is read from localStorage and the URL display is restored automatically
- [ ] Copy button shows "Copied! ✓" for 2 seconds after click, then reverts to "Copy"
- [ ] `npm run build` passes
- [ ] Verify in browser: controls render, state updates reflected on canvas immediately

---

### US-CT-009: Interactive Canvas Editor
**Description:** As a user, I want the right panel to be a live, draggable design surface where I can position photo layers, resize them, pan the background, and place life events by clicking on dots — directly on the canvas.

**Acceptance Criteria:**

**Canvas container:**
- [ ] `components/Canvas.tsx` renders a `position: relative` div scaled to `canvasWidth=390px`, `canvasHeight = round(390 * deviceH / deviceW)`
- [ ] Phone frame chrome (rounded corners, Dynamic Island placeholder, drop shadow) wraps the canvas
- [ ] Scale factor `scale = 390 / deviceWidth` is computed and passed to all child components

**Dot grid (CSS, not `<img>`):**
- [ ] `components/DotGrid.tsx` renders the dot grid using actual HTML divs with the same auto-size formula as the API
- [ ] Dots are scaled by `canvasScale` factor: `cssSize = dotSize * canvasScale`, `cssGap = gap * canvasScale`
- [ ] Current week dot renders as outlined ring
- [ ] Grid is vertically centered using the same `topOffset` formula (using `canvasScale`)
- [ ] Life event dots render as colored symbol icons at the correct week index
- [ ] **Each dot has an invisible hit target** — the clickable area is the full cell (`cellW * canvasScale`, minimum 8px) even though the visual dot is smaller. This ensures usability at the small canvas scale.
- [ ] Clicking the hit target opens `<LifeEventPopup>` for that week (see US-CT-013)

**Photo layers on canvas:**
- [ ] `components/CanvasLayer.tsx` renders each `PhotoLayer` as `position: absolute` within the canvas
- [ ] For `CutoutLayer`: `cssW = canvasWidth * (layer.layerSize / 100)`, `cssH = cssW * (layer.naturalH / layer.naturalW)`; `left = (layer.x/100 * canvasWidth) - cssW/2`, `top = (layer.y/100 * canvasHeight) - cssH/2`
- [ ] For `BgLayer`: fills canvas 100%, no position offset applied — pan handled via CSS `object-position: ${layer.panX}% ${layer.panY}%`
- [ ] **Drag to reposition (cutout layers only):** using `@dnd-kit/core` — drag updates `layer.x` and `layer.y` as % of canvas dimensions. History snapshot taken on `pointerup` (drag END only) — NOT on every `mousemove` event during drag.
- [ ] **Resize handles:** 4 corner handles — dragging a corner updates `layer.scale`. Hold shift = proportional only (always proportional for photos)
- [ ] **Opacity ring:** thin ring indicator on hover showing current opacity
- [ ] Selected layer has visible selection outline (2px dashed white)
- [ ] Click outside deselects
- [ ] Delete key removes selected layer
- [ ] Double-click a layer opens its detail popover: opacity slider, visibility toggle, "Remove" button

**Background layer panning:**
- [ ] Background (`type='bg'`) layer fills canvas 100%, not position-draggable
- [ ] Clicking the background layer activates "pan mode" — cursor becomes `grab`, mouse drag updates `layer.panX`/`layer.panY` (0–100). History snapshot on mouse release only.
- [ ] Pan indicator shows current position (small crosshair or position badge)
- [ ] Device dropdown change shows tooltip: "Changing device model may reposition your layers"

**Z-ordering:**
- [ ] Dot grid is always on top of all photo layers (fixed z-index)
- [ ] Among photo layers, `zIndex` from the `PhotoLayer` object determines stacking

**Canvas toolbar (above canvas):**
- [ ] Undo button — reverts last state change (maintain history stack, min 20 steps)
- [ ] Redo button
- [ ] "Fit to screen" — resets canvas zoom to default 390px width
- [ ] "Reset" — clears all layers and resets to defaults (confirm dialog)

- [ ] `npm run build` passes
- [ ] Verify in browser: upload a photo → it appears on canvas → drag to reposition → resize via corner handles → drag again → undo reverts the move

---

### US-CT-010: Photo Layer Manager — Upload + Background Removal
**Description:** As a user, I want to add photos to the canvas (with optional background removal) and manage them as independent layers.

**Acceptance Criteria:**

**Upload flow (in Layer Panel):**
- [ ] "Add Photo" button opens a modal with two options:
  - **Add as Background** — uploads directly (no BG removal), becomes `type='bg'` layer
  - **Add as Cutout** — runs `@imgly/background-removal` first, then uploads transparent PNG, becomes `type='cutout'` layer
- [ ] Upload progress shows state: `idle → removing bg... → uploading... → done ✓`
- [ ] `usePreloadBgRemoval()` hook preloads WASM on mount (non-blocking). Track model load state: `'loading-model' | 'model-ready'`
  - If user clicks "Add as Cutout" while model is still loading: button shows "Loading AI model... (first time only)" and is disabled until `model-ready`
  - On subsequent uses the model is cached — shows "Removing background..." immediately
- [ ] On success, new `PhotoLayer` object is created with:
  - `url` from Vercel Blob
  - `naturalW` + `naturalH` from upload response
  - Default position: `x=50, y=50` (center of canvas)
  - Default `scale=60` for cutouts, `scale=100` for background
  - New layer appended to layers array at top of z-order
- [ ] After adding, the new layer is auto-selected on the canvas. Canvas `<img>` shows a skeleton/spinner until `onLoad` fires. If URL returns 404, show "⚠️ Image unavailable" placeholder.
- [ ] Background layer (`type='bg'`): only one at a time — if one exists, offer "Replace" instead of "Add"
- [ ] Multiple cutout layers: no hard limit
- [ ] `npm run build` passes
- [ ] Verify in browser: upload portrait photo as cutout → BG removed → appears on canvas centered → drag to bottom-right → correct position in canvas

---

### US-CT-011: Install Page
**Description:** As a user, I want a clear one-tap way to set up the iOS Shortcut so that my lock screen updates automatically every morning.

**⚠️ Arthur must do this ONE TIME before launch (5 minutes on your iPhone):**
> 1. Open **Shortcuts** app → tap `+` (new shortcut)
> 2. Add action: **Ask for Input** — prompt: "Paste your Counted URL" — type: Text
> 3. Add action: **Save File** → iCloud Drive / Shortcuts / `counted-url.txt`
> 4. Tap the shortcut name → rename to **"Counted Setup"** → tap Done
> 5. Now tap the `···` menu (top right) → **Share** → **Copy iCloud Link**
> 6. You get a link like: `https://www.icloud.com/shortcuts/abc123def456...`
> 7. Paste that link into the install page code as `SHORTCUT_ICLOUD_URL` constant
>
> ⚠️ **Important:** iOS Automations CANNOT be shared via iCloud links. Only regular Shortcuts can. The automation (daily wallpaper update) must always be created manually by the user — there is no one-tap install for it. Only the Setup Shortcut (step 1 above) gets an iCloud share link.

**Acceptance Criteria:**
- [ ] `app/install/page.tsx` reads `?token=abc123` query param
- [ ] Shows permanent URL: `${APP_URL}/api/w/{token}` with Copy button + "Test" link (new tab)
- [ ] Progress indicator: Step 1 ✓ → Step 2 → Step 3
- [ ] **Step 2 — Setup Shortcut (one-tap install):**
  - Large button: `📱 Add Shortcut to iPhone` → links to `SHORTCUT_ICLOUD_URL`
  - When tapped on iPhone: Shortcuts app opens, user taps "Add Shortcut" — done in one tap
  - After adding: open Shortcuts, tap "Counted Setup", paste your URL when prompted
- [ ] **Step 3 — Create Daily Automation (manual, ~2 min):**
  - Note at top: "Apple doesn't allow automations to be shared — you'll need to create this one yourself. Takes 2 minutes."
  - Step-by-step instructions:
    1. Open Shortcuts → **Automation** tab → `+` → New Automation
    2. **Time of Day** → 6:00 AM → Daily → **Run Immediately** (turn off "Ask Before Running")
    3. Add: **Get File** → iCloud Drive / Shortcuts / `counted-url.txt`
    4. Add: **Get Contents of URL** → use file contents as URL
    5. Add: **Set Wallpaper Photo** → Lock Screen → tap `→` next to the action → **Crop to Subject: OFF** + **Show Preview: OFF**
    6. Tap Done
- [ ] **Manual setup accordion** (collapsed, "Do it manually instead ↓"):
  - Full 7-step instructions for users who prefer not to use iCloud links
  - Same instructions as the step-by-step copy from before
- [ ] **Troubleshooting accordion:**
  - "Shortcut asks me every morning" → Settings → Shortcuts → [shortcut name] → Allow Running Without Asking
  - "Wallpaper looks cropped" → Crop to Subject must be OFF
  - "Shortcut stopped working" → Re-run setup shortcut once manually to re-authorize
  - "I changed my settings — update needed?" → No. Same URL, new wallpaper auto-generates.
- [ ] Android tab: MacroDroid placeholder copy
- [ ] `SHORTCUT_ICLOUD_URL` is defined as a constant at top of file (easy to update after Arthur publishes). No automation URL needed — automations cannot be shared.
- [ ] `npm run build` passes
- [ ] Verify in browser: page renders correctly, both shortcut buttons present, troubleshooting accordion expands

---

### US-CT-012: Deploy to Vercel
**Description:** As a developer, I want the app deployed to Vercel with all integrations live.

**Acceptance Criteria:**
- [ ] GitHub repo `counted-app` created and code pushed
- [ ] New Vercel project connected to repo
- [ ] **Vercel KV integration** enabled (auto-injects KV env vars)
- [ ] **Vercel Blob integration** enabled (auto-injects `BLOB_READ_WRITE_TOKEN`)
- [ ] `NEXT_PUBLIC_APP_URL` set to Vercel deploy domain
- [ ] `vercel build` passes with zero errors
- [ ] Production deploy succeeds
- [ ] `GET /api/wallpaper?type=life&birthday=1990-01-15&width=1179&height=2556` returns PNG
- [ ] `POST /api/configs` → token → `GET /api/w/{token}` returns correct PNG
- [ ] Image upload + BG removal works end-to-end on production

---

### US-CT-013: Life Events — Click-on-Dot Placement
**Description:** As a user, I want to click directly on any dot in the canvas to assign a life event (date + icon) to that week so that meaningful milestones are visually marked on my grid.

**Acceptance Criteria:**

**Canvas interaction:**
- [ ] Every dot's hit target is clickable with `cursor: pointer` on hover
- [ ] Hovering a dot shows a subtle highlight ring (white, 30% opacity) on the visual dot
- [ ] **If `birthday` is not set when a dot is clicked:** show inline prompt "Enter your birthday first to place life events" with a jump-to link to the birthday field. Do NOT open the popup.
- [ ] Clicking a dot (when birthday is set) opens `<LifeEventPopup>` anchored near that dot position
- [ ] Popup displays:
  - The date of that week's start (computed from `birthday + weekIndex * 7days`)
  - Icon selector: visual grid of all 6 symbols (❤️ heart, ⭐ star, 🍃 leaf, 🌸 flower, 🌙 moon, ❄️ snow)
  - If event already exists at this week: pre-selects existing icon, shows "Remove" button
  - "Save" button — adds/updates event. "Cancel" — closes without change.
- [ ] Clicking an already-marked dot (gold icon) opens the popup with existing icon pre-selected and "Remove" option

**Event list in left panel (below Life Events header):**
- [ ] Shows all placed events in date order
- [ ] Format: `[icon] Week of [date]` e.g. `⭐ Week of Jun 15, 2010`
- [ ] `×` delete button on each event
- [ ] Empty state: "Click any dot on the canvas to mark a milestone."
- [ ] Max 50 events (dot click disabled beyond limit with tooltip)
- [ ] Only visible when `type=life` selected

**State + serialization:**
- [ ] Events stored as `LifeEvent[]`: `[{ weekIndex: number, icon: string, date: string }]`
- [ ] Serializes to `lifeEvents=YYYY-MM-DD:star,...` for `/api/wallpaper` URL param
- [ ] Full events array stored in KV config JSON (no length limit in KV)
- [ ] Canvas dot re-renders immediately on event add/remove

- [ ] `npm run build` passes
- [ ] Verify in browser: click week 500 → popup opens showing correct date → select star → dot turns gold on canvas → event appears in left panel list → click × removes it

---

### US-CT-014: Layer Panel
**Description:** As a user, I want a layer panel in the left sidebar showing all my photo layers so I can reorder them, toggle visibility, and delete them without going to the canvas.

**Acceptance Criteria:**
- [ ] `components/LayerPanel.tsx` renders in left panel between Style Controls and Life Events
- [ ] Shows stacked list of all layers in current z-order (top of list = top of canvas)
- [ ] Each layer row shows:
  - Thumbnail (small, 36×36px, aspect-fit)
  - Type label: "Background" or "Cutout"
  - Eye icon — toggles `visible` (hidden layers don't render on canvas or in PNG)
  - Trash icon — deletes layer (confirm on Background type)
- [ ] **Drag to reorder** — drag rows to change z-order (updates `zIndex` on all layers)
- [ ] Clicking a layer row selects it on the canvas (shows selection outline)
- [ ] "Add Photo" button at top of layer panel — triggers upload modal (see US-CT-010)
- [ ] Empty state: "No photos yet. Add a background or portrait." with Add Photo button
- [ ] `npm run build` passes
- [ ] Verify in browser: add 2 cutouts → drag to reorder → canvas z-order updates live → hide one → it disappears from canvas

---

### US-CT-015: Undo/Redo History
**Description:** As a user, I want undo/redo on all canvas actions so I can experiment without fear of losing my work.

**Acceptance Criteria:**
- [ ] Global undo/redo history stack (min 20 steps)
- [ ] Actions tracked: layer add, layer delete, layer move, layer resize, layer opacity change, life event add/remove, color change, dot style change
- [ ] **Drag operations:** history snapshot is taken on `pointerup` (drag END) only — NOT during `pointermove`. During a drag, state updates in "draft" mode; only the final released position is committed to history. This prevents hundreds of undo steps per drag.
- [ ] Undo/redo via toolbar buttons AND `Cmd+Z` / `Cmd+Shift+Z` keyboard shortcuts
- [ ] Undo/redo buttons disabled (greyed out) when stack is empty
- [ ] History is in-memory only (does not persist across page reload)
- [ ] State management: use `useReducer` with a history array `[past[], present, future[]]` — standard undo pattern
- [ ] `npm run build` passes
- [ ] Verify in browser: move a layer → undo → layer returns to previous position → redo → returns to moved position

---

## Functional Requirements

- FR-1: `/api/wallpaper` returns a PNG on every GET. Runtime: `edge`.
- FR-2: `/api/upload` returns `{ url, width, height }`. Runtime: `nodejs`.
- FR-3: Dot size is always auto-calculated from screen width. Never hardcoded.
- FR-4: Dot grid is always vertically centered in safe zone (12% top, 6% bottom) using spacer pattern.
- FR-5: All remote images must be fetched as base64 data URIs via `Promise.all` BEFORE `ImageResponse` call.
- FR-6: All Satori JSX uses inline `style={{}}` only. No className. No CSS files.
- FR-7: All Satori containers have `display: 'flex'`. Block layout doesn't exist in Satori.
- FR-8: Background images in Satori use `<img objectFit='cover' objectPosition='x% y%'>` — NOT CSS `background-size`.
- FR-9: `renderWallpaper(config)` is a shared function — used by both `/api/wallpaper` and `/api/w/[token]`.
- FR-10: Token URLs are 8 chars (nanoid). iOS Shortcuts has ~2000 char URL limit — use KV for complex configs.
- FR-11: Config tokens have 1-year TTL in Vercel KV.
- FR-12: Background removal runs in-browser via WASM only. No server-side processing.
- FR-13: Canvas scale factor: `scale = 390 / deviceWidth`. All canvas positions are in canvas-space px. Serialized to API as % (device-independent).
- FR-14: Photo layer positions stored as `x/y` in % (0–100) of full image dimensions. Canvas converts % ↔ px using scale.
- FR-15: Image upload returns natural dimensions (`naturalW`, `naturalH`) — required for aspect-ratio-correct rendering in both canvas and Satori.

---

## Non-Goals (Out of Scope)

- No user authentication or accounts
- No Supabase
- No connection to SwarmPost or zigzag repos
- No Android native app
- No server-side background removal
- No social sharing or public gallery
- No analytics dashboard
- No paid tier at launch
- No custom domain at launch (Vercel subdomain only)
- No text layer editor (no custom text overlays — only the optional daily quote)
- No video export
- No full mobile editor experience — the canvas editor requires a screen ≥768px wide. On narrower screens, show a message: "For the best experience, open Counted on a desktop or tablet." The install page and token URL (wallpaper generation) work fine on mobile.

---

## Design Considerations

### Default Visual (Must match thelifecalendar.com quality out of the box)

| Property | Default | Rationale |
|---|---|---|
| Background | `#000000` OLED black | Max contrast |
| Dot shape | Square, `borderRadius: '2px'` | WaitButWhy calendar heritage |
| Filled dot | White, 85% opacity | Crisp but not harsh |
| Empty dot | White, 10% opacity | Ghost future |
| Current week | Outlined hollow ring | "You are here" cursor |
| Text | None | Grid is the statement |
| Dot size | Auto-calculated | Correct on every device |
| Layout | Vertically centered in safe zone | Intentional |

### Theme Presets
`dark` / `light` / `amoled` / `cosmic` / `warm` / `minimal` — one-click apply via presets row.

---

## Technical Considerations

### Critical Satori Rules
1. Inline `style={{}}` only — no className, no CSS files
2. All containers need `display: 'flex'` — no block layout
3. `<img objectFit='cover'>` for full-screen images — NOT CSS `background-size`
4. Emoji: `loadAdditionalAsset` + Twemoji CDN
5. Fonts: ArrayBuffer before `ImageResponse`, even if no text shown
6. Fetch all remote images to base64 BEFORE `ImageResponse` — async inside JSX is broken
7. `transform` is not supported in Satori — use pixel-based `left`/`top` for positioning
8. Use top spacer div for vertical positioning — NOT padding-top

### Canvas Coordinate System
- Canvas space: pixels at `390 × scaled_height`
- Storage/API: % values (0–100) relative to full device dimensions
- Conversion: `canvasPx → %: (canvasPx / canvasDim) * 100`
- Conversion: `% → fullResPx: (pct / 100) * fullDim`

### KV Config Schema
```typescript
interface SavedConfig {
  type: 'life' | 'year' | 'goal'
  width: number
  height: number
  birthday?: string
  lifespan?: number
  deadline?: string
  goalStart?: string
  bg: string
  dotFilled: string
  dotEmpty: string
  dotCurrent: string
  dotFilledOpacity: number
  dotEmptyOpacity: number
  dotShape: string
  dotStyle: string
  dotMode: string
  emojiLived?: string
  emojiEmpty?: string
  dotSymbol?: string
  bgBlur?: number
  bgDim?: number
  safeLayout?: boolean
  gradientMode?: boolean
  gradientStart?: string
  gradientEnd?: string
  showQuote?: boolean
  lifeEvents?: LifeEvent[]
  layers?: PhotoLayer[]     // Full layer array with positions
}
```

---

## Success Metrics

- User can upload a photo, drag it to position, and save a wallpaper in under 5 minutes from first visit
- `/api/wallpaper` responds in under 300ms on Vercel Edge
- `/api/w/[token]` responds in under 400ms (KV lookup + render)
- Background removal completes in under 10 seconds in-browser
- Canvas drag feels responsive at 60fps (no lag on photo move)
- Wallpaper looks correct on all iPhone models from SE to 16 Pro Max
- Zero server costs at launch

---

## Build Timeline (Revised: ~7 hours)

| Hour | Deliverable | Stories |
|---|---|---|
| **1** | Scaffold + working Life Calendar PNG endpoint | CT-001, CT-002 |
| **2** | Year/Goal calendars + full dot customization + multi-layer API | CT-003, CT-004, CT-005 |
| **3** | Token system (KV) + upload endpoint (Blob + dimensions) | CT-006, CT-007 |
| **4** | Left panel style controls + layer panel + upload flow | CT-008, CT-010, CT-014 |
| **5** | Interactive canvas — layers, drag, resize, background pan | CT-009 |
| **6** | Life events click-on-dot + undo/redo | CT-013, CT-015 |
| **7** | Install page + deploy to Vercel | CT-011, CT-012 |

---

## Open Questions

- ~~Domain: Vercel deploy domain — confirmed.~~ ✅
- ~~iOS Shortcut: Users build it themselves from install page instructions — confirmed.~~ ✅
- ~~Life events UI: Full canvas interaction (click on dot) + list panel — confirmed.~~ ✅
- Quote library: Start with 30–50 quotes for launch or seed all 360+ up front?
- Max cutout layers: No hard limit per Arthur, but should UX cap at 10 with a warning?
