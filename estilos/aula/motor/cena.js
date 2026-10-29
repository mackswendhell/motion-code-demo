// Aula: abertura de aula para canal sem rosto. Fundo escuro, tipografia cinética, janela de app que a câmera percorre,
// lista que se marca, contador, legenda palavra por palavra. Tudo sai do campo "tela" de cada ato no roteiro.json.
// Palco lógico de 1920 x 1080 (16:9). Carregado depois de nucleo/2d/base.js. iniciar(tempo) uma vez, quadro(t) por quadro.

const COR = { fundo: "#0d0e11", grade: "#1b1d23", texto: "#f3efe8", apagado: "#8a8f99", acento: "#d97757", acento2: "#f0b48f",
  janela: "#17181c", barra: "#202227", linha: "#2c2f36", cartao: "#1f2126", verde: "#5fbf8a" };
const FONTE = '"Avenir Next", "Helvetica Neue", sans-serif', MONO = '"SF Mono", Menlo, monospace';
const ENTRA = 0.45; // duração do corte de entrada de cada ato (chicote + zoom)
let S, OX, OY;

const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const salto = (x) => { x = clamp(x); return 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2); }; // passa um pouco e volta
const fonte = (px, peso = 600, f = FONTE) => `${peso} ${px}px ${f}`;
function arred(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

function palavrasNoTempo(fala) { // cada palavra ganha um instante, proporcional ao tamanho, dentro da fala
  if (!fala) return [];
  const ps = fala.texto.split(/\s+/), pesos = ps.map((p) => p.length + 2), soma = pesos.reduce((a, b) => a + b, 0);
  let acc = 0;
  return ps.map((p, i) => { const t = fala.t0 + ((fala.t1 - fala.t0) * acc) / soma; acc += pesos[i]; return { p, t }; });
}

function quebrar(texto, larg, px, peso) {
  ctx.font = fonte(px, peso);
  const linhas = [[]];
  for (const p of texto.split(/\s+/)) {
    const l = linhas[linhas.length - 1], tenta = [...l, p].join(" ");
    if (l.length && ctx.measureText(tenta).width > larg) linhas.push([p]); else l.push(p);
  }
  return linhas;
}
const limpa = (p) => p.toLowerCase().replace(/[^\p{L}\p{N}.]/gu, "");

// ---------- cenas: cada uma recebe (tela, u = tempo no ato, fim, ato) e desenha no palco 1920 x 1080 ----------
const CENAS = {
  titulo(d, u) {
    if (d.selo) {
      const k = salto((u - 0.15) / 0.5);
      ctx.save(); ctx.globalAlpha = clamp(k); ctx.font = fonte(30, 700, MONO);
      const w = ctx.measureText(d.selo).width + 44;
      ctx.translate(960, 330); ctx.scale(k, k);
      arred(-w / 2, -28, w, 56, 28); ctx.fillStyle = "rgba(217,119,87,0.16)"; ctx.fill();
      ctx.strokeStyle = COR.acento; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = COR.acento2; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(d.selo, 0, 2);
      ctx.restore();
    }
    const letras = [...d.texto], px = d.tamanho || 150;
    ctx.font = fonte(px, 800);
    const larg = ctx.measureText(d.texto).width;
    let x = 960 - larg / 2;
    const dest = d.destaque ? d.texto.indexOf(d.destaque) : -1;
    letras.forEach((l, i) => {
      const k = salto((u - 0.3 - i * 0.035) / 0.5), w = ctx.measureText(l).width;
      const acento = dest >= 0 && i >= dest && i < dest + d.destaque.length;
      ctx.save(); ctx.globalAlpha = clamp(k * 1.4);
      ctx.translate(x + w / 2, 560 + (1 - k) * 90); ctx.rotate((1 - k) * 0.25);
      ctx.fillStyle = acento ? COR.acento : COR.texto; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillText(l, 0, 0); ctx.restore();
      x += w;
    });
    const s = seg(u, 0.9, 1.5);
    ctx.fillStyle = COR.acento; ctx.fillRect(960 - (larg / 2) * s, 600, larg * s, 10);
    if (d.sub) {
      ctx.globalAlpha = seg(u, 1.2, 1.7); ctx.font = fonte(44, 500); ctx.fillStyle = COR.apagado;
      ctx.textAlign = "center"; ctx.fillText(d.sub, 960, 700 + (1 - seg(u, 1.2, 1.7)) * 20); ctx.globalAlpha = 1;
    }
  },

  frase(d, u, fim, a) { // a frase da tela entra palavra por palavra no ritmo da fala; destaques ganham marca-texto
    const px = d.tamanho || 96, linhas = quebrar(d.texto, 1500, px, 800), alt = px * 1.22;
    const tempos = palavrasNoTempo(a.fala), dest = new Set((d.destaque || []).map(limpa));
    let prox = 0; // casa as palavras da tela com as da fala em ordem, para palavra repetida ("o", "de") não pular para a primeira vez
    const ritmo = (p, i) => {
      const k = tempos.findIndex((w, j) => j >= prox && limpa(w.p) === limpa(p));
      if (k < 0) return 0.2 + i * 0.12;
      prox = k + 1; return tempos[k].t - a.t0;
    };
    let n = 0, y = 540 - ((linhas.length - 1) * alt) / 2;
    ctx.font = fonte(px, 800); ctx.textBaseline = "middle";
    for (const l of linhas) {
      const larg = ctx.measureText(l.join(" ")).width, esp = ctx.measureText(" ").width;
      let x = 960 - larg / 2;
      for (const p of l) {
        const t0 = Math.max(0.1, ritmo(p, n) - 0.12), k = salto((u - t0) / 0.32), w = ctx.measureText(p).width;
        const marca = dest.has(limpa(p));
        if (marca) {
          const m = seg(u, t0 + 0.15, t0 + 0.45);
          ctx.fillStyle = COR.acento; ctx.globalAlpha = 0.9;
          ctx.fillRect(x - 10, y - alt * 0.42, (w + 20) * m, alt * 0.84); ctx.globalAlpha = 1;
        }
        ctx.save(); ctx.globalAlpha = clamp(k * 1.5); ctx.translate(x + w / 2, y + (1 - k) * 40); ctx.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k);
        ctx.fillStyle = marca && u > t0 + 0.3 ? COR.fundo : COR.texto; ctx.textAlign = "center"; ctx.fillText(p, 0, 0); ctx.restore();
        x += w + esp; n++;
      }
      y += alt;
    }
  },

  janela(d, u, fim) { // janela de app desenhada; a câmera vai até a área de "foco" e os cartões entram um por um
    const X = 260, Y = 150, Wj = 1400, Hj = 780, lat = 300, dir = 360;
    const k = salto(u / 0.6);
    ctx.save(); ctx.globalAlpha = clamp(k * 1.3); ctx.translate(960, 540); ctx.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k); ctx.translate(-960, -540);
    ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 60; arred(X, Y, Wj, Hj, 22); ctx.fillStyle = COR.janela; ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = COR.linha; ctx.lineWidth = 2; ctx.stroke();
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => { ctx.beginPath(); ctx.arc(X + 34 + i * 26, Y + 30, 8, 0, 7); ctx.fillStyle = c; ctx.fill(); });
    ctx.font = fonte(22, 600); ctx.fillStyle = COR.apagado; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(d.titulo || "Claude Code", X + Wj / 2, Y + 30);
    ctx.fillStyle = COR.barra; ctx.fillRect(X, Y + 60, lat, Hj - 60); ctx.fillRect(X + Wj - dir, Y + 60, dir, Hj - 60);
    ctx.fillStyle = COR.linha; ctx.fillRect(X, Y + 60, Wj, 2);
    ctx.textAlign = "left"; ctx.font = fonte(22, 600);
    (d.lateral || []).forEach((it, i) => {
      const s = seg(u, 0.4 + i * 0.08, 0.7 + i * 0.08), yy = Y + 110 + i * 54;
      ctx.globalAlpha = s; if (i === (d.ativo ?? 0)) { arred(X + 16, yy - 22, lat - 32, 44, 10); ctx.fillStyle = COR.linha; ctx.fill(); }
      ctx.fillStyle = it.startsWith("  ") ? COR.apagado : COR.texto; ctx.fillText(it.trim(), X + (it.startsWith("  ") ? 64 : 36), yy);
    });
    ctx.globalAlpha = 1;
    const cx = X + lat + 40, cw = Wj - lat - dir - 80;
    (d.chat || []).forEach((m, i) => {
      const s = seg(u, 0.7 + i * 0.35, 1.0 + i * 0.35), eu = i % 2 === 0, yy = Y + 110 + i * 120;
      const linhas = quebrar(m, cw - 120, 22, 500);
      const bw = Math.min(cw - 60, Math.max(...linhas.map((l) => ctx.measureText(l.join(" ")).width)) + 44), bh = linhas.length * 30 + 28;
      const bx = eu ? cx + cw - bw : cx;
      ctx.globalAlpha = s; arred(bx, yy + (1 - s) * 20, bw, bh, 16); ctx.fillStyle = eu ? COR.linha : "transparent"; ctx.fill();
      ctx.fillStyle = COR.texto; ctx.font = fonte(22, 500);
      linhas.forEach((l, j) => ctx.fillText(l.join(" "), bx + 22, yy + (1 - s) * 20 + 30 + j * 30));
    });
    ctx.globalAlpha = 1;
    arred(cx, Y + Hj - 100, cw, 64, 18); ctx.strokeStyle = COR.linha; ctx.stroke();
    ctx.fillStyle = COR.apagado; ctx.font = fonte(22, 500); ctx.fillText("Pergunte qualquer coisa...", cx + 24, Y + Hj - 68);
    const xd = X + Wj - dir + 20;
    (d.cartoes || []).forEach((c, i) => {
      const t0 = c.em ?? 1.0 + i * 0.7, s = salto((u - t0) / 0.45), yy = Y + 90 + i * 170;
      ctx.save(); ctx.globalAlpha = clamp(s * 1.3); ctx.translate((1 - s) * 80, 0);
      arred(xd, yy, dir - 40, 150, 16); ctx.fillStyle = COR.cartao; ctx.fill();
      ctx.strokeStyle = u > t0 + 0.2 && u < t0 + 1.4 ? COR.acento : COR.linha; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = COR.acento2; ctx.font = fonte(20, 700, MONO); ctx.fillText(c.titulo.toUpperCase(), xd + 20, yy + 34);
      ctx.fillStyle = COR.texto; ctx.font = fonte(22, 500);
      quebrar(c.texto, dir - 90, 22, 500).forEach((l, j) => ctx.fillText(l.join(" "), xd + 20, yy + 74 + j * 30));
      if (c.barra != null) { arred(xd + 20, yy + 120, dir - 80, 10, 5); ctx.fillStyle = COR.linha; ctx.fill();
        arred(xd + 20, yy + 120, (dir - 80) * c.barra * seg(u, t0 + 0.3, t0 + 1.2), 10, 5); ctx.fillStyle = COR.acento; ctx.fill(); }
      ctx.restore();
    });
    ctx.restore();
    if (d.foco) { // destaque da área em foco, com o resto escurecendo
      const R = { lateral: [X, Y + 60, lat, Hj - 60], chat: [X + lat, Y + 60, Wj - lat - dir, Hj - 60], cartoes: [X + Wj - dir, Y + 60, dir, Hj - 60] }[d.foco];
      const s = seg(u, d.focoEm ?? 1.4, (d.focoEm ?? 1.4) + 0.5);
      ctx.save(); ctx.globalAlpha = 0.55 * s; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.rect(-500, -500, 2920, 2080);
      ctx.roundRect(R[0], R[1], R[2], R[3], 12); ctx.fill("evenodd"); ctx.restore();
      ctx.save(); ctx.globalAlpha = s; ctx.strokeStyle = COR.acento; ctx.lineWidth = 4; arred(R[0], R[1], R[2], R[3], 12); ctx.stroke(); ctx.restore();
    }
  },

  lista(d, u) {
    ctx.textBaseline = "middle"; ctx.textAlign = "left";
    if (d.titulo) { ctx.font = fonte(56, 800); ctx.fillStyle = COR.texto; ctx.globalAlpha = seg(u, 0.1, 0.4); ctx.fillText(d.titulo, 420, 230); ctx.globalAlpha = 1; }
    const passo = d.passo || 0.9;
    d.itens.forEach((it, i) => {
      const t0 = (d.em ?? 0.5) + i * passo, s = salto((u - t0) / 0.4), yy = 350 + i * 120, ok = seg(u, t0 + 0.35, t0 + 0.6);
      ctx.save(); ctx.globalAlpha = clamp(s * 1.4); ctx.translate((1 - s) * -60, 0);
      arred(420, yy - 36, 72, 72, 18); ctx.fillStyle = ok > 0.5 ? COR.acento : COR.cartao; ctx.fill();
      if (ok > 0) { ctx.strokeStyle = COR.fundo; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath();
        const pts = [[438, yy], [452, yy + 14], [476, yy - 14]]; ctx.moveTo(...pts[0]);
        ctx.lineTo(lerp(pts[0][0], pts[1][0], clamp(ok * 2)), lerp(pts[0][1], pts[1][1], clamp(ok * 2)));
        if (ok > 0.5) ctx.lineTo(lerp(pts[1][0], pts[2][0], (ok - 0.5) * 2), lerp(pts[1][1], pts[2][1], (ok - 0.5) * 2)); ctx.stroke(); }
      ctx.font = fonte(54, 700); ctx.fillStyle = COR.texto; ctx.fillText(it, 530, yy + 2); ctx.restore();
    });
  },

  numero(d, u) {
    const k = seg(u, 0.2, 1.2), v = Math.round(d.valor * k), s = salto((u - 0.1) / 0.5);
    ctx.save(); ctx.translate(960, 500); ctx.scale(s, s); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = fonte(340, 800); ctx.fillStyle = COR.acento; ctx.fillText(String(v), 0, 0); ctx.restore();
    ctx.globalAlpha = seg(u, 0.8, 1.2); ctx.font = fonte(60, 700); ctx.fillStyle = COR.texto; ctx.textAlign = "center";
    ctx.fillText(d.rotulo || "", 960, 760); ctx.globalAlpha = 1;
  },
};
CENAS.fim = (d, u, fim, a) => CENAS.titulo({ ...d, tamanho: d.tamanho || 110 }, u, fim, a);

