# EcoPulse Desafio — jogo da feira

O visitante joga na tela 2, mas as respostas só estão no EcoPulse, na tela 1. São 3 perguntas e 3 vidas, e cada acerto dispara flash, confete e som.

## Como rodar

```bash
npx serve game -l 5174
```

Depois abra `http://localhost:5174` no Chrome em tela cheia (F11) ou em modo quiosque:

```bash
google-chrome --kiosk http://localhost:5174
```

Um toque em "Toque para jogar" libera o som, porque o navegador só toca áudio depois de uma interação.

## Com os dados ao vivo (modo `api`)

1. No `config.js`, troque `MODO` para `'api'` e coloque em `API_URL` o mesmo valor do `VITE_API_URL` do frontend, com o IP do PC que roda o backend (ex.: `http://192.168.0.10:3000/api`).
2. Em `EMAIL` e `SENHA`, coloque um usuário que exista no backend.
3. No `.env` do backend, acrescente a origem do jogo em `CORS_ORIGIN` (ex.: `http://localhost:5173,http://192.168.0.11:5174`) e reinicie.
4. Durante a feira, suba `POLLING_INTERVAL_MS` para `300000` (5 min), para os números não mudarem no meio de uma pergunta.

Também dá para trocar sem editar arquivo: `http://localhost:5174/?modo=api&api=http://192.168.0.10:3000/api`.

## Plano B (sem rede)

Rode o app sem `VITE_API_URL` (modo demonstração) e o jogo com `MODO: 'demo'`. Os dois usam os mesmos dados ilustrativos, que ficam em `dados-demo.js`. Se o jogo não conseguir ler a API no meio da feira, a tela de erro tem um botão "Usar modo demonstração".

## Atalhos

- `Enter`: começa a partida
- `1` a `6`: escolhe a opção (para testar sem mouse)
- `Esc`: volta para a tela de espera

## Arquivos

| Arquivo | O que faz |
| --- | --- |
| `config.js` | Modo, endereço da API, usuário, vidas e tempos |
| `api.js` | Login e leitura de `/api/services` e `/api/regions` |
| `perguntas.js` | Monta as 3 perguntas com os dados do momento |
| `game.js` | Telas, vidas, cronômetro e placar do dia |
| `festa.js` | Flash, faixa gigante, confete, tremida e sons (Web Audio, sem arquivos) |
| `dados-demo.js` | Cópia dos dados do modo demonstração do app |
| `vendor/canvas-confetti.js` | Biblioteca de confete (ISC), salva localmente para funcionar sem internet |
