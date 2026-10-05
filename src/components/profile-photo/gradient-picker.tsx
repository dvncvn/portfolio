import { GRADIENT_PRESETS } from "@/lib/photo-effects";
import { RotateCw } from "lucide-react";
import styles from "./controls.module.css";

type Gradient = { shadows: string; highlights: string };

export function GradientPicker({ shadows, highlights, onChange }: Gradient & { onChange: (gradient: Gradient) => void }) {
  const index = GRADIENT_PRESETS.findIndex((preset) => preset.shadows === shadows.toLowerCase() && preset.highlights === highlights.toLowerCase());
  return (
    <fieldset className={styles.inkPicker}>
      <legend className="sr-only">Gradient colors</legend>
      <div className={styles.inkHeading}>
        <span aria-hidden="true">Colors</span>
        <button type="button" aria-label="Next gradient colors" onClick={() => {
          const preset = GRADIENT_PRESETS[(index + 1) % GRADIENT_PRESETS.length];
          onChange({ shadows: preset.shadows, highlights: preset.highlights });
        }}><RotateCw size={14} aria-hidden="true" /></button>
      </div>
      <div className={styles.inkSwatches}>
        {GRADIENT_PRESETS.map((preset) => (
          <button key={preset.name} type="button" title={preset.name} aria-label={preset.name}
            aria-pressed={preset.shadows.toLowerCase() === shadows.toLowerCase() && preset.highlights.toLowerCase() === highlights.toLowerCase()}
            onClick={() => onChange({ shadows: preset.shadows, highlights: preset.highlights })}>
            <span style={{ background: `linear-gradient(135deg, ${preset.shadows}, ${preset.highlights})` }} aria-hidden="true" />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
