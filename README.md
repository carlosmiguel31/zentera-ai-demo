# Zentera AI Demo

Página pública de **demonstração interativa** da inteligência artificial de
atendimento da Zentera Virtua. O visitante entra, conversa com o agente como se
fosse um cliente de um provedor de internet, e é conduzido para a conversa
comercial.

Projeto independente. **Não substitui** a landing institucional, que continua
separada em `https://zenteravirtua.com.br`.

Endereço planejado: `https://teste.zenteravirtua.com.br`

---

## Stack

| Camada     | Tecnologia                                     |
| ---------- | ---------------------------------------------- |
| Framework  | TanStack Start (React 19 + TypeScript)         |
| Build      | Vite 8                                         |
| Servidor   | Nitro 3, preset `node-server`                  |
| Estilo     | Tailwind CSS 4 (tokens CSS, tema claro/escuro) |
| Animação   | Framer Motion                                  |
| Ícones     | Lucide React                                   |
| Primitivos | Radix UI (diálogo de confirmação)              |
| Runtime    | Bun (desenvolvimento) / Node 20+ (produção)    |

---

## Arquitetura

```text
Browser
  ↓  POST /api/chat          { sessionId, messageId, message }
zentera-ai-demo (Node, 127.0.0.1:3200)
  ↓  POST http://127.0.0.1:3001/api/integrations/generic-webhook/incoming
Aplicação Zentera
  ↓  { ok: true, data: { replyText, ... } }
zentera-ai-demo            extrai data.replyText
  ↓  { reply }
Browser
```

Landing e aplicação Zentera ficam na **mesma VPS**, então a chamada é por
loopback. O IP público não aparece no código: o endereço vem sempre de
`AI_WEBHOOK_URL`.

O navegador nunca fala com a aplicação Zentera — só com `/api/chat`.

### Mapeamento de campos

| Landing     | Aplicação Zentera        | Papel                    |
| ----------- | ------------------------ | ------------------------ |
| `sessionId` | `externalConversationId` | memória da conversa      |
| `messageId` | `externalMessageId`      | idempotência             |
| `message`   | `messageText`            | texto do visitante       |
| —           | `tenantId`               | `ZENTERA_DEMO_TENANT_ID` |
| —           | `platform`               | constante `"generic"`    |
| —           | `channel`                | constante `"web"`        |

A landing não conhece nome, telefone, CPF nem e-mail do visitante, então os
campos opcionais de identificação simplesmente não são enviados. Nada é
inventado para preencher o payload.

---

## Instalação

```bash
bun install
cp .env.example .env
```

## Desenvolvimento

```bash
bun run dev          # http://localhost:3000
bun run lint
bun run format
bun run build
bun run start        # roda o build gerado
```

---

## Configuração (`.env`)

O `.env.example` está dividido em duas seções, e a divisão é a regra de
segurança do projeto.

### Privado — só existe no processo Node

```env
AI_WEBHOOK_URL=http://127.0.0.1:3001/api/integrations/generic-webhook/incoming
AI_WEBHOOK_SECRET=
ZENTERA_DEMO_TENANT_ID=empresa_demo

AI_REQUEST_TIMEOUT_MS=30000

DEMO_MAX_MESSAGES=15
DEMO_MAX_MESSAGE_LENGTH=1500
DEMO_RATE_LIMIT_MAX=20
DEMO_RATE_LIMIT_WINDOW_MS=600000
```

`AI_WEBHOOK_URL`, `AI_WEBHOOK_SECRET` e `ZENTERA_DEMO_TENANT_ID` são
estritamente server-side e não têm prefixo `VITE_`, logo não podem entrar no
bundle do navegador.

### Público — chega ao navegador

```env
VITE_PUBLIC_SITE_URL=https://teste.zenteravirtua.com.br
VITE_PUBLIC_MAIN_SITE_URL=https://zenteravirtua.com.br
VITE_DEMO_MAX_MESSAGES=15
VITE_DEMO_MAX_MESSAGE_LENGTH=1500
```

O Vite só expõe ao navegador variáveis com prefixo `VITE_`. Por isso os valores
públicos que o briefing chamava de `PUBLIC_*` aparecem aqui como
`VITE_PUBLIC_*`. **Nenhuma variável `VITE_*` pode conter segredo.**

Mantenha `DEMO_MAX_MESSAGES` e `VITE_DEMO_MAX_MESSAGES` com o mesmo valor: o
servidor é quem decide de verdade, o valor público só ajusta a interface.

---

## Como o segredo é protegido

