# Theme Design System: Second Brain

This document translates the reference image into a reusable visual theme for slides and later app screens. The mood is calm, private, evidence-based, and emotionally soft. It should feel trustworthy enough for health-adjacent use, gentle enough for older adults and caregivers, and polished enough for an investor or product presentation.

## Design Intent

The interface should communicate:

- **Calm evidence**: claims are grounded, not guessed.
- **Human control**: the user remains in charge of what is shown, saved, or shared.
- **Soft protection**: privacy and consent are visible without feeling clinical.
- **Reflective intelligence**: AI is present as a quiet reviewer, not a loud assistant.
- **Bilingual readiness**: Thai and English can coexist in compact UI without clutter.

Avoid a loud medical, futuristic, or productivity-tool tone. The visual language should feel like mist over a lake, a personal journal, and a privacy-first interface brought into one system.

## Color Palette

Use a light, low-contrast palette with blue-green atmosphere and one restrained coral accent.

| Token | Color | Hex | Use |
| --- | --- | --- | --- |
| Porcelain | Near-white warm base | `#F7F9FA` | Main background, slide canvas, quiet empty space |
| Mist Blue | Pale blue wash | `#E6EEF5` | Hero backgrounds, section washes, soft panels |
| Sage Green | Muted green | `#DDE7DF` | Consent states, nature motifs, positive status |
| Coral Accent | Soft coral | `#F4A79A` | Warm highlights, emotional emphasis, small alert accents |
| Graphite | Deep cool gray | `#2F3337` | Primary text, icons, strong controls |
| Soft Gray | Neutral gray | `#E8EBEE` | Dividers, disabled states, quiet borders |
| Deep Lake | Desaturated blue-green | `#8FB2C5` | Primary buttons, flow markers, key lines |
| Leaf Shadow | Muted green-gray | `#8CA799` | Secondary icons, privacy badges, approval marks |

### Color Rules

- Keep backgrounds mostly `Porcelain` and `Mist Blue`.
- Use `Graphite` for readable text, never pure black.
- Use `Coral Accent` sparingly. It should warm the scene, not dominate it.
- Use `Sage Green` and `Leaf Shadow` for trust, control, nature, and consent.
- Use translucent overlays instead of solid blocks when layering over hero imagery.
- Borders should be very light: `rgba(47, 51, 55, 0.08)` to `rgba(47, 51, 55, 0.14)`.
- Shadows should be broad and soft, never sharp: `0 24px 80px rgba(61, 83, 96, 0.12)`.

## Typography

The reference uses a refined sans serif for product UI and a soft editorial serif for reflective moments.

### Preferred Fonts

- **Primary UI / Slides**: `Suisse Int'l`
- **Editorial / Quote Accent**: `Lora`

### Practical Web Fallbacks

The current app already uses Google fonts. If `Suisse Int'l` is unavailable, use:

- `Space Grotesk` for headings and UI labels when keeping the existing deck style.
- `Inter`, `Neue Haas Grotesk`, or system sans for app screens.

If `Lora` is unavailable, use:

- `Instrument Serif` for slide quotes and emotional emphasis.
- `Georgia` only as a last-resort fallback.

### Type Scale

| Role | Style |
| --- | --- |
| Hero title | Sans, light or regular, 56-76px on desktop slides, 36-44px on app/mobile |
| Slide title | Sans, regular/medium, 44-64px, tight but not cramped |
| Section label | Sans, uppercase, 12-14px, letter spacing `0.14em` to `0.18em` |
| Body | Sans, regular, 16-20px, line height `1.45` to `1.65` |
| UI labels | Sans, medium, 12-15px |
| Quote | Serif italic, 28-40px on slides, 20-26px in app cards |
| Metadata | Sans, regular, 11-13px, muted graphite |

### Typography Rules

- Use sentence case for readable UI text.
- Use uppercase only for small section labels or short brand statements.
- Keep large headlines airy and human; avoid over-condensed or heavy weights.
- Do not use negative letter spacing. The image feels clean because spacing is calm.
- Bilingual labels should use compact separators: `ไทย | EN`.

## Layout Principles

The system uses generous whitespace, quiet grids, and floating contextual details.

### Slide Layout

