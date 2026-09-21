"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Props = {
  full: boolean;
  sound: boolean;
  onFeed: (x: number, y: number, count: number) => void;
  onSound: () => void;
  onExit: () => void;
};

export function RatContextMenu({ full, sound, onFeed, onSound, onExit }: Props) {
  const menu = useRef<HTMLDivElement>(null);
  const origin = useRef({ x: 0, y: 0 });
  const previousFocus = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  const close = (restoreFocus = true) => {
    menu.current?.hidePopover();
    if (restoreFocus && previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
  };

  useEffect(() => {
    const node = menu.current;
    if (!node) return;
    const open = (x: number, y: number) => {
      if (!node.matches(":popover-open")) previousFocus.current = document.activeElement as HTMLElement | null;
      origin.current = { x, y };
      node.showPopover();
      const bounds = node.getBoundingClientRect();
      node.style.left = `${Math.max(8, Math.min(x, window.innerWidth - bounds.width - 8))}px`;
      node.style.top = `${Math.max(8, Math.min(y, window.innerHeight - bounds.height - 8))}px`;
      node.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
    };
    const editable = (target: EventTarget | null) => target instanceof Element && !!target.closest("input, textarea, select, [contenteditable], dialog, [role='dialog']");
    const context = (event: MouseEvent) => {
      // Shift-right-click is an escape hatch to the browser's own menu.
      if (event.shiftKey || editable(event.target)) return;
      event.preventDefault();
      if (event.clientX === 0 && event.clientY === 0 && event.target instanceof Element) {
        const bounds = event.target.getBoundingClientRect();
        open(bounds.left + 16, bounds.top + 16);
      } else open(event.clientX, event.clientY);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (editable(event.target) || !(event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))) return;
      event.preventDefault();
      const bounds = (document.activeElement as HTMLElement)?.getBoundingClientRect();
      open((bounds?.left ?? 0) + 16, (bounds?.top ?? 0) + 16);
    };
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && node.contains(event.target)) return;
      if (node.matches(":popover-open")) {
        node.hidePopover();
        if (node.contains(document.activeElement)) previousFocus.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("contextmenu", context);
    document.addEventListener("keydown", keyboard);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    window.addEventListener("blur", dismiss);
    return () => {
      document.removeEventListener("contextmenu", context);
      document.removeEventListener("keydown", keyboard);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("blur", dismiss);
      if (node.matches(":popover-open")) node.hidePopover();
    };
  }, []);

  useEffect(() => { menu.current?.hidePopover(); }, [pathname]);

  const act = (action: () => void) => { close(); action(); };

  return (
    <div ref={menu} popover="auto" role="menu" aria-label="Rat business" className="rat-context-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
          return;
        }
        if (event.key === "Tab") { close(); return; }
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        let next = -1;
        if (event.key === "ArrowDown") next = (index + 1) % items.length;
        if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = items.length - 1;
        if (event.key.length === 1 && /\S/.test(event.key)) next = items.findIndex((item) => item.textContent?.toLowerCase().startsWith(event.key.toLowerCase()));
        if (next >= 0) { event.preventDefault(); items[next].focus(); }
      }}>
      <div className="rat-context-heading" aria-hidden="true">RAT BUSINESS</div>
      <button role="menuitem" tabIndex={-1} onClick={() => act(() => onFeed(origin.current.x, origin.current.y, 1))}>Dump the crumbs <span>FEED</span></button>
      <button role="menuitem" tabIndex={-1} disabled={full} onClick={() => act(() => onFeed(origin.current.x, origin.current.y, 3))}>Call three cousins <span>{full ? "FULL" : "+3"}</span></button>
      <div role="separator" />
      <button role="menuitemcheckbox" aria-checked={sound} tabIndex={-1} onClick={() => act(onSound)}>Trench band <span>{sound ? "ON" : "OFF"}</span></button>
      <div role="separator" />
      <button role="menuitem" tabIndex={-1} onClick={() => act(onExit)}>Evict everyone <span>ESC</span></button>
      <div className="rat-context-hint" aria-hidden="true">Shift + right-click for human business</div>
    </div>
  );
}
