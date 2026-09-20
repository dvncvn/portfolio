import { useId } from "react";
import styles from "./controls.module.css";

// Decorative eight-dot cells, not a written braille message.
const cells = [0x35, 0x82, 0xda, 0x49, 0x96, 0x2b, 0x61, 0xac, 0x53, 0xe4, 0x1a, 0x75, 0xc2, 0x39, 0x8e, 0x64];
const dots = cells.flatMap((mask, cell) => Array.from({ length: 8 }, (_, dot) => {
  if (!(mask & (1 << dot))) return "";
  const x = (cell % 4) * 18 + 6 + Math.floor(dot / 4) * 5;
  const y = Math.floor(cell / 4) * 24 + 4 + (dot % 4) * 5;
  return `M${x - 1} ${y}a1 1 0 1 0 2 0a1 1 0 1 0-2 0`;
})).join("");

export function NormalState() {
  const patternId = useId();
  return (
    <div className={styles.normalState}>
      <svg className={styles.dotField} aria-hidden="true" width="100%" height="100%">
        <defs>
          <pattern id={patternId} width="72" height="96" patternUnits="userSpaceOnUse">
            <path d={dots} fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <p>&quot;Normal&quot;</p>
    </div>
  );
}
