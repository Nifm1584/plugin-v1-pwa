# Plugin V1 PWA — versão independente do `hermes-pwa` para Hermes Agent

> **Estado atual.** A branch `main` espelha o plugin original `hermes-pwa` **v1.7.1**
> (AstraOnlineWeb, licença MIT) + auditoria técnica em `report/` (documentos 01–09).
> **Esta branch aplica a identidade independente `treg-pwa`** (Fase B: isolamento para
> coexistência lado a lado) — ver `report/10-fase-b-isolamento.md` e
> `report/11-instalacao-e-coexistencia.md`.
>
> **Versão funcionalmente validada:** `1.8.0b1`, instalada no Hermes no SHA `16345103fcabf4347ac4225605036dcc1e1be3e6` (service worker `treg-pwa-v5`). O usuário confirmou os testes no computador e no celular e a preservação do PWA original. A validação e a limitação conhecida de renderização visual de imagens estão documentadas em [report/38-validacao-versao-estavel.md](report/38-validacao-versao-estavel.md). O código desta versão está congelado; próximas correções devem seguir em branch separada.

## Objetivo

Desenvolver uma versão independente do plugin PWA do Hermes Agent, com identidade própria e
experiência mobile aprimorada inspirada na usabilidade de aplicativos de mensagens (lista de
conversas legível, avatares, balões, menus de ações/anexos, temas claro e escuro), capaz de
**coexistir com o plugin original sem conflitos** — e, quando validada, substituí-lo de forma
controlada.

Princípio arquitetural: **estender o Hermes por meio de interfaces compatíveis e suportadas,
mantendo o núcleo da plataforma intacto** — sem duplicar autenticação, sessões, transporte de
mensagens, agentes ou ferramentas que já são responsabilidade do Hermes.

## Arquitetura atual (herdada do `hermes-pwa` v1.7.1)

Plugin de dashboard (`kind: standalone`, sem dependências Python declaradas, sem tools/hooks):

- **Backend** (`dashboard/plugin_api.py`, FastAPI `APIRouter` montado em
  `/api/plugins/treg-pwa/` nesta branch): serve o app estático e faz proxy autenticado para o
  API server do gateway (sessões, mensagens, chat com streaming, execuções `/v1/runs`,
  aprovações, upload para `~/uploads`, perfis, modo de autorização, configuração STT).
  A `API_SERVER_KEY` fica no servidor; o navegador usa só o cookie do dashboard.
- **App móvel** (`dashboard/pwa/`: `index.html`, `app.js`, `app.css`, `sw.js`): JavaScript puro,
  sem etapa de build; chat estilo mensageiro com streaming resiliente (a resposta continua no
  servidor em segundo plano), imagens/arquivos/voz com transcrição, aprovação de comandos.
- **Aba do painel** (`dashboard/dist/`): React via SDK oficial (`window.__HERMES_PLUGIN_SDK__`)
  com QR code de instalação e configuração da transcrição de áudio.
- **Comando de chat** (`__init__.py`): `/treg` devolve o link do app em qualquer canal.

Detalhes completos na auditoria: `report/01-arquitetura-e-funcionamento.md`.

## Estrutura de diretórios

```text
plugin-v1-pwa/
├── README.md                  # este arquivo (apresentação V1 + doc original preservada abaixo)
├── LICENSE                    # MIT (AstraOnlineWeb — autoria original preservada)
├── .gitignore
├── plugin.yaml                # metadados do plugin (id: treg-pwa nesta branch)
├── __init__.py                # comando /treg
├── dashboard/
│   ├── manifest.json          # aba TREG: tab /treg, entry, css, api
│   ├── plugin_api.py          # backend FastAPI (proxy + estático)
│   ├── dist/                  # aba do painel (index.js, style.css, qrcode.js vendored MIT)
│   └── pwa/                   # app móvel (index.html, app.js, app.css, sw.js, ícones)
├── tests/
│   └── test_plugin.py         # testes de contrato estático (manifestos + comando)
└── report/                    # auditoria técnica + Fase B (índice em report/README.md)
```

## Pré-requisitos conhecidos (respaldados pela auditoria)

- Hermes Agent v0.21.6, com o dashboard acessível por **HTTPS** (sem HTTPS o
  navegador não oferece a instalação do PWA).
- API server do gateway ligado no `.env`/ambiente: `API_SERVER_ENABLED=true`,
  `API_SERVER_HOST=0.0.0.0`, `API_SERVER_PORT=8642`, `API_SERVER_KEY=<gerada com
  openssl rand -hex 32>`. Opcional: `TREG_PWA_API_HOST` (override só da cópia).
