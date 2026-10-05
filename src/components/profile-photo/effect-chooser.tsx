import { ChevronRight } from "lucide-react";
import { DEFAULT_SETTINGS, EFFECT_LABELS, type ImageEffect } from "@/lib/photo-effects";
import { EffectImage } from "./effect-image";
import styles from "./controls.module.css";

const effects: Exclude<ImageEffect, "normal">[] = ["dither", "pixelate", "ascii", "gradient", "slice", "scanlines", "offset", "chromatic", "vhs", "decay"];

export function EffectChooser({ onChoose }: { onChoose: (effect: Exclude<ImageEffect, "normal">) => void }) {
  return (
    <div className={styles.effectChoices} data-effect-chooser>
      {effects.map((effect) => <button type="button" key={effect} className={styles.effectChoice}
        aria-label={`Choose ${EFFECT_LABELS[effect]}`} onClick={() => onChoose(effect)}>
        <span className={styles.effectThumbnail} aria-hidden="true">
          <EffectImage src="/assets/profile.png" effect={effect} color={null} renderWidth={120}
            settings={{ ...DEFAULT_SETTINGS[effect], ...(effect === "ascii" ? { size: 4 } : {}) }} />
        </span>
        <span className={styles.effectChoiceLabel}>{EFFECT_LABELS[effect]}<ChevronRight size={14} aria-hidden="true" /></span>
      </button>)}
    </div>
  );
}
