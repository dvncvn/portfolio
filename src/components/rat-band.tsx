"use client";

import { DEFAULT_RAT_MIX, RAT_BPM, type RatMix, type RatCue } from "./rat-audio";

export const BAND_PARTS = [
  { name: "Seq", rats: 3 },
  { name: "Bass", rats: 3 },
  { name: "Drums", rats: 3 },
  { name: "Texture", rats: 3 },
  { name: "Delay", rats: 3 },
];

export function RatInstrument({ part }: { part: number }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" shapeRendering="crispEdges">
      {part === 0 && <><path d="M3 14h34v19H3z" fill="var(--background)" /><path d="M10 15v17m7-17v17m7-17v17m7-17v17" /><path d="M8 14h4v11H8zm14 0h4v11h-4z" fill="currentColor" /></>}
      {part === 1 && <><path d="M23 3v20m5-20v20M21 3h9v6h-9" /><path d="M18 18c-10 0-5 8-9 10-9 7 7 15 14 7 5-5-3-8 1-12Z" fill="var(--background)" /><path d="m24 8-9 26m-4-4h9" /></>}
      {part === 2 && <><path d="M6 18h28v15H6z" fill="var(--background)" /><path d="m6 18 7 15 7-15 7 15 7-15M4 8l26 9M35 6 12 17M4 34h32" /></>}
      {part === 3 && <><path d="M3 8h34v26H3z" fill="var(--background)" /><path d="M7 13h4m4 0h4m4 0h9M7 19h25M10 24v7m7-7v7m7-7v7m7-7v7" /></>}
      {part === 4 && <><path d="M5 5h30v30H5z" fill="var(--background)" /><path d="M10 24v-8h5v8m5-12v16m6-19v22m5-14v6" /></>}
    </svg>
  );
}

const CHANNELS = [
  { key: "drums", label: "Drums" },
  { key: "bass", label: "Bass" },
  { key: "arp", label: "Sequence" },
  { key: "synth", label: "Texture" },
  { key: "pad", label: "Pad" },
] as const;

type Props = { mix: RatMix; onMix: (mix: RatMix) => void; onCue: (cue: RatCue) => void };

export function RatBand({ mix, onMix, onCue }: Props) {
  return (
    <section className="rat-band" aria-label="Trench band mixer">
      <div className="rat-band-heading"><span>TRENCH BAND</span><span>{RAT_BPM} BPM</span></div>
      <div className="rat-band-transport" aria-label="Current arrangement position">GROOVE · 01/32</div>
      <div className="rat-mixer-channels">
        {CHANNELS.map(({ key, label }) => (
          <label key={key} className="rat-mixer-channel">
            <span>{label}</span>
            <input type="range" min="0" max="100" step="1" aria-label={`${label} level`} value={Math.round(mix[key] * 100)}
              onChange={(event) => onMix({ ...mix, [key]: Number(event.target.value) / 100 })} />
            <output>{Math.round(mix[key] * 100)}%</output>
          </label>
        ))}
      </div>
      <div className="rat-mixer-effects">
        <label><span>Low-pass <output>{Math.round(180 * 100 ** mix.filter)} Hz</output></span>
          <input type="range" min="0" max="100" aria-label="Low-pass filter" value={Math.round(mix.filter * 100)}
            onChange={(event) => onMix({ ...mix, filter: Number(event.target.value) / 100 })} />
        </label>
        <label><span>Stereo delay <output>{Math.round(mix.delay * 100)}%</output></span>
          <input type="range" min="0" max="100" aria-label="Stereo delay" value={Math.round(mix.delay * 100)}
            onChange={(event) => onMix({ ...mix, delay: Number(event.target.value) / 100 })} />
        </label>
      </div>
      <div className="rat-mixer-cues" aria-label="Queue a change for the next bar">
        <button onClick={() => onCue("build")}>Tension</button>
        <button onClick={() => onCue("drop")}>Full</button>
        <button onClick={() => onCue("pattern")}>New pattern</button>
      </div>
      <div className="rat-band-floor"><button onClick={() => onMix({ ...DEFAULT_RAT_MIX })}>Reset mix</button><div className="rat-band-meter" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div></div>
    </section>
  );
}
