// Motor do 004 (Como nasce a chuva). Fica no episódio para não mexer no motor do estilo; usa o nucleo/2d/base.js.
// mar, vapor, nuvem e chuva são o mesmo mundo mudando com o tempo; peso é o close dentro da nuvem.

const COR = {
  ceuQ: ["#fbe7b8", "#a9d6e0"], ceuF: ["#cfe6ef", "#6fa3c4"], ceuC: ["#a7b4c0", "#5c7187"],
  mar: ["#4fb3b0", "#1f6f8b"], creme: "#f6e9c9", sol: "#f7b84a", solB: "#fde7a1",
  tinta: "#29465a", gota: ["#e3f4fb", "#7cc3e3", "#3a86b4"],
};
let CAMADA, CEUQ, CEUF, CEUC, MAR, DENTRO, T = {}, VAPOR, PONTOS, PUFOS, GOTAS, CHUVA;
const HZ = () => H * 0.62; // linha do mar
const NUV = () => [W * 0.4, H * 0.26]; // centro da nuvem

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function mist(a, b, k) {
  const x = hex(a), y = hex(b);
  return "#" + x.map((v, i) => Math.round(lerp(v, y[i], k)).toString(16).padStart(2, "0")).join("");
}

// ---------- fundos pintados uma vez ----------
function fazerCeu(cores, manchas, seed) {
  const c0 = tela(W, H), c = c0.getContext("2d"), r = rng(seed);
  const g = c.createLinearGradient(0, 0, 0, HZ());
  g.addColorStop(0, cores[1]); g.addColorStop(1, cores[0]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  aquarela(c, W, HZ(), manchas, 22, 0.14, r);
  c.globalAlpha = 0.06;
  hachura(c, 0, 0, W, HZ() * 0.5, 11, -0.5, "#ffffff", 1, r);
  c.globalAlpha = 1;
  return c0;
}
function fazerMar() {
  const c0 = tela(W, H), c = c0.getContext("2d"), r = rng(31), y0 = HZ();
  const g = c.createLinearGradient(0, y0, 0, H);
  g.addColorStop(0, COR.mar[0]); g.addColorStop(1, COR.mar[1]);
  c.fillStyle = g; c.fillRect(0, y0, W, H - y0);
  c.save(); c.beginPath(); c.rect(0, y0, W, H - y0); c.clip();
  c.translate(0, y0); aquarela(c, W, H - y0, ["#6fc9c0", "#2c8aa0", "#3fa6a6", "#185f7a"], 30, 0.22, r);
  c.globalAlpha = 0.12; hachura(c, 0, 0, W, H - y0, 7, 0.04, "#0d3d52", 1, r);
  c.restore();
  return c0;
}
function fazerDentro() { // o miolo da nuvem: papel cinza-azulado com bolos de algodão
  const c0 = tela(W, H), c = c0.getContext("2d"), r = rng(41);
  const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
  g.addColorStop(0, "#e9eef2"); g.addColorStop(1, "#9fb1c2");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  aquarela(c, W, H, ["#ffffff", "#d7e0e8", "#b9c7d4", "#f3f5f7"], 40, 0.3, r);
  for (let i = 0; i < 6000; i++) {
    c.fillStyle = r() < 0.6 ? "rgba(255,255,255,0.12)" : "rgba(40,60,80,0.06)";
    c.fillRect(r() * W, r() * H, 1.5, 1.5);
  }
  return c0;
}

// ---------- peças do mundo ----------
function sol(t, brilho, raio) {
  const [x, y] = [W * 0.8, H * 0.19], R = H * 0.085;
  ctx.save();
  ctx.globalAlpha = brilho;
  const g = ctx.createRadialGradient(x, y, R * 0.5, x, y, R * 3.2);
  g.addColorStop(0, "rgba(253,231,161,0.7)"); g.addColorStop(1, "rgba(253,231,161,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 3.2, 0, Math.PI * 2); ctx.fill();
  const circ = [...Array(24)].map((_, i) => [x + Math.cos(i * 0.2618) * R, y + Math.sin(i * 0.2618) * R]);
  const gs = ctx.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R);
  gs.addColorStop(0, COR.solB); gs.addColorStop(1, COR.sol);
  ctx.fillStyle = gs; caminho(ctx, tremido(circ, 1.5, rng(52), 2)); ctx.fill();
  tinta(ctx, () => { caminho(ctx, tremido(circ, 1.8, rng(53), 2)); ctx.stroke(); }, "#c9792a", 3);
  for (let i = 0; i < 12; i++) { // raios curtos girando devagar
    const a = i * 0.5236 + t * 0.08, l = R * (0.35 + 0.08 * Math.sin(t * 3 + i));
    tinta(ctx, () => { ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * R * 1.25, y + Math.sin(a) * R * 1.25); ctx.lineTo(x + Math.cos(a) * (R * 1.25 + l), y + Math.sin(a) * (R * 1.25 + l)); ctx.stroke(); }, "#e0902e", 4);
  }
  if (raio > 0) { // o sol esquentando a água: feixes descem até o mar
    for (let i = 0; i < 5; i++) {
      const tx = W * (0.45 + i * 0.1), k = raio * (0.75 + 0.25 * Math.sin(t * 4 + i * 1.3));
      ctx.globalAlpha = brilho * 0.45 * k;
      const gr = ctx.createLinearGradient(x, y, tx, HZ());
      gr.addColorStop(0, "rgba(253,231,161,0.9)"); gr.addColorStop(1, "rgba(253,200,120,0.2)");
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(x - R * 0.3, y); ctx.lineTo(x + R * 0.3, y); ctx.lineTo(tx + W * 0.03, HZ()); ctx.lineTo(tx - W * 0.03, HZ()); ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}
function ondas(t, calor) {
  ctx.drawImage(MAR, 0, 0);
  const y0 = HZ();
  for (let f = 0; f < 9; f++) { // fileiras de ondinhas, mais finas perto do horizonte
    const y = y0 + (H - y0) * Math.pow((f + 0.5) / 9, 1.3), amp = 3 + f * 1.4, larg = 1.2 + f * 0.35;
    const pts = [];
    for (let x = -20; x <= W + 20; x += 18) pts.push([x, y + Math.sin(x * (0.012 - f * 0.0008) + t * (1.4 + f * 0.1) + f) * amp]);
    tinta(ctx, () => { caminho(ctx, pts, false); ctx.stroke(); }, COR.creme, larg, 0.35 + f * 0.03);
  }
  const r = rng(61);
  for (let i = 0; i < 40; i++) { // brilho do sol na água, mais forte quando esquenta
    const x = W * (0.55 + r() * 0.4), y = y0 + r() * (H - y0) * 0.5, p = Math.sin(t * 5 + i * 2.1);
    if (p < 0.4) { r(); continue; }
    ctx.globalAlpha = (p - 0.4) * (0.5 + calor * 0.5);
    ctx.fillStyle = "#fff6d8"; ctx.fillRect(x, y, 10 + r() * 16, 2.5);
  }
  ctx.globalAlpha = 1;
}
function vapor(t, k0, k1) { // fios tremidos que sobem do mar e somem
  for (const v of VAPOR) {
    const u = (t - (k0 + v.atraso)) / v.dura;
    if (u <= 0 || t > k1 + v.atraso) continue;
    const p = u % 1, y = lerp(HZ() + 6, NUV()[1] + H * 0.08, p), x = v.x + Math.sin(p * 6 + v.fase) * W * 0.012;
    const a = Math.sin(Math.PI * p) * 0.75 * (1 - p * 0.6) * (1 - seg(t, k1 - 0.5, k1 + v.atraso));
    const pts = [...Array(9)].map((_, i) => [x + Math.sin(i * 0.9 + t * 2 + v.fase) * 10, y + i * 12]);
    tinta(ctx, () => { caminho(ctx, pts, false); ctx.stroke(); }, "#ffffff", 3, a);
  }
}
function nuvem(t, forma, cinza, dt = 0) { // forma: 0 = só pontinhos, 1 = nuvem pronta
  const [cx, cy] = NUV();
  const pts = PONTOS, junta = seg(forma, 0.15, 0.6), puf = seg(forma, 0.45, 1);
  for (const p of pts) { // as gotinhas: espalhadas, depois se juntam no desenho da nuvem
    const a = seg(forma, p.nasce, p.nasce + 0.12) * (1 - seg(puf, 0.5, 1));
    if (a <= 0) continue;
    const x = lerp(p.x0, p.x1, junta) + Math.sin(t * 2 + p.fase) * 4 * (1 - junta), y = lerp(p.y0, p.y1, junta);
    ctx.globalAlpha = a; ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COR.tinta; ctx.lineWidth = 1; ctx.globalAlpha = a * 0.5; ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (puf <= 0) return;
  const corA = mist("#ffffff", "#7b8da0", cinza), corB = mist("#dfe9f1", "#46596e", cinza);
  ctx.save();
  ctx.translate(0, dt);
  const tc = mist(COR.tinta, "#1c2b38", cinza);
  const forma1 = (q, i, k) => {
    const R = q.r * (0.6 + 0.4 * k), x = cx + q.dx + Math.sin(t * 0.6 + i) * 3, y = cy + q.dy;
    caminho(ctx, tremido(q.pts.map(([a, b]) => [x + a * R, y + b * R]), 1.2, rng(70 + i), 2));
    return [x, y, R];
  };
  const kp = (i) => seg(puf, i / PUFOS.length * 0.7, i / PUFOS.length * 0.7 + 0.3); // a nuvem se desenha camada por camada
  PUFOS.forEach((q, i) => { // contorno de fora: tinta grossa por baixo, o miolo cobre as linhas de dentro
    const k = kp(i); if (k <= 0) return;
    forma1(q, i, k); ctx.globalAlpha = k * 0.85; ctx.strokeStyle = tc; ctx.lineWidth = 5 * tw("traco"); ctx.stroke();
  });
  PUFOS.forEach((q, i) => {
    const k = kp(i); if (k <= 0) return;
    const [x, y, R] = forma1(q, i, k);
    const g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.4, R * 0.1, x, y + R * 0.3, R * 1.1);
    g.addColorStop(0, corA); g.addColorStop(1, corB);
    ctx.globalAlpha = k; ctx.fillStyle = g; ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}
function chuva(t, t0, t1) { // traços inclinados caindo da base da nuvem; círculos onde batem
  const [cx, cy] = NUV(), y0 = cy + H * 0.07, y1 = HZ() + H * 0.04;
  for (const d of CHUVA) {
    const nasce = t0 + d.atraso;
    if (t < nasce || nasce > t1) continue;
    const p = ((t - nasce) / d.queda) % 1, volta = Math.floor((t - nasce) / d.queda);
    if (nasce + volta * d.queda > t1) continue;
    const y = lerp(y0, y1 + d.fundo, p), x = cx + d.x - (y - y0) * 0.18;
    tinta(ctx, () => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y - 32); ctx.stroke(); }, "#e8f6ff", 2.2, 0.85);
    const pr = (p * d.queda + 0.0) / 0.5; // anel da gota anterior no mar
    if (volta > 0 && pr < 1) {
      const rx = cx + d.x - (y1 + d.fundo - y0) * 0.18;
      ctx.globalAlpha = (1 - pr) * 0.7; ctx.strokeStyle = COR.creme; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(rx, y1 + d.fundo, 6 + pr * 30, 2 + pr * 7, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}
function arco(k) { // o brilho do fim
  if (k <= 0) return;
  const [cx] = NUV(), y = HZ(), R = W * 0.3;
  ["#e8775a", "#f2b84b", "#f6e27a", "#7fd6a8", "#6fb7e0", "#9a86c9"].forEach((c, i) => {
    const pts = [...Array(40)].map((_, j) => { const a = Math.PI * (1 + j / 39); return [cx + W * 0.12 + Math.cos(a) * (R - i * 11), y + Math.sin(a) * (R - i * 11)]; });
    tinta(ctx, () => tracar(ctx, pts, k, false), c, 9, 0.45);
  });
}

function mundo(t) {
  const frio = seg(t, T.nuvem.t0 + 0.9, T.nuvem.t0 + 2.2);
  const escuro = seg(t, T.peso.t0, T.peso.t1) * (1 - seg(t, T.chuva.t0 + 2.6, T.chuva.t1 - 0.4));
  const fim = seg(t, T.chuva.t0 + 2.8, T.chuva.t1);
  ctx.drawImage(CEUQ, 0, 0);
  ctx.globalAlpha = frio * (1 - fim * 0.6); ctx.drawImage(CEUF, 0, 0);
  ctx.globalAlpha = escuro; ctx.drawImage(CEUC, 0, 0);
  ctx.globalAlpha = 1;
  const calor = seg(t, T.vapor.t0 + 0.5, T.vapor.t0 + 1.3) * (1 - seg(t, T.nuvem.t0 + 0.6, T.nuvem.t0 + 1.6));
  sol(t, 1 - escuro * 0.75, calor);
  arco(seg(t, T.chuva.t0 + 3.0, T.chuva.t1 - 0.2));
  ondas(t, calor);
  vapor(t, T.vapor.t0 + 2.1, T.nuvem.t0 + 3.2);
  const forma = seg(t, T.nuvem.t0 + 2.2, T.nuvem.t0 + 4.9);
  const peso = seg(t, T.peso.t0, T.peso.t1);
  nuvem(t, forma, Math.max(escuro * 0.85, 0), H * 0.02 * peso * (1 - fim));
  chuva(t, T.chuva.t0 + 1.85, T.chuva.t1 - 0.5);
}

// ---------- o close: gotas se juntando ----------
function fazerGotas() {
  const r = rng(91), g0 = [], r0 = H * 0.032;
  for (let i = 0; i < 16; i++) { // col/linha pelos bits: cada par vizinho se junta, e as duas últimas ficam lado a lado
    const col = (i & 1) + 2 * ((i >> 3) & 1), lin = ((i >> 1) & 1) + 2 * ((i >> 2) & 1);
    g0.push({ x: W * (0.29 + col * 0.14) + (r() - 0.5) * W * 0.04, y: H * (0.24 + lin * 0.16) + (r() - 0.5) * H * 0.05, r: r0 * (0.85 + r() * 0.3), f: r() * 6 });
  }
  const ger = [g0];
  while (ger[ger.length - 1].length > 2) {
    const a = ger[ger.length - 1], b = [];
    for (let j = 0; j < a.length; j += 2) {
      const [p, q] = [a[j], a[j + 1]], w = p.r * p.r + q.r * q.r;
      b.push({ x: (p.x * p.r * p.r + q.x * q.r * q.r) / w, y: (p.y * p.r * p.r + q.y * q.r * q.r) / w, r: Math.sqrt(w), f: p.f });
    }
    ger.push(b);
  }
  return ger;
}
function gota(x, y, R, estica, seed) {
  const pts = [...Array(28)].map((_, i) => {
    const a = (i / 28) * Math.PI * 2, s = Math.sin(a);
    const yy = s > 0 ? s : s * (1 + estica * 1.3); // estica vira gota: ponta em cima
    const xx = Math.cos(a) * (s < 0 ? 1 - estica * 0.55 * -s : 1);
    return [x + xx * R, y + yy * R + estica * R * 0.4];
  });
  const g = ctx.createRadialGradient(x - R * 0.35, y - R * 0.2, R * 0.1, x, y + R * 0.3, R * 1.3);
  g.addColorStop(0, COR.gota[0]); g.addColorStop(0.6, COR.gota[1]); g.addColorStop(1, COR.gota[2]);
  ctx.fillStyle = g; caminho(ctx, tremido(pts, 0.8, rng(seed), 1)); ctx.fill();
  tinta(ctx, () => { caminho(ctx, tremido(pts, 1, rng(seed + 1), 1)); ctx.stroke(); }, COR.tinta, 2.4);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath(); ctx.ellipse(x - R * 0.35, y - R * 0.25, R * 0.18, R * 0.09, -0.7, 0, Math.PI * 2); ctx.fill();
}
function peso(u) {
  ctx.drawImage(DENTRO, 0, 0);
  const janelas = [[0.45, 1.15], [1.25, 1.95], [2.05, 2.8]]; // juntam, crescem, pesadas
  let L = 0;
  while (L < janelas.length && u >= janelas[L][1]) L++;
  const calma = 1 - seg(u, 2.4, 3.4); // o tremor para: suspense
  const cai = seg(u, 2.8, 4.4), estica = seg(u, 2.6, 3.6);
  ctx.globalAlpha = 0.35 * seg(u, 1.0, 3.6); ctx.fillStyle = "#4a5d72"; ctx.fillRect(0, 0, W, H); // a nuvem escurece
  ctx.globalAlpha = 1;
  const k = L < janelas.length ? seg(u, ...janelas[L]) : 1;
  const filhos = GOTAS[L], pais = GOTAS[Math.min(L + 1, GOTAS.length - 1)];
  const mexe = (g) => [Math.sin(u * 1.7 + g.f) * 9 * calma, Math.cos(u * 1.3 + g.f) * 7 * calma];
  if (L < janelas.length && k < 1) filhos.forEach((g, i) => {
    const p = pais[i >> 1], [mx, my] = mexe(g);
    gota(lerp(g.x, p.x, k) + mx, lerp(g.y, p.y, k) + my, lerp(g.r, p.r * 0.8, k * k), 0, 100 + L * 40 + i);
  });
  else (L < janelas.length ? pais : GOTAS[GOTAS.length - 1]).forEach((g, i) => {
    const [mx, my] = mexe(g);
    gota(g.x + mx, g.y + my + cai * H * 0.06, g.r * (1 + 0.04 * estica), estica, 300 + i);
  });
}

// ---------- entrada ----------
function iniciar(tempo) {
  TEMPO = tempo;
  [W, H] = TAM[tempo.formato];
  const c = document.getElementById("c");
  c.width = W; c.height = H;
  ctx = c.getContext("2d");
  GRAO = fazerGrao(); MANCHA = fazerMancha(); CAMADA = tela(W, H);
  for (const a of tempo.atos) T[a.cena] = a;
  CEUQ = fazerCeu(COR.ceuQ, ["#fde9b0", "#f4c98a", "#bfe0e6", "#fff4d6"], 3);
  CEUF = fazerCeu(COR.ceuF, ["#bcd9ea", "#8fb9d4", "#e4f0f6"], 4);
  CEUC = fazerCeu(COR.ceuC, ["#8d9cab", "#6c7f93", "#b3bdc7"], 5);
  MAR = fazerMar(); DENTRO = fazerDentro(); GOTAS = fazerGotas();
  const r = rng(17), [cx, cy] = NUV();
  VAPOR = [...Array(26)].map(() => ({ x: W * (0.12 + r() * 0.62), atraso: r() * 1.6, dura: 1.8 + r() * 1.2, fase: r() * 6 }));
  PUFOS = [[-0.13, 0.03, 0.09], [0.12, 0.03, 0.09], [-0.06, -0.02, 0.11], [0.05, -0.04, 0.12], [-0.17, 0.05, 0.06], [0.17, 0.05, 0.065], [0, 0.04, 0.1]]
    .map(([dx, dy, rr]) => ({ dx: dx * W, dy: dy * H, r: rr * H * 1.2, pts: [...Array(20)].map((_, i) => [Math.cos(i * 0.314), Math.sin(i * 0.314)]) }));
  PONTOS = [...Array(140)].map((_, i) => {
    const q = PUFOS[i % PUFOS.length], a = r() * Math.PI * 2, d = Math.sqrt(r()) * q.r * 0.9;
    return { x0: W * (0.12 + r() * 0.6), y0: cy + (r() - 0.6) * H * 0.3, x1: cx + q.dx + Math.cos(a) * d, y1: cy + q.dy + Math.sin(a) * d, r: 2 + r() * 3, nasce: r() * 0.15, fase: r() * 6 };
  });
  CHUVA = [...Array(170)].map(() => ({ x: (r() - 0.5) * W * 0.36, atraso: r() * 0.35, queda: 0.45 + r() * 0.2, fundo: r() * (H - HZ()) * 0.8 }));
}

function camada(a, desenha) { // desenha fora da tela e cola com transparência
  const real = ctx;
  ctx = CAMADA.getContext("2d"); ctx.clearRect(0, 0, W, H); desenha();
  ctx = real; ctx.save(); ctx.globalAlpha = a; ctx.drawImage(CAMADA, 0, 0); ctx.restore();
}

function quadro(t) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  const [cx, cy] = NUV(), P = T.peso, C = T.chuva;
  const entra = seg(t, P.t0 - 0.1, P.t0 + 0.8), sai = seg(t, C.t0, C.t0 + 0.9);
  if (t < P.t0 - 0.1 || sai >= 1) mundo(t);
  else if (t < C.t0) { // mergulha na nuvem
    if (entra < 1) {
      const z = lerp(1, 3.2, entra);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); mundo(t); ctx.restore();
    }
    camada(entra, () => peso(t - P.t0));
  } else { // sai da nuvem pesada para o céu
    const z = lerp(2.6, 1, sai);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); mundo(t); ctx.restore();
    camada(1 - sai, () => peso(P.t1 - P.t0));
  }
  ctx.restore();
  papel(t);
}
