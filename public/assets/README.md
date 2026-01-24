Asset drop folder (place SVG/PNG/WebP exports here)

General notes
- Prefer SVG for diagrams/icons; use PNG/WebP for screenshots.
- Keep filenames lowercase-kebab-case.
- For SVGs: include a `viewBox`, avoid fixed `width/height` unless necessary.
- If an asset needs hover accent behavior, keep meaningful classnames on shapes/groups.

Where to put things
- `ui/`: site-wide UI icons, small decorative SVGs
- `diagrams/`: reusable diagrams or experiments
- `play/`: play-mode thumbnails/media
- `work/_shared/`: shared work assets used across multiple projects
- `work/<project-slug>/`: per-project screenshots, diagrams, before/after pairs

Example
- Work card diagram SVG:
  - `work/langflow-platform-redesign/card-diagram.svg`
- Project page hero screenshot:
  - `work/langflow-platform-redesign/hero.png`
- Before/after slider pair:
  - `work/langflow-platform-redesign/before.png`
  - `work/langflow-platform-redesign/after.png`
