import { useState } from "react";

const FONT = `'Courier New', monospace`;

const PHASE = { INTRO: "intro", GUIDED: "guided", CHALLENGE: "challenge", SANDBOX: "sandbox" };

function generateVector(len = 8, blockSize = 2) {
  let v;
  do {
    v = Array.from({ length: len }, () => Math.floor(Math.random() * 19) + 1);
  } while (Math.max(...v.slice(0, blockSize)) >= Math.max(...v.slice(blockSize)));
  return v;
}

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
function simplify(n, d) { if (d === 0) return { n: 0, d: 1 }; const g = gcd(n, d); return { n: n / g, d: d / g }; }

function parseFrac(str) {
  str = str.trim();
  if (str.includes("/")) {
    const [a, b] = str.split("/").map(Number);
    if (isNaN(a) || isNaN(b) || b === 0) return null;
    return simplify(a, b);
  }
  const num = parseInt(str);
  if (isNaN(num)) return null;
  return { n: num, d: 1 };
}

function fracEq(a, b) {
  if (!a || !b) return false;
  return a.n * b.d === b.n * a.d;
}

function trueNorm(vec) {
  const mx = Math.max(...vec);
  return vec.map((x) => simplify(x, mx));
}

// ─── UI Primitives ────────────────────────────────────────────

function FracDisplay({ n, d, color = "#fff", size = 15 }) {
  if (d === 1) return <span style={{ fontFamily: FONT, fontSize: size, color, fontWeight: 700 }}>{n}</span>;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", fontFamily: FONT, fontSize: size * 0.78, color, fontWeight: 700, lineHeight: 1.05, verticalAlign: "middle", margin: "0 2px" }}>
      <span>{n}</span>
      <span style={{ width: "100%", height: 1.5, background: color, opacity: 0.5, margin: "1px 0" }} />
      <span>{d}</span>
    </span>
  );
}

function FracCell({ frac, glow, finished, correct, size = "normal" }) {
  const sm = size === "small";
  if (!frac) return (
    <div style={{ minWidth: sm ? 36 : 50, padding: sm ? "4px 5px" : "8px 10px", background: "#0a0a15", border: "1px solid #1a1a2e", borderRadius: 6, textAlign: "center", fontFamily: FONT, fontSize: sm ? 11 : 14, color: "#2a2a3e" }}>—</div>
  );
  const bg = finished ? (correct ? "#00ffc810" : "#ff444415") : glow ? "#ff880018" : "#0a0a15";
  const border = finished ? (correct ? "#00ffc850" : "#ff444850") : glow ? "#ff880060" : "#222";
  return (
    <div style={{ minWidth: sm ? 36 : 50, padding: sm ? "4px 5px" : "8px 10px", background: bg, border: `1.5px solid ${border}`, borderRadius: 6, textAlign: "center", transition: "all 0.4s" }}>
      <FracDisplay n={frac.n} d={frac.d} color={finished && correct ? "#00ffc8" : glow ? "#ff8800" : "#ddd"} size={sm ? 11 : 14} />
    </div>
  );
}