1. `AI_WEBHOOK_URL`, `AI_WEBHOOK_SECRET` e `ZENTERA_DEMO_TENANT_ID` são lidos
   apenas em `src/server/config.ts`, via `process.env`.
2. Esse módulo é importado somente por `src/server/*` e pela rota
   `src/routes/api/chat.ts`, que rodam exclusivamente no servidor.
3. Nenhum componente do cliente importa `src/server/*`.
4. O navegador nunca fala com o provedor de IA — só com `/api/chat`.
5. O header `Authorization: Bearer ...` é montado no servidor e só é enviado se
   a variável estiver preenchida.

Verificação rápida depois de um build:

```bash
grep -ril "AI_WEBHOOK_SECRET\|AI_WEBHOOK_URL\|ZENTERA_DEMO_TENANT_ID" .output/public/
```

---

## Contrato da API

### Requisição

`POST /api/chat`

```json
{
  "sessionId": "demo_550e8400-e29b-41d4-a716-446655440000",
  "messageId": "b6f0c2a1-6f8d-4a1e-9b0c-2f1d4e7a9c33",
  "message": "Quero contratar internet",
  "metadata": { "source": "zentera-ai-demo" }
}
```

`sessionId` e `messageId` são obrigatórios. `metadata` é opcional e o servidor
não confia em nada vindo dele. O `messageId` é o que torna o retry idempotente
— veja a seção sobre idempotência.

### Resposta de sucesso

```json
{
  "reply": "Claro! Vou te ajudar com a contratação."
}
```

Só o texto. A aplicação Zentera devolve metadata interna extensa — `provider`,
`engine`, `toolCalls`, `fallbackUsed`, `policies`, `memory`, `idempotency`,
`observability`, `webhookAuth`, estados internos — e **nada disso atravessa
para o navegador**.

`conversationState`, `detectedIntent` e `shouldHandoffToHuman` também ficam no
servidor por enquanto. Se algum deles for aprovado para uso na interface no
futuro, o lugar de liberar é `ChatSuccessResponse` em `src/lib/types.ts`, campo
a campo — nunca repassando o objeto inteiro.

### Respostas de erro

Sempre no formato `{ "error": { "code", "message" } }`. O `message` é o texto em
português exibido ao visitante; o `code` é estável para tratamento na interface.

| Código               | HTTP | Texto mostrado                                         |
| -------------------- | ---- | ------------------------------------------------------ |
| `invalid_body`       | 400  | Não conseguimos ler sua mensagem. Tente novamente.     |
| `invalid_message`    | 400  | Escreva uma mensagem antes de enviar.                  |
| `invalid_message_id` | 400  | Não conseguimos identificar sua mensagem…              |
| `message_too_long`   | 413  | Sua mensagem é muito longa para esta demonstração.     |
| `rate_limited`       | 429  | Você enviou muitas mensagens em pouco tempo…           |
| `demo_limit_reached` | 429  | Você chegou ao final desta demonstração.               |
| `demo_unavailable`   | 503  | A demonstração está temporariamente indisponível.      |
| `upstream_timeout`   | 504  | A resposta está demorando mais que o esperado…         |
| `upstream_error`     | 502  | Não conseguimos falar com a IA agora. Tente novamente. |

Stack trace, token, URL interna, variável de ambiente ou erro bruto do provedor
**nunca** saem do servidor.

---

## Integração com a aplicação Zentera (o adapter)

Toda a conversa com a aplicação Zentera está em **um único arquivo**:
`src/server/ai-client.ts`. A rota `/api/chat` e o frontend não conhecem esse
contrato — eles falam apenas em `{ sessionId, messageId, message }` e recebem
`{ reply }`.

### O que ele envia

```
POST <AI_WEBHOOK_URL>
Content-Type: application/json
Accept: application/json
Authorization: Bearer <AI_WEBHOOK_SECRET>   (só se configurado)

{
  "tenantId": "empresa_demo",
  "platform": "generic",
  "channel": "web",
  "externalConversationId": "demo_550e8400-e29b-41d4-a716-446655440000",
  "externalMessageId": "b6f0c2a1-6f8d-4a1e-9b0c-2f1d4e7a9c33",
  "messageText": "Quero contratar internet"
}
```

`platform` e `channel` são constantes. `tenantId` vem de
`ZENTERA_DEMO_TENANT_ID`. Os outros três são o mapeamento direto da tabela na
seção Arquitetura.

Campos opcionais de identificação (`customerName`, `customerPhone` e afins) não
são enviados: a landing não tem esses dados e nada é inventado.

### O que ele aceita de volta

