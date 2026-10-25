'use client';

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { Check, Upload as UpIcon, X } from "lucide-react";
import "./upload-dropzone.css";

/* ══ Upload dropzone ══════════════════════════════════════
   A drop box for an image. Drag one in from the desktop, or
   click — on a phone, tap — the box to browse: it uploads there — name, a rolling
   percentage, a bar — ticks, and stays, showing what it holds,
   until it is removed or another image is dropped over it.

   ── REAL FILES, READ IN THE BROWSER ──────────────────────
   Bencho's original carried two pretend files on a tray. This
   one takes the visitor's own: a native drop, or the file
   picker behind a click. The image is read locally into a data
   URL — the same way the design studio reads artwork — and
   handed to `onUpload`; nothing is sent to a server here.

   ── THE BOX INHALES, AND SWALLOWS ───────────────────────
   A plain filled box, no edge. A file carried over it is
   answered before it is let go: the box grows with a small
   bounce and the arrow lifts toward the hand. Let go and the
   box gives a little gulp before the upload appears in it.

   ── WHAT IT REFUSES ─────────────────────────────────────
   Anything over `maxMB`, and anything that is not an image a
   browser can draw onto the tee. Either shakes the box and
   says why in red; whatever it already held stays. */

/* ── inlined from lab/spring ──────────────────────── */
/* ── one spring, for everything that settles ───────────────
   The maths was already on this bench twice, copied by hand:
   Humidity's wheel and Brightness's column both accumulate
   velocity toward a target, damp it, and snap when both the
   delta and the velocity fall under 0.02. Two copies is a
   coincidence; five would be a policy, so it comes out here
   before the elastic blocks are written against it.

   The two shipped copies are deliberately NOT refactored onto
   this. They work, they are tuned, and rewriting the innards
   of two live components to prove a point about duplication
   is how a good afternoon becomes a bad one. This is the one
   new code uses.

   Frames, not milliseconds. `dt` is expressed in sixtieths of
   a second and the damping is RAISED to it rather than
   multiplied by it, so a dropped frame decays the same amount
   of energy as the two frames it replaced. Multiplying is the
   version that makes a spring behave differently on a busy
   page, which is the hardest kind of bug to see.

   The loop parks itself the moment the value has settled.
   CLAUDE.md is not complimentary about the one permanent
   requestAnimationFrame already on this bench and there is no
   case for five more. */

/* Read once, the way the wheel and the pill nav do. A
   preference, not a live input. */
const stillness = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* what it says the second time, and after */
const snark = (size: string) => [
  `Still ${size}. It didn't shrink.`,
  "Pushing harder won't help",
  "Have you tried compressing it?",
  "The box is full of excuses now",
  "No.",
];

/* the images a browser decodes everywhere, so a texture can be
   made from any of them — HEIC and TIFF are left out for that */
const TYPES: Record<string, { ext: string; tint: string }> = {
  "image/png": { ext: "PNG", tint: "#079455" },
  "image/jpeg": { ext: "JPG", tint: "#155EEF" },
  "image/webp": { ext: "WEBP", tint: "#7A5AF8" },
  "image/gif": { ext: "GIF", tint: "#DD2590" },
  "image/svg+xml": { ext: "SVG", tint: "#E62E05" },
};
const ACCEPT = Object.keys(TYPES).join(",");

export type UploadedFile = { name: string; size: number; type: string; dataUrl: string };

type F = { name: string; ext: string; size: number; tint: string };

