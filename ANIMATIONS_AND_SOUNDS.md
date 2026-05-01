# Fly-To-Cart Pro: Animations & Sounds Library

## 5 ANIMATIONS (Visual Effects When Product Added to Cart)

### 1. **Slide In** 
**Visual:** Product smoothly slides from bottom-left to cart icon
- Duration: ~1 second
- Effect: Product image slides diagonally to cart
- Best for: Professional, clean look
```
[Product] → → → [Cart]
```

### 2. **Bounce**
**Visual:** Product bounces upward with elastic effect, then lands in cart
- Duration: ~1.2 seconds
- Effect: Product bounces 2-3 times while moving to cart
- Best for: Playful, friendly stores
```
    [Product]↑
        ↓ [Product]
            ↑ [Cart]
              ↓
```

### 3. **Flip**
**Visual:** Product rotates 360° (flip animation) while flying to cart
- Duration: ~1 second
- Effect: Product spins while moving to cart icon
- Best for: Modern, dynamic look
```
⟳ [Product spinning] → [Cart]
```

### 4. **Pulse**
**Visual:** Cart icon pulses/grows bigger when product arrives
- Duration: ~0.6 seconds
- Effect: Cart icon scales up and down
- Best for: Subtle, minimalist stores
```
[Product] → [Cart ⭐ pulse ⭐]
```

### 5. **Spiral**
**Visual:** Product spirals upward (360° rotation) to cart
- Duration: ~1.2 seconds
- Effect: Product rotates while moving to cart in spiral path
- Best for: Premium, eye-catching experience
```
     ⟳ 
   ⟳ [Cart]
 ⟳ [Product]
```

---

## 5 SOUNDS (Audio Effects)

### 1. **Chime** 🔔
- **File Size:** ~15 KB
- **Duration:** 0.5 seconds
- **Frequency:** High pitched, pleasant
- **Best for:** Professional, elegant feel
- **Sound:** Ding ding! (notification chime)
- **File:** `chime.mp3`

### 2. **Whoosh** 💨
- **File Size:** ~12 KB
- **Duration:** 0.4 seconds
- **Frequency:** Smooth swoosh/transition
- **Best for:** Modern, fast feel
- **Sound:** Whoooosh! (smooth transition)
- **File:** `whoosh.mp3`

### 3. **Pop** 🎈
- **File Size:** ~8 KB
- **Duration:** 0.3 seconds
- **Frequency:** Playful pop sound
- **Best for:** Fun, casual stores
- **Sound:** Pop! (bubble pop)
- **File:** `pop.mp3`

### 4. **Bell** 🛎️
- **File Size:** ~20 KB
- **Duration:** 0.7 seconds
- **Frequency:** Ringing bell
- **Best for:** Notification, alert-like feel
- **Sound:** Ring ring! (bell ring)
- **File:** `bell.mp3`

### 5. **Sparkle** ✨
- **File Size:** ~18 KB
- **Duration:** 0.6 seconds
- **Frequency:** Magical tinkling
- **Best for:** Premium, luxury, magical feel
- **Sound:** Tink tink tink! (sparkle/magical)
- **File:** `sparkle.mp3`

---

## Animation + Sound Combinations (Examples)

| Animation | Best Paired With | Effect |
|-----------|------------------|--------|
| **Slide In** | Chime | Professional, clean |
| **Slide In** | Whoosh | Modern, fast |
| **Bounce** | Pop | Fun, playful |
| **Bounce** | Bell | Casual, friendly |
| **Flip** | Whoosh | Dynamic, modern |
| **Flip** | Sparkle | Premium, magical |
| **Pulse** | Chime | Subtle, minimal |
| **Pulse** | Bell | Alert, notification |
| **Spiral** | Sparkle | Luxury, premium |
| **Spiral** | Whoosh | Bold, eye-catching |

---

## How It Works in Storefront

```
Customer clicks "Add to Cart"
        ↓
App fetches animation config from metaobject
        ↓
Animation plays: [Product Image] → [Cart Icon]
        ↓
Sound plays simultaneously: 🔊 Chime/Whoosh/Pop/Bell/Sparkle
        ↓
Product added to cart ✓
```

---

## Configuration in Admin

Merchants will:

1. Go to **Products** → Select product
2. Click **Fly-To-Cart Config** section
3. Choose:
   - ✅ Animation type (5 options)
   - ✅ Sound type (5 options)
   - ✅ Animation speed (0.5s - 2s)
   - ✅ Sound volume (0% - 100%)
   - ✅ Enable/Disable for this product

4. **Global Default:** Set default animation + sound for all products

---

## File Delivery

### Sound Files Location:
- `/public/sounds/` - Hosted locally on your CDN
  - `chime.mp3`
  - `whoosh.mp3`
  - `pop.mp3`
  - `bell.mp3`
  - `sparkle.mp3`

### Animation Logic:
- Stored in metaobjects (ftc_animation_preset)
- GSAP animation engine handles rendering
- No pre-recorded videos, pure code-based animations

---

## Performance Target
- Animation trigger: **<200ms**
- Sound playback: **<100ms latency**
- Total load time: **<1.2 seconds**

---

## Questions to Confirm:

✅ Do you want these exact 5 animations?
✅ Do you want these exact 5 sounds?
✅ Should merchants be able to set per-product OR only global default?
✅ Should animation/sound be customizable (speed, volume) OR fixed?
