# Play Assets

This directory contains assets for play/side project items.

## Directory Structure

Each project should have its own folder named with the project slug:

```
play/
├── signal-field-study/
│   ├── thumb.png          # Thumbnail shown in grid
│   └── lightbox-1.png     # Image(s) shown in lightbox
├── terra/
│   ├── thumb.png
│   ├── lightbox-1.png
│   └── lightbox-2.mp4     # Videos are also supported
└── ...
```

## Asset Paths in items.json

Reference assets using paths like:
- Thumbnail: `/assets/play/[slug]/thumb.png`
- Lightbox assets: `/assets/play/[slug]/lightbox-1.png`

## Supported Formats

- Images: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`
- Videos: `.mp4`, `.webm`
