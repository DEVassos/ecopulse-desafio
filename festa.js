// Comemoração: flash, faixa gigante, confete, tremida e sons (gerados na hora pela Web Audio API, sem arquivos).
// Regra de segurança: um flash forte por evento, nunca piscando sem parar (no máximo 3 por segundo).

(function () {
  const C = window.ECOPULSE_JOGO;
  const VERDES = ['#10b981', '#34d399', '#5cffb8', '#a7f3d0', '#facc15', '#ffffff'];
  let audio = null;

  // ---------- som ----------
  function ctx() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }

  function nota(freq, inicio, dur, tipo = 'triangle', vol = 0.3, freqFinal) {
    const a = ctx();
    if (!a || C.VOLUME <= 0) return;
    const t = a.currentTime + inicio;
    const osc = a.createOscillator();
    const ganho = a.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    if (freqFinal) osc.frequency.exponentialRampToValueAtTime(freqFinal, t + dur);
    ganho.gain.setValueAtTime(0.0001, t);
    ganho.gain.exponentialRampToValueAtTime(vol * C.VOLUME, t + 0.015);
    ganho.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(ganho).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function ruido(inicio, dur, vol, freqFiltro = 2500) {
    const a = ctx();
    if (!a || C.VOLUME <= 0) return;
    const tamanho = Math.floor(a.sampleRate * dur);
    const buffer = a.createBuffer(1, tamanho, a.sampleRate);
    const dados = buffer.getChannelData(0);
    for (let i = 0; i < tamanho; i++) dados[i] = (Math.random() * 2 - 1) * (1 - i / tamanho);
    const fonte = a.createBufferSource();
    const filtro = a.createBiquadFilter();
    const ganho = a.createGain();
    fonte.buffer = buffer;
    filtro.type = 'bandpass';
    filtro.frequency.value = freqFiltro;
    ganho.gain.value = vol * C.VOLUME;
    fonte.connect(filtro).connect(ganho).connect(a.destination);
    fonte.start(a.currentTime + inicio);
  }

  const sons = {
    inicio() {
      nota(330, 0, 0.12, 'square', 0.12, 660);
      nota(660, 0.1, 0.18, 'square', 0.12, 1320);
    },
    acerto() {
      nota(523.25, 0, 0.18, 'triangle', 0.35);
      nota(659.25, 0.1, 0.18, 'triangle', 0.35);
      nota(783.99, 0.2, 0.45, 'triangle', 0.4);
      nota(1567.98, 0.32, 0.4, 'sine', 0.18);
      ruido(0.05, 0.4, 0.25, 6000);
    },
    erro() {
      nota(150, 0, 0.45, 'sawtooth', 0.25, 70);
      nota(155, 0, 0.45, 'square', 0.12, 72);
    },
    tique() {
      nota(1000, 0, 0.06, 'square', 0.1);
    },
    vitoria() {
      const fanfarra = [392, 523.25, 659.25, 783.99];
      fanfarra.forEach((f, i) => nota(f, i * 0.13, 0.16, 'square', 0.18));
      [523.25, 659.25, 783.99, 1046.5].forEach((f) => nota(f, 0.6, 1.6, 'triangle', 0.22));
      [261.63, 392].forEach((f) => nota(f, 0.6, 1.6, 'sawtooth', 0.06));
      // aplausos: muitas palmas curtas espalhadas em 2,8 s
      for (let i = 0; i < 70; i++) ruido(0.7 + Math.random() * 2.8, 0.05, 0.5, 1500 + Math.random() * 2000);
    },
  };

  // ---------- visual ----------
  const el = (id) => document.getElementById(id);

  function reiniciarAnimacao(elemento, classe) {
    elemento.classList.remove(classe);
    void elemento.offsetWidth; // força o navegador a recomeçar a animação
    elemento.classList.add(classe);
  }

  function flash(cor, intensidade = 0.9) {
    const f = el('flash');
    f.style.setProperty('--cor-flash', cor);
    f.style.setProperty('--forca-flash', intensidade);
    reiniciarAnimacao(f, 'ativo');
  }

  function faixa(texto, classe, ms) {
    const b = el('faixa');
    el('faixa-texto').textContent = texto;
    b.className = '';
    void b.offsetWidth;
    b.className = `ativo ${classe}`;
    clearTimeout(faixa.t);
    faixa.t = setTimeout(() => (b.className = ''), ms);
  }

  function tremer(forte) {
    reiniciarAnimacao(document.body, forte ? 'tremer-forte' : 'tremer');
    setTimeout(() => document.body.classList.remove('tremer', 'tremer-forte'), 700);
  }

  function confete(opcoes) {
    if (typeof window.confetti === 'function') window.confetti({ colors: VERDES, ...opcoes });
  }

  // ---------- momentos ----------
  function acerto() {
    sons.acerto();
    flash('#5cffb8', 0.85);
    faixa('ACERTOU!', 'faixa-acerto', 1900);
    confete({ particleCount: 120, spread: 75, angle: 60, origin: { x: 0, y: 0.9 }, startVelocity: 60 });
    confete({ particleCount: 120, spread: 75, angle: 120, origin: { x: 1, y: 0.9 }, startVelocity: 60 });
    confete({ particleCount: 80, spread: 360, origin: { x: 0.5, y: 0.45 }, startVelocity: 35, shapes: ['circle'], scalar: 1.4 });
  }

  function erro(texto = 'ERROU!') {
    sons.erro();
    flash('#ef4444', 0.4);
    faixa(texto, 'faixa-erro', 1100);
    tremer(false);
  }

  function vitoria() {
    sons.vitoria();
    flash('#ffffff', 1);
    setTimeout(() => flash('#10b981', 0.9), 650);
    tremer(true);
    faixa('VOCÊ SALVOU O PLANETA!', 'faixa-vitoria', 5200);

    const fim = Date.now() + 4800;
    (function canhoes() {
      confete({ particleCount: 7, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, startVelocity: 70 });
      confete({ particleCount: 7, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, startVelocity: 70 });
      if (Date.now() < fim) requestAnimationFrame(canhoes);
    })();
    let fogos = 0;
    const intervalo = setInterval(() => {
      confete({
        particleCount: 90,
        spread: 360,
        startVelocity: 32,
        ticks: 90,
        origin: { x: 0.15 + Math.random() * 0.7, y: 0.15 + Math.random() * 0.35 },
        shapes: ['circle'],
        scalar: 1.2,
      });
      if (++fogos >= 10) clearInterval(intervalo);
    }, 420);
  }

  window.EcoFesta = { acerto, erro, vitoria, flash, sons, destravarSom: ctx };
})();
