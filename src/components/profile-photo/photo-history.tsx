"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { PhotoEdit } from "@/lib/shared-photo";
import { EffectImage } from "./effect-image";
import styles from "./controls.module.css";

function SavedPhoto({ edit }: { edit: PhotoEdit }) {
  const { effect, settings, colors } = edit.recipe;
  const active = effect === "normal" ? "dither" : effect;
  // Render at portrait scale so small thumbnails preserve the effect detail.
  return <EffectImage renderWidth={320} src="/assets/profile.png" effect={effect} settings={settings[active]}
    color={colors[active]} />;
}

export function PhotoHistory({ edits }: { edits: PhotoEdit[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<PhotoEdit | null>(null);
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  return (
    <section hidden={!edits.length} className={styles.history} aria-label="Previous photo edits">
      <div className={styles.historyGrid}>
        <AnimatePresence initial={false} mode="popLayout">
          {edits.map((edit, index) => (
            <motion.div key={edit.id} className={styles.historyItem}
              layout={reduceMotion ? false : "position"}
              initial={{ opacity: 0, transform: reduceMotion ? "none" : "translateY(-10%) scale(0.95)" }}
              animate={{ opacity: 1, transform: "translateY(0%) scale(1)" }}
              exit={{ opacity: 0, transform: reduceMotion ? "none" : "translateY(-10%) scale(0.95)" }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1], layout: { duration: 0.25, ease: [0.77, 0, 0.175, 1] } }}>
              <button type="button" aria-label={`Preview previous edit ${index + 1}: ${edit.recipe.effect}`}
                aria-describedby={`${titleId}-${edit.id}`} aria-haspopup="dialog"
                onClick={() => { setSelected(edit); dialog.current?.showModal(); }}>
                <span aria-hidden="true"><SavedPhoto edit={edit} /></span>
              </button>
              <span id={`${titleId}-${edit.id}`} className={styles.historyLocation}>
                {edit.location ?? "Location not shared"}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <dialog ref={dialog} className={styles.historyDialog} aria-labelledby={titleId}
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        <div className={styles.historyPreview}>
          <div className={styles.historyHeading}>
            <h2 id={titleId}>Previous edit</h2>
            <button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Close photo preview">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          {selected && <>
            <div className={styles.historyPortrait}><SavedPhoto edit={selected} /></div>
            <p><time dateTime={selected.savedAt}>{new Date(selected.savedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
              {selected.location && <><br />From {selected.location}</>}</p>
          </>}
        </div>
      </dialog>
    </section>
  );
}
