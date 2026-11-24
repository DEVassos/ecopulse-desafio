// Leitura dos dados: as mesmas rotas que o EcoPulse usa (GET /api/services e GET /api/regions).

(function () {
  const C = window.ECOPULSE_JOGO;
  let token = null;

  async function pedir(caminho, opcoes = {}) {
    const controle = new AbortController();
    const limite = setTimeout(() => controle.abort(), 8000);
    try {
      return await fetch(C.API_URL.replace(/\/$/, '') + caminho, {
        ...opcoes,
        signal: controle.signal,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
    } catch (erro) {
      throw new Error(
        `Não consegui falar com o backend em ${C.API_URL}. Confira se ele está ligado, se os dois PCs estão na mesma rede e se a origem do jogo está no CORS_ORIGIN.`,
      );
    } finally {
      clearTimeout(limite);
    }
  }

  async function entrar() {
    const resposta = await pedir('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: C.EMAIL, password: C.SENHA }),
    });
    if (resposta.status === 401) throw new Error('O backend recusou o e-mail e a senha do jogo. Confira EMAIL e SENHA no config.js.');
    if (!resposta.ok) throw new Error(`O login do jogo falhou (HTTP ${resposta.status}).`);
    token = (await resposta.json()).token;
  }

  async function lerJson(caminho, segundaTentativa = false) {
    if (!token) await entrar();
    const resposta = await pedir(caminho);
    if (resposta.status === 401 && !segundaTentativa) {
      token = null;
      return lerJson(caminho, true);
    }
    if (!resposta.ok) throw new Error(`A rota ${caminho} respondeu HTTP ${resposta.status}.`);
    return resposta.json();
  }

  /**
   * As colunas "CO₂e 24 h", "Energia 24 h" e "Potência média (W)" do EcoPulse são das últimas 24 h
   * (GET /api/services/ranking), não da última leitura. Cada serviço ganha co2e24h, energia24h e potenciaW
   * com esses mesmos números. Sem o ranking, faz como a tabela do EcoPulse: usa a última leitura e fica sem potência.
   */
  function completar24h(servicos, ranking) {
    const porId = new Map(((ranking && ranking.services) || []).map((r) => [r.id, r]));
    return servicos.map((s) => {
      const r = porId.get(s.id);
      if (!ranking) return { ...s, co2e24h: s.emissionsG, energia24h: s.energyKwh, potenciaW: null };
      const potencia =
        r && typeof r.energyKwh === 'number' && r.monitoredSeconds > 0 ? (r.energyKwh * 3600000) / r.monitoredSeconds : null;
      return { ...s, co2e24h: r ? r.co2eGrams : null, energia24h: r ? r.energyKwh : null, potenciaW: potencia };
    });
  }

  /** Modo demonstração do app: a leitura ilustrativa vale 1 h, então 24 h = 24 leituras e a potência = kWh × 1000. */
  function completarDemo(servicos) {
    return servicos.map((s) => ({
      ...s,
      co2e24h: typeof s.emissionsG === 'number' ? s.emissionsG * 24 : null,
      energia24h: typeof s.energyKwh === 'number' ? s.energyKwh * 24 : null,
      potenciaW: typeof s.energyKwh === 'number' ? s.energyKwh * 1000 : null,
    }));
  }

  async function carregarDados() {
    if (C.MODO === 'demo') {
      const d = await window.ECOPULSE_DEMO();
      return { services: completarDemo(d.services), regions: d.regions };
    }
    if (!token) await entrar();
    const ate = new Date();
    const de = new Date(ate.getTime() - 24 * 60 * 60 * 1000);
    const [servicos, regioes, ranking] = await Promise.all([
      lerJson('/services'),
      // Sem regiões o jogo ainda funciona: as perguntas de região só não são sorteadas
      lerJson('/regions').catch(() => ({ regions: [] })),
      lerJson(`/services/ranking?metric=co2e&from=${encodeURIComponent(de.toISOString())}&to=${encodeURIComponent(ate.toISOString())}`).catch(
        () => null,
      ),
    ]);
    return {
      services: completar24h((servicos.services || []).filter((s) => s.status !== 'removido'), ranking),
      regions: regioes.regions || [],
    };
  }

  window.EcoApi = { carregarDados };
})();