- Use a 16:9 canvas with a soft full-bleed atmospheric background.
- Keep content aligned to a disciplined grid, usually left text and right visual system.
- Leave large breathing room around the hero title.
- Put explanatory text in short blocks. Avoid dense paragraphs.
- Let one visual metaphor dominate each slide: landscape, path, journal, protection, family, or care.

### App Screen Layout

- Use card clusters on a pale atmospheric canvas.
- Cards should have 8-18px radius depending on density:
  - Dense UI cards: 8-12px.
  - Editorial summary cards: 14-18px.
- Avoid nested cards.
- Use subtle dividers instead of boxed sections when information belongs to one workflow.
- Keep controls near the content, state, or setting they affect.

## Iconography

Use thin-line icons with soft fills when needed.

Recommended icon directions:

- Privacy and protection: lock, shield
- Care and ownership: heart, hand, person
- Calm and nature: leaf, sun, horizon
- Time and continuity: calendar, clock, path
- Evidence and context: image, note, chart, pin

Icons should be supportive, not decorative. Prefer recognizability over novelty.

## Imagery

Use watercolor, mist, and gentle natural scenes:

- Lakes
- Rivers
- Pale mountains
- Morning light
- Soft foliage
- Reflective paths
- Quiet desks or diaries

Avoid:

- Dark neural-network visuals
- Hard sci-fi interfaces
- Clinical hospital imagery
- Stock-photo caregiver melodrama
- Overly saturated AI gradients

## Motion & Interaction

For app screens, motion should feel slow and reassuring.

- Sequential content can fade in gently.
- Ambient visual layers can drift or shimmer subtly.
- Confirmed states can settle with a small check animation.
- Avoid bouncing, flashy, or gamified effects.
- Transitions should be 180-300ms with ease-out timing.

## Slide Theme Guidance

### Best Slide Types

- **Opening / promise**: atmospheric background, title, one restrained visual metaphor.
- **Painpoint**: mostly text with one symbolic visual and a soft coral accent.
- **Evidence / context**: quiet visual proof, source note, or supporting diagram.
- **Trust / control**: simple privacy, consent, or user-control message.
- **Impact**: simple large number or quote with soft supporting illustration.
- **Closing**: reflective quote and calm final promise.

### Painpoint Adaptation

For the existing painpoint deck about aging and cognitive decline:

- Keep the tone human and calm, not alarming.
- Use coral only for urgency moments such as risk, burden, or missed medication.
- Use blue-green for support, safety, review, and memory preservation.
- Show people indirectly through meaningful objects when possible: calendar, medicine, family message, walking route, diary.
- When showing older adults or caregivers, choose warm documentary-like imagery rather than dramatic distress.

## CSS Token Starting Point

```css
:root {
  --color-porcelain: #f7f9fa;
  --color-mist-blue: #e6eef5;
  --color-sage-green: #dde7df;
  --color-coral: #f4a79a;
  --color-graphite: #2f3337;
  --color-soft-gray: #e8ebee;
  --color-deep-lake: #8fb2c5;
  --color-leaf-shadow: #8ca799;

  --surface-glass: rgba(255, 255, 255, 0.62);
  --surface-strong: rgba(255, 255, 255, 0.86);
  --line-soft: rgba(47, 51, 55, 0.1);
  --shadow-soft: 0 24px 80px rgba(61, 83, 96, 0.12);

  --font-sans: "Suisse Int'l", "Space Grotesk", Inter, system-ui, sans-serif;
  --font-serif: "Lora", "Instrument Serif", Georgia, serif;
}
```

## Do / Do Not

### Do

- Make the first impression atmospheric and quiet.
- Show complex ideas as calm, reviewable, human-scale visuals.
- Make privacy, control, and trust part of the core visual language.
- Use bilingual labels as a normal part of the system.
- Keep cards light, glassy, and readable.
- Let nature imagery carry emotional softness.

### Do Not

- Turn the system into a generic AI dashboard.
- Overuse bright gradients or saturated blue-purple palettes.
- Make privacy feel like legal paperwork.
- Use heavy black text or harsh contrast.
- Hide consent behind settings.
- Add decorative cards or visual clutter just to fill space.

## Success Criteria

The design is working when a viewer understands, within a few seconds:

1. The theme communicates cognitive care without fear.
2. Information feels grounded, calm, and reviewable.
3. The user or viewer senses control and trust.
4. The product feels private, calm, and trustworthy.
5. The same system can support both polished pitch slides and real app screens.
