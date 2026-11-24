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

As perguntas são montadas com os dados do momento em que abrem. Uma pergunta só é sorteada quando a resposta é clara: no modo `api`, o 1º colocado precisa estar bem à frente do 2º. A margem é de 3% nos totais de 24 h e de 25% nos números da última leitura (`MARGEM_24H` e `MARGEM_MINIMA` no `config.js`). Com isso, a resposta quase nunca troca enquanto o visitante procura. Por isso, ao vivo, nem todas as 13 aparecem: se todos os serviços estão ativos, por exemplo, não há pergunta de alerta.

**Se os números mudarem no meio da pergunta**, o visitante não perde por isso. Quando ele toca numa opção errada, o jogo relê os dados (a opção pisca em amarelo por um instante). Se a opção tocada for a certa com os números de agora, entre as opções que a pergunta mostrou, vale o acerto.

## Como rodar

Na pasta do jogo (a raiz deste repositório), com Node 18 ou mais novo (não precisa instalar nada):

```bash
node servidor.js
```

O `servidor.js` entrega as telas do jogo em `http://localhost:5174` e repassa os pedidos de `/api` para o backend do EcoPulse. Por padrão, é o **backend online** (`https://ecopulse-backend-lxtx.onrender.com`), o mesmo do site `https://ecopulse-app-smoky.vercel.app`. Como o navegador só fala com o `servidor.js`, **o CORS do backend não importa**: não é preciso mexer no `CORS_ORIGIN`.

Para usar outro backend, passe o endereço:

```bash
node servidor.js http://localhost:3000        # backend local, no mesmo PC
node servidor.js http://192.168.0.10:3001     # backend local em outro notebook (veja "Plano C")
```

Deixe a janela do `servidor.js` aberta. Ele também chama o backend a cada 5 min, para o Render gratuito não dormir.

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

**O usuário precisa existir no banco do backend usado.** O banco online e o local são diferentes. Para criar, use o fluxo de convite do EcoPulse:

1. Entre no EcoPulse como administrador (no online: `https://ecopulse-app-smoky.vercel.app`) e gere um convite para `userplanet@ecopulse.local`, com papel `usuario`.
2. O EcoPulse mostra o link do convite na tela (não manda e-mail, então o endereço não precisa existir). Abra o link, informe o nome "Jogo da feira" e a senha `planet123`.

Para usar outro usuário sem editar arquivo, passe pela URL: `?email=...&senha=...`.

## Na feira (backend online)

Precisa de **internet** nos dois notebooks. Eles não precisam estar na mesma rede.

| Notebook | O que fazer |
| --- | --- |
| **Aplicação (tela 1)** | Abrir `https://ecopulse-app-smoky.vercel.app` e entrar com uma conta. |
| **Jogo (tela 2)** | `git pull` (ou `git clone`), `node servidor.js` e abrir `http://localhost:5174` em tela cheia. No canto deve aparecer **"dados ao vivo"**. |

Opcional, no Render: `POLLING_INTERVAL_MS=300000` (coleta a cada 5 min), para os números mudarem pouco no meio de uma pergunta.

## Plano B (sem rede)

Rode o app do EcoPulse sem `VITE_API_URL` (modo demonstração) e o jogo com `MODO: 'demo'` no `config.js` (ou abra `http://localhost:5174/?modo=demo`). Os dois usam os mesmos dados ilustrativos, que ficam em `dados-demo.js`. Se a equipe mudar os dados de demonstração do app, mude aqui também.

Se o jogo não conseguir ler a API no meio da feira, a tela de erro tem o botão "Usar modo demonstração".

## Plano C: backend local (Docker), se o Render falhar

O jogo roda no **notebook do jogo** e lê os dados pela rede no **notebook da aplicação**, onde ficam o backend local e o EcoPulse local. Os dados ainda vêm da API de métricas na internet, então isso só ajuda se o problema for o Render.

```
notebook da aplicação                         notebook do jogo
  Docker (WSL): backend :3000, EcoPulse :5173    node servidor.js http://IP-DA-APLICACAO:3001
  portproxy :3001 → localhost:3000   ◄─rede─    http://localhost:5174
```

### Rede

Os dois notebooks precisam estar na mesma rede. **Wi-Fi de evento costuma bloquear um aparelho de falar com outro**: o mais seguro é um roteador ou o hotspot de um celular só para os dois. Teste antes da feira.

### Notebook da aplicação

1. **`.env` do backend** (na raiz do `greener-app`). Durante a feira, colete a cada 5 min:
   ```
   POLLING_INTERVAL_MS=300000
   ```
