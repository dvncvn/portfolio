"use client";

import { useEffect, useRef, useState } from "react";
import { Reorder } from "framer-motion";
import type { PhotoLayer } from "@/lib/shared-photo";
import { LayerRow } from "./layer-row";
import styles from "./controls.module.css";

export function LayerList({ layers, selectedId, onSelect, onToggle, onRemove, onReorder, onMove }: {
  layers: PhotoLayer[]; selectedId?: string;
  onSelect: (id: string) => void; onToggle: (id: string) => void; onRemove: (id: string) => void;
  onReorder: (ids: string[]) => void; onMove: (id: string, direction: number) => void;
}) {
  const list = useRef<HTMLOListElement>(null);
  // Keep release listeners on the stationary list. React may replay row effects
  // as keyed rows move in development, which would remove a row-owned listener.
  const releaseListenersRef = useRef<(() => void) | null>(null);
  useEffect(() => () => releaseListenersRef.current?.(), []);
  const pending = useRef<string[] | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);
  const ids = order ?? layers.map((layer) => layer.id);
  const finish = (id: string, cancelled: boolean, pointerY?: number) => {
    let next = pending.current;
    // Fast releases may arrive before Motion has processed the final row crossing.
    // Resolve the drop from its final position, including releases beyond the list.
    if (!cancelled && next && pointerY !== undefined && list.current) {
      const bounds = list.current.getBoundingClientRect();
      // Labels can wrap, so use each row's actual layout height rather than
      // dividing the list into equal slots. offsetTop excludes drag transforms.
      const rows = Array.from(list.current.children) as HTMLElement[];
      const hit = rows.findIndex((row) => pointerY - bounds.top < row.offsetTop + row.offsetHeight + 2);
      const slot = hit < 0 ? next.length - 1 : hit;
      next = next.filter((value) => value !== id);
      next.splice(slot, 0, id);
    }
    pending.current = null;
    setOrder(null);
    if (!cancelled && next && next.some((id, index) => id !== layers[index]?.id)) onReorder(next);
  };
  return (
    <Reorder.Group ref={list} as="ol" axis="y" values={ids} className={styles.layerList} data-dragging={order !== null}
      onReorder={(next) => {
        if (!pending.current || next.length !== layers.length || new Set(next).size !== layers.length) return;
        pending.current = next;
        setOrder(next);
      }}>
      {ids.map((id, index) => {
        const layer = layers.find((item) => item.id === id);
        if (!layer) return null;
        return <LayerRow key={id} layer={layer} index={index} selected={selectedId === id} constraints={list} releaseListenersRef={releaseListenersRef}
          onSelect={() => onSelect(id)} onToggle={() => onToggle(id)} onRemove={() => onRemove(id)} onMove={(direction) => onMove(id, direction)}
          onStart={() => { pending.current = layers.map((item) => item.id); setOrder(pending.current); }}
          onFinish={(cancelled, pointerY) => finish(id, cancelled, pointerY)} />;
      })}
    </Reorder.Group>
  );
}
