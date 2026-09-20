import { ditherMask, type DitherType } from "@/lib/photo-effects";
import styles from "./controls.module.css";

const options: { value: DitherType; label: string }[] = [
  { value: "bayer", label: "Bayer" },
  { value: "floyd-steinberg", label: "Floyd–Steinberg" },
  { value: "atkinson", label: "Atkinson" },
  { value: "noise", label: "Noise" },
];
// Previews use the same algorithms as the portrait, on a shared tonal gradient.
const previews = options.map((option) => {
  const mask = ditherMask(Float32Array.from({ length: 240 }, (_, i) => 0.15 + (i % 24) / 23 * 0.7), 24, 10, option.value);
  return Array.from(mask, (bit, i) => bit ? `M${i % 24} ${Math.floor(i / 24)}h1v1h-1z` : "").join("");
});

export function DitherPicker({ value, onChange }: { value: DitherType; onChange: (value: DitherType) => void }) {
  return (
    <fieldset className={styles.glyphPicker}>
      <legend>Dither type</legend>
      <div className={styles.ditherOptions}>
        {options.map((option, i) => (
          <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
            <svg viewBox="0 0 24 10" aria-hidden="true" shapeRendering="crispEdges"><path d={previews[i]} fill="currentColor" /></svg>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
