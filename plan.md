Portfolio site execution plan (living checklist)

How to use this plan
- This is a to-do list. Check items off as they are completed.
- Add new tasks and decisions as they come up so this stays current.

Context
- Requirements live in `../Requirements/requirements.md` and screenshots in `../Requirements/`.

Assumptions and decisions to document (add entries below as they happen)
- [x] Color tokens: background #0B0A09, foreground #E9E9E2, muted #A3A3A3, accent #E93940.
- [ ] Note any resolved ambiguity from visual references.
- [ ] Record any theme or layout decisions that affect future theming.
- [ ] Confirm content format choice (JSON vs MDX).

Phase 0: Setup and structure
- [x] Initialize repo (from `https://github.com/dvncvn/portfolio.git`) if not already cloned.
- [x] Create base Next.js app with Tailwind and shadcn/ui integration.
- [x] Add content directories:
  - `content/work/`
  - `content/play/`
- [x] Define content types for WorkProject and PlayItem (TS types).

Phase 1: Core shell and layout
- [x] Build `SiteShell` with header and footer:
  - Header: wordmark + seedling emoji + nav (Work, Play, Info).
  - Footer: "Made in Madison WI" left; GitHub/LinkedIn/Email right.
- [x] Implement global layout with generous spacing and dark theme tokens.
- [x] Set up font loading (Inter + IBM Plex Mono) with no layout shift.
- [x] Active nav state styling (accent red for current section).

Phase 2: Home page
- [x] Implement hero section:
  - Left: H1 "Hi, I'm Simon" + 2-3 line intro.
  - Right: compact work history table with role, status badge, years.
- [x] Implement Work grid:
  - 4 project cards with asymmetric layout (first card spans 2 rows).
  - Placeholder hover interaction (subtle gradient).
- [x] Add placeholders for images with fixed aspect ratios.
- [x] Refine hover-to-info affordance on intro text (appears on hover).
- [x] Card hover effects with cursor-following border glow.

Phase 3: Project page template
- [ ] Build `ProjectHero` (back link, title, chips, summary block, responsibilities).
- [ ] Build `SectionBlock` + `AssetRenderer` (image, video, compare).
- [ ] Build `CompareView` (interactive before/after slider).
- [ ] Ensure support for section layouts (single, split, stacked, compare).

Phase 4: Play page
- [ ] Build dense `PlayGrid` with thumbnails, titles, and one-line descriptions.
- [ ] Implement click behavior to open external links in new tabs.
- [ ] Optionally add `OverlayDialog` for richer item details (v1 optional).

Phase 5: Motion and interaction
- [ ] Global motion language: opacity + blur with calm easing.
- [ ] Scroll-aware navigation:
  - Hide on scroll down, reveal on scroll up with translucent blur.
- [ ] Card hover effects:
  - Ambient, contextual visual response; no aggressive glows or positional moves.

Phase 6: Performance and loading quality
- [ ] Ensure all media has known aspect ratios or explicit dimensions.
- [ ] Add placeholders for async content to avoid CLS.
- [ ] Validate that server-rendered layout avoids hydration shift.

Phase 7: Presentation mode (v1)
- [ ] Add presentation mode via query param or route variant.
- [ ] Hide nav/footer, emphasize visuals, add next/previous navigation.

Progress log
- 2026-01-20: Plan created from requirements and converted to checklist.
- 2026-01-20: Repo cloned locally.
- 2026-01-20: Base Next.js app scaffolded (app router + Tailwind).
- 2026-01-20: Content directories and types added.
- 2026-01-20: Site shell, fonts, and global theme tokens added.
- 2026-01-20: Home page scaffolded with hero and grid placeholders.
- 2026-01-20: shadcn/ui initialized and base styles applied.
- 2026-01-20: Updated colors to match reference, refined hero and work grid layout.
- 2026-01-20: Added IntroBlock with hover-to-info affordance, WorkCard with cursor-following glow.
