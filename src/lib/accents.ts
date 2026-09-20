export const ACCENT_IDS = ["green", "orange"] as const;

export type AccentId = (typeof ACCENT_IDS)[number];

export const ACCENT_STORAGE_KEY = "sd-accent";

export const ACCENTS = {
  green: {
    id: "green",
    label: "Electric Green",
    hex: "#01F8A5",
  },
  orange: {
    id: "orange",
    label: "Blaze Orange",
    hex: "#FF5C00",
  },
} as const satisfies Record<AccentId, { id: AccentId; label: string; hex: string }>;

export const DEFAULT_ACCENT: AccentId = "green";

export function isAccentId(value: unknown): value is AccentId {
  return value === "green" || value === "orange";
}

export function getAccent(id: AccentId) {
  switch (id) {
    case "green":
      return ACCENTS.green;
    case "orange":
      return ACCENTS.orange;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export function getNextAccent(id: AccentId): AccentId {
  switch (id) {
    case "green":
      return "orange";
    case "orange":
      return "green";
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export function applyAccentToDocument(id: AccentId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.accent = id;
}

/** Electric mint hexes baked into work SVGs — remapped to the live highlight token. */
export function bindSvgHighlight(svgText: string): string {
  return svgText.replace(/#01F8A5|#00FFAA/gi, "var(--highlight)");
}

/** Inline script: apply stored accent before first paint to avoid a green flash. */
export const ACCENT_BOOTSTRAP_SCRIPT = `(function(){try{var id=localStorage.getItem(${JSON.stringify(ACCENT_STORAGE_KEY)});document.documentElement.dataset.accent=id==="orange"?"orange":"green";}catch(e){}})();`;
