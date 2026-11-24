# EcoPulse Desafio — jogo da feira

Jogo de perguntas para o estande do EcoPulse. O visitante joga na **tela 2**, mas as respostas só estão no **EcoPulse, aberto na tela 1**. Para acertar, ele precisa usar o painel de verdade: a lista de serviços, o mapa e a lista de regiões.

É HTML, CSS e JavaScript puro, sem build e sem dependências para instalar.

## Como se joga

1. **Toque para jogar.** A tela de espera chama quem passa pelo corredor e mostra quantos visitantes já salvaram o planeta hoje.
2. **Instrução (5 s).** Avisa que as respostas estão no EcoPulse, na tela ao lado.
3. **3 perguntas, 40 s cada.** O visitante procura a resposta no EcoPulse e toca na opção certa no jogo.
4. **3 vidas para a partida inteira**, mostradas como folhas 🍃. Errar uma opção ou deixar o tempo acabar custa uma folha.
5. **Fim:**
   - **Acertou as 3:** tela "Você salvou o planeta!", com fanfarra, aplausos, confete e fogos. Conta no placar do dia.
   - **Perdeu as 3 vidas:** tela "Quase!", que mostra a resposta certa. O fundo fica poluído, as bolhas viram fumaça e folhas secas 🍂 caem. A equipe aproveita para mostrar no EcoPulse onde estava a resposta.
   - Depois de 10 s, ou com um toque, o jogo volta para a tela de espera, com o fundo verde de novo.

Cada acerto dispara flash, a faixa "ACERTOU!", confete e som. Cada erro dispara a faixa "ERROU!" e uma tremida na tela.

### As perguntas

Cada partida sorteia 3 perguntas de um banco de 13, em `perguntas.js`. Na mesma partida, não se repete pergunta nem resposta, e saem no máximo duas do mesmo assunto.

| Assunto | Perguntas | Onde está a resposta no EcoPulse |
| --- | --- | --- |
| Serviços | Quem emitiu mais CO₂e nas últimas 24 h · quem emitiu menos · quem gastou mais energia (e pesa mais na conta de luz) · quem tem a maior potência média · quem usa mais CPU · quem usa menos CPU | Colunas "CO₂e 24 h", "Energia 24 h", "Potência média (W)" e "CPU" da lista de serviços |
| Alertas | Qual serviço está fora do ar · qual está sem medição | Status na lista e cor da bolha no mapa |
| Regiões | Para onde mover o serviço que mais emite (menor fator de carbono) · qual região usa mais energia renovável · qual tem o maior fator de carbono | Lista de regiões: fator (gCO₂e/kWh) e "% renovável" |
| Mapa | Qual cidade tem mais serviços · quantos serviços estão ativos | Bolhas do mapa e status na lista |

As perguntas são montadas com os dados do momento em que abrem. Uma pergunta só é sorteada quando a resposta é clara: no modo `api`, o 1º colocado precisa estar bem à frente do 2º. A margem é de 3% nos totais de 24 h e de 15% nos números da última leitura (`MARGEM_24H` e `MARGEM_MINIMA` no `config.js`). Com isso, a resposta não troca enquanto o visitante procura. Por isso, ao vivo, nem todas as 13 aparecem: se todos os serviços estão ativos, por exemplo, não há pergunta de alerta.

## Como rodar

Na pasta do jogo (a raiz deste repositório):

```bash
npx serve -l 5174
```

Depois abra `http://localhost:5174` no navegador em tela cheia (F11) ou em modo quiosque:

```bash
msedge --kiosk http://localhost:5174          # Windows (Edge)
google-chrome --kiosk http://localhost:5174   # Chrome
```

O primeiro toque em "Toque para jogar" libera o som, porque o navegador só toca áudio depois de uma interação.

## Usuário do jogo no backend

No modo `api`, o jogo entra no backend com um usuário próprio, só de leitura (papel `usuario`, sem poder de administrador):

| Campo | Valor |
| --- | --- |
| E-mail | `userplanet@ecopulse.local` |
| Senha | `planet123` |

Esses valores ficam em `EMAIL` e `SENHA` no `config.js`. O backend do EcoPulse exige que o usuário seja um e-mail, por isso é `userplanet@ecopulse.local`, e não só `userplanet`.

**Se o backend for outro, ou o banco tiver sido zerado**, crie o usuário de novo pelo fluxo de convite do EcoPulse:

1. Entre no EcoPulse como administrador e gere um convite para `userplanet@ecopulse.local`, com papel `usuario`.
2. Abra o link do convite, informe um nome (ex.: "Jogo da feira") e a senha `planet123`.

