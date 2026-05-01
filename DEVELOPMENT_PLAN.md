# Fly-To-Cart Pro: Development Plan

## Project Overview
**App Name:** Fly-To-Cart Pro (Add-to-Cart Animation & Sound System)

A Shopify app that allows merchants to create engaging add-to-cart experiences with customizable animations and sound effects. Merchants can configure different animation-sound combinations for different products and trigger them when customers add items to cart.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│    Shopify Admin (React Router 7 + Node.js)     │
│  - Admin UI: Manage animations & sounds         │
│  - Admin Player: Preview animations & sounds    │
│  - Metafield API: Read/write product settings   │
└─────────────────────────────────────────────────┘
                       ↕️
        ┌──────────────────────────────┐
        │   Admin GraphQL API          │
        │   (Read/Write Metaobjects)   │
        └──────────────────────────────┘
                       ↕️
┌─────────────────────────────────────────────────┐
│      Shopify Theme App Extension                │
│  (React/Preact - Injected into Theme)           │
│  - Listens for cart add events                  │
│  - Loads animation & sound from metaobject      │
│  - Triggers GSAP animation + Web Audio API      │
└─────────────────────────────────────────────────┘
                       ↕️
        ┌──────────────────────────────┐
        │   Shopify Metaobject         │
        │   (Product Animation Config)  │
        │   - Animation Type ID         │
        │   - Sound Type ID             │
        │   - Custom Settings           │
        └──────────────────────────────┘
```

---

## Tech Stack

### Backend
- **Framework:** Node.js with React Router 7 (File-based routing)
- **Session Storage:** Prisma (session management only - already configured)
- **Data Storage:** Shopify Metaobjects (all app data)
- **Authentication:** Shopify OAuth 2.0 (via @shopify/shopify-app-react-router)
- **API:** GraphQL Admin API (metaobject queries & mutations)
- **Environment:** Production: Shopify servers, Dev: Local dev store

### Admin Frontend
- **Framework:** React 18+ with TypeScript
- **Router:** React Router 7 (File-based routes in `/app/routes`)
- **UI Library:** Shopify Polaris
- **State Management:** React Context API (can add Zustand if needed)
- **HTTP Client:** Fetch API or Axios
- **Preview:** GSAP (animation) + Web Audio API (sound playback)

### Storefront/Theme Extension
- **Framework:** Preact (lightweight for theme injection)
- **Animation:** GSAP 3.x (fully JavaScript, Shopify compatible ✅)
- **Audio:** Web Audio API (native browser API)
- **Bundle Size:** <100KB (optimized)
- **Performance Target:** Animation trigger <200ms

### Data Storage
- **Metaobject Type:** `cart_animation_config`
- **Metafield:** Store animation & sound IDs on products

---

## Core Features

### 1. Animation System (5 Animations)
- [ ] **Slide In**: Product flies from bottom to cart icon
- [ ] **Bounce**: Product bounces with elastic effect
- [ ] **Flip**: 3D flip animation before landing in cart
- [ ] **Pulse**: Cart icon pulses when item added
- [ ] **Spiral**: Product spirals up to cart

### 2. Sound System (5 Sounds)
- [ ] **Success Chime**: Positive notification sound
- [ ] **Whoosh**: Smooth transition sound
- [ ] **Pop**: Playful pop sound
- [ ] **Bell**: Notification bell sound
- [ ] **Sparkle**: Magical sparkle sound effect

### 3. Admin Interface Features
- [ ] **Dashboard**: Overview of installed products with animations
- [ ] **Animation Manager**: Configure animations per product
- [ ] **Sound Manager**: Upload/manage sound files
- [ ] **Admin Player**: Real-time preview of animations + sounds
- [ ] **Product Settings**: Assign animation-sound combo to products
- [ ] **Analytics**: Track add-to-cart events with animation usage

### 4. Merchant Controls
- [ ] **Per-Product Configuration**: Different animation/sound per product
- [ ] **Global Defaults**: Set default animation/sound for all products
- [ ] **Enable/Disable**: Toggle animation system on/off
- [ ] **Animation Speed**: Control animation duration (0.5s - 2s)
- [ ] **Sound Volume**: Control sound playback volume

### 5. Theme Extension (Storefront)
- [ ] **Cart Event Listener**: Detect "add to cart" action
- [ ] **Metaobject Query**: Fetch animation/sound config for product
- [ ] **GSAP Animation Execution**: Trigger animation with timing
- [ ] **Web Audio Playback**: Play selected sound synchronously
- [ ] **Fallback Handling**: Graceful degradation if GSAP fails
- [ ] **Performance Optimization**: Lazy load sounds, optimize DOM

### 6. Shopify Payments Integration
- [ ] **Configuration**: Connect Shopify Payments account
- [ ] **Transaction Logging**: Log animation triggers per payment
- [ ] **Analytics Dashboard**: Sales metrics filtered by animation type
- [ ] **A/B Testing**: Compare conversion rates by animation

---

## Data Storage - Shopify Metaobjects Only

### Metaobject Type 1: `ftc_animation_preset`
**Purpose:** Store animation presets (5 predefined animations)

```
Fields:
- name (single_line_text): 'Slide In' | 'Bounce' | 'Flip' | 'Pulse' | 'Spiral'
- animation_key (single_line_text): 'slide_in' | 'bounce' | 'flip' | 'pulse' | 'spiral'
- duration_ms (number_integer): milliseconds (500-2000, default 1000)
- enabled (boolean): true/false
- preview_json (multi_line_text): GSAP timeline config (JSON)
```

### Metaobject Type 2: `ftc_sound_preset`
**Purpose:** Store sound presets (5 predefined sounds)

```
Fields:
- name (single_line_text): 'Chime' | 'Whoosh' | 'Pop' | 'Bell' | 'Sparkle'
- sound_key (single_line_text): 'chime' | 'whoosh' | 'pop' | 'bell' | 'sparkle'
- file_url (url): CDN URL to MP3 file
- duration_ms (number_integer): milliseconds
- volume (number_decimal): 0.0 - 1.0 (default 0.8)
- enabled (boolean): true/false
```

### Metafield on Products: `ftc_cart_config`
**Purpose:** Link animation & sound to specific products

```
Type: json

