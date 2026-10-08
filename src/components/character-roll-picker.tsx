"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { characterRolls, rollFormula, type CharacterRoll } from "@/lib/character-rolls";
import styles from "./dnd-character.module.css";

const groups = [...new Set(characterRolls.map(roll => roll.group))];


export function CharacterRollPicker({ selected, disabled, onSelect }: {
  selected: CharacterRoll;
  disabled: boolean;
  onSelect: (roll: CharacterRoll) => void;
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState({ above: true, height: 340 });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const active = options.current[characterRolls.findIndex(roll => roll.id === selected.id)];
    active?.focus({ preventScroll: true });
    active?.scrollIntoView({ block: 'nearest' });
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, selected.id]);

  const close = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }); };
  const show = () => {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const above = rect.top - 20;
    const below = window.innerHeight - rect.bottom - 20;
    const useAbove = above >= 280 || above >= below;
    setPlacement({ above: useAbove, height: Math.max(80, Math.min(340, useAbove ? above : below)) });
    setOpen(true);
  };

  return <div ref={root} className={styles.rollPicker} data-roll-picker data-open={open}
    onBlur={event => {
      // Touch browsers can blur an option with no relatedTarget before sending
      // the trigger's click. Closing here would make that click reopen it.
      // Outside taps are handled by pointerdown; keyboard focus has a target.
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}
    onKeyDown={event => {
      if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); }
    }}>
    <button ref={trigger} type="button" className={styles.rollTrigger} disabled={disabled}
      aria-label={`Choose roll: ${selected.label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => { if (open) setOpen(false); else show(); }}
      onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); } }}>
      <span className={styles.rollChoice}>{selected.label}</span>
      <small className={styles.rollFormula}>{rollFormula(selected)}</small>
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d={open ? 'M2 7h2V5h4v2h2v2H8V7H4v2H2z' : 'M2 3h2v2h4V3h2v2H8v2H4V5H2z'} /></svg>
    </button>
    {open ? <motion.div className={styles.rollMenu} id={id} role="listbox" aria-label="Choose a roll"
      style={{ maxHeight: placement.height, bottom: placement.above ? 'calc(100% + 8px)' : 'auto', top: placement.above ? 'auto' : 'calc(100% + 8px)' }}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}
      onKeyDown={event => {
        const current = options.current.findIndex(option => option === document.activeElement);
        let next: number | undefined;
        if (event.key === 'ArrowDown') next = (current + 1) % characterRolls.length;
        if (event.key === 'ArrowUp') next = (current - 1 + characterRolls.length) % characterRolls.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = characterRolls.length - 1;
        if (next !== undefined) { event.preventDefault(); options.current[next]?.focus({ preventScroll: true }); options.current[next]?.scrollIntoView({ block: 'nearest' }); }
      }}>
      {groups.map((group, groupIndex) => <div role="group" aria-labelledby={`${id}-${groupIndex}`} key={group}>
        <div id={`${id}-${groupIndex}`} className={styles.rollGroup}>{group}</div>
        {characterRolls.filter(roll => roll.group === group).map(roll => <button
          key={roll.id} ref={el => { options.current[characterRolls.indexOf(roll)] = el; }}
          type="button" role="option" aria-selected={roll.id === selected.id} tabIndex={-1} className={styles.rollOption}
          onClick={() => { onSelect(roll); close(); }}>
          <span>{roll.label}</span>
          {roll.id === selected.id ? <svg aria-hidden="true" className={styles.rollCheck} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 3 3 7-7" /></svg> : null}
          <small>{rollFormula(roll)}</small>
        </button>)}
      </div>)}
    </motion.div> : null}
  </div>;
}
