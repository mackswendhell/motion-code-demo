// Recorte: papel recortado à mão sobre fundo creme, nas cores do Claude. Cada informação é um cartão de borda
// irregular que cai na mesa, assenta com leve rotação e sai voando quando o assunto muda. Prints entram colados com fita.
// Palco lógico 1920 x 1080. Os elementos (com tempos em segundos) vêm de episodios/<slug>/cenas.json, posto em TEMPO.cenas.

const COR = { papel: "#F0EEE6", claro: "#FAF9F5", cream: "#E8E6DC", ink: "#141413", ink2: "#3D3D3A", muted: "#87867F",
  coral: "#D97757", coralEsc: "#C15F3C", coralClaro: "#F2A07B", fita: "rgba(217,119,87,0.78)" };
const SERIF = '"Source Serif 4"', SANS = '"Inter"', MAO = '"Caveat"';
const ENTRA = 0.55, SAI = 0.35;
let S, OX, OY, IMG = {}, BORDA = {};

const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const salto = (x) => { x = clamp(x); return 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2); };
const f = (px, peso, fam) => `${peso} ${px}px ${fam}`;

function borda(id, w, h) { // contorno de papel cortado à tesoura: pontos a cada ~28 px com desvio pequeno
  const k = `${id}:${w}:${h}`; if (BORDA[k]) return BORDA[k];
  const r = rng([...k].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0), pts = [], d = 5;
  const lado = (x0, y0, x1, y1) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 28));
    for (let i = 0; i < n; i++) pts.push([lerp(x0, x1, i / n) + (r() - 0.5) * d, lerp(y0, y1, i / n) + (r() - 0.5) * d]); };
  lado(-w / 2, -h / 2, w / 2, -h / 2); lado(w / 2, -h / 2, w / 2, h / 2); lado(w / 2, h / 2, -w / 2, h / 2); lado(-w / 2, h / 2, -w / 2, -h / 2);
  return (BORDA[k] = pts);
}
function papelCortado(id, w, h, cor) {
  ctx.save(); ctx.shadowColor = "rgba(60,40,20,0.28)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
  caminho(ctx, borda(id, w, h)); ctx.fillStyle = cor; ctx.fill(); ctx.restore();
  ctx.save(); caminho(ctx, borda(id, w, h)); ctx.clip(); ctx.globalAlpha = 0.08; ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(GRAO, -w / 2, -h / 2, w, h); ctx.restore();
}
function fita(x, y, w, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = COR.fita;
  ctx.beginPath(); ctx.moveTo(-w / 2, -16); ctx.lineTo(w / 2, -14); ctx.lineTo(w / 2 - 4, 16); ctx.lineTo(-w / 2 + 3, 15); ctx.closePath(); ctx.fill(); ctx.restore();
}
function texto(s, x, y, px, peso, fam, cor, alinha = "center") {
  ctx.font = f(px, peso, fam); ctx.fillStyle = cor; ctx.textAlign = alinha; ctx.textBaseline = "middle"; ctx.fillText(s, x, y);
}
function linhas(s, larg, px, peso, fam) {
  ctx.font = f(px, peso, fam); const out = [[]];
  for (const p of s.split(" ")) { const l = out[out.length - 1]; if (l.length && ctx.measureText([...l, p].join(" ")).width > larg) out.push([p]); else l.push(p); }
  return out.map((l) => l.join(" "));
}

