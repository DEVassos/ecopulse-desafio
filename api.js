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

  async function carregarDados() {
    if (C.MODO === 'demo') return window.ECOPULSE_DEMO();
    if (!token) await entrar();
    const [servicos, regioes] = await Promise.all([
      lerJson('/services'),
      // Sem regiões o jogo ainda funciona: a pergunta 3 troca por outra
      lerJson('/regions').catch(() => ({ regions: [] })),
    ]);
    return {
      services: (servicos.services || []).filter((s) => s.status !== 'removido'),
      regions: regioes.regions || [],
    };
  }

  window.EcoApi = { carregarDados };
})();
