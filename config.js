// Configuração do EcoPulse Desafio. É o único arquivo que precisa mudar no dia da feira.
//
// MODO 'api'  → lê os mesmos dados que o EcoPulse mostra na tela 1 (backend ligado).
// MODO 'demo' → usa os dados do modo demonstração do app (sem rede). Use junto com o app sem VITE_API_URL.
//
// Também dá para trocar sem editar, pela URL: index.html?modo=api&api=http://192.168.0.10:3000/api

window.ECOPULSE_JOGO = {
  MODO: 'demo',
  API_URL: 'http://localhost:3000/api', // o mesmo valor de VITE_API_URL do frontend
  EMAIL: 'userplanet@ecopulse.local', // usuário criado para a feira (o backend exige formato de e-mail)
  SENHA: 'planet123',

  VIDAS: 3, // vidas para a partida inteira
  TEMPO_POR_PERGUNTA: 40, // segundos
  TEMPO_INSTRUCAO: 5, // segundos da tela "as respostas estão no EcoPulse"
  VOLTAR_ESPERA: 10, // segundos até voltar para a tela de espera depois do fim
  // 1º e 2º colocados precisam estar a essa distância (só no modo api, em que os dados mudam)
  MARGEM_MINIMA: 0.15, // números da última leitura (CPU, regiões), que mudam a cada coleta
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