Structure:
{
  "animation_preset_id": "gid://shopify/Metaobject/...",
  "sound_preset_id": "gid://shopify/Metaobject/...",
  "enabled": true,
  "custom_duration_ms": null,
  "custom_volume": null
}
```

### Metafield on Shop: `ftc_global_settings`
**Purpose:** Global app configuration

```
Type: json

Structure:
{
  "enabled": true,
  "default_animation": "gid://shopify/Metaobject/...",
  "default_sound": "gid://shopify/Metaobject/...",
  "analytics_enabled": true,
  "theme_injection_enabled": true
}
```

### Prisma Schema (Session Storage Only)
```prisma
// prisma/schema.prisma - No changes needed
// Keep existing session storage for Shopify OAuth
// All app data goes to Shopify Metaobjects
```

---

## Development Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create Shopify Metaobject types via GraphQL
  - `ftc_animation_preset` (5 predefined animations)
  - `ftc_sound_preset` (5 predefined sounds)
- [ ] Create Metafield on Product: `ftc_cart_config` (links animation+sound)
- [ ] Create Metafield on Shop: `ftc_global_settings` (app settings)
- [ ] Build GraphQL queries & mutations for metaobject operations
- [ ] Create basic admin dashboard UI (React Router + Polaris)

### Phase 2: Admin Features (Week 3-4)
- [ ] Build Animation Manager UI
- [ ] Build Sound Manager UI
- [ ] Implement Admin Player (GSAP + Web Audio API)
- [ ] Create product assignment UI
- [ ] Test GSAP library integration

### Phase 3: Theme Extension (Week 5-6)
- [ ] Build Preact theme extension
- [ ] Implement cart event listener
- [ ] Integrate metaobject GraphQL queries
- [ ] Integrate GSAP animation execution
- [ ] Integrate Web Audio sound playback
- [ ] Performance optimization & testing

### Phase 4: Shopify Payments & Analytics (Week 7)
- [ ] Implement Shopify Payments integration
- [ ] Build analytics dashboard
- [ ] Set up conversion tracking
- [ ] A/B testing framework

### Phase 5: Testing & Launch (Week 8)
- [ ] Unit tests (animations, sound loading)
- [ ] E2E tests (add-to-cart flow)
- [ ] Performance testing
- [ ] Security audit
- [ ] Shopify App Store submission

---

## Important Technical Notes

### ✅ GSAP Compatibility with Shopify
**YES - GSAP is fully supported** because:
- GSAP is a pure JavaScript library (no external dependencies)
- Works in any JavaScript environment including Shopify apps
- No DOM restrictions that would prevent usage
- Lightweight (~50KB minified)
- No conflicts with Shopify's systems

**Best Practices:**
- Load GSAP as npm dependency: `npm install gsap`
- Import specific modules to reduce bundle: `import gsap from "gsap"`
- Avoid global GSAP in theme injections
- Use GSAP's cleanup methods to prevent memory leaks

### Performance Targets
- **Load Time:** <1.2s (your requirement)
- **Animation Trigger:** <200ms from "add to cart" click
- **Sound Playback Lag:** <100ms
- **Theme Extension Bundle:** <100KB
- **Metaobject Query:** <50ms

### Sound File Requirements
- **Format:** MP3, WAV, or OGG (web-optimized)
- **Duration:** 0.3s - 2s
- **Size:** <50KB per file
- **Bitrate:** 128kbps (optimize for web)
- **Hosting:** Shopify CDN or AWS S3

### Browser Compatibility
- **Modern Browsers:** Chrome, Firefox, Safari, Edge
- **Mobile:** iOS Safari (Web Audio API support varies)
- **Fallback:** Animations play even if sounds fail
- **No Third-Party Scripts:** GSAP is self-contained

---

## API Endpoints (Admin Routes - GraphQL Only)

All data operations go through **Shopify GraphQL Admin API** for metaobjects:

```
GET    /animations              - Fetch all animation presets (GraphQL query)
GET    /sounds                  - Fetch all sound presets (GraphQL query)
GET    /products                - Fetch products with animation config (GraphQL query)