Para usar outro usuário sem editar arquivo, passe pela URL: `?email=...&senha=...`.

## Com os dados ao vivo (modo `api`)

1. **Ligue o modo:** troque `MODO` para `'api'` no `config.js`, ou abra `http://localhost:5174/?modo=api`.
2. **Endereço da API:** se o backend roda no mesmo PC, o padrão `http://localhost:3000/api` já serve. Se roda em outro PC, coloque o IP dele em `API_URL` (ex.: `http://192.168.0.10:3000/api`) ou passe na URL: `?modo=api&api=http://192.168.0.10:3000/api`.
3. **Libere o jogo no backend:** no `.env` do backend, a origem do jogo precisa estar em `CORS_ORIGIN`, separada por vírgula, mantendo a do app em primeiro lugar. Depois, reinicie o backend:
   ```
   CORS_ORIGIN=http://localhost:5173,http://localhost:5174
   ```
   Com o jogo em outro PC, acrescente também a origem dele (ex.: `http://192.168.0.11:5174`).
4. **Opcional:** durante a feira, suba `POLLING_INTERVAL_MS` para `300000` (5 min) no `.env` do backend. Assim os números mudam menos no meio de uma pergunta.

### Backend no Docker dentro do WSL: deixe uma janela do Ubuntu aberta

Se o Docker do backend roda dentro do WSL (Ubuntu), o WSL desliga sozinho quando fica sem uso, e o backend cai junto. Nos testes, isso aconteceu em poucos segundos sem nenhuma sessão aberta. **Durante a feira, deixe uma janela do Ubuntu aberta o tempo todo.** Se o backend cair mesmo assim, o jogo mostra a tela de erro, com os botões "Tentar de novo" e "Usar modo demonstração".

## Plano B (sem rede)

Rode o app do EcoPulse sem `VITE_API_URL` (modo demonstração) e o jogo com `MODO: 'demo'` (o padrão). Os dois usam os mesmos dados ilustrativos, que ficam em `dados-demo.js`. Se a equipe mudar os dados de demonstração do app, mude aqui também.

Se o jogo não conseguir ler a API no meio da feira, a tela de erro tem o botão "Usar modo demonstração".

## Atalhos (para a equipe)

- `Enter`: começa a partida
- `1` a `6`: escolhe a opção (para testar sem mouse)
- `Esc`: volta para a tela de espera

## Configuração (`config.js`)

| Campo | Padrão | O que faz |
| --- | --- | --- |
| `MODO` | `'demo'` | `'demo'` (dados ilustrativos) ou `'api'` (dados ao vivo) |
| `API_URL` | `http://localhost:3000/api` | Endereço da API, o mesmo `VITE_API_URL` do frontend |
| `EMAIL` / `SENHA` | `userplanet@ecopulse.local` / `planet123` | Usuário do jogo no backend |
| `VIDAS` | `3` | Vidas para a partida inteira |
| `TEMPO_POR_PERGUNTA` | `40` | Segundos por pergunta |
| `TEMPO_INSTRUCAO` | `5` | Segundos da tela de instrução |
| `VOLTAR_ESPERA` | `10` | Segundos até voltar para a tela de espera depois do fim |
| `MARGEM_MINIMA` | `0.15` | Distância mínima entre 1º e 2º nos números da última leitura (só no modo `api`) |
| `MARGEM_24H` | `0.03` | Distância mínima entre 1º e 2º nos totais de 24 h (só no modo `api`) |
| `VOLUME` | `0.9` | Volume dos sons, de 0 a 1 |

## Arquivos

| Arquivo | O que faz |
| --- | --- |
| `index.html` | As telas: espera, instrução, carregando, pergunta, vitória, derrota e erro |
| `config.js` | Modo, endereço da API, usuário, vidas, tempos e margens |
| `api.js` | Login e leitura de `/api/services`, `/api/regions` e `/api/services/ranking` (os números das 24 h que a lista do EcoPulse mostra) |
| `perguntas.js` | Banco de 13 perguntas: cada partida sorteia 3 e monta com os dados do momento |
| `game.js` | Telas, vidas, cronômetro, placar do dia e fundo da derrota |
| `festa.js` | Flash, faixa gigante, confete, tremida e sons (Web Audio, sem arquivos de áudio) |
| `style.css` | Visual: verde do EcoPulse, letras grandes para ler de longe e botões grandes para toque |
| `dados-demo.js` | Cópia dos dados do modo demonstração do app |
| `vendor/canvas-confetti.js` | Biblioteca de confete (ISC), salva localmente para funcionar sem internet |
