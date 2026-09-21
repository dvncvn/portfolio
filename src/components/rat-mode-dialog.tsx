"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./rat-mode.css";

type RatModeDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const DISCLAIMERS = [
  {
    title: "Let the rats in?",
    body: "They will follow you. They will bring friends. They have no relevant work experience.",
    finePrint: "Click to drop crumbs. Sound is optional. ESC evicts everyone.",
    accept: "Let them in",
    cancel: "Keep door shut",
  },
  {
    title: "Are you sure?",
    body: "You are admitting three rats. This is a starting number, not a promise.",
    finePrint: "Any crumbs dropped on the premises will be interpreted as a job offer.",
    accept: "I can manage three rats",
    cancel: "On second thought",
  },
  {
    title: "About the larger rat.",
    body: "He says he is management. Nobody hired him. He has already asked for a second monitor.",
    finePrint: "By continuing, you agree to hear him out. You do not have to buy the monitor.",
    accept: "He can use my laptop",
    cancel: "Withdraw the offer",
  },
  {
    title: "One last thing.",
    body: "The rats wrote these disclaimers. The rat who checked them was also a rat.",
    finePrint: "This is the last screen. The next click contains actual rats. ESC still works.",
    accept: "Fine. Open the door.",
    cancel: "I would like a human",
  },
];

export function RatModeDialog({ isOpen, ...props }: RatModeDialogProps) {
  // Each opening starts a new application to admit rats.
  return isOpen ? <RatAdmission {...props} /> : null;
}

function RatAdmission({ onClose, onConfirm }: Omit<RatModeDialogProps, "isOpen">) {
  const [step, setStep] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const previous = document.activeElement as HTMLElement | null;
    node.showModal();
    return () => { node.close(); previous?.focus(); };
  }, []);

  useEffect(() => {
    // Announce each new screen; Enter on the heading advances the confirmation.
    heading.current?.focus();
  }, [step]);

  const advance = () => {
    if (step === DISCLAIMERS.length - 1) onConfirm();
    else setStep(step + 1);
  };

  return (
    <dialog ref={dialog} className="rat-dialog-stack" aria-labelledby={`rat-mode-title-${step}`} aria-describedby={`rat-mode-description-${step}`}
      onKeyDown={(event) => {
        if (event.key !== "Enter" || event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.repeat) { event.preventDefault(); return; }
        // Respect an explicitly focused button, including the cancel action.
        if ((event.target as HTMLElement).closest("button")) return;
        event.preventDefault();
        event.stopPropagation();
        advance();
      }}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="rat-dialog-pile">
        {DISCLAIMERS.slice(0, step + 1).map((disclaimer, index) => {
          const active = index === step;
          return (
            <section key={index} className="rat-dialog rat-dialog-layer"
              inert={!active} aria-hidden={!active}
              style={{ "--rat-layer": index, zIndex: index + 1 } as CSSProperties}>
              <div className="rat-admission-progress" aria-label={`Disclaimer ${index + 1} of ${DISCLAIMERS.length}`}>
                <span>RAT ADMISSION</span><span>{String(index + 1).padStart(2, "0")} / 04</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/rat.png" alt="" />
              <h2 ref={active ? heading : undefined} tabIndex={-1} id={`rat-mode-title-${index}`}>{disclaimer.title}</h2>
              <p id={`rat-mode-description-${index}`}>{disclaimer.body}</p>
              <small>{disclaimer.finePrint}</small>
              <footer>
                <button onClick={onClose}>{disclaimer.cancel}</button>
                <button onKeyDown={(event) => { if (event.repeat) event.preventDefault(); }}
                  onClick={advance}>
                  {disclaimer.accept}
                </button>
              </footer>
            </section>
          );
        })}
      </div>
    </dialog>
  );
}