```json
{
  "ok": true,
  "data": {
    "replyText": "Resposta da IA",
    "conversationState": "DIAGNOSING",
    "detectedIntent": "TECHNICAL_SUPPORT",
    "shouldHandoffToHuman": false,
    "metadata": {}
  }
}
```

Só há sucesso quando **todas** estas condições valem:

1. HTTP 2xx;
2. corpo é JSON válido;
3. `ok === true`;
4. `data` é um objeto;
5. `data.replyText` é uma string;
6. `replyText` não está vazia depois do `trim()`.

Qualquer degrau que falhe vira erro controlado (`upstream_error`, HTTP 502). O
JSON bruto nunca chega ao visitante. O degrau exato que falhou é registrado no
log técnico — `not_object`, `ok_false`, `missing_data`, `missing_reply_text`,
`empty_reply_text` — sem o corpo da resposta.

### Autenticação

A autenticação do webhook Zentera está desativada no momento, então
`AI_WEBHOOK_SECRET` pode ficar vazio e nenhum header `Authorization` é enviado.

Quando for ativada: preencha a variável e reinicie o processo. O header
`Authorization: Bearer <valor>` passa a ser montado no servidor
automaticamente. Nenhuma mudança de código é necessária, e o segredo nunca
volta para o frontend.

### Provider e fallback

A aplicação pode devolver internamente `provider: MOCK`, `fallbackUsed: true`,
`fallbackReason` e semelhantes. A landing **ignora** tudo isso e exibe apenas
`replyText`. Não existe selo de "IA real", nome de provider ou indicador de
modelo na interface — e não deve existir sem decisão explícita.

### Trocar de endpoint

Edite `AI_WEBHOOK_URL` no `.env` e reinicie o processo. Se o contrato mudar, o
único ponto a alterar é `sendToAi` em `src/server/ai-client.ts` — o frontend
não muda.

### Sem endpoint configurado

- **Desenvolvimento** (`bun run dev`): responde em modo simulado, com o texto
  identificando-se claramente como simulação e um selo "Modo simulado" no
  cabeçalho do chat. O selo viaja no header `X-Zentera-Demo-Mode`, fora do
  corpo, para manter a resposta limpa.
- **Produção**: devolve `503 demo_unavailable`. A página nunca finge que uma IA
  real respondeu.

---

## Contexto da conversa — responsabilidade do orquestrador

Esta é a parte mais importante para quem for conectar a IA real.

A rota `/api/chat` envia **apenas a mensagem atual**. O histórico do navegador
não é reenviado a cada requisição: o payload fica pequeno e previsível, e o
cliente não vira fonte de verdade de um contexto que ele poderia adulterar.

**Consequência direta:** a memória da conversa é mantida pela aplicação
Zentera, que identifica a conversa pelo `externalConversationId`.

Duas mensagens da mesma conversa:

```json
{
  "externalConversationId": "demo_ABC",
  "externalMessageId": "msg_001",
  "messageText": "Meu nome é Carlos"
}
```

```json
{
  "externalConversationId": "demo_ABC",
  "externalMessageId": "msg_002",
  "messageText": "Qual plano você recomenda?"
}
```

O `externalConversationId` é o mesmo nas duas — é o `sessionId` da landing, que
permanece estável durante toda a conversa. Na segunda mensagem, a aplicação já
deve saber que o cliente se chama Carlos.

Um `externalConversationId` novo é gerado **apenas** quando o visitante clica
em "Nova conversa". Nunca por mensagem.

O `externalMessageId` (o `messageId` da landing) muda a cada mensagem nova e é
**repetido nos retries**, o que alimenta a idempotência dos dois lados: a cota
comercial aqui e o controle de duplicatas na aplicação Zentera.

O `sessionId` é rotativo e descartável: muda no "Nova conversa" e some quando o
visitante fecha a aba. Não é identificador de pessoa e não deve ser tratado
como dado cadastral.

---

## Sessão

- `sessionId` é gerado no navegador com `crypto.randomUUID()`, no formato
  `demo_<uuid>`.
- Persiste em **`sessionStorage`**: um refresh preserva a conversa, outra aba
  abre uma sessão própria, fechar a aba descarta tudo.
- Nenhum dado pessoal (e-mail, telefone, IP) entra no identificador.
- O histórico local guarda no máximo as últimas 30 mensagens.
- "Nova conversa" limpa as mensagens, gera um novo `sessionId` e volta ao estado
  inicial sem recarregar a página. Se já houver conversa, pede confirmação.
- Nada é armazenado permanentemente no servidor.

---

## Proteções

