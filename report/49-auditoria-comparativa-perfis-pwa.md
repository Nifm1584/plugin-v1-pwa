# 49 — Auditoria comparativa do sistema de perfis: hermes-pwa original × TREG PWA

**Data:** 2026-11-01<br>
**Natureza:** investigação somente leitura. Nenhum código, configuração, segredo, plugin, serviço ou VPS foi alterado.<br>
**Objetivo:** comparar o gerenciamento de perfis do PWA original com o TREG PWA e identificar diferenças que possam explicar o comportamento atual na seleção e utilização de perfis.

## 1. Escopo e método

Foram examinados diretamente:

- o repositório original `AstraOnlineWeb/hermes-plugins`, pasta `hermes-pwa`, na branch `main`;
- o TREG `Nifm1584/plugin-v1-pwa` no commit congelado da Fase 1, no commit da Fase 2 e no código da Fase 3;
- o Relatório 47, publicado na `main` do TREG;
- os READMEs dos dois projetos.

O acesso ao original foi feito pelo Browser MCP no GitHub, com leitura dos arquivos. O TREG foi comparado por meio dos commits publicados. Não houve execução do PWA original contra a VPS, nem alteração de instalação, configuração ou dados.

## 2. Versões e commits comparados

| Projeto | Referência | Versão | Data |
|---|---|---|---|
| Original | `AstraOnlineWeb/hermes-plugins` @ `e4459cd320c1b5e9819ba123526e9cb565681aab` | `hermes-pwa` 1.7.1 | 2026-10-11 |
| TREG congelado | `9b34073c94f61a78b427b518cd587909cf80884b` | `treg-pwa` 1.8.0b1 | 2026-10-26 |
| TREG Fase 2 | `a24cab2cf2a763c00ed2883eb2eb30741c0329c4` | 1.8.0b1 + correções de auth | 2026-11-01 |
| TREG Fase 3 | `43f0441d8e48f67711d26ed61b98c1d293ff2271` | 1.8.0b1 + chave administrada | 2026-11-01 |
| Relatório 47 | `Nifm1584/plugin-v1-pwa` @ `main` | auditoria da VPS | 2026-11-01 |

O TREG declara a mesma base arquitetural do original no próprio README: “Arquitetura atual (herdada do `hermes-pwa` v1.7.1)”.

## 3. Como o PWA original gerencia perfis

### 3.1 Listagem no backend

Arquivo: `hermes-pwa/dashboard/plugin_api.py`

- `_pfx(profile)` (linha 145) valida o nome e devolve `"/p/<perfil>"` para perfis secundários; para `default`, devolve string vazia.
- `profiles()` (linha 156) usa `hermes_cli.profiles.list_profiles()` e devolve `name`, `is_default`, `model`, `provider` e `description`.
- O campo `multiplex` é lido de `load_config_readonly()["gateway"]["multiplex_profiles"]` (linhas 175–180).
- As rotas de sessões, mensagens, runs e eventos recebem `profile` e montam o caminho com `_pfx(profile)`.

### 3.2 Interface e seleção

Arquivo: `hermes-pwa/dashboard/pwa/app.js`

- `state` contém `profile`, `profiles` e `multiplex` (linha 6).
- `pq(path, profile)` acrescenta `?profile=` quando o perfil não é `default` (linhas 45–48).
- `loadProfiles()` (linha 639) chama `req("profiles")`, preenche o `<select id="agent">`, restaura o perfil salvo e esconde a barra de agentes quando há menos de dois perfis.
- O evento `change` do seletor (linha 658):
  - bloqueia perfis secundários quando `state.multiplex` é falso;
  - grava `state.profile` e `localStorage["hermes-pwa-profile"]`;
  - limpa `state.sessions` e recarrega a lista;
  - **não fecha a conversa aberta** (`state.current` permanece).
- `boot()` (linha 666) restaura o perfil de `localStorage` e chama `loadProfiles().then(loadSessions)`.

