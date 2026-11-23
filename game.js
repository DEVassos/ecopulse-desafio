// Estado da partida e troca de telas: espera → instrução → 3 perguntas → vitória ou derrota → espera.

(function () {
  const C = window.ECOPULSE_JOGO;
  const $ = (id) => document.getElementById(id);
  const TOTAL = 3;

  const estado = {
    tela: 'espera',
    vidas: C.VIDAS,
    numero: 0,
    pergunta: null,
    contexto: {},
    travado: false,
    restante: 0,
    relogio: null,
    voltar: null,
    instrucao: null,
    fimEm: 0,
  };

  // ---------- placar do dia (fica só neste navegador) ----------
  const CHAVE = 'ecopulse-desafio-placar';
  const hoje = () => new Date().toLocaleDateString('pt-BR');
  function lerPlacar() {
    try {
      const p = JSON.parse(localStorage.getItem(CHAVE) || '{}');
      return p.dia === hoje() ? p : { dia: hoje(), partidas: 0, vitorias: 0 };
    } catch {
      return { dia: hoje(), partidas: 0, vitorias: 0 };
    }
  }
  function somarPlacar(campo) {
    const p = lerPlacar();
    p[campo] += 1;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(p));
    } catch {
      /* sem armazenamento: o placar só não aparece */
    }
  }
  function mostrarPlacar() {
    const p = lerPlacar();
    $('placar').textContent =
      p.vitorias > 0
        ? `${p.vitorias} ${p.vitorias === 1 ? 'visitante já salvou' : 'visitantes já salvaram'} o planeta hoje. Você é o próximo?`
        : 'Ninguém salvou o planeta ainda hoje. Seja o primeiro!';
  }

  // ---------- telas ----------
  function mostrar(tela) {
    estado.tela = tela;
    document.querySelectorAll('.tela').forEach((t) => t.classList.toggle('ativa', t.id === `tela-${tela}`));
  }

  function voltarEspera() {
    clearTimeout(estado.voltar);
    clearTimeout(estado.instrucao);
    pararRelogio();
    mostrarPlacar();
    mostrar('espera');
  }

  function iniciar() {
    if (estado.tela !== 'espera') return;
    window.EcoFesta.destravarSom(); // o navegador só libera áudio depois de um toque
    window.EcoFesta.sons.inicio();
    estado.vidas = C.VIDAS;
    estado.numero = 0;
    estado.contexto = {};
    somarPlacar('partidas');
    $('instrucao-vidas').textContent = C.VIDAS;
    mostrar('instrucao');
    estado.instrucao = setTimeout(proxima, C.TEMPO_INSTRUCAO * 1000);
  }

  async function proxima() {
    clearTimeout(estado.instrucao);
    if (estado.tela !== 'instrucao' && estado.tela !== 'pergunta' && estado.tela !== 'erro') return;
    estado.numero += 1;
    mostrar('carregando');
    try {
      const dados = await window.EcoApi.carregarDados();
      estado.pergunta = window.EcoPerguntas.gerar(estado.numero, dados, estado.contexto);
    } catch (erro) {
      estado.numero -= 1;
      $('erro-texto').textContent = erro.message;
      mostrar('erro');
      return;
    }
    if (estado.numero === 1) estado.contexto.alvo = estado.pergunta.alvo;
    desenharPergunta();
    mostrar('pergunta');
    iniciarRelogio();
  }

  // ---------- pergunta ----------
  function desenharVidas() {
    const caixa = $('vidas');
    caixa.innerHTML = '';
    for (let i = 0; i < C.VIDAS; i++) {
      const v = document.createElement('span');
      v.className = i < estado.vidas ? 'vida' : 'vida perdida';
      v.textContent = '♥';
      caixa.appendChild(v);
    }
  }

  function desenharPergunta() {
    const p = estado.pergunta;
    estado.travado = false;
    $('numero').textContent = `Pergunta ${estado.numero} de ${TOTAL}`;
    $('etiqueta').textContent = p.etiqueta;
    $('titulo').textContent = p.titulo;
    $('dica').textContent = p.dica;
    desenharVidas();

    const caixa = $('opcoes');
    caixa.className = p.tipo === 'bolhas' ? 'opcoes bolhas' : 'opcoes cartoes';
    caixa.innerHTML = '';
    p.opcoes.forEach((opcao, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opcao';
      b.style.setProperty('--atraso', `${(i * 0.37) % 1.6}s`);
      b.dataset.id = opcao.id;
      b.innerHTML = `<span class="tecla">${i + 1}</span><span class="rotulo"></span><span class="sub"></span>`;
      b.querySelector('.rotulo').textContent = opcao.rotulo;
      b.querySelector('.sub').textContent = opcao.sub;
      b.addEventListener('click', () => responder(opcao.id, b));
      caixa.appendChild(b);
    });
  }

  function responder(id, botao) {
    if (estado.travado || estado.tela !== 'pergunta' || botao.disabled) return;
    if (id === estado.pergunta.certa) {
      estado.travado = true;
      pararRelogio();
      botao.classList.add('certa');
      if (estado.numero >= TOTAL) {
        setTimeout(vitoria, 250);
      } else {
        window.EcoFesta.acerto();
        setTimeout(proxima, 2300);
      }
    } else {
      botao.classList.add('errada');
      botao.disabled = true;
      perderVida('ERROU!');
    }
  }

  function perderVida(texto) {
    estado.vidas -= 1;
    desenharVidas();
    window.EcoFesta.erro(estado.vidas > 0 ? texto : 'ACABARAM AS VIDAS');
    if (estado.vidas <= 0) {
      estado.travado = true;
      pararRelogio();
      document.querySelectorAll('.opcao').forEach((b) => {
        if (b.dataset.id === estado.pergunta.certa) b.classList.add('revelada');
      });
      setTimeout(derrota, 1600);
    }
  }

  // ---------- relógio ----------
  function iniciarRelogio() {
    pararRelogio();
    estado.fimEm = Date.now() + C.TEMPO_POR_PERGUNTA * 1000;
    let ultimoSegundo = null;
    const passo = () => {
      const restante = Math.max(0, (estado.fimEm - Date.now()) / 1000);
      const segundo = Math.ceil(restante);
      $('relogio-barra').style.transform = `scaleX(${restante / C.TEMPO_POR_PERGUNTA})`;
      $('relogio-numero').textContent = segundo;
      $('relogio').classList.toggle('urgente', restante <= 5);
      if (restante <= 5 && segundo !== ultimoSegundo && segundo > 0) window.EcoFesta.sons.tique();
      ultimoSegundo = segundo;
      if (restante <= 0) {
        perderVida('TEMPO ESGOTADO!');
        if (estado.vidas > 0) iniciarRelogio();
      }
    };
    passo();
    estado.relogio = setInterval(passo, 100);
  }

  function pararRelogio() {
    clearInterval(estado.relogio);
    estado.relogio = null;
  }

  // ---------- fim ----------
  function vitoria() {
    somarPlacar('vitorias');
    mostrar('vitoria');
    window.EcoFesta.vitoria();
    estado.voltar = setTimeout(voltarEspera, (C.VOLTAR_ESPERA + 2) * 1000);
    estado.podeSair = Date.now() + 3000;
  }

  function derrota() {
    const certa = estado.pergunta.opcoes.find((o) => o.id === estado.pergunta.certa);
    $('derrota-resposta').textContent = certa ? certa.rotulo : '';
    mostrar('derrota');
    estado.voltar = setTimeout(voltarEspera, C.VOLTAR_ESPERA * 1000);
    estado.podeSair = Date.now() + 2000;
  }

  // ---------- fundo de bolhas ----------
  function criarFundo() {
    const fundo = $('fundo');
    for (let i = 0; i < 16; i++) {
      const b = document.createElement('span');
      const tamanho = 40 + Math.random() * 180;
      b.style.width = b.style.height = `${tamanho}px`;
      b.style.left = `${Math.random() * 100}%`;
      b.style.animationDuration = `${14 + Math.random() * 18}s`;
      b.style.animationDelay = `${-Math.random() * 30}s`;
      fundo.appendChild(b);
    }
  }

  // ---------- eventos ----------
  $('tela-espera').addEventListener('click', iniciar);
  $('tela-instrucao').addEventListener('click', proxima);
  ['tela-vitoria', 'tela-derrota'].forEach((id) =>
    $(id).addEventListener('click', () => {
      if (Date.now() > (estado.podeSair || 0)) voltarEspera();
    }),
  );
  $('erro-tentar').addEventListener('click', (e) => {
    e.stopPropagation();
    proxima();
  });
  $('erro-demo').addEventListener('click', (e) => {
    e.stopPropagation();
    C.MODO = 'demo';
    $('modo').textContent = 'modo demonstração';
    proxima();
  });
  $('erro-sair').addEventListener('click', (e) => {
    e.stopPropagation();
    voltarEspera();
  });

  document.addEventListener('keydown', (e) => {
    if (estado.tela === 'espera' && (e.key === 'Enter' || e.key === ' ')) iniciar();
    else if (estado.tela === 'pergunta' && /^[1-6]$/.test(e.key)) {
      const botao = document.querySelectorAll('.opcao')[Number(e.key) - 1];
      if (botao) botao.click();
    } else if (e.key === 'Escape') voltarEspera();
  });

  $('modo').textContent = C.MODO === 'api' ? 'dados ao vivo' : 'modo demonstração';
  criarFundo();
  mostrarPlacar();
})();
