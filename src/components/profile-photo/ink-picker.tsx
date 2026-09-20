import type { EffectColor } from "@/lib/photo-effects";
import { ACCENTS } from "@/lib/accents";
import styles from "./controls.module.css";

type Ink = { name: string; hex: string };
const inks: Ink[] = [
  { name: ACCENTS.green.label, hex: ACCENTS.green.hex.toLowerCase() },
  { name: ACCENTS.orange.label, hex: ACCENTS.orange.hex.toLowerCase() },
  { name: "Chalk", hex: "#ffffff" },
  { name: "Paper", hex: "#e8e4dc" },
  { name: "Silver", hex: "#b9b9b9" },
  { name: "Graphite", hex: "#828282" },
];

function rgb(hex: string): NonNullable<EffectColor> {
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}

export function InkPicker({ value, onChange }: { value: NonNullable<EffectColor>; onChange: (color: NonNullable<EffectColor>) => void }) {
  const hex = "#" + [value.r, value.g, value.b].map((channel) => channel.toString(16).padStart(2, "0")).join("");
  const index = inks.findIndex((ink) => ink.hex === hex);
  // Older saved edits may contain a custom color. Keep it visible and selected.
  const choices = index < 0 ? [...inks, { name: "Saved ink", hex }] : inks;
  return (
    <fieldset className={styles.inkPicker}>
      <legend className="sr-only">Ink color</legend>
      <div className={styles.inkHeading}>
        <span aria-hidden="true">Ink</span>
        <button type="button" aria-label="Next ink color" onClick={() => onChange(rgb(inks[(index + 1) % inks.length].hex))}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 7v5h-5M4 17v-5h5" />
            <path d="M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1" />
          </svg>
        </button>
      </div>
      <div className={styles.inkSwatches}>
        {choices.map((ink) => (
          <button key={ink.hex} type="button" aria-label={ink.name} aria-pressed={ink.hex === hex} onClick={() => onChange(rgb(ink.hex))}>
            <span style={{ backgroundColor: ink.hex }} aria-hidden="true" />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