**Identificação do IP** (`getClientIp`, em `src/server/rate-limit.ts`) — a
topologia é `Internet → Nginx → Node (127.0.0.1:3200)`, então a fonte principal
é o header `X-Real-IP` escrito pelo nosso Nginx. `X-Forwarded-For` é apenas
fallback e, se vier com vários valores, usamos o **último** — o mais próximo do
proxy confiável, já que o primeiro é exatamente o que o cliente controla.
Qualquer valor que não se pareça com um endereço IPv4/IPv6 é descartado, para
que lixo no header não vire um balde de rate limit novo a cada requisição.

**Rate limit** — janela deslizante em memória, combinando IP e `sessionId`.
Padrão: 20 mensagens por 10 minutos por sessão, com folga maior no IP para não
penalizar múltiplas abas. Retries **contam** aqui: esta camada protege a
infraestrutura.

**Limite comercial** — 15 mensagens do visitante por sessão, aplicado também no
servidor (a contagem do navegador é manipulável) e **idempotente por
`messageId`**. Retries não contam aqui: um erro do webhook não pode custar uma
mensagem ao visitante. Veja a seção seguinte.

**Validação de entrada** — mensagem precisa ser string não vazia, com trim, até
1500 caracteres; caracteres de controle são removidos; `sessionId` precisa bater
com o padrão `demo_<uuid>`.

**Conteúdo da IA** — renderizado por `src/lib/markdown.tsx`, que produz apenas
elementos React. Não há `dangerouslySetInnerHTML` em nenhum lugar do chat, então
HTML vindo da IA aparece como texto literal. Links aceitam somente `http`,
`https`, `mailto` e `tel`.

**Logs** — `src/server/logger.ts` registra status HTTP, duração, prefixo do
`sessionId`, prefixo do `messageId`, tamanho da resposta e sucesso/falha. Nunca
registra `AI_WEBHOOK_SECRET`, o conteúdo da mensagem, a resposta integral nem
dados pessoais. URLs e tokens que apareçam em mensagens de erro são mascarados
antes de imprimir.

---

## Idempotência do retry (`messageId`)

O problema: o visitante envia uma mensagem, a cota comercial é debitada, o
webhook falha ou estoura o timeout, ele clica em "Tentar novamente" — e perde
mais uma das 15 mensagens por um erro que não foi dele.

A solução: cada mensagem do visitante carrega um `messageId` gerado no
navegador (`crypto.randomUUID()`), que é o mesmo `id` da bolha já desenhada na
tela.

```json
{
  "sessionId": "demo_550e8400-e29b-41d4-a716-446655440000",
  "messageId": "b6f0c2a1-6f8d-4a1e-9b0c-2f1d4e7a9c33",
  "message": "Quero contratar internet"
}
```

O botão "Tentar novamente" reenvia **o mesmo `messageId` com o mesmo texto**.

No servidor (`consumeDemoQuota`, em `src/server/rate-limit.ts`):

| Situação                                   | Resultado         | Cota       |
| ------------------------------------------ | ----------------- | ---------- |
| `messageId` novo                           | `consumed`        | debita     |
| `messageId` conhecido, **mesmo** texto     | `already_counted` | não debita |
| `messageId` conhecido, texto **diferente** | `conflict` → 400  | não debita |
| Cota esgotada                              | `exhausted` → 429 | —          |

O registro guarda `sessionId + messageId → impressão digital da mensagem`,
onde a impressão digital é o tamanho mais um SHA-256 truncado. O texto em si
nunca é armazenado. Por isso não dá para reciclar um `messageId` já usado para
enviar conteúdos novos de graça: o conteúdo diferente devolve
`invalid_message_id` (HTTP 400).

O TTL do registro acompanha o da cota (6 horas de inatividade da sessão), então
o par expira junto — não sobra estado órfão.

O mesmo `messageId` segue para a aplicação Zentera como `externalMessageId`,
que também tem idempotência própria. Nenhum ID é gerado dentro do adapter: ele
apenas repassa o que veio do navegador.

---

## Testar localmente

```bash
bun run dev
```

Sem `AI_WEBHOOK_URL`, o chat responde em modo simulado — suficiente para testar
interface, tema, limites e estados de erro.

Com um webhook real:

```bash
echo 'AI_WEBHOOK_URL=https://seu-n8n/webhook/zentera' >> .env
bun run dev
```

Teste direto na API:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
        "sessionId": "demo_550e8400-e29b-41d4-a716-446655440000",
        "messageId": "b6f0c2a1-6f8d-4a1e-9b0c-2f1d4e7a9c33",
        "message": "Quero contratar internet"
      }'