// cada tipo desenha centrado em (0,0), já transladado e girado; u = tempo desde a entrada
const TIPOS = {
  cartao(e, u) {
    const w = e.w || 620, h = e.h || 200, cor = COR[e.cor || "claro"], escuro = e.cor === "ink" || e.cor === "coral";
    papelCortado(e.id, w, h, cor);
    if (e.kicker) texto(e.kicker.toUpperCase(), 0, -h / 2 + 44, 26, 600, SANS, escuro ? COR.coralClaro : COR.coralEsc);
    const ls = linhas(e.texto || "", w - 80, e.px || 56, 600, SERIF), ah = (e.px || 56) * 1.15, y0 = (e.kicker ? 18 : 0) - ((ls.length - 1) * ah) / 2;
    ls.forEach((l, i) => texto(l, 0, y0 + i * ah, e.px || 56, 600, SERIF, escuro ? (e.cor === "coral" ? COR.claro : "#F6F0E4") : COR.ink));
    if (e.fita) fita(0, -h / 2, 150, -0.04);
  },
  numero(e, u) {
    const w = e.w || 460, h = e.h || 300; papelCortado(e.id, w, h, COR[e.cor || "coral"]);
    const k = clamp((u - 0.15) / 0.8), v = e.de != null ? Math.round(lerp(e.de, e.valor, 1 - Math.pow(1 - k, 3))) : e.valor;
    const claro = (e.cor || "coral") !== "claro";
    texto(`${e.antes || ""}${v}${e.depois || ""}`, 0, -18, e.px || 150, 700, SERIF, claro ? COR.claro : COR.coralEsc);
    if (e.rotulo) texto(e.rotulo.toUpperCase(), 0, h / 2 - 46, 24, 600, SANS, claro ? "#FCE3D6" : COR.muted);
  },
  print(e, u) {
    const im = IMG[e.src], w = e.w || 820, h = im ? (w * im.height) / im.width : 460, m = 16;
    ctx.save(); ctx.shadowColor = "rgba(60,40,20,0.3)"; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
    ctx.fillStyle = "#fff"; ctx.fillRect(-w / 2 - m, -h / 2 - m, w + 2 * m, h + 2 * m); ctx.restore();
    if (im) { const [sx, sy, sw, sh] = e.recorte || [0, 0, im.width, im.height]; ctx.drawImage(im, sx, sy, sw, sh, -w / 2, -h / 2, w, (w * sh) / sw); }
    fita(-w / 2 + 40, -h / 2 - 6, 140, -0.5); fita(w / 2 - 40, -h / 2 - 6, 140, 0.45);
  },
  nota(e, u) { // anotação manuscrita que se escreve da esquerda para a direita
    ctx.font = f(e.px || 54, 700, MAO); const w = ctx.measureText(e.texto).width, k = clamp(u / (e.escreve || 0.7));
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 - 10, -60, (w + 20) * k, 120); ctx.clip();
    texto(e.texto, 0, 0, e.px || 54, 700, MAO, COR.coralEsc);
    if (e.sublinha) { ctx.strokeStyle = COR.coralEsc; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-w / 2, 30); ctx.quadraticCurveTo(0, 40, w / 2, 26); ctx.stroke(); }
    ctx.restore();
  },
  carimbo(e, u) {
    const s = 1 + 0.6 * (1 - clamp(u / 0.25)); ctx.scale(s, s); ctx.globalAlpha *= 0.92;
    ctx.strokeStyle = COR.coralEsc; ctx.lineWidth = 7; ctx.beginPath(); ctx.roundRect(-230, -70, 460, 140, 14); ctx.stroke();
    texto(e.texto.toUpperCase(), 0, 2, 44, 700, SANS, COR.coralEsc);
  },
  barra(e, u) { // a conta inteira e a fatia pequena em coral
    const w = e.w || 1300, h = 150; papelCortado(e.id, w + 40, h + 120, COR.claro);
    texto(e.titulo.toUpperCase(), -w / 2, -h / 2 - 22, 24, 600, SANS, COR.muted, "left");
    const k = clamp((u - 0.3) / 0.9), fat = e.fatia * w;
    ctx.fillStyle = COR.cream; ctx.fillRect(-w / 2, -h / 2 + 20, w * Math.min(1, k * 1.4), h - 40);
    if (k > 0.6) { ctx.fillStyle = COR.coral; ctx.fillRect(-w / 2, -h / 2 + 20, fat * clamp((k - 0.6) / 0.4), h - 40);
      texto(e.rotulo, -w / 2 + fat + 24, 0, 30, 600, SANS, COR.ink, "left"); }
  },
  seta(e, u) {
    const k = clamp(u / 0.4); ctx.strokeStyle = COR.coralEsc; ctx.lineWidth = 6; ctx.lineCap = "round";
    const L = (e.comp || 120) * k; ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(0, -14, L / 2, 0); ctx.stroke();
    if (k > 0.9) { ctx.beginPath(); ctx.moveTo(L / 2 - 20, -16); ctx.lineTo(L / 2, 0); ctx.lineTo(L / 2 - 22, 14); ctx.stroke(); }
  },
};