// ---------- quadro ----------
function fundo(t) {
  ctx.fillStyle = COR.fundo; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(OX, OY); ctx.scale(S, S);
  const desl = (t * 18) % 80; ctx.strokeStyle = COR.grade; ctx.lineWidth = 1.5;
  for (let x = -80 + desl; x < 2000; x += 80) { ctx.beginPath(); ctx.moveTo(x, -200); ctx.lineTo(x, 1280); ctx.stroke(); }
  for (let y = -80 + desl * 0.5; y < 1200; y += 80) { ctx.beginPath(); ctx.moveTo(-200, y); ctx.lineTo(2120, y); ctx.stroke(); }
  const gx = 960 + Math.sin(t * 0.4) * 500, gy = 540 + Math.cos(t * 0.3) * 260, g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 700);
  g.addColorStop(0, "rgba(217,119,87,0.20)"); g.addColorStop(1, "rgba(217,119,87,0)"); ctx.fillStyle = g; ctx.fillRect(-200, -200, 2320, 1480);
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.6)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

function legenda(t, a) {
  const ps = palavrasNoTempo(a.fala); if (!ps.length || t > a.fala.t1 + 0.4) return;
  let i = ps.findIndex((w, j) => t < (ps[j + 1]?.t ?? a.fala.t1)); if (i < 0) i = ps.length - 1;
  const g0 = Math.floor(i / 6) * 6, grupo = ps.slice(g0, g0 + 6);
  ctx.save(); ctx.translate(OX, OY); ctx.scale(S, S); ctx.font = fonte(40, 700); ctx.textBaseline = "middle";
  const larg = ctx.measureText(grupo.map((w) => w.p).join(" ")).width, esp = ctx.measureText(" ").width;
  arred(960 - larg / 2 - 26, 975, larg + 52, 70, 18); ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fill();
  let x = 960 - larg / 2;
  grupo.forEach((w, j) => { ctx.fillStyle = g0 + j === i ? COR.acento2 : g0 + j < i ? COR.texto : COR.apagado; ctx.textAlign = "left"; ctx.fillText(w.p, x, 1011); x += ctx.measureText(w.p).width + esp; });
  ctx.restore();
}