```

Repetir o comando com o mesmo `messageId` devolve a resposta sem debitar a cota
novamente; trocar o `messageId` debita uma nova mensagem.

---

## Build e produção

```bash
bun run build          # gera .output/server/index.mjs
bun run start
```

Na VPS Debian:

```bash
# /opt/zentera-ai-demo
bun install
bun run build
HOST=127.0.0.1 PORT=3200 node .output/server/index.mjs
```

A porta não está fixada no código: `HOST` e `PORT` vêm do ambiente.

Exemplo de unidade systemd:

```ini
[Unit]
Description=Zentera AI Demo
After=network.target

[Service]
WorkingDirectory=/opt/zentera-ai-demo
EnvironmentFile=/opt/zentera-ai-demo/.env
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3200
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

### Nginx

O Node escuta apenas em `127.0.0.1` e nunca fica exposto à internet. O Nginx é
o único proxy confiável na frente da aplicação, então é ele quem define o IP do
visitante:

```nginx
proxy_set_header Host              $host;
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $remote_addr;
proxy_set_header X-Forwarded-Proto $scheme;
```

Repare que `X-Forwarded-For` recebe `$remote_addr`, e **não**
`$proxy_add_x_forwarded_for`. Como só existe um proxy, não há cadeia a
preservar — e sobrescrever o header impede que o navegador injete endereços
falsos para escapar do rate limit.

Sem esses headers o rate limit continua funcionando, mas passa a tratar todos
os visitantes como um único cliente (`unknown`).

---

## Estrutura

```text
public/
  favicon.svg  og-image.svg  robots.txt  sitemap.xml

src/
  components/
    demo/       ChatDemo  ChatHeader  ChatMessage  ChatComposer
                SuggestedPrompts  TypingIndicator  DemoLimitNotice
    zentera/    Header  Hero  Capabilities  FinalCTA  Footer
                Logo  ThemeProvider  ThemeToggle
  config/       site.ts          (público)
  hooks/        useChatDemo.ts   (máquina de estado do chat)
  lib/          session  validation  analytics  markdown  types
                demo-bus  utils
  server/       ai-client  config  rate-limit  logger   (nunca vai ao cliente)
  routes/       __root.tsx  index.tsx  api/chat.ts
  styles.css
```

---

## Logo

Nenhum arquivo oficial de logo foi fornecido, então a marca aparece como texto
(`Zentera Virtua`). A logo **não** foi redesenhada, recolorida nem recriada em
CSS, e o avatar do agente no chat é apenas o gradiente da marca, sem símbolo.

Para usar o arquivo oficial, edite `src/components/zentera/Logo.tsx`:

```ts
const LOGO_SRC: string | null = '/zentera-virtua-logo.png'
```

Coloque o arquivo em `public/zentera-virtua-logo.png` (SVG ou WebP também
servem). É a única linha a mudar: o componente troca o texto pela imagem no
header e no footer sozinho, com o nome da marca no `alt`. Se a proporção pedir,
ajuste `LOGO_HEIGHT_CLASS` logo abaixo.

---

## Analytics

`src/lib/analytics.ts` centraliza os eventos e hoje **não envia nada**. Eventos
previstos: `demo_started`, `message_sent`, `suggestion_clicked`,
`demo_limit_reached`, `contact_cta_clicked`, `new_conversation`,
`theme_changed`.

Para instrumentar, conecte um destino uma única vez:

```ts
setAnalyticsSink((event, payload) => {
  window.plausible?.(event, { props: payload })
})
```

O conteúdo das mensagens nunca é enviado para analytics.

---

## Limitações conhecidas

- Rate limit e contagem de sessão vivem na memória do processo: com múltiplas
  instâncias ou após restart, os contadores zeram. A interface `RateLimitStore`
  existe para trocar por Redis sem tocar na rota.
- Sem banco, login, painel administrativo ou integração com CRM/Chatwoot — fora
  do escopo deste MVP.
- O histórico da conversa não é enviado ao webhook; o contexto multi-turno fica
  a cargo do orquestrador, que recebe o `sessionId` a cada mensagem.
- O Open Graph usa `public/og-image.png` (1200×630), que é o formato aceito por
  todas as redes e mensageiros. O `og-image.svg` fica como fonte auxiliar para
  edição; se você alterar o SVG, exporte um novo PNG no mesmo tamanho.
- As fontes (Inter e Sora) vêm do Google Fonts. Para ambiente sem saída externa,
  hospede os arquivos em `public/` e troque o `<link>` no root.