### 3.3 Fluxo de conversas por perfil

- `loadSessions()` (linha 96) chama `sessions?limit=80` com o perfil atual e marca cada sessão com `x.profile = prof`.
- `openSession()` (linha 136) usa a sessão recebida; `loadMessages()` (linha 153) usa `state.current.profile`.
- O envio (`ctx`, linha 333) usa `state.current.profile`; runs, eventos e retomada usam `ctx.profile`.
- O README original documenta o requisito de múltiplos agentes (linhas 80–88):

```bash
hermes -p default config set gateway.multiplex_profiles true
hermes -p <perfil> config set API_SERVER_ENABLED true
hermes -p <perfil> config set API_SERVER_KEY <mesma chave do default>
hermes gateway restart
```

Ou seja: o próprio original exige a **mesma `API_SERVER_KEY` no escopo de cada perfil** para o seletor funcionar.

### 3.4 Autenticação no original

- `_api_key()` (linhas 45–61) lê a chave do ambiente do processo ou do `.env` principal.
- `_client()` (linha 63) e `_proxy_json()` (linha 69) não recebem perfil: **todas** as chamadas, inclusive `/p/<perfil>/...`, usam a mesma chave do processo padrão.
- `req()` (linhas 50–62) trata qualquer HTTP 401 ou 403 como sessão expirada e chama `showLogin()`.

## 4. Como o TREG gerencia perfis

### 4.1 Listagem e rotas

O TREG preservou a mesma estrutura:

- `_pfx(profile)` no TREG congelado (linha 148) e na Fase 3 (linha 286) é equivalente ao original.
- `profiles()` no TREG congelado (linha 159) e na Fase 3 (linha 297) usa `list_profiles()` e a mesma leitura de `gateway.multiplex_profiles`.
- As rotas de sessões, mensagens, runs e eventos continuam usando `/p/<perfil>` e o parâmetro `profile`.

Não foi encontrada diferença funcional na **listagem** de perfis nem no formato do seletor.

### 4.2 Interface e seleção

Arquivo: `treg-pwa/dashboard/pwa/app.js`

- `state` contém os mesmos campos de perfil (linha 9).
- `pq()` é equivalente (linhas 88–92).
- `loadProfiles()` (Fase 3, linha 1638) preenche o mesmo `<select id="agent">` e usa `profiles.length < 2` para esconder a barra.
- O evento `change` (Fase 3, linha 1662):
  - mantém o bloqueio por `state.multiplex`;
  - grava `state.profile` e `localStorage["treg-pwa-profile"]`;
  - **fecha a sessão aberta** (`closeSession`) e desliga a execução ativa (`detachActiveRun`);
  - limpa sessões/busca e recarrega a lista e as capabilities.
- `boot()` (Fase 3, linha 1710) restaura `treg-pwa-profile` e chama `loadProfiles().then(loadSessions)`, além de `loadCapabilities()`.

### 4.3 Fluxo de conversas por perfil

- `loadSessions()` (Fase 3, linha 289) usa paginação (`limit`/`offset`), `sessionsSeq` e `mergeSessions`, mas mantém a marcação `item.profile = prof` e os guardas `prof !== state.profile`.
- `openSession()` (linha 570) usa `s.profile` e, se ausente, `state.profile`.
- `loadMessages()` (linha 596) usa `state.current.profile`; o envio (`ctx`, linha 1193) usa o mesmo perfil.
- A troca de perfil limpa a conversa aberta, o que é **mais restritivo** que o original.

### 4.4 Autenticação no TREG

