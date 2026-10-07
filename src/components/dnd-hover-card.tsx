"use client";

import { useEffect, useState } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import { DndCharacterOverlay } from "./dnd-character-overlay";
import styles from "./dnd-character.module.css";

type DndHoverCardProps = {
  children: React.ReactNode;
  zIndex?: number;
  position?: "above" | "below";
};

export function DndHoverCard({ children, zIndex = 50, position = "above" }: DndHoverCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    if (!previewOpen) return;
    const dismiss = () => setPreviewOpen(false);
    window.addEventListener('blur', dismiss);
    document.addEventListener('visibilitychange', dismiss);
    return () => {
      window.removeEventListener('blur', dismiss);
      document.removeEventListener('visibilitychange', dismiss);
    };
  }, [previewOpen]);

  const showCharacter = () => {
    setPreviewOpen(false);
    setOverlayOpen(true);
  };

  return <>
    <HoverCard.Root open={previewOpen && !overlayOpen}
      onOpenChange={open => setPreviewOpen(open && !overlayOpen)}
      openDelay={180} closeDelay={180}>
      <HoverCard.Trigger asChild
        // Keyboard and touch activate the sheet directly; focus isn't a hover.
        onFocus={event => event.preventDefault()}>
        <button type="button"
          className="cursor-pointer border-b border-dashed border-muted-foreground/50 bg-transparent p-0 text-inherit [font:inherit] transition-colors hover:border-foreground hover:text-foreground focus-visible:outline focus-visible:outline-offset-4"
          aria-label="D&D player: view Perrin Burrowfen" onClick={showCharacter}>
          {children}
        </button>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content side={position === 'above' ? 'top' : 'bottom'}
          align="center" sideOffset={8} collisionPadding={12} hideWhenDetached
          className={styles.hoverPreview} style={{ zIndex }}>
          <button type="button" onClick={showCharacter} className={styles.card}
            aria-label="View Perrin Burrowfen">
            <div className={styles.portrait}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/dnd-character.png" alt="Perrin Burrowfen"
                className="h-full w-full object-cover" />
            </div>
            <div className={styles.caption}>
              <span className={styles.name} style={{ fontFamily: "var(--font-jacquard-24)" }}>
                Perrin Burrowfen
              </span>
              <span className={styles.subtitle}>Level 7 · Twilight Cleric</span>
            </div>
          </button>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
    <DndCharacterOverlay isOpen={overlayOpen} onClose={() => {
      setPreviewOpen(false);
      setOverlayOpen(false);
    }} />
  </>;
}
