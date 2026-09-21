// Deliberately edible silhouettes: torn crust, a bitten cracker, and a chip.
const SCRAPS = [
  '<path d="M2 7h4V3h18v3h5v14h-5v4H6v-4H2Z" fill="currentColor"/><path d="M6 7h17v3H9v10H6Z" fill="var(--background)" opacity=".45"/><path d="M24 11h6v5h-6v5h-5v-5h5Z" fill="var(--background)"/>',
  '<path d="M3 3h22v6h-5v5h6v12H3Z" fill="currentColor"/><path d="M7 8h3v3H7zm7 9h3v3h-3zm-7 3h3v3H7zm7-13h3v3h-3z" fill="var(--background)"/>',
  '<path d="M3 24 14 3h5l10 21v4H3Z" fill="currentColor"/><path d="m8 22 8-13h3l-7 13zm12 1h4v3h-4z" fill="var(--background)" opacity=".45"/>',
];

export function createRatFood(layer: HTMLElement) {
  const piles = new Map<HTMLElement, Animation[]>();
  const remove = (pile: HTMLElement) => {
    piles.get(pile)?.forEach((animation) => animation.cancel());
    piles.delete(pile);
    pile.remove();
  };
  return {
    drop(x: number, y: number, count: number, reduced: boolean) {
      // Keep rapid feeding bounded, including animations retained by the browser.
      if (piles.size >= 4) remove(piles.keys().next().value!);
      const pile = document.createElement("div");
      pile.className = "rat-food-pile";
      layer.append(pile);
      const animations: Animation[] = [];
      piles.set(pile, animations);
      const pieces = count > 1 ? 18 : 12;
      for (let i = 0; i < pieces; i++) {
        const scrap = document.createElement("span");
        const large = i < (count > 1 ? 5 : 3);
        scrap.className = large ? "rat-food-scrap" : "rat-food-bit";
        if (large) scrap.innerHTML = `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">${SCRAPS[i % SCRAPS.length]}</svg>`;
        const size = large ? 24 + Math.random() * 14 : 4 + Math.random() * 5;
        scrap.style.width = `${size}px`;
        scrap.style.height = `${size}px`;
        const angle = Math.random() * Math.PI * 2;
        const distance = 14 + Math.random() * (large ? 38 : 68);
        const endX = Math.max(8, Math.min(window.innerWidth - size - 8, x + Math.cos(angle) * distance));
        const endY = Math.max(40, Math.min(window.innerHeight - size - 8, y + Math.sin(angle) * distance));
        const rotation = Math.round(Math.random() * 220 - 110);
        const start = `translate(${x - size / 2}px, ${y - size / 2}px) rotate(0deg)`;
        const end = `translate(${endX}px, ${endY}px) rotate(${rotation}deg)`;
        const apex = `translate(${(x + endX) / 2}px, ${Math.min(y, endY) - 35 - Math.random() * 30}px) rotate(${rotation / 2}deg)`;
        pile.append(scrap);
        const duration = 1500 + i * 65;
        const frames: Keyframe[] = reduced ? [
          { transform: end, opacity: 1 }, { transform: end, opacity: 1, offset: .85 }, { transform: end, opacity: 0 },
        ] : [
          { transform: start, opacity: 1, offset: 0 },
          { transform: apex, opacity: 1, offset: .09 },
          { transform: end, opacity: 1, offset: .2 },
          { transform: `translate(${endX}px, ${endY - 7}px) rotate(${rotation + 12}deg)`, opacity: 1, offset: .25 },
          { transform: end, opacity: 1, offset: .3 },
          { transform: end, opacity: 1, offset: .88 },
          { transform: `${end} scale(.9)`, opacity: 0, offset: 1 },
        ];
        const animation = scrap.animate(frames, { duration, easing: "linear", fill: "forwards" });
        animations.push(animation);
        if (i === pieces - 1) animation.onfinish = () => remove(pile);
      }
    },
    dispose() { Array.from(piles.keys()).forEach(remove); },
  };
}
