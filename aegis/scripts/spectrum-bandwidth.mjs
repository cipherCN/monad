// Aegis 谱系带宽实验（S2）—— 行使 m<κ：B1 带宽–松弛律与匹配下界的数值验证
//
// 论文对应：§4.4.1（覆盖网验证器上界）、§4.4.2（无结构匹配下界）、§4.4.3（B1 律：
//   结构化 Lipschitz 目标 s*(m)=Θ(L·r_m) + 填充/bump 下界）。
//
// 本脚本做什么（零 gas、纯离线、固定构造、零第三方依赖）：
//   1) 在 d 维归一化网格菜单 μ（κ=|μ|）上，用增量贪心 k-center 构造近最优 m-点网 N；
//   2) 对每个 m，构造 §4.4.3 的对抗世界对：
//        基线 u0(z) = -(L/2)·d(z,a)   （argmax=a，a∈N，必须被接受）
//        未查询点 p* = 离网最远的菜单点，bump 支撑半径 r_m、峰高 L·r_m/2
//        u_atk = max(u0, bump)
//      实际验算：u_atk|_N == u0|_N（网外点不可见）；覆盖网验证器（阈值 2L·r_m）接受 a；
//      接受时 a 的真实次优 gap = L·r_m/2（= 对抗可达下界）。
//   3) 双对数回归验证 s_lower 斜率 ≈ -1/d（B1 律）。
//   4) 无结构对照：去掉 Lipschitz 约束 → s*=1（m<κ），m=κ 时 0（阶跃，§4.4.2）。
//
// 诚实边界（写进论文 §8）：这是合成数值验证（B 级证据），与 §8.6 bond-check 同级；
//   验证的是不等式/率与假设作用，不是链上二维执行（当前真实路径仅 dμ=1 的 WMON wrap）。
//
// 运行：
//   node scripts/spectrum-bandwidth.mjs
//   node scripts/spectrum-bandwidth.mjs --out figs/spectrum-rate.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const argVal = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const OUT = argVal("--out", path.join(__dirname, "spectrum-rate.json"));

const L = 0.4;   // 目标类 𝒰_L 的 Lipschitz 常数（基线 u0 用 L/2，bump 用 L/2，max 仍 ≤ L）
const D = 1.0;   // 归一化域直径

// ---------- 几何 ----------
function dist(a, b) { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return Math.sqrt(s); }

function buildGrid(d, g) {
  const pts = [];
  const rec = (i, c) => {
    if (i === d) { pts.push(c.slice()); return; }
    for (let k = 0; k < g; k++) { c.push(k / (g - 1)); rec(i + 1, c); c.pop(); }
  };
  rec(0, []);
  return pts;
}

function nearestIdx(menu, x) {
  let bi = 0, bd = Infinity;
  for (let i = 0; i < menu.length; i++) { const dd = dist(menu[i], x); if (dd < bd) { bd = dd; bi = i; } }
  return bi;
}

/// 增量贪心 k-center：从 start 开始，逐步加入离当前网最远的点。
/// 返回 { order, rs, stars }：rs[m-1] = 前 m 个点的覆盖半径；stars[m-1] = 该步最远点下标。
function kCenterCovering(menu, maxM, startIdx) {
  const n = menu.length;
  const minD = new Array(n).fill(Infinity);
  const order = [startIdx];
  for (let i = 0; i < n; i++) minD[i] = dist(menu[i], menu[startIdx]);
  let pstar = 0, rmax = 0;
  for (let i = 0; i < n; i++) if (minD[i] > rmax) { rmax = minD[i]; pstar = i; }
  const rs = [rmax], stars = [pstar];
  while (order.length < maxM && order.length < n) {
    let bi = 0, bd = -1;
    for (let i = 0; i < n; i++) if (minD[i] > bd) { bd = minD[i]; bi = i; }
    order.push(bi);
    for (let i = 0; i < n; i++) { const dd = dist(menu[i], menu[bi]); if (dd < minD[i]) minD[i] = dd; }
    let r = 0, ps = 0;
    for (let i = 0; i < n; i++) if (minD[i] > r) { r = minD[i]; ps = i; }
    rs.push(r); stars.push(ps);
  }
  return { order, rs, stars };
}

function fitLogLog(xs, ys) {
  const n = xs.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) { const lx = Math.log(xs[i]), ly = Math.log(ys[i]); sx += lx; sy += ly; sxx += lx * lx; sxy += lx * ly; }
  const p = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const c = Math.exp((sy - p * sx) / n);
  return { slope: p, coef: c, n };
}

/// 对给定 m 实际重建网 N，数值验算：u_atk|_N == u0|_N，验证器接受 a，且真实 gap = L·r/2。
function verifyAdversary(menu, order, rs, stars, m, aIdx) {
  const N = new Set(order.slice(0, m));
  const r = rs[m - 1];
  const pIdx = stars[m - 1];
  const p = menu[pIdx];
  const a = menu[aIdx];
  const u0 = (z) => -(L / 2) * dist(z, a);
  const bump = (z) => Math.max(0, (L * r) / 2 - (L / 2) * dist(z, p));
  const uAtk = (z) => Math.max(u0(z), bump(z));

  let maxNdiff = 0;
  for (const qi of N) maxNdiff = Math.max(maxNdiff, Math.abs(uAtk(menu[qi]) - u0(menu[qi])));

  // 验证器：接受 a iff u_atk(a) >= max_{q∈N} u_atk(q) - 2L·r
  let maxN = -Infinity;
  for (const qi of N) maxN = Math.max(maxN, uAtk(menu[qi]));
  const accept = uAtk(a) >= maxN - 2 * L * r - 1e-12;

  // 真实最坏 gap（在整张菜单上取 max）
  let maxAll = -Infinity;
  for (let i = 0; i < menu.length; i++) maxAll = Math.max(maxAll, uAtk(menu[i]));
  const gap = accept ? maxAll - uAtk(a) : 0;

  return { accept, gap, netInvisible: maxNdiff < 1e-12, formula: (L * r) / 2 };
}

