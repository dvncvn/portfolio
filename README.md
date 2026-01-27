```
 :::::::: ::::::::::: ::::    ::::   ::::::::  ::::    :::      :::::::::  :::     ::: ::::    :::  ::::::::  :::     ::: ::::    ::: 
:+:    :+:    :+:     +:+:+: :+:+:+ :+:    :+: :+:+:   :+:      :+:    :+: :+:     :+: :+:+:   :+: :+:    :+: :+:     :+: :+:+:   :+: 
+:+           +:+     +:+ +:+:+ +:+ +:+    +:+ :+:+:+  +:+      +:+    +:+ +:+     +:+ :+:+:+  +:+ +:+        +:+     +:+ :+:+:+  +:+ 
+#++:++#++    +#+     +#+  +:+  +#+ +#+    +:+ +#+ +:+ +#+      +#+    +:+ +#+     +:+ +#+ +:+ +#+ +#+        +#+     +:+ +#+ +:+ +#+ 
       +#+    +#+     +#+       +#+ +#+    +#+ +#+  +#+#+#      +#+    +#+  +#+   +#+  +#+  +#+#+# +#+         +#+   +#+  +#+  +#+#+# 
#+#    #+#    #+#     #+#       #+# #+#    #+# #+#   #+#+#      #+#    #+#   #+#+#+#   #+#   #+#+# #+#    #+#   #+#+#+#   #+#   #+#+# 
 ######## ########### ###       ###  ########  ###    ####      #########      ###     ###    ####  ########      ###     ###    #### 
```

# Simon Duncan Portfolio

Personal portfolio website showcasing product design work.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **Analytics**: Vercel Analytics & Speed Insights
- **Fonts**: Geist Sans, Geist Mono, Jacquard 24

## Pages

- **/** – Work showcase with animated project cards
- **/work/[slug]** – Individual project case studies
- **/play** – Creative/side projects gallery with lightbox
- **/info** – About page with interactive profile image effects

## Features

- **Command Palette** – Press `/` to open quick navigation
- **Resume Modal** – View full work history and download resume
- **Image Effects** – Dither, pixelate, and ASCII rendering on info page
- **Presentation Mode** – Project slideshow for work section
- **Dark Theme** – System-aware with smooth transitions
- **Responsive** – Mobile-first design

## Project Structure

```
src/
├── app/              # Next.js pages and layouts
├── components/       # React components
│   └── ui/           # Reusable UI primitives
├── content/          # Content loaders (work.ts, play.ts)
├── contexts/         # React context providers
└── lib/              # Utilities
content/
├── work/             # Project JSON files
└── play/             # Play items JSON
public/assets/        # Images, SVGs, project assets
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Scripts

- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run start` – Start production server
- `npm run lint` – Run ESLint

---

```
        🐀                    🐀
            psst... type "ratmode"
        🐀                    🐀
```
