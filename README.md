# Simon Duncan

Product design portfolio. [simonduncan.co ↗](https://simonduncan.co)

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion

---

### Pages

| Route | Content |
| :--- | :--- |
| `/` | Selected work |
| `/work/[slug]` | Case studies |
| `/play` | Side projects |
| `/info` | About and résumé |

### Development

```sh
npm install
npm run dev
```

[localhost:3000](http://localhost:3000)

| Command | |
| :--- | :--- |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

### Structure

```text
src/app/          Pages and layouts
src/components/   Components
src/content/      Content loaders
src/contexts/     Shared state
src/lib/          Utilities
content/          Work and play JSON
public/assets/    Images and media
```

### Shared photo edits

The info-page photo loads the last visitor's effect settings and saves changed settings when the controls close (close button, Escape, or outside click). The current and previous recipes live in private Vercel Blob storage; image files are not uploaded.

Connect a private Blob store to the Vercel project. For local development, add `BLOB_STORE_ID` and `BLOB_READ_WRITE_TOKEN` to the ignored `.env.local` file. Production, individual preview deployments, and local development use separate paths under `photo-edits/`.

City attribution uses Vercel's approximate location headers and can be disabled in the controls. Local saves are anonymous. No IP addresses or precise coordinates are stored. Unchanged controls do not write, and concurrent saves use conditional writes with a short cooldown.

Run `npm run test:photo` for validation, attribution, storage history, and API checks.