function Btn({ children, onClick, secondary, small, disabled, color }) {
  const c = color || "#00ffc8";
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: small ? "6px 14px" : "10px 22px", background: disabled ? "#222" : secondary ? "transparent" : c, color: disabled ? "#555" : secondary ? c : "#000", border: secondary ? `1.5px solid ${c}` : "none", borderRadius: 7, fontFamily: FONT, fontSize: small ? 11 : 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", letterSpacing: 1, transition: "all 0.2s", opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

function Msg({ text, type }) {
  if (!text) return null;
  const colors = { ok: "#00ffc8", warn: "#ff8800", err: "#ff5555", info: "#8888ff" };
  const c = colors[type] || colors.info;
  return (
    <div style={{ padding: "10px 14px", background: `${c}10`, border: `1px solid ${c}35`, borderRadius: 8, fontFamily: FONT, fontSize: 13, color: c, marginTop: 10, lineHeight: 1.7 }}>
      {text}
    </div>
  );
}

function MemoryDiagram({ vec, blockSize, currentBlock, hideUnvisited }) {
  const blocks = [];
  for (let i = 0; i < vec.length; i += blockSize) blocks.push(vec.slice(i, i + blockSize));
  return (
    <div style={{ background: "#0d0d1a", border: "1px solid #222", borderRadius: 10, padding: "14px 18px", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff4444" }} />
        <span style={{ fontFamily: FONT, fontSize: 10, color: "#ff4444", letterSpacing: 1.5 }}>HBM (SLOW)</span>
        <span style={{ fontFamily: FONT, fontSize: 9, color: "#444", marginLeft: 4 }}>full vector lives here</span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {blocks.map((b, bi) => {
          const active = bi === currentBlock;
          const past = bi < currentBlock;
          const hidden = hideUnvisited && !active && !past;
          return (
            <div key={bi} style={{ position: "relative" }}>
              {active && <div style={{ position: "absolute", top: -15, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "#00ffc8", fontFamily: FONT, whiteSpace: "nowrap" }}>▼ loading</div>}
              <div style={{ display: "flex", gap: 3, opacity: hidden ? 0.2 : past ? 0.45 : 1, transition: "opacity 0.3s" }}>
                {b.map((v, vi) => (
                  <div key={vi} style={{ background: active ? "#00ffc808" : "#111", border: `1.5px solid ${active ? "#00ffc8" : "#282828"}`, borderRadius: 5, padding: "5px 9px", fontFamily: FONT, fontSize: 14, fontWeight: 700, color: active ? "#00ffc8" : hidden ? "#333" : "#777", minWidth: 30, textAlign: "center" }}>
                    {hidden ? "?" : v}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SramBox({ values }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #0a1628, #0d1f3c)", border: "1.5px solid #00ffc8", borderRadius: 10, padding: "14px 18px", marginBottom: 14, boxShadow: "0 0 20px #00ffc808" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ffc8", boxShadow: "0 0 6px #00ffc8" }} />
        <span style={{ fontFamily: FONT, fontSize: 10, color: "#00ffc8", letterSpacing: 1.5 }}>SRAM (FAST)</span>
        <span style={{ fontFamily: FONT, fontSize: 9, color: "#446", marginLeft: 4 }}>this is all you can see</span>
      </div>
      {values ? (
        <div style={{ display: "flex", gap: 6 }}>
          {values.map((v, i) => (
            <div key={i} style={{ background: "#00ffc810", border: "1.5px solid #00ffc860", borderRadius: 6, padding: "10px 16px", fontFamily: FONT, fontSize: 20, fontWeight: 700, color: "#00ffc8", minWidth: 44, textAlign: "center" }}>{v}</div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: FONT, fontSize: 13, color: "#335", textAlign: "center", padding: 10 }}>[ empty ]</div>
      )}
    </div>
  );
}

function OutputBuffer({ outputs, trueOutputs, finished, glowIndices }) {
  return (
    <div style={{ background: "#111", border: "1px solid #222", borderRadius: 10, padding: "12px 16px", marginBottom: 14 }}>
      <div style={{ fontFamily: FONT, fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 8 }}>OUTPUT BUFFER (HBM)</div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {outputs.map((o, i) => (
          <FracCell key={i} frac={o} glow={glowIndices && glowIndices.includes(i)} finished={finished} correct={finished && trueOutputs && fracEq(o, trueOutputs[i])} />
        ))}
      </div>
    </div>
  );
}

// ─── Phase: Intro ─────────────────────────────────────────────

function IntroPhase({ onNext }) {
  const ex = [3, 7, 2, 8, 1, 5, 9, 4];
  return (
    <div>
      <h2 style={{ fontFamily: FONT, color: "#00ffc8", fontSize: 15, letterSpacing: 2, marginBottom: 14, fontWeight: 400 }}>THE PROBLEM</h2>
      <p style={{ fontFamily: FONT, color: "#ccc", fontSize: 14, lineHeight: 1.8, marginBottom: 14 }}>
        Compute <span style={{ color: "#ffcc00" }}>norm(x)ᵢ = xᵢ / max(x)</span> for a vector x.
      </p>
      <p style={{ fontFamily: FONT, color: "#999", fontSize: 13, lineHeight: 1.8, marginBottom: 14 }}>
        Normally trivial. But what if you're a GPU that can only load <span style={{ color: "#00ffc8" }}>2 numbers at a time</span> into fast SRAM?
        The full vector lives in slow HBM. You process block-by-block, writing results back after each block.
      </p>
      <p style={{ fontFamily: FONT, color: "#999", fontSize: 13, lineHeight: 1.8, marginBottom: 22 }}>
        The catch: you don't know the global max until you've seen every block.
        If a later block has a bigger value, your earlier outputs are <em>wrong</em>. Can you fix them on the fly?
      </p>

      <div style={{ background: "#111", borderRadius: 10, padding: "16px 20px", marginBottom: 22, border: "1px solid #222" }}>
        <div style={{ fontFamily: FONT, fontSize: 11, color: "#555", marginBottom: 10, letterSpacing: 1 }}>EASY VERSION — FULL VISIBILITY</div>
        <div style={{ fontFamily: FONT, fontSize: 14, color: "#ccc", marginBottom: 10 }}>
          x = [{ex.join(", ")}], max = <span style={{ color: "#ffcc00" }}>9</span>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {ex.map((v, i) => <FracCell key={i} frac={simplify(v, 9)} />)}
        </div>
      </div>
      <p style={{ fontFamily: FONT, color: "#ffcc00", fontSize: 13, lineHeight: 1.8, marginBottom: 22 }}>
        Now try it the hard way — block by block, never seeing the whole vector.
      </p>
      <Btn onClick={onNext}>START THE PUZZLE →</Btn>
    </div>
  );
}

// ─── Interactive Phase (used by both Guided & Challenge) ──────

function InteractivePhase({ guided, onNext }) {
  const [vec, setVec] = useState(() => guided ? [4, 7, 2, 9, 5, 3, 8, 1] : generateVector(8));
  const BS = 2;
  const NB = vec.length / BS;
  const trueOut = trueNorm(vec);

  const [blockIdx, setBlockIdx] = useState(0);
  const [runMax, setRunMax] = useState(0);
  const [outputs, setOutputs] = useState(Array(vec.length).fill(null));
  const [sub, setSub] = useState("max"); // max | rescale | done
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");
  const [mistakes, setMistakes] = useState(0);
  const [glowIndices, setGlowIndices] = useState(null);

  const finished = blockIdx >= NB;
  const bStart = blockIdx * BS;
  const bVals = finished ? [] : vec.slice(bStart, bStart + BS);
  const localMax = finished ? 0 : Math.max(...bVals);

  const reset = () => {
    const v = generateVector(8);
    setVec(v);
    setBlockIdx(0);
    setRunMax(0);
    setOutputs(Array(8).fill(null));
    setSub("max");
    setInput("");
    setMsg(null);
    setMistakes(0);
    setGlowIndices(null);
  };

  const showMsg = (text, type) => { setMsg(text); setMsgType(type); };

  const handleMaxSubmit = () => {
    const parsed = parseInt(input);
    if (isNaN(parsed)) return;
    const expected = Math.max(runMax, localMax);
    if (parsed === expected) {
      const oldMax = runMax;
      setRunMax(expected);
      setInput("");

      if (oldMax > 0 && expected > oldMax) {
        // Max changed — ask for rescale factor
        setSub("rescale");
        if (guided) {
          showMsg(
            `New max ${expected} > old max ${oldMax}. Your previous outputs used /${oldMax} as the denominator, but the true denominator is /${expected}. What single fraction do you multiply every old output by to fix them?`,
            "warn"
          );
        } else {
          showMsg(`Max: ${oldMax} → ${expected}. Rescale factor for old outputs?`, "warn");
        }
      } else {
        // No rescale — auto-fill this block's outputs
        const newOut = [...outputs];
        for (let i = 0; i < BS; i++) newOut[bStart + i] = simplify(bVals[i], expected);
        setOutputs(newOut);
        setSub("done");
        if (guided) {
          showMsg(`${runMax === 0 ? "Max starts at" : "Max stays at"} ${expected}. This block → ${bVals.map((v) => `${v}/${expected}`).join(", ")}. Written to output buffer.`, "ok");
        } else {
          showMsg(null, "ok");
        }
      }
    } else {
      setMistakes((m) => m + 1);
      if (guided) {
        showMsg(`Not quite. You see [${bVals.join(", ")}] and running max is ${runMax || "nothing yet"}. New max = max(${runMax || "−∞"}, ${localMax}).`, "err");
      } else {
        showMsg("Wrong. max(running_max, block_max).", "err");
      }
    }
  };

  const handleRescaleSubmit = () => {
    const parsed = parseFrac(input);
    if (!parsed) return;
    const oldMax = Math.max(...vec.slice(0, bStart));
    const newMax = Math.max(oldMax, localMax);
    const expected = simplify(oldMax, newMax);

    if (fracEq(parsed, expected)) {
      // Apply rescale + write current block
      const newOut = [...outputs];
      for (let i = 0; i < bStart; i++) {
        if (newOut[i]) newOut[i] = simplify(newOut[i].n * oldMax, newOut[i].d * newMax);
      }
      for (let i = 0; i < BS; i++) newOut[bStart + i] = simplify(bVals[i], newMax);

      const indices = Array.from({ length: bStart }, (_, i) => i);
      setGlowIndices(indices);
      setOutputs(newOut);
      setSub("done");
      setInput("");
      if (guided) {
        showMsg(`Correct! Every old output × ${oldMax}/${newMax}. This block → ${bVals.map((v) => `${v}/${newMax}`).join(", ")}. All outputs updated.`, "ok");
      } else {
        showMsg(null, "ok");
      }
      setTimeout(() => setGlowIndices(null), 2500);
    } else {
      setMistakes((m) => m + 1);
      if (guided || mistakes >= 1) {
        showMsg(`Old outputs have /${oldMax} in the denominator. Correct denominator is /${newMax}. So multiply by ${oldMax}/${newMax}.`, "err");
      } else {
        showMsg("Not right. How do you convert xᵢ/old_max into xᵢ/new_max?", "err");
      }
    }
  };

  const advance = () => {
    setBlockIdx(blockIdx + 1);
    setSub("max");
    setMsg(null);
    setInput("");
    setGlowIndices(null);
  };

  const allCorrect = finished && outputs.every((o, i) => o && fracEq(o, trueOut[i]));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ fontFamily: FONT, color: guided ? "#00ffc8" : "#ff8800", fontSize: 15, letterSpacing: 2, fontWeight: 400 }}>
          {guided ? "GUIDED ROUND" : "CHALLENGE"}
        </h2>
        {!guided && <span style={{ fontFamily: FONT, fontSize: 11, color: mistakes > 0 ? "#ff4444" : "#333" }}>{mistakes} mistake{mistakes !== 1 ? "s" : ""}</span>}
      </div>
      <p style={{ fontFamily: FONT, fontSize: 12, color: "#777", marginBottom: 14 }}>
        {guided
          ? "Process each block. When the max changes, figure out the correction factor. Outputs are written for you."
          : "Random vector. Fewer hints. Just the running max and the rescale factor."}
      </p>

      <MemoryDiagram vec={vec} blockSize={BS} currentBlock={finished ? -1 : blockIdx} hideUnvisited />
      <SramBox values={finished ? null : bVals} />

      <div style={{ display: "flex", gap: 24, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: FONT, fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 3 }}>RUNNING MAX</div>
          <div style={{ fontFamily: FONT, fontSize: 24, color: "#ffcc00", fontWeight: 700 }}>{runMax || "—"}</div>
        </div>
        <div>
          <div style={{ fontFamily: FONT, fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 3 }}>BLOCK</div>
          <div style={{ fontFamily: FONT, fontSize: 24, color: "#aaa", fontWeight: 700 }}>{finished ? "✓" : `${blockIdx + 1}/${NB}`}</div>
        </div>
      </div>

      <OutputBuffer outputs={outputs} trueOutputs={trueOut} finished={finished} glowIndices={glowIndices} />

      {glowIndices && (
        <div style={{ padding: "8px 14px", background: "#ff880012", border: "1px solid #ff880035", borderRadius: 8, fontFamily: FONT, fontSize: 12, color: "#ff8800", marginBottom: 10, textAlign: "center" }}>
          ↻ Previous outputs rescaled × <FracDisplay n={Math.max(...vec.slice(0, bStart))} d={runMax} color="#ff8800" size={13} />
        </div>
      )}

      {/* ── Max input ── */}
      {!finished && sub === "max" && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#ccc", marginBottom: 8 }}>
            Loaded [{bVals.join(", ")}]. What's the <span style={{ color: "#ffcc00" }}>running max</span> now?
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="max"
              style={{ width: 80, padding: "8px 12px", background: "#111", border: "1.5px solid #ffcc00", borderRadius: 6, color: "#ffcc00", fontFamily: FONT, fontSize: 17, textAlign: "center", outline: "none" }}
              onKeyDown={(e) => e.key === "Enter" && handleMaxSubmit()} />
            <Btn onClick={handleMaxSubmit} small>CHECK</Btn>
          </div>
        </div>
      )}

      {/* ── Rescale factor input ── */}
      {!finished && sub === "rescale" && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontFamily: FONT, fontSize: 13, color: "#ff8800", marginBottom: 8 }}>
            ⚠ Max changed! What fraction do you multiply <em>every old output</em> by to correct them?
          </p>
          <p style={{ fontFamily: FONT, fontSize: 11, color: "#666", marginBottom: 8 }}>
            Type a fraction like "7/9"
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="a/b"
              style={{ width: 100, padding: "8px 12px", background: "#111", border: "1.5px solid #ff8800", borderRadius: 6, color: "#ff8800", fontFamily: FONT, fontSize: 17, textAlign: "center", outline: "none" }}
              onKeyDown={(e) => e.key === "Enter" && handleRescaleSubmit()} />
            <Btn onClick={handleRescaleSubmit} small color="#ff8800">CHECK</Btn>
          </div>
        </div>
      )}

      {/* ── Advance ── */}
      {!finished && sub === "done" && (
        <div style={{ marginTop: 8 }}>
          <Btn onClick={advance}>{blockIdx < NB - 1 ? "LOAD NEXT BLOCK →" : "FINISH →"}</Btn>
        </div>
      )}

      <Msg text={msg} type={msgType} />

      {/* ── Finished ── */}
      {finished && (
        <div style={{ marginTop: 16 }}>
          {allCorrect ? (
            <div style={{ background: "#00ffc810", border: "1.5px solid #00ffc840", borderRadius: 10, padding: "16px 20px", marginBottom: 14, fontFamily: FONT, fontSize: 14, color: "#00ffc8", lineHeight: 1.8 }}>
              ✓ Exact normalized values — computed block-by-block without ever seeing the full vector.
              {!guided && mistakes === 0 ? " Zero mistakes!" : ""}
            </div>
          ) : (
            <div style={{ background: "#ff444410", border: "1px solid #ff444440", borderRadius: 10, padding: "16px 20px", marginBottom: 14 }}>
              <div style={{ fontFamily: FONT, fontSize: 13, color: "#ff6666", marginBottom: 8 }}>Some values off. True answer:</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {trueOut.map((o, i) => <FracCell key={i} frac={o} finished correct />)}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            {!guided && <Btn onClick={reset} secondary>NEW VECTOR</Btn>}
            <Btn onClick={onNext}>{guided ? "CHALLENGE MODE →" : "SEE THE ALGORITHM →"}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Phase: Sandbox ───────────────────────────────────────────

function SandboxPhase() {
  const [vecSize, setVecSize] = useState(8);
  const [blockSize, setBlockSize] = useState(2);
  const [vec, setVec] = useState(() => generateVector(8));
  const [step, setStep] = useState(0);
  const [runMax, setRunMax] = useState(0);
  const [outputs, setOutputs] = useState(Array(8).fill(null));
  const [log, setLog] = useState([]);
  const [glowIndices, setGlowIndices] = useState(null);

  const NB = Math.ceil(vec.length / blockSize);
  const finished = step >= NB;
  const bStart = step * blockSize;
  const bVals = finished ? [] : vec.slice(bStart, bStart + blockSize);
  const trueOut = trueNorm(vec);

  const reset = (ns, nb) => {
    const s = ns || vecSize;
    const b = nb || blockSize;
    const v = generateVector(s);
    setVec(v);
    setStep(0);
    setRunMax(0);
    setOutputs(Array(s).fill(null));
    setLog([]);
    setGlowIndices(null);
    setVecSize(s);
    setBlockSize(b);
  };

  const doStep = () => {
    if (finished) return;
    const localMax = Math.max(...bVals);
    const oldMax = runMax;
    const newMax = Math.max(runMax, localMax);
    const newOut = [...outputs];
    const entry = { block: step, values: [...bVals], oldMax, newMax, rescaled: false, factor: null };

    if (newMax > oldMax && oldMax > 0) {
      for (let i = 0; i < bStart; i++) {
        if (newOut[i]) newOut[i] = simplify(newOut[i].n * oldMax, newOut[i].d * newMax);
      }
      entry.rescaled = true;
      entry.factor = simplify(oldMax, newMax);
      setGlowIndices(Array.from({ length: bStart }, (_, i) => i));
      setTimeout(() => setGlowIndices(null), 2000);
    } else {
      setGlowIndices(null);
    }

    for (let i = 0; i < bVals.length; i++) newOut[bStart + i] = simplify(bVals[i], newMax);

    setRunMax(newMax);
    setOutputs(newOut);
    setLog((prev) => [...prev, entry]);
    setStep(step + 1);
  };

  return (
    <div>
      <h2 style={{ fontFamily: FONT, color: "#aa88ff", fontSize: 15, letterSpacing: 2, marginBottom: 4, fontWeight: 400 }}>THE ALGORITHM & SANDBOX</h2>

      <div style={{ background: "#0d0d1a", border: "1px solid #aa88ff30", borderRadius: 10, padding: "18px 22px", marginBottom: 18, fontFamily: FONT, fontSize: 13, color: "#ccc", lineHeight: 1.9 }}>
        <div style={{ color: "#aa88ff", fontSize: 12, letterSpacing: 1.5, marginBottom: 10 }}>TILED NORMALIZATION</div>
        <div style={{ paddingLeft: 14, borderLeft: "2px solid #333", marginBottom: 14 }}>
          <div>For each block loaded into SRAM:</div>
          <div style={{ marginTop: 6 }}>1. <span style={{ color: "#ffcc00" }}>m_new = max(m_running, max(block))</span></div>
          <div>2. If m_new {">"} m_running → <span style={{ color: "#ff8800" }}>rescale all old outputs × (m_old / m_new)</span></div>
          <div>3. Write <span style={{ color: "#00ffc8" }}>xᵢ / m_new</span> for this block</div>
          <div>4. m_running ← m_new</div>
        </div>
        <div style={{ color: "#aa88ff", fontSize: 12, lineHeight: 1.8, borderTop: "1px solid #222", paddingTop: 12 }}>
          <strong>Connection to FlashAttention:</strong> The real tiled softmax is the same structure, but with exp(xᵢ − m) instead of xᵢ, and it also tracks a running sum ℓ alongside the running max m. When the max changes, both the exponential terms <em>and</em> the accumulated sum get rescaled by e^(m_old − m_new). Same principle, harder arithmetic.
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <label style={{ fontFamily: FONT, fontSize: 9, color: "#555", letterSpacing: 1 }}>VEC SIZE</label>
          <select value={vecSize} onChange={(e) => reset(parseInt(e.target.value), blockSize)}
            style={{ display: "block", marginTop: 3, padding: "5px 8px", background: "#111", border: "1px solid #333", borderRadius: 5, color: "#ccc", fontFamily: FONT, fontSize: 12 }}>
            {[6, 8, 10, 12].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: FONT, fontSize: 9, color: "#555", letterSpacing: 1 }}>BLOCK SIZE</label>
          <select value={blockSize} onChange={(e) => reset(vecSize, parseInt(e.target.value))}
            style={{ display: "block", marginTop: 3, padding: "5px 8px", background: "#111", border: "1px solid #333", borderRadius: 5, color: "#ccc", fontFamily: FONT, fontSize: 12 }}>
            {[2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 12 }}><Btn onClick={() => reset()} secondary small>NEW VECTOR</Btn></div>
      </div>

      <MemoryDiagram vec={vec} blockSize={blockSize} currentBlock={finished ? -1 : step} hideUnvisited />
      <SramBox values={finished ? null : bVals} />

      <div style={{ display: "flex", gap: 24, marginBottom: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: FONT, fontSize: 10, color: "#555", letterSpacing: 1, marginBottom: 3 }}>RUNNING MAX</div>
          <div style={{ fontFamily: FONT, fontSize: 24, color: "#ffcc00", fontWeight: 700 }}>{runMax || "—"}</div>
        </div>
        <Btn onClick={doStep} disabled={finished} small>{finished ? "DONE" : `STEP (BLOCK ${step + 1})`}</Btn>
        {finished && <Btn onClick={() => reset()} secondary small>RESET</Btn>}
      </div>

      <OutputBuffer outputs={outputs} trueOutputs={trueOut} finished={finished} glowIndices={glowIndices} />

      {glowIndices && (
        <div style={{ padding: "8px 14px", background: "#ff880012", border: "1px solid #ff880035", borderRadius: 8, fontFamily: FONT, fontSize: 12, color: "#ff8800", marginBottom: 10, textAlign: "center" }}>
          ↻ Old outputs × <FracDisplay n={log[log.length - 1]?.factor?.n || 0} d={log[log.length - 1]?.factor?.d || 1} color="#ff8800" size={13} />
        </div>
      )}

      {finished && (
        <div style={{ marginTop: 6, marginBottom: 14 }}>
          <div style={{ fontFamily: FONT, fontSize: 10, color: "#00ffc8", letterSpacing: 1, marginBottom: 6 }}>TRUE ANSWER</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {trueOut.map((o, i) => <FracCell key={i} frac={o} finished correct size="small" />)}
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div style={{ background: "#0a0a12", border: "1px solid #1a1a2e", borderRadius: 8, padding: "12px 16px", maxHeight: 200, overflowY: "auto" }}>
          <div style={{ fontFamily: FONT, fontSize: 10, color: "#444", letterSpacing: 1, marginBottom: 8 }}>EXECUTION LOG</div>
          {log.map((e, i) => (
            <div key={i} style={{ fontFamily: FONT, fontSize: 11, color: "#888", marginBottom: 5, lineHeight: 1.7, paddingLeft: 8, borderLeft: `2px solid ${e.rescaled ? "#ff8800" : "#222"}` }}>
              <span style={{ color: "#555" }}>block {e.block + 1}:</span>{" "}
              [{e.values.join(", ")}] → local_max={Math.max(...e.values)}, m={e.newMax}
              {e.rescaled && (
                <span style={{ color: "#ff8800" }}>
                  {" "}⚠ RESCALE × <FracDisplay n={e.factor.n} d={e.factor.d} color="#ff8800" size={10} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase] = useState(PHASE.INTRO);
  return (
    <div style={{ minHeight: "100vh", background: "#09090f", padding: "24px 20px", fontFamily: FONT }}>
      <div style={{ maxWidth: 660, margin: "0 auto" }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontFamily: FONT, fontSize: 19, color: "#fff", fontWeight: 700, letterSpacing: 3, marginBottom: 3 }}>TILED NORMALIZATION</h1>
          <p style={{ fontFamily: FONT, fontSize: 10, color: "#444", letterSpacing: 1.5 }}>DISCOVER THE CORE TRICK BEHIND FLASH ATTENTION</p>
        </div>
        <div style={{ display: "flex", gap: 2, marginBottom: 22 }}>
          {[
            { key: PHASE.INTRO, label: "INTRO" },
            { key: PHASE.GUIDED, label: "GUIDED" },
            { key: PHASE.CHALLENGE, label: "CHALLENGE" },
            { key: PHASE.SANDBOX, label: "SANDBOX" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setPhase(key)}
              style={{ flex: 1, padding: "8px 0", background: phase === key ? "#1a1a2e" : "transparent", border: "none", borderBottom: `2px solid ${phase === key ? "#00ffc8" : "#1a1a2e"}`, color: phase === key ? "#00ffc8" : "#444", fontFamily: FONT, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>
        {phase === PHASE.INTRO && <IntroPhase onNext={() => setPhase(PHASE.GUIDED)} />}
        {phase === PHASE.GUIDED && <InteractivePhase key="guided" guided onNext={() => setPhase(PHASE.CHALLENGE)} />}
        {phase === PHASE.CHALLENGE && <InteractivePhase key="challenge" guided={false} onNext={() => setPhase(PHASE.SANDBOX)} />}
        {phase === PHASE.SANDBOX && <SandboxPhase />}
      </div>
    </div>
  );
}