function desenhar(e, t) {
  const t1 = e.t1 ?? TEMPO.total + 1, u = t - e.t0;
  if (u < 0 || t > t1 + SAI) return;
  const r = rng(e.id.length * 97 + e.t0 * 13), lado = e.de2 || (r() < 0.5 ? -1 : 1);
  const kIn = salto(u / ENTRA), kOut = t > t1 ? clamp((t - t1) / SAI) : 0;
  const rot = ((e.rot ?? (r() - 0.5) * 4) * Math.PI) / 180;
  ctx.save();
  ctx.translate(e.x + lado * (1 - kIn) * 90 + kOut * kOut * 700 * (e.sai || lado), e.y - (1 - kIn) * 160 - kOut * 120);
  ctx.rotate(rot + (1 - kIn) * 0.25 * lado + kOut * 0.4 * lado);
  const esc = (e.esc || 1) * (1.12 - 0.12 * kIn); ctx.scale(esc, esc);
  ctx.globalAlpha = clamp(u / 0.12) * (1 - kOut);
  TIPOS[e.tipo](e, u);
  ctx.restore();
}

function legenda(t) {
  const ps = TEMPO.palavras; let i = ps.findIndex((w) => t < w.f + 0.05); if (i < 0 || t < ps[0].t - 0.2) return;
  const g0 = Math.floor(i / 7) * 7, g = ps.slice(g0, g0 + 7), txt = g.map((w) => w.fala || w.p).join(" ");
  ctx.font = f(42, 600, SANS); const larg = ctx.measureText(txt).width, esp = ctx.measureText(" ").width;
  ctx.save(); ctx.translate(960, 1000); papelCortado("leg" + g0, larg + 80, 86, COR.ink); ctx.restore();
  let x = 960 - larg / 2;
  g.forEach((w, j) => { const s = w.fala || w.p; ctx.font = f(42, 600, SANS);
    texto(s, x, 1001, 42, 600, SANS, g0 + j === i ? COR.coralClaro : g0 + j < i ? "#F6F0E4" : "#8f8b82", "left"); x += ctx.measureText(s).width + esp; });
}

function iniciar(tempo) {
  TEMPO = tempo; [W, H] = TAM[tempo.formato];
  const el = document.getElementById("c"); el.width = W; el.height = H; ctx = el.getContext("2d");
  S = Math.min(W / 1920, H / 1080); OX = (W - 1920 * S) / 2; OY = (H - 1080 * S) / 2;
  GRAO = fazerGrao();
  const fontes = [["Source Serif 4", "fontes/SourceSerif4.ttf"], ["Inter", "fontes/Inter.ttf"], ["Caveat", "fontes/Caveat.ttf"]]
    .map(([n, u]) => new FontFace(n, `url(${u})`).load().then((ff) => document.fonts.add(ff)));
  const imgs = [...new Set(tempo.cenas.filter((e) => e.src).map((e) => e.src))].map((s) => new Promise((ok) => {
    const im = new Image(); im.onload = () => { IMG[s] = im; ok(); }; im.onerror = ok; im.src = tempo.base + s; }));
  return Promise.all([...fontes, ...imgs]);
}

function quadro(t) {
  ctx.fillStyle = COR.papel; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.12; ctx.globalCompositeOperation = "multiply"; ctx.drawImage(GRAO, 0, 0, W, H); ctx.restore();
  const cam = TEMPO.camera.find((c) => t >= c.t0 && t < c.t1) || { t0: 0, t1: 1, z0: 1, z1: 1 };
  const z = lerp(cam.z0, cam.z1, ease((t - cam.t0) / (cam.t1 - cam.t0)));
  ctx.save(); ctx.translate(OX, OY); ctx.scale(S, S);
  ctx.translate(960, 500); ctx.scale(z, z); ctx.translate(-960 + Math.sin(t * 0.3) * 6, -500 + Math.cos(t * 0.25) * 4);
  for (const e of TEMPO.cenas) desenhar(e, t);
  ctx.restore();
  ctx.save(); ctx.translate(OX, OY); ctx.scale(S, S); legenda(t); ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, "rgba(120,90,60,0)"); v.addColorStop(1, "rgba(120,90,60,0.12)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