// ---------- 单个 d ----------
function runDimension(d, g) {
  const menu = buildGrid(d, g);
  const kappa = menu.length;
  const aIdx = nearestIdx(menu, new Array(d).fill(0.5));
  const maxM = Math.min(kappa, 1200);
  const { order, rs, stars } = kCenterCovering(menu, maxM, aIdx);

  const points = [];
  for (let m = 1; m <= maxM; m++) {
    const r = rs[m - 1];
    const sLower = (L * r) / 2;      // 对抗可达下界（实测构造）
    const sUpper = 3 * L * r;        // §4.4.1 健全性上界
    points.push({ m, r, sLower, sUpper });
  }

  // 抽样点数值验算（证明"接受 + gap = L r/2"不是纸面断言）
  const checkMs = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512].filter((m) => m <= maxM);
  const checks = checkMs.map((m) => {
    const v = verifyAdversary(menu, order, rs, stars, m, aIdx);
    return { m, ...v, gapMatches: Math.abs(v.gap - v.formula) < 1e-9 };
  });

  const fitPts = points.filter((p) => p.m >= 4 && p.m <= Math.floor(maxM / 2) && p.sLower > 0);
  const fit = fitLogLog(fitPts.map((p) => p.m), fitPts.map((p) => p.sLower));

  return {
    d, g, kappa, maxM,
    theorySlope: -1 / d,
    fittedSlope: fit.slope,
    fittedCoef: fit.coef,
    L,
    checks,
    points: points.map((p) => ({
      m: p.m, r: +p.r.toFixed(6),
      sLower: +p.sLower.toFixed(6), sUpper: +p.sUpper.toFixed(6),
    })),
  };
}

// ---------- 无结构对照（§4.4.2） ----------
function unstructuredControl(d, g) {
  const kappa = Math.pow(g, d);
  const samples = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512].filter((m) => m <= kappa);
  if (samples[samples.length - 1] !== kappa) samples.push(kappa);
  return {
    kappa,
    points: samples.map((m) => ({
      m, sStar: m < kappa ? 1.0 : 0.0,
      note: m < kappa ? "未查询点自由实例化 → 判定无信息" : "全揭示 → 精确",
    })),
  };
}

// ---------- 系统接地（Q4） ----------
function systemGrounding() {
  return {
    policy: { perTxLimitMon: 0.05, maxSlippageBps: 100 },
    deployed: {
      dMu: 1,
      verifier: "解析 argmax + 点 ε-检查（m=1 即精确）",
      spectrumPosition: "m=κ 精确端（s*=0）",
      evidence: "SOA-lite / §8.2 soa-demo 8/8",
    },
    hypothetical: {
      dMu: 2,
      domain: "amount∈[0,0.05]MON × slippage∈[0,100]bps（归一化）",
      rate: "s*(m)=Θ(L D m^{-1/2})",
      status: "假设部署；链上二维执行 = future work（当前真实路径仅 WMON wrap）",
    },
  };
}

// ---------- 主流程 ----------
console.log("=== Aegis S2 谱系带宽实验（m<κ）===");
console.log(`L=${L}, D=${D}；网 = 增量贪心 k-center（2-近似）；对抗 = §4.4.3 bump\n`);

const dims = [{ d: 1, g: 512 }, { d: 2, g: 32 }, { d: 3, g: 10 }];
const results = [];
for (const { d, g } of dims) {
  const r = runDimension(d, g);
  const allAccept = r.checks.every((c) => c.accept && c.gapMatches && c.netInvisible);
  console.log(`d=${d}  κ=${r.kappa}  实测斜率=${r.fittedSlope.toFixed(4)}  理论=-1/d=${r.theorySlope.toFixed(4)}  对抗验算(接受/不可见/gap) = ${allAccept ? "全部通过" : "有失败"}`);
  const agg = {};
  for (const c of r.checks) agg[c.m] = c;
  for (const m of [1, 2, 4, 16, 64, 256].filter((m) => m <= r.maxM)) {
    const p = r.points.find((x) => x.m === m);
    if (p) console.log(`    m=${String(m).padStart(4)}  r_m=${p.r.toFixed(4)}  s_lower=${p.sLower.toFixed(4)}  s_upper=${p.sUpper.toFixed(4)}` + (agg[m] ? `   [验算 gap=${agg[m].gap.toFixed(4)} accept=${agg[m].accept}]` : ""));
  }
  console.log("");
  results.push(r);
}

const un = unstructuredControl(1, 512);
console.log("无结构对照（§4.4.2）：", un.points.map((p) => `m=${p.m}:s*=${p.sStar}`).join("  "));
const grounding = systemGrounding();
console.log("\n系统接地：部署 dμ=1 = 精确端（s*=0）；假设 dμ=2 = 中间档 s*~m^{-1/2}");

const payload = {
  meta: {
    experiment: "S2 spectrum-bandwidth (m<kappa)",
    date: new Date().toISOString(),
    L, D,
    net: "incremental greedy k-center (2-approx)",
    adversary: "worst-case bump at farthest unqueried menu point (S4.4.3)",
    evidenceTier: "B (synthetic, offline, reproducible)",
    command: "node scripts/spectrum-bandwidth.mjs",
  },
  dimensions: results,
  unstructured: un,
  grounding,
};
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log(`\n→ 写入 ${OUT}`);