function progresso(t) {
  ctx.fillStyle = COR.acento; ctx.fillRect(0, 0, W * (t / TEMPO.total), Math.max(4, H * 0.005));
}

function iniciar(tempo) {
  TEMPO = tempo;
  [W, H] = TAM[tempo.formato];
  const el = document.getElementById("c"); el.width = W; el.height = H; ctx = el.getContext("2d");
  S = Math.min(W / 1920, H / 1080); OX = (W - 1920 * S) / 2; OY = (H - 1080 * S) / 2;
  return document.fonts.ready;
}

function quadro(t) {
  const i = Math.max(0, TEMPO.atos.findIndex((a) => t < a.t1)), a = TEMPO.atos[i < 0 ? TEMPO.atos.length - 1 : i];
  const u = t - a.t0, fim = a.t1 - a.t0, d = a.tela || {};
  fundo(t);
  const e = i > 0 && a.entrada !== "suave" ? seg(u, 0, ENTRA) : 1; // chicote: entra da direita, inclinada e borrada
  const z = (d.zoom ?? 1.05), cam = lerp(1, z, ease(u / fim)); // câmera empurra devagar durante o ato
  ctx.save(); ctx.translate(OX, OY); ctx.scale(S, S);
  ctx.translate(960 + (1 - e) * 700, 540); ctx.scale(cam * (1 + (1 - e) * 0.15), cam * (1 + (1 - e) * 0.15)); ctx.translate(-960, -540);
  if (d.zoomEm) { const [zx, zy, zz] = d.zoomEm, k = ease(seg(u, d.zoomT ?? 1.5, (d.zoomT ?? 1.5) + 0.8)); // aproxima num ponto
    ctx.translate(lerp(zx, 960, k), lerp(zy, 540, k)); ctx.scale(lerp(1, zz, k), lerp(1, zz, k)); ctx.translate(-zx, -zy); }
  ctx.globalAlpha = a.entrada === "suave" && i > 0 ? seg(u, 0, 0.4) : clamp(e * 1.6);
  if (e < 1) ctx.filter = `blur(${(1 - e) * 14}px)`;
  (CENAS[a.cena] || CENAS.frase)(d, u, fim, a);
  ctx.restore(); ctx.filter = "none"; ctx.globalAlpha = 1;
  if (e < 1) { ctx.globalAlpha = (1 - e) * 0.5; ctx.fillStyle = COR.acento; for (let k = 0; k < 6; k++) ctx.fillRect(0, H * (0.15 + k * 0.14), W * (1 - e), 3 * S); ctx.globalAlpha = 1; }
  if (a.entrada === "flash" && u < 0.12) { ctx.fillStyle = `rgba(255,255,255,${1 - u / 0.12})`; ctx.fillRect(0, 0, W, H); }
  if (a.fala) legenda(t, a);
  progresso(t);
}

function eventos() { // para o som.py: chicote a cada corte, estalo em cada elemento que aparece, tique da lista
  const ev = [];
  TEMPO.atos.forEach((a, i) => {
    const d = a.tela || {};
    if (i > 0) ev.push({ t: a.t0, tipo: a.entrada === "suave" ? "sopro" : "chicote" });
    if (a.cena === "titulo" || a.cena === "fim") ev.push({ t: a.t0 + 0.3, tipo: "subida" }, { t: a.t0 + 0.9, tipo: "estalo" });
    if (a.cena === "frase") for (const w of palavrasNoTempo(a.fala)) if ((d.destaque || []).map(limpa).includes(limpa(w.p))) ev.push({ t: w.t, tipo: "estalo" });
    if (a.cena === "janela") (d.cartoes || []).forEach((c, k) => ev.push({ t: a.t0 + (c.em ?? 1.0 + k * 0.7), tipo: "estalo" }));
    if (a.cena === "lista") d.itens.forEach((_, k) => ev.push({ t: a.t0 + (d.em ?? 0.5) + k * (d.passo || 0.9) + 0.4, tipo: "tique" }));
    if (a.cena === "numero") ev.push({ t: a.t0 + 0.2, tipo: "subida" });
  });
  return ev;
}