- Para múltiplos agentes no seletor: gateway multiplexado + mesma chave por perfil
  (detalhes na documentação original preservada abaixo).

## Instalação (somente após validar a coexistência — nunca em produção sem teste)

```bash
hermes plugins install Nifm1584/plugin-v1-pwa --enable
hermes gateway restart
```

Reinicie também o dashboard (ou o contêiner) para a aba aparecer. No celular, abra
`https://SEU-DOMINIO/treg` e faça login com o usuário do painel. Procedimento completo de
validação lado a lado em `report/11-instalacao-e-coexistencia.md`.

## Auditoria técnica (`report/`)

| Documento | Conteúdo |
|---|---|
| `report/README.md` | Índice e resumo executivo |
| `report/01-arquitetura-e-funcionamento.md` | Arquitetura, tecnologias, fluxos |
| `report/02-inventario-de-funcionalidades.md` | Funcionalidades por estado de implementação |
| `report/03-auditoria-interface-mobile.md` | Frontend mobile e hipóteses da "primeira conversa" |
| `report/04-integracao-hermes-api.md` | APIs/hooks/eventos do Hermes e compatibilidade |
| `report/05-seguranca-e-privacidade.md` | Riscos estáticos (nenhum P0/P1 confirmado) |
| `report/06-qualidade-e-testes.md` | Qualidade, desempenho e plano de testes |
| `report/07-plano-de-evolucao.md` | Plano faseado de melhorias (matriz por item) |
| `report/08-github-e-distribuicao.md` | Isolamento, coexistência lado a lado, checklist de renomeação |
| `report/09-evidencias-e-pendencias.md` | Evidências, lacunas e pendências de execução |
| `report/10-fase-b-isolamento.md` | Execução do isolamento TREG (Fase B) |
| `report/11-instalacao-e-coexistencia.md` | Plano prático de validação lado a lado |

## Objetivos da evolução (resumo — detalhe em `report/07`)

1. Legibilidade mobile (tipografia, lista, balões) e menus estilo mensageiro — só frontend.
2. Avatares (Hermes próprio, usuário opt-in, agentes) e empty-states.
3. Tema claro/escuro com alternância manual, em camada isolada no plugin.
4. Desempenho (paginação, throttle de streaming) e acessibilidade.
5. Isolamento completo + validação lado a lado com o original antes de substituir.

## Desenvolvimento

```bash
hermes plugins validate .
python -m pytest tests -q
```

O app é JavaScript puro, sem etapa de build.

## Licença e autoria

