Portfolio site execution plan (living checklist)

Last updated: 2026-01-24 (aligned to `../Requirements/updated-requirements.md`)

How to use this plan
- This is a checklist of small, testable tasks. Check items off as they’re completed.
- Avoid churn: do not re-architect or re-do “working” parts unless a change is required to satisfy updated requirements.
- Keep changes PR-sized.

Context
- Updated requirements: `../Requirements/updated-requirements.md`
- Original requirements: `../Requirements/requirements.md`

Asset drop locations (for SVG/PNG/WebP)
- `public/assets/` (see `public/assets/README.md`)
- Suggested per-project path: `public/assets/work/<project-slug>/`

Assumptions and decisions (keep current)
- [x] Color tokens: background #0B0A09, foreground #E9E9E2, muted #A3A3A3 (neutral-only, no red accent).
- [ ] Work index location: confirm whether Work index is the homepage, `/work`, or both (avoid duplicating routes).
- [ ] Decide which project is “most complex” and will define the canonical template first.

What is already built (do not redo)
- [x] Next.js app + Tailwind + shadcn/ui scaffold
- [x] Site shell (header/footer), fonts with minimal layout shift
- [x] Home hero and work grid exist
- [x] Work detail route `/work/[slug]` loading JSON content
- [x] Core project-page building blocks (`ProjectHero`, `SectionBlock`, `AssetRenderer`)
- [x] Compare slider component exists (`CompareView`) — needs hardening to meet updated “hard requirement”

---

Phase 1 (Highest): Work Index — “Project mode” polish

Goal (done means)
- The Work index feels portfolio-polished: stable layout, strong hover/focus states, keyboard parity, and no layout shift/jank.

Files/components likely involved (best guess)
- `src/app/page.tsx` (and/or add `src/app/work/page.tsx`)
- `src/components/work-grid-animated.tsx`
- `src/components/work-card.tsx`
- `src/app/globals.css`

Checklist
- [ ] Confirm which route is the Work index (homepage vs `/work`) and keep a single canonical index.
- [ ] Update Work cards so **titles are always visible** (no hover-reveal title behavior).
- [ ] Implement hover/focus behavior:
  - [ ] Active tile: title increases contrast (subtle emphasis, no reflow)
  - [ ] Inactive tiles: dim when one is active (hover OR keyboard focus)
  - [ ] Focus ring styles are intentional and match the design language
- [ ] Ensure “no layout shift” on hover/focus:
  - [ ] no border-width changes that reflow
  - [ ] no font-weight swaps that reflow (or compensate)
  - [ ] SVG/diagram sizing is fixed and predictable
- [ ] Add per-project “diagram/SVG” placeholders in cards with correct sizing and viewBox (structural first).
- [ ] Add accent-on-hover/focus that affects parts of the project SVG:
  - [ ] start with class toggles + CSS variables
  - [ ] no JS per-path logic (defer unless clearly required)
- [ ] Keyboard testing pass: tab through cards and verify identical behavior to hover.
- [ ] Motion sanity: respect `prefers-reduced-motion` for any transitions.

Acceptance criteria
- Stable grid: no jank, no layout shift while interacting
- Hover and focus states feel deliberate and minimal (contrast + subtle accent only)
- Titles always readable on all tiles (desktop + mobile)

Risks
- Hover dimming interacting with existing cursor-follow glow logic (ensure no “fighting” visual states)
- SVG exports without viewBox or with hardcoded fills (harder to accent parts cleanly)

Defer list (explicitly not now)
- Complex SVG animations or per-path scripting
- Bonus “Visual mode” / “Presentation mode”

---

Phase 2 (High): Canonical project detail template (build against most complex project first)

Goal (done means)
- One canonical project page template that supports hero, summary/metadata, image grids, narrative sections, optional video embeds, and smooth long-scroll on mobile.

Files/components likely involved (best guess)
- `src/app/work/[slug]/page.tsx`
- `src/components/project-hero.tsx`
- `src/components/section-block.tsx`
- `src/components/asset-renderer.tsx`
- `content/work/*.json`