- TREG congelado: `_api_key()` (linha 48) ainda usa a chave global do processo/`.env` principal; `_proxy_json()` não recebe perfil.
- TREG Fase 2/3: `_profile_api_key()` (Fase 3, linha 93) resolve a chave do perfil; `_api_key(profile)` (linha 127) escolhe entre default e perfil; `_proxy_json(..., profile=...)` (linha 205) usa a chave do perfil.
- A Fase 3 acrescentou `_managed_env_value()` (linha 64), que lê o escopo administrado (`/etc/hermes/.env` ou `HERMES_MANAGED_DIR`), e aplica override sobre o `.env` do perfil.
- O cliente TREG Fase 2/3 substituiu o tratamento único de 401/403 por `isProfileApiError`, `isLoginRequired` e `handleProfileApiError` (linhas 93–171), separando sessão expirada de erro de chave do perfil.

## 5. Comparação detalhada

| Área | Original (1.7.1) | TREG (Fase 3) | Diferença relevante | Classificação |
|---|---|---|---|---|
| Listagem de perfis | `profiles()` com `list_profiles()` e `multiplex` | Mesma lógica | Nenhuma diferença funcional | **Preservado** |
| Rota por perfil | `_pfx()` → `/p/<perfil>` | Mesma lógica | Nenhuma | **Preservado** |
| Seletor na interface | `<select id="agent">`, barra escondida com <2 perfis | Mesmo seletor | Nenhuma | **Preservado** |
| Troca de perfil | Grava perfil, limpa sessões, recarrega | Também fecha conversa e desliga run | TREG é mais restritivo | **Modificado (proteção)** |
| Persistência | `hermes-pwa-profile` | `treg-pwa-profile` | Chaves diferentes; TREG não herda a escolha do original | **Modificado (isolamento)** |
| Lista de conversas | Requisição única, substitui a lista | Paginação + merge + `seq` | TREG mantém marcação por perfil; não mistura por causa do reset na troca | **Modificado (robustez)** |
| Conversa aberta | Não fecha ao trocar | Fecha e desliga run | TREG evita atualização cruzada | **Modificado (proteção)** |
| Chave da API | Uma chave global para todos os `/p/` | Chave por perfil + escopo administrado | Diferença substancial de autenticação | **Modificado (auth)** |
| Erro 401/403 | Sempre login | Sessão expirada vs erro de perfil | Muda o sintoma exibido | **Modificado (UX/auth)** |
| Capabilities | Não chama no boot | Chama `/v1/capabilities?profile=` no boot | Pode exibir o erro de perfil mais cedo | **Modificado (UX)** |
| README de múltiplos agentes | Exige a mesma chave por perfil | Preserva a mesma orientação | Nenhuma diferença de requisito | **Preservado** |

## 6. Evidências técnicas por diferença

### 6.1 Chave global versus chave por perfil

- **Original:** `dashboard/plugin_api.py`, `_api_key()` linha 45; `_client()` linha 63; `_proxy_json()` linha 69. Nenhum recebe `profile`.
- **TREG Fase 3:** `dashboard/plugin_api.py`, `_profile_api_key()` linha 93; `_api_key(profile)` linha 127; `_proxy_json(..., profile=...)` linha 205.
- **Impacto:** o original envia a chave do processo padrão para `/p/<perfil>/`. Isso funciona **somente** se o perfil também tiver a mesma chave no escopo do gateway, como o README original exige. Se o perfil não tiver a chave, o gateway responde 401. O TREG, na Fase 2/3, procura a chave do próprio perfil e, na ausência, retorna `profile_api_key_missing` antes de enviar a requisição.
- **Classificação:** diferença comprovada no código; o efeito depende da configuração do gateway.

### 6.2 Tratamento de 401/403

- **Original:** `dashboard/pwa/app.js`, `req()` linhas 50–62; qualquer 401/403 chama `showLogin()`.
- **TREG Fase 3:** `isProfileApiError()` linha 93, `isLoginRequired()` linha 97, `handleProfileApiError()` linha 141. Erro de perfil não abre login; sessão expirada abre.
- **Impacto:** no original, a falha de chave do perfil aparece como tela de login; no TREG, aparece como erro de configuração com ação de retorno. O TREG não corrige a ausência da chave, mas evita o loop de login.
- **Classificação:** diferença comprovada; é a principal explicação para a mudança de comportamento percebida.

