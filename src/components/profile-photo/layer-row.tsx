"use client";

import { useRef, useState, type RefObject } from "react";
import { Reorder, useDragControls, useReducedMotion, useMotionValue } from "framer-motion";
import { Eye, EyeClosed, GripVertical, X } from "lucide-react";
import type { PhotoLayer } from "@/lib/shared-photo";
import { EFFECT_LABELS } from "@/lib/photo-effects";
import styles from "./controls.module.css";

export function LayerRow({ tooltipId, layer, index, selected, onSelect, onToggle, onRemove, onMove, constraints, releaseListenersRef, onStart, onFinish }: {
  tooltipId: string;
  releaseListenersRef: RefObject<(() => void) | null>;
  constraints: RefObject<HTMLOListElement | null>; onStart: () => void; onFinish: (cancelled: boolean, pointerY?: number) => void;
  layer: PhotoLayer; index: number; selected: boolean;
  onSelect: () => void; onToggle: () => void; onRemove: () => void; onMove: (direction: number) => void;
}) {
  const drag = useDragControls();
  const reduced = useReducedMotion();
  const y = useMotionValue(0);
  const gesture = useRef(false);
  const [dragging, setDragging] = useState(false);
  const name = EFFECT_LABELS[layer.effect];
  return (
    <Reorder.Item value={layer.id} dragListener={false} dragControls={drag}
      layout="position" style={{ y }} dragConstraints={constraints} dragElastic={0} dragMomentum={false}
      dragTransition={{ bounceStiffness: 700, bounceDamping: 45 }}
      data-selected={selected} data-enabled={layer.enabled} data-dragging={dragging}
      onDragEnd={(event, info) => {
        if (!gesture.current) return;
        gesture.current = false; setDragging(false); onFinish(event.type === "pointercancel", info.point.y);
      }}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}>
      <button type="button" className={styles.layerSelect} data-layer-id={layer.id} aria-label={`Edit layer ${index + 1}: ${name}`} aria-pressed={selected} onClick={onSelect} />
      <button type="button" className={styles.layerGrip} aria-label={`Reorder layer ${index + 1}: ${name}`}
        data-layer-tooltip="Drag to reorder" data-tooltip-shortcut="↑ ↓" aria-describedby={tooltipId}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          onSelect();
          releaseListenersRef.current?.();
          const pointer = event.pointerId;
          constraints.current?.setPointerCapture(pointer);
          const release = (end: PointerEvent) => {
            if (end.pointerId !== pointer) return;
            releaseListenersRef.current?.();
            if (!gesture.current) return;
            gesture.current = false;
            drag.stop(); setDragging(false);
            onFinish(end.type === "pointercancel", end.clientY);
          };
          const cancel = () => {
            releaseListenersRef.current?.();
            if (!gesture.current) return;
            gesture.current = false; drag.cancel(); y.set(0); setDragging(false); onFinish(true);
          };
          window.addEventListener("pointerup", release, true);
          window.addEventListener("pointercancel", release, true);
          window.addEventListener("blur", cancel);
          releaseListenersRef.current = () => {
            window.removeEventListener("pointerup", release, true);
            window.removeEventListener("pointercancel", release, true);
            window.removeEventListener("blur", cancel);
            releaseListenersRef.current = null;
          };
          // Motion dispatches onDragStart on a later animation frame. A quick
          // release can precede it, leaving a stale drag active after pointerup.
          // Own the gesture lifetime synchronously with the pointer events.
          gesture.current = true;
          setDragging(true);
          onStart();
          drag.start(event, { distanceThreshold: 4 });
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && gesture.current) {
            event.preventDefault(); event.stopPropagation();
            releaseListenersRef.current?.(); gesture.current = false; drag.cancel(); y.set(0); setDragging(false); onFinish(true); return;
          }
          if (gesture.current) return;
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault(); onMove(event.key === "ArrowUp" ? -1 : 1);
          }
        }}>
        <GripVertical size={14} aria-hidden="true" />
      </button>
      <button type="button" className={styles.layerName} aria-label={`Select layer ${index + 1}: ${name}`} aria-pressed={selected} onClick={onSelect}>
        <span>{name}</span>
      </button>
      <button type="button" className={styles.layerVisibility} aria-label={`${layer.enabled ? "Hide" : "Show"} layer ${index + 1}: ${name}`}
        data-layer-tooltip={layer.enabled ? "Hide layer" : "Show layer"} aria-describedby={tooltipId} onClick={onToggle}>
        {layer.enabled ? <Eye size={14} aria-hidden="true" /> : <EyeClosed size={14} aria-hidden="true" />}
      </button>
      <button type="button" className={styles.layerRemove} aria-label={`Remove layer ${index + 1}: ${name}`} data-layer-tooltip="Remove layer" aria-describedby={tooltipId} onClick={onRemove}>
        <X size={14} aria-hidden="true" />
      </button>
    </Reorder.Item>
  );
}
