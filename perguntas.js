// Banco de perguntas. Cada partida sorteia 3 perguntas diferentes, e cada uma é montada com os dados
// do momento em que ela abre ("foto do momento"). Todas as respostas estão visíveis no EcoPulse (tela 1).
//
// Uma pergunta = { tipo: 'bolhas' | 'opcoes', etiqueta, titulo, dica, opcoes: [{ id, rotulo, sub }], certa, conferir }
//
// Regras do sorteio, para cada partida ficar variada:
//   - a mesma pergunta não se repete na partida;
//   - no máximo duas perguntas da mesma família (serviços, alertas, regiões, mapa);
//   - a resposta certa não se repete na partida.
// Se os dados não permitirem, as regras de família e de resposta são relaxadas, nessa ordem.
//
// conferir(dadosNovos) devolve os ids certos com os números de agora, só entre as opções mostradas. O jogo usa
// quando o visitante erra: se os dados mudaram no meio da pergunta e ele acertou pela tela atual, vale o acerto.

(function () {
  const C = window.ECOPULSE_JOGO;

  // ---------- utilidades ----------
  const embaralhar = (lista) => {
    const a = [...lista];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const sortear = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const lugar = (s) => [s.city, s.country].filter(Boolean).join(', ') || s.region || '';
  const exigeMargem = () => C.MODO === 'api'; // no modo demo os números não mudam

  /**
   * O 1º colocado está bem separado do 2º? Empate nunca vale. No modo api, exige a margem (MARGEM_MINIMA
   * ou, nos totais de 24 h, MARGEM_24H), para os números não trocarem de posição enquanto o visitante procura.
   */
  function folga(primeiro, segundo, maior, margem = C.MARGEM_MINIMA) {
    if (segundo === undefined) return true;
    if (primeiro === segundo) return false;
    if (!exigeMargem()) return true;
    const base = maior ? primeiro : segundo;
    return base > 0 && Math.abs(primeiro - segundo) / base >= margem;
  }
  const CAMPOS_24H = ['co2e24h', 'energia24h', 'potenciaW'];

  /**
   * Serviços com valor no campo, de qualquer status: a lista do EcoPulse mostra todos, então o 1º colocado
   * do jogo é o mesmo da tela. co2e24h, energia24h e potenciaW são das últimas 24 h (ver api.js).
   */
  const comValor = (d, campo) => d.services.filter((s) => typeof s[campo] === 'number');
  const opcaoServico = (s) => ({ id: s.id, rotulo: s.name, sub: lugar(s) });
  const opcaoRegiao = (r) => ({ id: r.code, rotulo: r.city || r.region, sub: r.country });

  /**
   * Ids, entre `ids`, que têm o melhor valor de `campo` em `lista` (mais de um se empatarem). Serve para
   * reconferir uma resposta com dados novos: só compara as opções que o visitante viu na tela do jogo.
   */
  function melhoresEntre(lista, ids, campo, maior, chave = 'id') {
    const candidatos = lista.filter((x) => ids.includes(x[chave]) && typeof x[campo] === 'number');
    if (candidatos.length === 0) return [];
    const valores = candidatos.map((x) => x[campo]);
    const alvo = maior ? Math.max(...valores) : Math.min(...valores);
    return candidatos.filter((x) => x[campo] === alvo).map((x) => x[chave]);
  }

  // ---------- fábricas ----------
  /** "Qual serviço tem mais/menos <campo>?" com bolhas do mesmo tamanho. */
  function rankingServicos(campo, maior, textos) {
    return (d) => {
      const lista = comValor(d, campo);
      if (lista.length < 2) return null;
      const ordem = [...lista].sort((a, b) => (maior ? b[campo] - a[campo] : a[campo] - b[campo]));
      const margem = CAMPOS_24H.includes(campo) ? C.MARGEM_24H : C.MARGEM_MINIMA;
      if (!folga(ordem[0][campo], ordem[1][campo], maior, margem)) return null;
      const opcoes = embaralhar(ordem.slice(0, 6)).map(opcaoServico);
      const ids = opcoes.map((o) => o.id);
      return {
        tipo: 'bolhas',
        ...textos,
        opcoes,
        certa: ordem[0].id,
        conferir: (novos) => melhoresEntre(novos.services, ids, campo, maior),
      };
    };
  }

  /** Sorteia até 4 regiões em que o 1º colocado em <campo> fica bem separado do 2º. */
  function rankingRegioes(d, campo, maior, excluir) {
    const regioes = d.regions.filter((r) => typeof r[campo] === 'number' && r.code !== excluir);
    if (regioes.length < 2) return null;
    for (let tentativa = 0; tentativa < 40; tentativa++) {
      const escolhidas = embaralhar(regioes).slice(0, Math.min(4, regioes.length));
      const ordem = [...escolhidas].sort((a, b) => (maior ? b[campo] - a[campo] : a[campo] - b[campo]));
      if (folga(ordem[0][campo], ordem[1][campo], maior)) return { escolhidas, certa: ordem[0] };
    }
    return null;
  }

  /** Reconferência de uma pergunta de regiões: a melhor entre as regiões sorteadas, com os números novos. */
  const conferirRegioes = (r, campo, maior) => {
    const codigos = r.escolhidas.map((x) => x.code);
    return (novos) => melhoresEntre(novos.regions, codigos, campo, maior, 'code');
  };

  /** "Qual destes serviços está <status>?": um com o problema e até 3 ativos. */
  function servicoComProblema(status, titulo, dica) {
    return (d) => {
      const comProblema = d.services.filter((s) => s.status === status);
      const ativos = d.services.filter((s) => s.status === 'ativo');
      if (comProblema.length === 0 || ativos.length < 1) return null;
      const certo = sortear(comProblema);
      return {
        tipo: 'opcoes',
        etiqueta: 'Alerta no painel',
        titulo,
        dica,
        opcoes: embaralhar([certo, ...embaralhar(ativos).slice(0, 3)]).map(opcaoServico),
        certa: certo.id,
        conferir: (novos) => novos.services.filter((s) => s.status === status).map((s) => s.id),
      };
    };
  }

  // ---------- o banco ----------
  const BANCO = [
    // Família "servicos": rankings da lista de serviços
    {
      id: 'mais-co2',
      familia: 'servicos',
      montar: rankingServicos('co2e24h', true, {
        etiqueta: 'Apague o datacenter mais sujo',
        titulo: 'Qual serviço emitiu mais CO₂e nas últimas 24 h?',
        dica: 'Olhe a coluna CO₂e 24 h na lista do EcoPulse e toque na bolha certa.',
      }),
    },
    {
      id: 'menos-co2',
      familia: 'servicos',
      montar: rankingServicos('co2e24h', false, {
        etiqueta: 'Ache o exemplo a seguir',
        titulo: 'Qual serviço emitiu menos CO₂e nas últimas 24 h?',
        dica: 'Olhe a coluna CO₂e 24 h no EcoPulse: quem está lá no fim da lista?',
      }),
    },
    {
      id: 'mais-energia',
      familia: 'servicos',
      montar: rankingServicos('energia24h', true, {
        etiqueta: 'Caça ao gastão de energia',
        titulo: 'Qual serviço gastou mais energia nas últimas 24 h?',
        dica: 'Mais energia = mais conta de luz e mais CO₂e. Veja a coluna Energia 24 h no EcoPulse.',
      }),
    },
    {
      id: 'mais-potencia',
      familia: 'servicos',
      montar: rankingServicos('potenciaW', true, {
        etiqueta: 'Quem puxa mais da tomada?',
        titulo: 'Qual serviço tem a maior potência média?',
        dica: 'Veja a coluna Potência média (W) na lista de serviços do EcoPulse.',
      }),
    },
    {
      id: 'mais-cpu',
      familia: 'servicos',
      montar: rankingServicos('cpuPercent', true, {
        etiqueta: 'Quem está suando a camisa?',
        titulo: 'Qual serviço está usando mais CPU agora?',
        dica: 'Confira a coluna de CPU na lista de serviços do EcoPulse.',
      }),
    },
    {
      id: 'menos-cpu',
      familia: 'servicos',
      montar: rankingServicos('cpuPercent', false, {
        etiqueta: 'Quem está de boa?',
        titulo: 'Qual serviço está usando menos CPU agora?',
        dica: 'Confira a coluna de CPU na lista de serviços do EcoPulse.',
      }),
    },

    // Família "alertas": status dos serviços
    {
      id: 'fora-do-ar',
      familia: 'alertas',
      montar: servicoComProblema(
        'indisponivel',
        'Qual destes serviços está fora do ar?',
        'No EcoPulse, a cor da bolha e o status na lista mostram quem caiu.',
      ),
    },
    {
      id: 'sem-medicao',
      familia: 'alertas',
      montar: servicoComProblema(
        'sem_metricas',
        'Qual destes serviços está sem medição?',
        'No EcoPulse, procure o serviço sem métricas (sem leitura de CPU e energia).',
      ),
    },

    // Família "regioes": lista de regiões (intensidade de carbono e % renovável)
    {
      id: 'mover-servidor',
      familia: 'regioes',
      montar(d) {
        // O serviço a mover é o que mais emitiu nas 24 h; a região dele não entra nas opções
        const emissores = comValor(d, 'co2e24h').sort((a, b) => b.co2e24h - a.co2e24h);
        const servico = emissores[0] || null;
        const r = rankingRegioes(d, 'carbonIntensityGco2ePerKwh', false, servico && servico.regionCode);
        if (!r) return null;
        return {
          tipo: 'opcoes',
          etiqueta: 'Mude o servidor de lugar',
          titulo: servico ? `Para onde mover o ${servico.name}?` : 'Para onde mover o servidor?',
          dica: 'Escolha a energia mais limpa: o menor fator de carbono (gCO₂e/kWh) na lista de regiões do EcoPulse.',
          opcoes: r.escolhidas.map(opcaoRegiao),
          certa: r.certa.code,
          conferir: conferirRegioes(r, 'carbonIntensityGco2ePerKwh', false),
        };
      },
    },
    {
      id: 'mais-renovavel',
      familia: 'regioes',
      montar(d) {
        const r = rankingRegioes(d, 'renewableSharePercent', true);
        if (!r) return null;
        return {
          tipo: 'opcoes',
          etiqueta: 'Energia do sol, do vento e da água',
          titulo: 'Qual destas regiões usa mais energia renovável?',
          dica: 'Na lista de regiões do EcoPulse, compare o "% renovável".',
          opcoes: r.escolhidas.map(opcaoRegiao),
          certa: r.certa.code,
          conferir: conferirRegioes(r, 'renewableSharePercent', true),
        };
      },
    },
    {
      id: 'regiao-mais-suja',
      familia: 'regioes',
      montar(d) {
        const r = rankingRegioes(d, 'carbonIntensityGco2ePerKwh', true);
        if (!r) return null;
        return {
          tipo: 'opcoes',
          etiqueta: 'Fuja da energia suja',
          titulo: 'Qual destas regiões tem o maior fator de carbono?',
          dica: 'Procure o maior fator (gCO₂e/kWh) na lista de regiões do EcoPulse: é onde a energia é mais suja.',
          opcoes: r.escolhidas.map(opcaoRegiao),
          certa: r.certa.code,
          conferir: conferirRegioes(r, 'carbonIntensityGco2ePerKwh', true),
        };
      },
    },

    // Família "mapa": contagens no mapa e na lista
    {
      id: 'cidade-mais-servicos',
      familia: 'mapa',
      montar(d) {
        const contagem = new Map();
        for (const s of d.services) if (s.city) contagem.set(s.city, (contagem.get(s.city) || 0) + 1);
        const ordem = [...contagem].sort((a, b) => b[1] - a[1]);
        if (ordem.length < 2 || ordem[0][1] === ordem[1][1]) return null; // precisa de uma vencedora única
        const opcoes = embaralhar([ordem[0], ...embaralhar(ordem.slice(1)).slice(0, 3)]);
        return {
          tipo: 'opcoes',
          etiqueta: 'Olho no mapa',
          titulo: 'Qual cidade tem mais serviços monitorados?',
          dica: 'Conte as bolhas de cada cidade no mapa do EcoPulse.',
          opcoes: opcoes.map(([cidade]) => ({ id: cidade, rotulo: cidade, sub: '' })),
          certa: ordem[0][0],
          conferir: (novos) => {
            const conta = opcoes.map(([cidade]) => ({ cidade, n: novos.services.filter((s) => s.city === cidade).length }));
            return melhoresEntre(conta, conta.map((c) => c.cidade), 'n', true, 'cidade');
          },
        };
      },
    },
    {
      id: 'quantos-ativos',
      familia: 'mapa',
      montar(d) {
        const n = d.services.filter((s) => s.status === 'ativo').length;
        if (n < 1) return null;
        const valores = embaralhar([...new Set([n, n + 1, n + 2, Math.max(0, n - 1)])]);
        return {
          tipo: 'opcoes',
          etiqueta: 'Contagem rápida',
          titulo: 'Quantos serviços estão ativos agora?',
          dica: 'Conte os serviços com status ativo no EcoPulse.',
          opcoes: valores.map((v) => ({ id: String(v), rotulo: String(v), sub: v === 1 ? 'serviço' : 'serviços' })),
          certa: String(n),
          conferir: (novos) => [String(novos.services.filter((s) => s.status === 'ativo').length)],
        };
      },
    },
  ];

  // ---------- sorteio ----------
  function rotuloCerto(p) {
    const certa = p.opcoes.find((o) => o.id === p.certa);
    return certa ? certa.rotulo : p.certa;
  }

  /** Primeira pergunta da ordem sorteada que dá para montar com os dados e respeita as regras pedidas. */
  function escolher(dados, contexto, regras) {
    for (const item of contexto.ordem) {
      if (contexto.usadas.includes(item.id)) continue;
      if (regras.familia && contexto.familias.filter((f) => f === item.familia).length >= 2) continue;
      const p = item.montar(dados);
      if (!p || p.opcoes.length < 2) continue;
      if (regras.resposta && contexto.respostas.includes(rotuloCerto(p))) continue;
      return { item, p };
    }
    return null;
  }

  /**
   * Monta a pergunta `numero` (1 a 3) da partida. `contexto` começa vazio a cada partida e guarda
   * a ordem sorteada e o que já saiu. Se a montagem falhar, nada é gravado, e dá para tentar de novo.
   */
  function gerar(numero, dados, contexto) {
    if (!contexto.ordem) {
      contexto.ordem = embaralhar(BANCO);
      contexto.usadas = [];
      contexto.familias = [];
      contexto.respostas = [];
    }
    const achou =
      escolher(dados, contexto, { familia: true, resposta: true }) ||
      escolher(dados, contexto, { familia: false, resposta: true }) ||
      escolher(dados, contexto, { familia: false, resposta: false });
    if (!achou) {
      throw new Error('O EcoPulse está sem dados suficientes para montar a pergunta. Confira se o worker está coletando.');
    }
    contexto.usadas.push(achou.item.id);
    contexto.familias.push(achou.item.familia);
    contexto.respostas.push(rotuloCerto(achou.p));
    return achou.p;
  }

  window.EcoPerguntas = { gerar, BANCO };
})();