### 6.3 Conversa aberta na troca de perfil

- **Original:** `app.js`, evento `change` linha 658; não chama `closeSession()`. O chat aberto continua com `state.current.profile` antigo enquanto a lista carrega o novo perfil.
- **TREG:** `app.js`, evento `change` Fase 3 linha 1662; chama `detachActiveRun()` e `closeSession()` antes de recarregar.
- **Impacto:** o original pode manter a conversa do perfil anterior visível após a troca; o TREG fecha a conversa. O TREG é mais seguro para isolamento, mas muda a sensação de “a conversa sumiu” ao trocar de perfil.
- **Classificação:** diferença comprovada; proteção, não causa de falha de autenticação.

### 6.4 Lista de conversas e paginação

- **Original:** `loadSessions()` linha 96 substitui `state.sessions` por uma requisição de 80.
- **TREG:** `loadSessions()` Fase 3 linha 289 usa `offset`, `sessionsSeq`, `mergeSessions` e `hasMore`.
- **Impacto:** o TREG pode mostrar “Carregar mais” e mesclar páginas; a marcação `profile` continua por item. A troca de perfil limpa a lista e invalida requisições antigas por `seq`, evitando mistura. Não foi encontrada evidência de conversas de perfis diferentes na mesma lista.
- **Classificação:** diferença comprovada; não explica a falha de seleção, mas altera o comportamento da lista.

### 6.5 Pré-carregamento de capabilities

- **Original:** `boot()` linha 666 não chama capabilities.
- **TREG:** `boot()` Fase 3 linha 1710 chama `loadCapabilities()` antes de `loadProfiles().then(loadSessions)`.
- **Impacto:** se o perfil persistido não tiver chave, o TREG pode mostrar o erro de perfil antes de terminar o boot; o original só mostraria o login depois da tentativa de listar sessões. É uma diferença de **quando** o erro aparece, não da causa.
- **Classificação:** diferença comprovada; impacto de UX, não causa raiz.

### 6.6 Detecção de multiplex

- **Original:** `profiles()` lê `gateway.multiplex_profiles` (linhas 175–180); o `change` bloqueia se `state.multiplex` for falso (linha 660).
- **TREG:** a mesma leitura e o mesmo bloqueio (Fase 3, linhas 316–322 e 1664).
- **Impacto:** se a configuração não declarar `gateway.multiplex_profiles` explicitamente, ambos podem devolver `multiplex: false` e bloquear a troca, apesar de o Hermes v0.22.2 usar multiplexação por padrão. É um risco **herdado**, não uma diferença introduzida pelo TREG.
- **Classificação:** comportamento idêntico; hipótese para instalações com a flag ausente.

### 6.7 Persistência da escolha

- **Original:** `hermes-pwa-profile`.
- **TREG:** `treg-pwa-profile`.
- **Impacto:** ao migrar do original para o TREG, o TREG começa em `default`, não no perfil selecionado no original. Depois da primeira escolha, o TREG persiste normalmente. Não é uma falha de seleção; é uma diferença de estado inicial.
- **Classificação:** diferença comprovada; impacto de migração.

## 7. Causas possíveis do problema atual

### 7.1 Causas comprovadas

1. **A listagem, o seletor e o fluxo de conversas por perfil foram preservados.** O TREG usa o mesmo `list_profiles()`, o mesmo `_pfx()` e os mesmos campos `profile`/`ctx.profile`. Não foi encontrada uma regressão de código que impeça a seleção em si.
2. **O Relatório 47 comprova que o perfil secundário não tem `API_SERVER_KEY` no escopo.** O gateway v0.22.2 responde 401 em `/p/<perfil>/`, com a mensagem `no profile-scoped API_SERVER_KEY is configured`; foram registradas 53 respostas 401. O próprio README original exige a mesma chave em cada perfil. Sem essa configuração, o original também não autentica o perfil secundário.
3. **O TREG Fase 2/3 transforma esse 401 em erro de configuração**, com `profile_api_key_missing`/`profile_api_auth_failed`, em vez de abrir a tela de login. O sintoma visível muda, mas a causa é a mesma ausência de chave.