Checklist
- [ ] Pick the “most complex” project and ensure its content drives the template shape (not the other way around).
- [ ] Add/confirm template support for:
  - [ ] Hero section (static first; motion optional later)
  - [ ] Summary + metadata block
  - [ ] Image blocks + grids
  - [ ] Narrative sections with headings
  - [ ] Optional video embed block(s)
- [ ] Ensure typography and spacing are excellent on mobile (small screens first pass).
- [ ] Ensure long-scroll stays smooth (no stutter from heavy effects).

Acceptance criteria
- One project page reads cleanly as a “canonical” example on desktop and mobile
- No clipped content; images/SVGs scale without distortion

Risks
- Content schema churn (avoid by iterating on one project first and only generalizing once it’s stable)

Defer list
- Advanced hero motion; keep it static until the page is solid
- Refactor bento layouts for consistent configuration: Currently, different projects use different patterns (implicit layouts detected by asset count vs explicit `bento.items` config). Migrate all bentos to use explicit `bento.items` with `colSpan`, `rowSpan`, and `height` for clarity and maintainability.

---

Phase 3 (Hard Requirement): Before/After slider (harden + use on at least 2 projects)

Goal (done means)
- A stable before/after component that works with mouse + touch, supports keyboard access, survives resize/orientation change, and does not hijack mobile scrolling.

Files/components likely involved (best guess)
- `src/components/compare-view.tsx`
- `src/components/asset-renderer.tsx`
- `content/work/*.json`

Checklist (hardening)
- [ ] Pointer support:
  - [ ] mouse drag works
  - [ ] touch drag works (iOS + Android assumptions)
  - [ ] does not trap scroll when user tries to scroll the page
- [ ] Resize/orientation:
  - [ ] slider recalculates correctly on container resize
  - [ ] no “jump” after orientation change
- [ ] Accessibility:
  - [ ] keyboard operable (left/right to adjust, or explicit handle control)
  - [ ] sensible focus styles
  - [ ] ARIA label(s) for the control and the images
- [ ] Performance:
  - [ ] no expensive reflows on move
  - [ ] transitions feel instant/snappy

Checklist (integration)
- [ ] Add compare sections to at least 2 project pages with real assets.

Acceptance criteria
- Works reliably on mobile without “stuck” gestures
- Keyboard users can operate it and understand what it does

Risks
- Mobile scroll/drag conflicts (requires careful pointer/touch-action handling)

Defer list
- Fancy compare animations; keep it minimal

---

Phase 4 (Hard Requirement): Mobile + “No Jank” performance pass

Goal (done means)
- The whole site feels fast and stable: minimal CLS, predictable sizing, lightweight interactions, mobile layout coherence everywhere.

Files/components likely involved (best guess)
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/*` (work cards, project sections, compare view)
- `next.config.ts` (image config if needed)

Checklist
- [ ] CLS audit:
  - [ ] all images have known dimensions/aspect ratios
  - [ ] SVGs have fixed layout boxes (no late sizing)
- [ ] Interaction sanity:
  - [ ] hover/focus states don’t trigger layout changes
  - [ ] reduced-motion respected
- [ ] Mobile layout sweep:
  - [ ] nav usable and consistent
  - [ ] typography scale/line-length is readable
  - [ ] no clipped/overflowing content on small screens
- [ ] Lazy load where appropriate (without complexity).

Acceptance criteria
- Site feels stable (no surprising jumps) and responsive on low-end devices

Risks
- Fixing CLS late can cascade into layout changes (prioritize explicit sizing early)

Defer list
- Heavy runtime animation systems
- New dependencies unless clearly justified

---

Phase 5 (Optional / Defer): Bonus modes

Constraint
- Do not implement until Phases 1–4 are complete.

Wishlist (later)
- [ ] Visual mode (bento grid of screenshots/art)
- [ ] Presentation mode (slide-ish layout/interaction)

---

Progress log
- 2026-01-20: Plan created from original requirements and converted to checklist.
- 2026-01-20: Base app scaffolded; site shell and core pages/components established.
- 2026-01-24: Plan rewritten to prioritize Project mode polish + canonical template + slider hardening; bonus modes deferred.