PUT    /api/metaobject.server   - Update metaobject via GraphQL mutation
- Create/update animation preset
- Create/update sound preset
- Link animation to product via metafield

GET    /api/preview.server      - Preview animation (admin player)
- Returns animation + sound JSON for preview
```

**No database CRUD operations needed** - all data is in Shopify metaobjects.

---

## Required Shopify Permissions

```toml
scopes = [
  "write_products",           # To read/write product metafields
  "read_products",            # To list products
  "write_metaobjects",        # To create/update animation & sound presets
  "read_metaobjects",         # To read animation & sound presets
  "write_metafields",         # To update product metafield
  "read_metafields"           # To read product animation config
]
```

---

## File Structure (Your Existing Project)

```
fly-to-cart-pro/
├── app/
│   ├── routes/                           # React Router file-based routes
│   │   ├── _index.jsx                   # Dashboard
│   │   ├── animations.jsx               # Animation Manager
│   │   ├── sounds.jsx                   # Sound Manager
│   │   ├── products.jsx                 # Product Configuration
│   │   ├── preview.jsx                  # Admin Player (Preview)
│   │   └── api/
│   │       ├── metaobject.server.ts     # Metaobject CRUD via GraphQL
│   │       └── preview.server.ts        # Preview animation + sound
│   ├── components/
│   │   ├── AnimationManager.tsx         # List & edit animations
│   │   ├── SoundManager.tsx             # List & edit sounds
│   │   ├── AdminPlayer.tsx              # Real-time preview player
│   │   └── ProductConfig.tsx            # Assign animation to product
│   ├── utils/
│   │   ├── shopify-graphql.ts          # GraphQL client helper
│   │   └── animation-queries.ts         # GraphQL queries for metaobjects
│   ├── root.jsx                          # Root component
│   ├── entry.server.jsx                  # Server entry
│   └── shopify.server.js                 # Shopify auth setup
├── extensions/
│   └── cart-animation/                   # Shopify Theme App Extension
│       ├── src/
│       │   ├── index.jsx                 # Extension entry point
│       │   ├── animation-engine.ts       # GSAP animation logic
│       │   ├── audio-player.ts           # Web Audio API handler
│       │   ├── cart-observer.ts          # Listen for add-to-cart
│       │   └── queries.graphql           # Fetch product config
│       ├── tsconfig.json
│       └── shopify.extension.toml
├── public/
│   ├── sounds/                           # Sound files (CDN will serve these)
│   │   ├── chime.mp3
│   │   ├── whoosh.mp3
│   │   ├── pop.mp3
│   │   ├── bell.mp3
│   │   └── sparkle.mp3
│   └── animations-config.json            # Animation timeline presets
├── package.json
├── vite.config.ts
├── tsconfig.json
├── shopify.app.toml
├── .env.example
└── DEVELOPMENT_PLAN.md
```

---

## Key Decisions & Rationale

| Decision | Choice | Why |
|----------|--------|-----|
| Animation Library | GSAP | Industry standard, high performance, Shopify compatible |
| Audio API | Web Audio API | Native browser API, no external dependency |
| Theme Integration | App Extension | Cleaner than theme code injection, easier updates |
| Data Storage | Metaobject | Native Shopify feature, no extra setup needed |
| State Management | Context API | Sufficient for MVP, can upgrade if needed |
| Payment Integration | Shopify Payments | Native integration, fewer dependencies |

---

## Success Criteria

- ✅ All 5 animations working smoothly (<200ms trigger)
- ✅ All 5 sounds playing without lag (<100ms)
- ✅ Admin player previews animations accurately
- ✅ Per-product configuration working
- ✅ App loads in <1.2 seconds
- ✅ 95%+ compatibility across modern browsers
- ✅ Shopify App Store approved

---

## Next Steps (After Plan Approval)

1. **Initialize Shopify App** with `shopify app create`
2. **Set up environment** with Node.js, PostgreSQL, Redis
3. **Create project structure** with above file organization
4. **Start with Phase 1** - Foundation setup
5. **Weekly sync** on progress and blockers

---

**Questions for Clarification:**
- Do you want to host sounds on Shopify CDN or your own server?
- Should admin player have 3D preview or 2D preview?
- Do you want to add custom animation editor (for merchants to create their own)?
- Timeline expectation for full launch?