### 7.2 Hipóteses ainda não confirmadas

1. **O original pode parecer funcional porque exibe a tela de login.** Após o login, a requisição ao perfil secundário continuaria sem a chave e voltaria a falhar; não foi feito um teste lado a lado no mesmo gateway para confirmar o comportamento visual completo.
2. **O original pode ter sido validado em outro gateway/configuração**, por exemplo uma versão em que a chave global era aceita em `/p/`, ou com o perfil secundário já configurado com a mesma chave. Não há evidência no repositório de que o original funcione sem essa configuração.
3. **O TREG pode ser mais restritivo que o original em versões antigas do Hermes.** O original envia a chave global e deixa o gateway decidir; o TREG Fase 3 procura a chave do perfil e falha antes de enviar se ela não existir. Em um gateway que aceitasse a chave global para `/p/`, o TREG poderia recusar um perfil que o original acessaria. No Hermes v0.22.2 auditado, o gateway exige a chave do perfil, então essa hipótese não se aplica ao caso medido.
4. **O pré-carregamento de capabilities pode antecipar o erro**, mas não cria a falha; a listagem de sessões também usaria a mesma chave.
5. **A flag `gateway.multiplex_profiles` ausente** pode bloquear a troca em ambos os projetos; não é específica do TREG.
6. **A chave `treg-pwa-profile`** faz o TREG iniciar no perfil padrão após a migração; isso pode dar a impressão de que a seleção “não lembra”, mas não impede a troca.

## 8. Conclusão

A comparação efetiva dos códigos mostra que o sistema de perfis do TREG foi **herdado do original** e mantém:

- a mesma listagem via `list_profiles()`;
- o mesmo seletor `#agent`;
- a mesma verificação de `gateway.multiplex_profiles`;
- a mesma associação de conversas por `profile`/`ctx.profile`;
- a mesma convenção `/p/<perfil>`.

As diferenças encontradas são de **autenticação e apresentação de erro**, não de seleção de perfil:

- o original usa uma chave global para todas as rotas e trata 401/403 como login;
- o TREG Fase 2/3 usa a chave do perfil e distingue erro de perfil de sessão expirada;
- o TREG fecha a conversa e desliga runs ao trocar de perfil;
- o TREG pagina a lista e mantém guardas de perfil;
- o TREG tem botão de retorno ao perfil padrão.

A falha atual é compatível com a **ausência da `API_SERVER_KEY` no escopo do perfil secundário**, requisito documentado também no README original. O TREG não inventou um novo sistema de perfis; ele tornou o erro explícito. Não foi comprovada uma regressão de código na seleção de perfis. A hipótese de que o original funcione no mesmo perfil sem essa chave não se sustenta pelo código nem pelo Relatório 47, mas não foi testada lado a lado nesta fase.

## 9. Limitações

- Não foi executado um teste controlado do PWA original contra o mesmo gateway/perfil da VPS; a conclusão sobre o original é baseada em código e README.
- Não houve acesso à VPS nesta fase; os dados de 401 vêm do Relatório 47.
- Não foram criados, alterados ou removidos perfis, chaves, configurações ou serviços.
- O TREG congelado e a Fase 3 foram comparados; a versão instalada pode conter apenas parte das mudanças, dependendo do deploy.

## 10. Declaração de não alteração

Esta auditoria foi somente leitura. Não houve alteração de código, HTML, CSS, JavaScript, Python, configuração, `.env`, YAML, banco, perfil, chave, plugin, tag, Release ou branch `main`. O plugin original `hermes-pwa`, o core do Hermes e a VPS não foram modificados. A única escrita desta fase é este relatório e sua entrada no índice, em branch documental própria.