2. **Abra uma janela do Ubuntu e deixe aberta o tempo todo** (veja abaixo) e suba os containers:
   ```bash
   cd /mnt/c/dev/greener-app && docker compose up -d
   ```
   Confira no navegador: `http://localhost:3000/health` responde `{"status":"ok","db":"ok"}`.
3. **Abra a porta para a rede.** O Docker dentro do WSL só responde no próprio notebook (`localhost`). No **PowerShell como administrador**, uma vez só:
   ```powershell
   netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=3001 connectaddress=127.0.0.1 connectport=3000
   New-NetFirewallRule -DisplayName "EcoPulse API (jogo)" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
   ```
   A porta 3001 repassa para a 3000 do backend e continua valendo depois de reiniciar. Para desfazer depois da feira: `netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=3001` e `Remove-NetFirewallRule -DisplayName "EcoPulse API (jogo)"`.
4. **Descubra o IP:** `ipconfig`, linha "Endereço IPv4" do adaptador Wi-Fi (ex.: `192.168.0.10`).
5. Abra o EcoPulse local em `http://localhost:5173` e entre com sua conta.

### Notebook do jogo

1. Teste a rede: no navegador, `http://IP-DA-APLICACAO:3001/health` precisa responder `{"status":"ok","db":"ok"}`. Se não responder, o problema é rede, portproxy ou firewall, não o jogo.
2. Na pasta do jogo: `node servidor.js http://IP-DA-APLICACAO:3001` e abra `http://localhost:5174`.

### Backend no Docker dentro do WSL: deixe uma janela do Ubuntu aberta

Se o Docker do backend roda dentro do WSL (Ubuntu), o WSL desliga sozinho quando fica sem uso, e o backend cai junto. Nos testes, isso aconteceu em poucos segundos sem nenhuma sessão aberta. **Deixe uma janela do Ubuntu aberta o tempo todo.**

### Tudo num PC só

Com o backend local no mesmo PC do jogo: `node servidor.js http://localhost:3000`, sem portproxy.

## Atalhos (para a equipe)

- `Enter`: começa a partida
- `1` a `6`: escolhe a opção (para testar sem mouse)
- `Esc`: volta para a tela de espera

## Configuração (`config.js`)

| Campo | Padrão | O que faz |
| --- | --- | --- |
| `MODO` | `'api'` | `'api'` (dados ao vivo) ou `'demo'` (dados ilustrativos) |
| `API_URL` | `/api` | O próprio `servidor.js`, que repassa para o backend. O backend é escolhido na linha de comando do `servidor.js` |
| `EMAIL` / `SENHA` | `userplanet@ecopulse.local` / `planet123` | Usuário do jogo no backend |
| `VIDAS` | `3` | Vidas para a partida inteira |
| `TEMPO_POR_PERGUNTA` | `40` | Segundos por pergunta |
| `TEMPO_INSTRUCAO` | `5` | Segundos da tela de instrução |
| `VOLTAR_ESPERA` | `10` | Segundos até voltar para a tela de espera depois do fim |
| `MARGEM_MINIMA` | `0.25` | Distância mínima entre 1º e 2º nos números da última leitura (só no modo `api`) |
| `MARGEM_24H` | `0.03` | Distância mínima entre 1º e 2º nos totais de 24 h (só no modo `api`) |
| `VOLUME` | `0.9` | Volume dos sons, de 0 a 1 |

## Arquivos

| Arquivo | O que faz |
| --- | --- |
| `servidor.js` | Servidor do jogo: entrega os arquivos e repassa `/api` para o backend (online por padrão), sem CORS |
| `index.html` | As telas: espera, instrução, carregando, pergunta, vitória, derrota e erro |
| `config.js` | Modo, endereço da API, usuário, vidas, tempos e margens |
| `api.js` | Login e leitura de `/api/services`, `/api/regions` e `/api/services/ranking` (os números das 24 h que a lista do EcoPulse mostra) |
| `perguntas.js` | Banco de 13 perguntas: cada partida sorteia 3 e monta com os dados do momento |
| `game.js` | Telas, vidas, cronômetro, placar do dia e fundo da derrota |
| `festa.js` | Flash, faixa gigante, confete, tremida e sons (Web Audio, sem arquivos de áudio) |
| `style.css` | Visual: verde do EcoPulse, letras grandes para ler de longe e botões grandes para toque |
| `dados-demo.js` | Cópia dos dados do modo demonstração do app |
| `vendor/canvas-confetti.js` | Biblioteca de confete (ISC), salva localmente para funcionar sem internet |
