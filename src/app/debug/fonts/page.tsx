"use client";

import { useEffect, useState } from "react";

type FontDebugState = {
  htmlClass?: string;
  bodyClass?: string;
  bodyFontFamily?: string;
  rootFontInter?: string;
  rootFontIbmPlexMono?: string;
  fontsReady?: boolean;
};

export default function FontDebugPage() {
  const [state, setState] = useState<FontDebugState>({});

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const read = async () => {
      const bodyFontFamily = getComputedStyle(body).fontFamily;
      const rootFontInter = getComputedStyle(html)
        .getPropertyValue("--font-inter")
        .trim();
      const rootFontIbmPlexMono = getComputedStyle(html)
        .getPropertyValue("--font-ibm-plex-mono")
        .trim();

      let fontsReady = false;
      try {
        await document.fonts.ready;
        fontsReady = true;
      } catch {
        fontsReady = false;
      }

      setState({
        htmlClass: html.className,
        bodyClass: body.className,
        bodyFontFamily,
        rootFontInter,
        rootFontIbmPlexMono,
        fontsReady,
      });
    };

    void read();
  }, []);

  return (
    <div className="py-20">
      <h1 className="text-[18px] font-medium text-foreground">Font debug</h1>
      <p className="mt-2 text-[14px] text-muted-foreground">
        This page shows what the browser thinks the fonts are.
      </p>

      <div className="mt-10 space-y-4 rounded-[8px] border border-white/10 bg-[#121212] p-6 text-[14px] text-muted-foreground">
        <div>
          <div className="text-foreground">Computed body font-family</div>
          <div className="mt-1 break-words font-mono text-[13px]">
            {state.bodyFontFamily ?? "…"}
          </div>
        </div>

        <div>
          <div className="text-foreground">CSS vars on &lt;html&gt;</div>
          <div className="mt-1 grid gap-2 font-mono text-[13px]">
            <div className="break-words">
              --font-inter: {state.rootFontInter || "(empty)"}
            </div>
            <div className="break-words">
              --font-ibm-plex-mono: {state.rootFontIbmPlexMono || "(empty)"}
            </div>
          </div>
        </div>

        <div>
          <div className="text-foreground">Classes</div>
          <div className="mt-1 grid gap-2 font-mono text-[13px]">
            <div className="break-words">html.className: {state.htmlClass ?? "…"}</div>
            <div className="break-words">body.className: {state.bodyClass ?? "…"}</div>
          </div>
        </div>

        <div>
          <div className="text-foreground">document.fonts.ready</div>
          <div className="mt-1 font-mono text-[13px]">
            {state.fontsReady === undefined ? "…" : String(state.fontsReady)}
          </div>
        </div>

        <div className="pt-4 text-foreground">
          Inter sample: <span className="font-sans">The quick brown fox</span>
        </div>
        <div className="text-foreground">
          IBM Plex Mono sample:{" "}
          <span className="font-mono">The quick brown fox</span>
        </div>
      </div>
    </div>
  );
}