Licença MIT (ver `LICENSE`, copyright AstraOnlineWeb). Projeto derivado do
[`hermes-pwa`](https://github.com/AstraOnlineWeb/hermes-plugins) — avisos de autoria
originais preservados, incluindo o cabeçalho do `qrcode-generator` (MIT, Kazuhiko Arase) em
`dashboard/dist/qrcode.js`. Projeto independente, sem vínculo com a Nous Research.

---

## Documentação original do `hermes-pwa` (conteúdo preservado integralmente)

> O texto abaixo é o README original do plugin, mantido como referência da implementação da qual
> esta variante deriva.

# hermes-pwa

App de celular para o [Hermes Agent](https://github.com/NousResearch/hermes-agent) em formato **PWA**:
uma interface limpa, estilo mensageiro, instalável na tela inicial do Android e do iPhone.

Não é um serviço separado. É um plugin de dashboard: o próprio painel do Hermes serve o app, atrás do
mesmo login, e conversa com o API server do gateway. Por isso você vê no celular as sessões de todos
os canais, como WhatsApp, Telegram, terminal e painel, e continua qualquer uma delas.

## O que o app faz

- **Conversas**: lista com origem, prévia e horário. Busca, nova conversa, renomear e apagar, direto da lista.
- **Agentes**: seletor para trocar entre os perfis do Hermes. Cada agente tem suas próprias conversas.
- **Chat**: respostas em tempo real, Markdown, blocos de código, indicador de "pensando" e de ferramenta em uso.
- **Imagens**: anexar, colar print ou arrastar. O modelo enxerga a imagem.
- **Arquivos**: PDF, planilhas, texto e outros, até 25 MB. Ficam em `~/uploads` do agente, que os lê com as ferramentas de arquivo.
- **Continua em segundo plano**: a resposta é uma execução no servidor. Se você trocar de app, bloquear a tela ou perder a conexão, o agente continua trabalhando; ao voltar, o app retoma o acompanhamento e mostra a resposta completa.
- **Aprovação de comandos**: quando o agente precisa de autorização para um comando perigoso, o pedido aparece no chat com os botões Permitir uma vez, Permitir nesta conversa, Permitir sempre e Negar.
- **Modo de autorização**: no botão de configurações da lista de conversas dá para escolher entre sempre perguntar, modo inteligente ou não perguntar. Vale por agente.
- **Voz**: grava pelo microfone e envia como mensagem de voz, com player para ouvir e a transcrição logo abaixo.
- **Teclado**: Enter envia, Shift+Enter quebra linha.
- **Tema** claro e escuro automáticos. Em tela larga, lista e chat ficam lado a lado.

## Instalação

```bash
hermes plugins install AstraOnlineWeb/hermes-plugins/hermes-pwa --enable
hermes gateway restart
```

Reinicie também o dashboard, ou o contêiner, para a aba aparecer.

### Pré-requisito: API server do gateway

No `.env` do Hermes ou nas variáveis do contêiner:

```
API_SERVER_ENABLED=true
API_SERVER_HOST=0.0.0.0
API_SERVER_PORT=8642
API_SERVER_KEY=<gere com: openssl rand -hex 32>
```

O painel precisa estar acessível por **HTTPS**. Sem isso o navegador não oferece a instalação do app.

## Uso

1. No celular, abra `https://SEU-DOMINIO/pwa` e faça login com o usuário do painel.
2. Android, Chrome: menu ⋮, "Instalar app".
   iPhone, Safari: botão Compartilhar, "Adicionar à Tela de Início".

No computador, a aba **PWA** do painel mostra um QR code com o link. Em qualquer canal do Hermes, o
comando `/pwa` devolve o endereço.

**Conversa cheia.** Quando o Hermes avisa que a conversa ficou grande demais para o modelo ("too large to
compress further"), abra uma conversa nova: botão **+** flutuante no canto inferior direito da lista, ou digite `/new` no chat (aceita um nome,
por exemplo `/new site da padaria`). O app cria a conversa e abre nela. Os comandos `/compress`, `/model` e
os demais do Hermes continuam indo para o agente normalmente.

## Opcionais

### Transcrição das mensagens de voz

No painel do Hermes, abra a aba **PWA**, vá até **Transcrição de áudio**, cole a chave do Groq e clique em
**Salvar e conferir**. O Groq tem plano gratuito; a chave é criada em https://console.groq.com/keys.

A chave é conferida na hora e a transcrição passa a valer para os próximos áudios, sem reiniciar o Hermes.

Quem preferir o terminal:

```bash
hermes config set GROQ_API_KEY <sua-chave>
hermes config set stt.provider groq
hermes config set stt.language pt
hermes config set stt.groq.model whisper-large-v3
```

Sem provedor, o áudio ainda é enviado e o agente recebe o arquivo, só não vem transcrito.

### Vários agentes

Para o seletor mostrar outros perfis além do `default`, ligue o gateway multiplexado e dê a cada perfil
a chave do API server:

```bash
hermes -p default config set gateway.multiplex_profiles true
hermes -p <perfil> config set API_SERVER_ENABLED true
hermes -p <perfil> config set API_SERVER_KEY <mesma chave do default>
hermes gateway restart
```

## Como funciona

| Rota | Função |
|---|---|
| `/pwa` | aba do painel. Acesso direto redireciona para o app; pelo menu mostra QR code e instruções |
| `/api/plugins/hermes-pwa/` | o app |
| `/api/plugins/hermes-pwa/api/*` | proxy para o API server do gateway: sessões, mensagens, chat com streaming, upload, perfis |

A chave do API server fica no servidor. O navegador usa só o cookie do dashboard.

## Limitações

- Sem notificações push. Mensagens de outros canais aparecem ao abrir o app, ou a cada 12 segundos com a conversa aberta.
- Imagens enviadas não ficam no histórico do servidor. Ao reabrir a conversa aparece o texto e um marcador.
- A transcrição usa o provedor configurado no perfil `default`.

## Segurança

- Todas as rotas passam pela autenticação do dashboard.
- O login vale 12 horas e se renova por até 30 dias com uso.
- Os nomes de arquivo enviados são sanitizados, e a rota de download só serve arquivos de `~/uploads`, sem subpastas.

## Desenvolvimento

```bash
hermes plugins validate .
python -m pytest tests -q
```

O app é JavaScript puro, sem etapa de build. Os arquivos ficam em `dashboard/pwa/`.

Licença MIT.
