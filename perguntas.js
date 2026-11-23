// Monta cada pergunta a partir dos dados do momento em que ela abre ("foto do momento").
// Uma pergunta = { tipo: 'bolhas' | 'opcoes', etiqueta, titulo, dica, opcoes: [{ id, rotulo, sub }], certa, alvo? }

(function () {
  const C = window.ECOPULSE_JOGO;

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

  /** Maior valor bem à frente do segundo (ou não é preciso conferir). */
  const maiorComMargem = (primeiro, segundo) =>
    !exigeMargem() || segundo === undefined || (primeiro > 0 && (primeiro - segundo) / primeiro >= C.MARGEM_MINIMA);
  /** Menor valor bem abaixo do segundo. */
  const menorComMargem = (primeiro, segundo) =>
    !exigeMargem() || segundo === undefined || (segundo > 0 && (segundo - primeiro) / segundo >= C.MARGEM_MINIMA);

  function maiorPor(servicos, campo, textos, ignorarMargem = false) {
    const comValor = servicos.filter((s) => s.status === 'ativo' && typeof s[campo] === 'number');
    if (comValor.length < 2) return null;
    const ordem = [...comValor].sort((a, b) => b[campo] - a[campo]);
    if (!ignorarMargem && !maiorComMargem(ordem[0][campo], ordem[1][campo])) return null;
    return {
      tipo: 'bolhas',
      ...textos,
      opcoes: embaralhar(ordem.slice(0, 6)).map((s) => ({ id: s.id, rotulo: s.name, sub: lugar(s) })),
      certa: ordem[0].id,
      alvo: ordem[0],
    };
  }

  // Pergunta 1 — apague o datacenter mais sujo
  const TEXTO_CO2 = {
    etiqueta: 'Apague o datacenter mais sujo',
    titulo: 'Qual serviço está emitindo mais CO₂e agora?',
    dica: 'Olhe o ranking ou o tamanho das bolhas no EcoPulse e toque na bolha certa.',
  };
  function pergunta1(d) {
    return (
      maiorPor(d.services, 'emissionsG', TEXTO_CO2) ||
      maiorPor(d.services, 'energyKwh', {
        etiqueta: 'Caça ao gastão de energia',
        titulo: 'Qual serviço está gastando mais energia agora?',
        dica: 'Confira a energia (kWh) de cada serviço no EcoPulse.',
      }) ||
      maiorPor(d.services, 'cpuPercent', {
        etiqueta: 'Quem está suando a camisa?',
        titulo: 'Qual serviço está usando mais CPU agora?',
        dica: 'Confira o uso de CPU de cada serviço no EcoPulse.',
      }) ||
      maiorPor(d.services, 'emissionsG', TEXTO_CO2, true)
    );
  }

  // Pergunta 2 — quem está com problema
  function pergunta2(d) {
    const ativos = d.services.filter((s) => s.status === 'ativo');
    const problema = (status, titulo, dica) => {
      const comProblema = d.services.filter((s) => s.status === status);
      if (comProblema.length === 0 || ativos.length < 1) return null;
      const certo = sortear(comProblema);
      const opcoes = embaralhar([certo, ...embaralhar(ativos).slice(0, 3)]);
      return {
        tipo: 'opcoes',
        etiqueta: 'Alerta no painel',
        titulo,
        dica,
        opcoes: opcoes.map((s) => ({ id: s.id, rotulo: s.name, sub: lugar(s) })),
        certa: certo.id,
      };
    };
    return (
      problema('indisponivel', 'Qual destes serviços está fora do ar?', 'No EcoPulse, a cor da bolha e o status na lista mostram quem caiu.') ||
      problema('sem_metricas', 'Qual destes serviços está sem medição?', 'No EcoPulse, procure o serviço sem métricas (sem leitura de CPU e energia).') ||
      cidadeComMaisServicos(d) ||
      quantosAtivos(d)
    );
  }

  function cidadeComMaisServicos(d) {
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
    };
  }

  function quantosAtivos(d) {
    const n = d.services.filter((s) => s.status === 'ativo').length;
    const valores = embaralhar([...new Set([n, n + 1, n + 2, Math.max(0, n - 1)])]);
    return {
      tipo: 'opcoes',
      etiqueta: 'Olho no mapa',
      titulo: 'Quantos serviços estão ativos agora?',
      dica: 'Conte os serviços ativos no EcoPulse.',
      opcoes: valores.map((v) => ({ id: String(v), rotulo: String(v), sub: v === 1 ? 'serviço' : 'serviços' })),
      certa: String(n),
    };
  }

  // Pergunta 3 — para onde mover o servidor
  function pergunta3(d, contexto) {
    const servico = contexto.alvo || null;
    const regioes = d.regions.filter((r) => typeof r.carbonIntensityGco2ePerKwh === 'number');
    const candidatas = regioes.filter((r) => !servico || r.code !== servico.regionCode);
    if (candidatas.length >= 2) {
      for (let tentativa = 0; tentativa < 40; tentativa++) {
        const escolhidas = embaralhar(candidatas).slice(0, Math.min(4, candidatas.length));
        const ordem = [...escolhidas].sort((a, b) => a.carbonIntensityGco2ePerKwh - b.carbonIntensityGco2ePerKwh);
        if (!menorComMargem(ordem[0].carbonIntensityGco2ePerKwh, ordem[1].carbonIntensityGco2ePerKwh)) continue;
        return {
          tipo: 'opcoes',
          etiqueta: 'Mude o servidor de lugar',
          titulo: servico ? `Para onde mover o ${servico.name}?` : 'Para onde mover o servidor?',
          dica: 'Escolha a região com a energia mais limpa: a menor intensidade de carbono (gCO₂e/kWh) no EcoPulse.',
          opcoes: escolhidas.map((r) => ({ id: r.code, rotulo: r.city || r.region, sub: r.country })),
          certa: ordem[0].code,
        };
      }
    }
    // Sem regiões com intensidade: troca por "quem é o mais limpo", que tem resposta diferente da pergunta 1
    return (
      menorEmissao(d.services, false) ||
      maiorPor(d.services, 'cpuPercent', {
        etiqueta: 'Última chance de salvar o planeta',
        titulo: 'Qual serviço está usando mais CPU agora?',
        dica: 'Confira o uso de CPU de cada serviço no EcoPulse.',
      }) ||
      menorEmissao(d.services, true)
    );
  }

  function menorEmissao(servicos, ignorarMargem) {
    const comValor = servicos.filter((s) => s.status === 'ativo' && typeof s.emissionsG === 'number');
    if (comValor.length < 2) return null;
    const ordem = [...comValor].sort((a, b) => a.emissionsG - b.emissionsG);
    if (!ignorarMargem && !menorComMargem(ordem[0].emissionsG, ordem[1].emissionsG)) return null;
    return {
      tipo: 'bolhas',
      etiqueta: 'Ache o exemplo a seguir',
      titulo: 'Qual serviço está emitindo menos CO₂e agora?',
      dica: 'Olhe o ranking no EcoPulse: quem está lá no fim da lista?',
      opcoes: embaralhar(ordem.slice(0, 6)).map((s) => ({ id: s.id, rotulo: s.name, sub: lugar(s) })),
      certa: ordem[0].id,
    };
  }

  function gerar(numero, dados, contexto) {
    const pergunta = numero === 1 ? pergunta1(dados) : numero === 2 ? pergunta2(dados) : pergunta3(dados, contexto);
    if (!pergunta || pergunta.opcoes.length < 2) {
      throw new Error('O EcoPulse está sem dados suficientes para montar a pergunta. Confira se o worker está coletando.');
    }
    return pergunta;
  }

  window.EcoPerguntas = { gerar };
})();