const fmt = (b: number) => (b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* ── the file icon ─────────────────────────────────────────
   After Untitled UI's: a rounded page on a 40 grid with a thin
   grey outline and a folded corner, and the extension on a
   coloured label that sticks out past the page's left edge —
   the colour carries the kind before the word is read. */
function Page({ f, size = 40 }: { f: F; size?: number }) {
  return (
    <svg className="upl-page" width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        className="upl-page-line"
        d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
      />
      <path className="upl-page-line" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
      <rect width="29" height="16" x="1" y="18" rx="8" fill={f.tint} />
      <text x="15.5" y="29.3" textAnchor="middle" className="upl-page-ext">{f.ext}</text>
    </svg>
  );
}

function Roll({ value }: { value: number }) {
  const s = String(Math.round(value));
  return (
    <span className="upl-roll" aria-label={`${s}%`}>
      {s.split("").map((d, i) => (
        <span key={s.length - i} className="upl-roll-col">
          <span className="upl-roll-strip" style={{ transform: `translateY(${-Number(d)}em)` }}>
            {"0123456789".split("").map((n) => <span key={n}>{n}</span>)}
          </span>
        </span>
      ))}
      %
    </span>
  );
}

type Phase = { kind: "idle" } | { kind: "up"; f: F; p: number } | { kind: "done"; f: F; url: string };

export function UploadDropzone({
  /* called with the image once its bar has filled */
  onUpload,
  /* called when the held image is removed */
  onClear,
  /* the size limit, in MB */
  maxMB = 5,
  /* how fast the bar fills, 0..100 */
  speed = 50,
  /* how springy the upload lands, 0..100 */
  bounce = 40,
  corner = 16,
}: {
  onUpload?: (file: UploadedFile) => void;
  onClear?: () => void;
  maxMB?: number;
  speed?: number;
  bounce?: number;
  corner?: number;
} = {}) {
  const still = stillness();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [over, setOver] = useState(false);
  /* the tick shows first, then gives its room to the remove button */
  const [ticked, setTicked] = useState(false);
  /* what the box says when it refuses — null while it is not */
  const [refuse, setRefuse] = useState<string | null>(null);
  const tries = useRef(0);
  const cool = useRef(0);
  const [gulp, setGulp] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const now = useRef<HTMLSpanElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const shake = useAnimationControls();
  const raf = useRef(0);
  const timers = useRef<number[]>([]);
  /* dragenter and dragleave fire for every child the file
     crosses, so "over" is a count of the enters not yet left */
  const depth = useRef(0);
  /* bumped by every new read, so a slow one finishing after a
     newer one has started is ignored */
  const job = useRef(0);
  const knobs = useRef({ speed, onUpload });
  /* kept current after each render rather than during it, so a
     send already under way reads the latest knob */
  useEffect(() => { knobs.current = { speed, onUpload }; });

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    job.current++;
    timers.current.forEach(clearTimeout);
    clearTimeout(cool.current);
  }, []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const max = maxMB * 1e6;

  /* ── the wire ─────────────────────────────────────────────
     The file is really read, and the bar never runs ahead of
     what has been read. But a local file reads in a few
     milliseconds, and a bar that jumps straight to full reads
     as a flash, not an upload — so the bar also keeps to a
     short floor of its own, a second or so, and finishes on
     whichever of the two is slower. */
  const send = (file: File) => {
    const type = TYPES[file.type];
    const f: F = { name: file.name, ext: type.ext, size: file.size, tint: type.tint };
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    const id = ++job.current;
    let read = 0;
    let url: string | null = null;

    const reader = new FileReader();
    reader.onprogress = (e) => { if (e.lengthComputable) read = e.loaded / e.total; };
    reader.onerror = () => { if (id === job.current) fail(); };
    reader.onload = () => {
      if (id !== job.current) return;
      if (typeof reader.result !== "string") { fail(); return; }
      url = reader.result;
      read = 1;
      if (still) finish(f, file, url);
    };
    reader.readAsDataURL(file);

    setTicked(false);
    if (still) return;
    setPhase({ kind: "up", f, p: 0 });
    let p = 0;
    let prev = 0;
    const secs = (2 - (clamp(knobs.current.speed, 0, 100) / 100) * 1.6) * (0.7 + Math.min(1, f.size / max) * 0.6);
    const tick = (t: number) => {
      if (id !== job.current) { raf.current = 0; return; }
      const dt = prev ? Math.min(0.05, (t - prev) / 1000) : 0;
      prev = t;
      /* uneven on purpose: a steady climb reads as a timer */
      p = Math.min(read, 1, p + (dt / secs) * (0.4 + Math.random() * 1.2));
      if (p >= 1 && url) { raf.current = 0; finish(f, file, url); return; }
      setPhase({ kind: "up", f, p });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const finish = (f: F, file: File, url: string) => {
    tries.current = 0;
    setPhase({ kind: "done", f, url });
    knobs.current.onUpload?.({ name: file.name, size: file.size, type: file.type, dataUrl: url });
    /* the tick has its moment, then makes way for the remove —
       unless another file has come in since */
    const id = job.current;
    later(() => { if (id === job.current) setTicked(true); }, 1400);
  };

  const fail = () => {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    setPhase({ kind: "idle" });
    say("Couldn't read that file");
  };

  const clear = () => {
    job.current++;
    setPhase({ kind: "idle" });
    setTicked(false);
    onClear?.();
  };

  const say = (line: string) => {
    setRefuse(line);
    shake.start({ x: [0, -7, 6, -4, 2, 0], transition: { duration: 0.38 } });
    later(() => setRefuse(null), 1800);
  };

  /* ── trying again ─────────────────────────────────────────
     The first refusal is plain. Try a file that big again and
     the box starts to answer back, a new line each time, the
     last one repeating — until a file that fits goes through,
     which puts it back to being polite. A wrong kind of file
     is only ever told plainly: that is a mistake, not a dare. */
  const refuseBig = (size: number) => {
    const n = tries.current++;
    const lines = snark(fmt(size));
    say(n === 0 ? `Too big — up to ${maxMB} MB` : lines[Math.min(n - 1, lines.length - 1)]);
    /* "in a row" means close together: leave it alone a while and
       the next refusal is the polite one again */
    clearTimeout(cool.current);
    cool.current = window.setTimeout(() => { tries.current = 0; }, 8000);
  };

  const take = (file: File | undefined) => {
    if (!file || phase.kind === "up") return;
    if (!TYPES[file.type]) say("Images only — PNG, JPG, WebP, GIF or SVG");
    else if (file.size > max) refuseBig(file.size);
    else send(file);
  };

  /* ── carrying a file ─────────────────────────────────────
     The browser's own drag, from the desktop or another
     window. Only a drag that carries files is answered — a
     dragged link or a bit of selected text is not something
     this box can take. */
  const carriesFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  const onDragEnter = (e: React.DragEvent) => {
    if (!carriesFiles(e)) return;
    e.preventDefault();
    depth.current++;
    if (phase.kind !== "up") setOver(true);
  };

  const onDragOver = (e: React.DragEvent) => {
    if (!carriesFiles(e)) return;
    /* without this the browser opens the file in the tab */
    e.preventDefault();
    e.dataTransfer.dropEffect = phase.kind === "up" ? "none" : "copy";
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (!carriesFiles(e)) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    if (!carriesFiles(e)) return;
    e.preventDefault();
    depth.current = 0;
    setOver(false);
    if (phase.kind === "up") return;
    const file = e.dataTransfer.files[0];
    if (file && TYPES[file.type] && file.size <= max && !still) {
      setGulp(true);
      later(() => setGulp(false), 460);
    }
    take(file);
  };

  const browse = () => input.current?.click();

  /* ── the box hugs the upload ─────────────────────────────
     While a file is in it the box closes in round the upload row
     — measured, because the row is as wide as its name — and
     grows a little when the tick arrives; back to idle it opens
     out to the full drop box again. Width and height, never a
     scale, so its corner stays the corner. It shrinks inside a
     slot of fixed size, so nothing below it moves. */
  useLayoutEffect(() => {
    const z = zone.current;
    const n = now.current;
    if (!z) return;
    if (phase.kind === "idle" || !n) {
      z.style.width = "";
      z.style.height = "";
      return;
    }
    z.style.width = `${n.offsetWidth + 32}px`;
    z.style.height = `${n.offsetHeight + 28}px`;
  }, [phase.kind]);

  const r = Math.max(0, corner);
  const up = phase.kind !== "idle";
  const f = phase.kind !== "idle" ? phase.f : null;

  return (
    <div
      className="upl"
      style={{ "--upl-r": `${r}px`, "--upl-spring": `cubic-bezier(0.3, ${1 + (bounce / 100) * 0.9}, 0.4, 1)` } as React.CSSProperties}
    >
      <motion.div animate={shake} className="upl-zone-wrap">
        <div
          ref={zone}
          className="upl-zone"
          data-over={over || undefined}
          data-refuse={refuse ? true : undefined}
          data-busy={up || undefined}
          data-gulp={gulp || undefined}
          /* idle, the whole box is the button that opens the picker;
             holding a file, its only control is the remove */
          role={f ? undefined : "button"}
          tabIndex={f ? undefined : 0}
          aria-label={f ? undefined : `Upload an image, PNG, JPG, WebP, GIF or SVG, up to ${maxMB} MB. Drop a file here or press Enter to browse.`}
          onClick={f ? undefined : browse}
          onKeyDown={(e) => {
            if (!f && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              browse();
            }
          }}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <span className="upl-live" aria-live="polite">
            {refuse ?? (phase.kind === "done" ? `${phase.f.name} uploaded` : "")}
          </span>
          {!f ? (
            <>
              <span className="upl-icon"><UpIcon size={18} strokeWidth={2} /></span>
              {/* both wordings are rendered and CSS shows one: a phone
                  has no drag to offer, and asking in render would
                  disagree with the server's markup */}
              <span className="upl-say">
                <b>
                  {refuse ?? (over ? "Drop to upload" : (
                    <>
                      <span className="upl-mouse">Drag an image here</span>
                      <span className="upl-touch">Tap to choose an image</span>
                    </>
                  ))}
                </b>
                <span>
                  <span className="upl-mouse">or click to browse · </span>
                  PNG, JPG or SVG · up to {maxMB} MB
                </span>
              </span>
            </>
          ) : (
            <span className="upl-now" key={f.name} ref={now}>
              {phase.kind === "done"
                // eslint-disable-next-line @next/next/no-img-element -- a local data URL, nothing for next/image to optimise
                ? <img className="upl-thumb" src={phase.url} alt="" width={36} height={36} />
                : <Page f={f} size={36} />}
              <span className="upl-text">
                <span className="upl-name">{f.name}</span>
                <span className="upl-meta" data-refuse={refuse ? true : undefined}>
                  {/* holding a file, a refusal is said here — the
                      line it would have gone on is not showing */}
                  {refuse ?? <>{fmt(f.size)} · {phase.kind === "done" ? "Uploaded" : <Roll value={phase.kind === "up" ? phase.p * 100 : 0} />}</>}
                </span>
                <span className="upl-track">
                  <span className="upl-bar" style={{ transform: `scaleX(${phase.kind === "up" ? phase.p : 1})` }} />
                </span>
              </span>
              {/* the tick's room is kept from the start, so the box
                  is its final size before the tick arrives; the
                  remove takes the same room after it */}
              <span className="upl-end">
                {phase.kind === "done" && !ticked && <span className="upl-tick"><Check size={12} strokeWidth={3} /></span>}
                {phase.kind === "done" && ticked && (
                  <button type="button" className="upl-x" onClick={clear} aria-label={`Remove ${f.name}`}>
                    <X size={13} strokeWidth={2.4} />
                  </button>
                )}
              </span>
            </span>
          )}
        </div>
      </motion.div>

      <input
        ref={input}
        className="upl-input"
        type="file"
        accept={ACCEPT}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          take(e.target.files?.[0]);
          /* so picking the same file again still fires */
          e.target.value = "";
        }}
      />
    </div>
  );
}
