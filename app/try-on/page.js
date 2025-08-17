// PressMuah — Live Virtual Nail Try‑On (Webcam)
// Default export a React component that opens the user's camera,
// tracks hand landmarks with MediaPipe Hands, and overlays virtual nails
// with selectable styles (Solid / French / Glitter / Chrome), colors, length, and opacity.
// Tailwind + framer-motion + lucide-react are used for a clean UI.
//
// IMPORTANT FIX:
// The previous build failed because it tried to import a *named* export `Hands` from
// "@mediapipe/hands" via the +esm CDN wrapper, which exposes a *default* UMD namespace.
// We now import the default package and access `.Hands` off it, with a fallback to
// `.default.Hands` for different bundlers. No other behavior changed.

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Camera as CamIcon,
  CameraOff,
  FlipHorizontal,
  SlidersHorizontal,
  Pause,
  Play,
  Download,
  TriangleAlert
} from "lucide-react";
import HandsPkg from "@mediapipe/hands";
// NOTE: In Canvas, npm/ESM imports of MediaPipe can fail in the sandbox.
// We'll load the UMD script at runtime and access the global `window.Hands` instead.

// --------------------------------------
// Minimal UI helpers
// --------------------------------------
function Button({ className = "", children, ...props }) {
  return (
    <button
      className={
        "px-3 py-2 rounded-2xl shadow-sm border border-black/10 bg-white/80 hover:bg-white active:scale-[0.98] transition text-sm " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}

function Toggle({ pressed, onToggle, children }) {
  return (
    <button
      onClick={() => onToggle(!pressed)}
      className={
        "px-3 py-2 rounded-2xl text-sm transition border " +
        (pressed
          ? "bg-black text-white border-black"
          : "bg-white text-black border-black/10 hover:bg-white")
      }
    >
      {children}
    </button>
  );
}

function Swatch({ color, selected, onClick, title }) {
  return (
    <button
      title={title || color}
      onClick={onClick}
      className={
        "w-7 h-7 rounded-full border transition " +
        (selected ? "ring-2 ring-offset-2 ring-black" : "border-black/20 hover:scale-105")
      }
      style={{ background: color }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      className="px-3 py-2 rounded-2xl bg-white border border-black/10 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// --------------------------------------
// Color & Style Presets
// --------------------------------------
const NUDES = ["#F4E7DA", "#E9D3C2", "#D4B6A4", "#B9927F", "#966D58", "#6F4B38"];
const BRIGHTS = [
  "#FF3B30",
  "#FF2D55",
  "#FF9F0A",
  "#34C759",
  "#0A84FF",
  "#AF52DE",
  "#FFD60A",
  "#111111",
  "#eeeeee",
];
const TIP_COLORS = ["#ffffff", "#111111", "#FF3B30", "#FF2D55", "#0A84FF", "#AF52DE", "#34C759"];
const DESIGNS = [
  { value: "solid", label: "Solid" },
  { value: "french", label: "French Tip" },
  { value: "glitter", label: "Glitter" },
  { value: "chrome", label: "Chrome" },
];

// --------------------------------------
// Math helpers
// --------------------------------------
function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}
function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// Map each finger to landmark indices (tip/dip/pip/mcp)
const FINGER_MAP = {
  thumb: { t: 4, d: 3, p: 2, m: 1 },
  index: { t: 8, d: 7, p: 6, m: 5 },
  middle: { t: 12, d: 11, p: 10, m: 9 },
  ring: { t: 16, d: 15, p: 14, m: 13 },
  pinky: { t: 20, d: 19, p: 18, m: 17 },
};
const FINGER_KEYS = Object.keys(FINGER_MAP);

// Glitter texture generator (offscreen canvas)
function makeGlitterPattern(ctx, color = "#fff") {
  const size = 128;
  const off = document.createElement("canvas");
  off.width = size;
  off.height = size;
  const g = off.getContext("2d");
  g.fillStyle = "rgba(255,255,255,0)";
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.6 + 0.2;
    g.fillStyle = color;
    g.globalAlpha = Math.random() * 0.8 + 0.2;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  return ctx.createPattern(off, "repeat");
}

// Chrome gradient helper
function makeChromeGradient(ctx, w, h, hue = 0) {
  const grad = ctx.createLinearGradient(-w, -h, w, h);
  grad.addColorStop(0.0, "#eeeeee");
  grad.addColorStop(0.2, `hsl(${hue}, 10%, 65%)`);
  grad.addColorStop(0.5, "#fafafa");
  grad.addColorStop(0.7, `hsl(${hue}, 15%, 55%)`);
  grad.addColorStop(1.0, "#d0d0d0");
  return grad;
}

// --------------------------------------
// Main Component
// --------------------------------------
export default function VirtualNailTryOn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const handsRef = useRef(null);
  const landmarksRef = useRef([]);

  const [running, setRunning] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [design, setDesign] = useState("solid");
  const [baseColor, setBaseColor] = useState(NUDES[4]);
  const [tipColor, setTipColor] = useState("#ffffff");
  const [lengthScale, setLengthScale] = useState(1.25); // 0.8–2.0
  const [opacity, setOpacity] = useState(0.95);
  const [hint, setHint] = useState("Raise one hand and spread your fingers.");
  const [calibrating, setCalibrating] = useState(false);
  const [paused, setPaused] = useState(false);

  // --- Lightweight in-app tests (for debugging/regression) ---
  const [tests, setTests] = useState({ total: 0, passed: 0, details: [] });
  useEffect(() => {
    const details = [];
    const assert = (name, cond) => details.push({ name, pass: !!cond });

    // Math sanity
    assert("dist 3-4-5 triangle", Math.abs(dist({ x: 0, y: 0 }, { x: 3, y: 4 }) - 5) < 1e-6);
    const mid = lerp({ x: 0, y: 0 }, { x: 10, y: 10 }, 0.5);
    assert("lerp midpoint", mid.x === 5 && mid.y === 5);

    // Finger map coverage
    assert("FINGER_MAP has 5 keys", Object.keys(FINGER_MAP).length === 5);
    assert("FINGER_MAP index tip is 8", FINGER_MAP.index.t === 8);

    // MediaPipe import shape (the root cause we fixed)
    const hasHands = !!(HandsPkg && (HandsPkg.Hands || HandsPkg.default?.Hands));
    assert("Hands constructor present", hasHands);

    setTests({ total: details.length, passed: details.filter((d) => d.pass).length, details });
  }, []);

  // --- Utilities to load MediaPipe Hands in Canvas ---
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  async function ensureHandsLoaded() {
    if (typeof window !== 'undefined' && window.Hands) return true;
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
      return !!window.Hands;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // Prepare MediaPipe Hands on mount (via UMD global)
  useEffect(() => {
    (async () => {
      const ok = await ensureHandsLoaded();
      if (!ok) {
        console.error('Could not load MediaPipe Hands UMD.');
        setHint('Failed to load hand tracker. Check your connection and refresh.');
        return;
      }
      const HandsCtor = window.Hands;
      const hands = new HandsCtor({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      hands.onResults((res) => {
        landmarksRef.current = res.multiHandLandmarks || [];
      });
      handsRef.current = hands;
    })();

    return () => {
      try { handsRef.current?.close(); } catch {}
    };
  }, []);

  // Start/Stop camera stream
  async function startCamera(nextFacingMode = facingMode) {
    if (!videoRef.current) return;

    try {
      setCalibrating(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      await videoRef.current.play();

      setRunning(true);
      setHint("Hold your hand steady for best results ✨");

      // Begin RAF loop
      cancelAnimationFrame(rafRef.current);
      const loop = async () => {
        if (!paused && videoRef.current && handsRef.current) {
          try {
            await handsRef.current.send({ image: videoRef.current });
          } catch (e) {
            // Frame drop — ignore
          }
          draw();
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      const onLoaded = () => setCalibrating(false);
      videoRef.current.onloadeddata = onLoaded;
    } catch (err) {
      console.error(err);
      setHint("Camera blocked. Please allow access in your browser settings.");
      setCalibrating(false);
    }
  }

  function stopCamera() {
    setRunning(false);
    setCalibrating(false);
    cancelAnimationFrame(rafRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  function flipCamera() {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    if (running) {
      stopCamera();
      startCamera(next);
    }
  }

  // Resize canvas to match video
  useEffect(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const syncSize = () => {
      if (v.videoWidth && v.videoHeight) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
      }
    };
    const id = setInterval(syncSize, 300);
    return () => clearInterval(id);
  }, []);

  // Core drawing of nails overlay
  function draw() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;

    const ctx = c.getContext("2d");
    const W = c.width;
    const H = c.height;

    ctx.save();
    ctx.clearRect(0, 0, W, H);
    // Mirror horizontally to match selfie preview
    ctx.setTransform(-1, 0, 0, 1, W, 0);

    ctx.globalAlpha = Math.min(opacity + 0.05, 1);

    const hands = landmarksRef.current;
    if (!hands || hands.length === 0) {
      ctx.restore();
      return;
    }

    for (const lm of hands) {
      for (const finger of FINGER_KEYS) {
        const { t, d, p } = FINGER_MAP[finger];
        const tip = { x: lm[t].x * W, y: lm[t].y * H };
        const dip = { x: lm[d].x * W, y: lm[d].y * H };
        const pip = { x: lm[p].x * W, y: lm[p].y * H };

        const dir = { x: tip.x - dip.x, y: tip.y - dip.y };
        const theta = Math.atan2(dir.y, dir.x);
        const segLen = Math.hypot(dir.x, dir.y);
        const widthGuess = Math.max(8, dist(dip, pip) * 0.9);
        const nailLen = Math.min(80, Math.max(14, segLen * 1.6 * lengthScale));
        const nailWid = Math.min(60, Math.max(10, widthGuess * 1.25));

        const center = {
          x: tip.x - dir.x * 0.55,
          y: tip.y - dir.y * 0.55,
        };

        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.rotate(theta);
        ctx.globalAlpha = opacity;

        const rw = nailWid * 0.5;
        const rh = nailLen * 0.6;

        // Drop shadow for depth
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.25)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fill();
        ctx.restore();

        // Nail fill
        ctx.beginPath();
        ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);

        if (design === "solid") {
          ctx.fillStyle = baseColor;
          ctx.fill();
        } else if (design === "glitter") {
          ctx.fillStyle = baseColor;
          ctx.fill();
          const pat = makeGlitterPattern(ctx, "rgba(255,255,255,0.9)");
          if (pat) {
            ctx.globalAlpha = Math.min(1, opacity + 0.05);
            ctx.fillStyle = pat;
            ctx.fill();
          }
        } else if (design === "chrome") {
          const grad = makeChromeGradient(ctx, rw, rh, 200);
          ctx.fillStyle = grad;
          ctx.fill();
        } else if (design === "french") {
          ctx.fillStyle = baseColor;
          ctx.fill();
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(0, -rh * 0.35, rw * 0.98, rh * 0.5, 0, Math.PI * 1.15, Math.PI * 1.85);
          ctx.closePath();
          ctx.fillStyle = tipColor;
          ctx.fill();
          ctx.restore();
        }

        // Subtle highlight
        ctx.beginPath();
        ctx.ellipse(-rw * 0.2, -rh * 0.2, rw * 0.15, rh * 0.3, -0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.fill();

        ctx.restore();
      }
    }

    ctx.restore();
  }

  // Fun calibration animation overlay
  function CalibratingOverlay() {
    return (
      <AnimatePresence>
        {calibrating && (
          <motion.div
            className="absolute inset-0 z-20 rounded-2xl overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-sm" />
            <motion.div
              className="absolute left-0 top-0 h-full w-40 bg-white/50"
              initial={{ x: -160 }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            />
            <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Finding your fingertips…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Screenshot capture
  function captureFrame() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;

    const out = document.createElement("canvas");
    out.width = c.width;
    out.height = c.height;
    const g = out.getContext("2d");

    g.save();
    g.setTransform(-1, 0, 0, 1, out.width, 0);
    g.drawImage(v, 0, 0, out.width, out.height);
    g.restore();

    g.drawImage(c, 0, 0);

    const url = out.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "pressmuah-tryon.png";
    a.click();
  }

  return (
    <div className="w-full min-h-[80vh] grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-4 p-4">
      {/* Left: Live view */}
      <div className="relative aspect-video w-full bg-black/5 rounded-2xl overflow-hidden shadow-sm">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100" // mirror for selfie
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Top-left controls */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-30">
          {!running ? (
            <Button onClick={() => startCamera()}>
              <div className="flex items-center gap-2"><CamIcon className="w-4 h-4" /> Start camera</div>
            </Button>
          ) : (
            <>
              <Button onClick={stopCamera}>
                <div className="flex items-center gap-2"><CameraOff className="w-4 h-4" /> Stop</div>
              </Button>
              <Button onClick={flipCamera}>
                <div className="flex items-center gap-2"><FlipHorizontal className="w-4 h-4" /> Flip</div>
              </Button>
              <Toggle pressed={paused} onToggle={setPaused}>
                <div className="flex items-center gap-2">{paused ? <Play className="w-4 h-4"/> : <Pause className="w-4 h-4"/>}{paused ? "Resume" : "Pause"}</div>
              </Toggle>
              <Button onClick={captureFrame}>
                <div className="flex items-center gap-2"><Download className="w-4 h-4" /> Save photo</div>
              </Button>
            </>
          )}
        </div>

        {/* Bottom hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 text-xs rounded-full bg-white/80 shadow border border-black/10">
          {hint}
        </div>

        {/* Calibrating animation */}
        <CalibratingOverlay />
      </div>

      {/* Right: Controls */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          <h2 className="text-base font-semibold">Style</h2>
        </div>

        {/* Design selector */}
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium">Design</label>
          <Select value={design} onChange={setDesign} options={DESIGNS} />
        </div>

        {/* Base color */}
        <div>
          <div className="text-sm font-medium mb-1">Base color</div>
          <div className="flex flex-wrap gap-2">
            {NUDES.map((c) => (
              <Swatch key={c} color={c} selected={baseColor === c} onClick={() => setBaseColor(c)} />
            ))}
            {BRIGHTS.map((c) => (
              <Swatch key={c} color={c} selected={baseColor === c} onClick={() => setBaseColor(c)} />
            ))}
          </div>
        </div>

        {/* Tip color (for French) */}
        {design === "french" && (
          <div>
            <div className="text-sm font-medium mb-1">Tip color</div>
            <div className="flex flex-wrap gap-2">
              {TIP_COLORS.map((c) => (
                <Swatch key={c} color={c} selected={tipColor === c} onClick={() => setTipColor(c)} />
              ))}
            </div>
          </div>
        )}

        {/* Length scale */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1"><span className="font-medium">Length</span><span className="tabular-nums">{lengthScale.toFixed(2)}×</span></div>
          <input
            type="range"
            min={0.8}
            max={2.0}
            step={0.01}
            value={lengthScale}
            onChange={(e) => setLengthScale(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Opacity */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1"><span className="font-medium">Opacity</span><span className="tabular-nums">{Math.round(opacity * 100)}%</span></div>
          <input
            type="range"
            min={0.6}
            max={1.0}
            step={0.01}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Debug / Tests */}
        <div className="mt-2 rounded-xl border border-black/10 p-3 bg-white/60">
          <div className="flex items-center gap-2 text-sm font-medium mb-1"><TriangleAlert className="w-4 h-4"/> Diagnostics</div>
          <div className="text-xs text-black/60">Tests passed: {tests.passed}/{tests.total}</div>
          <ul className="mt-1 space-y-1 text-[11px] text-black/70">
            {tests.details.map((t, i) => (
              <li key={i} className={t.pass ? "" : "text-red-600"}>• {t.pass ? "✔" : "✖"} {t.name}</li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-black/60 leading-relaxed">
          Tips: Good lighting • Keep one hand in frame • Avoid fast motion • Try flipping the camera if tracking is off.
        </div>
      </div>
    </div>
  );
}
