// Configuração do EcoPulse Desafio.
//
// MODO 'api'  → lê os mesmos dados que o EcoPulse mostra na tela 1 (backend ligado).
// MODO 'demo' → usa os dados do modo demonstração do app (sem rede). Use junto com o app sem VITE_API_URL.
//
// Rode o jogo com `node servidor.js`: ele repassa /api para o backend (o online, por padrão), sem CORS.
// Qual backend é escolhido na linha de comando do servidor.js, não aqui.
// Também dá para trocar pela URL: index.html?modo=demo, ou ?api=http://outro-endereco/api (aí o CORS volta a valer).

window.ECOPULSE_JOGO = {
  MODO: 'api',
  API_URL: '/api', // o próprio servidor.js, que repassa para o backend
  EMAIL: 'userplanet@ecopulse.local', // usuário criado para a feira (o backend exige formato de e-mail)
  SENHA: 'planet123',

  VIDAS: 3, // vidas para a partida inteira
  TEMPO_POR_PERGUNTA: 40, // segundos
  TEMPO_INSTRUCAO: 5, // segundos da tela "as respostas estão no EcoPulse"
  VOLTAR_ESPERA: 10, // segundos até voltar para a tela de espera depois do fim
  // 1º e 2º colocados precisam estar a essa distância (só no modo api, em que os dados mudam)
  MARGEM_MINIMA: 0.25, // números da última leitura (CPU, regiões); a CPU oscila bastante entre coletas
  MARGEM_24H: 0.03, // totais das últimas 24 h (CO₂e, energia, potência), que quase não mudam em minutos
  VOLUME: 0.9, // 0 a 1
};

(function lerUrl() {
  const c = window.ECOPULSE_JOGO;
  const p = new URLSearchParams(location.search);
  if (p.get('modo') === 'api' || p.get('modo') === 'demo') c.MODO = p.get('modo');
  if (p.get('api')) c.API_URL = p.get('api');
  if (p.get('email')) c.EMAIL = p.get('email');
  if (p.get('senha')) c.SENHA = p.get('senha');
})();
