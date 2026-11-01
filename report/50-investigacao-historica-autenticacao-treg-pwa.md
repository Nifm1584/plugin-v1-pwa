# 50 — Investigação histórica das alterações de autenticação do TREG PWA

**Data:** 2026-11-01<br>
**Natureza:** investigação histórica somente leitura. Nenhum código, configuração, segredo, plugin, serviço ou referência protegida foi alterado.<br>
**Ponto de partida:** [Relatório 49 — auditoria comparativa do sistema de perfis](https://github.com/Nifm1584/plugin-v1-pwa/blob/docs/fase-1-auditoria-comparativa-perfis/report/49-auditoria-comparativa-perfis-pwa.md)

## 1. Objetivo e escopo

Identificar quando, como e por que o mecanismo de autenticação do TREG PWA foi alterado entre:

- a versão congelada `9b34073c94f61a78b427b518cd587909cf80884b`;
- a Fase 2, commit final `a24cab2cf2a763c00ed2883eb2eb30741c0329c4`;
- a Fase 3, commit final `43f0441d8e48f67711d26ed61b98c1d293ff2271`.

Também foram verificadas alterações das Fases 2 e 3 que pudessem afetar seleção, alternância e carregamento de conversas, além da autenticação.

A análise foi feita com `git log`, `git show`, `git diff`, leitura dos arquivos nos três commits e consulta aos relatórios 46, 47, 48 e 49. Não houve checkout com alterações, reset, rebase, cherry-pick, merge, tag, release ou escrita em qualquer referência protegida.

## 2. Linha do tempo dos commits

A história é linear:

```text
9b34073  versão congelada (Fase 1)
   └── 71038be  Fase 2 — correção de autenticação e erros
          └── a24cab2  Fase 2 — desanexar execução ativa na troca de perfil
                 └── 43f0441  Fase 3 — preferir a chave administrada
```

| Commit | Data | Branch | Arquivos | Resumo |
|---|---|---|---|---|
| `9b34073` | 2026-10-26 | tag congelada | — | Base validada `1.8.0b1` |
| `71038be` | 2026-11-01 12:33 | `fix/treg-pwa-autenticacao-multiperfil` | 8 arquivos, +448/−71 | Introduz chave por perfil e classificação de erros |
| `a24cab2` | 2026-11-01 12:35 | `fix/treg-pwa-autenticacao-multiperfil` | 2 arquivos, +6 | Desliga execução ativa ao trocar de perfil |
| `43f0441` | 2026-11-01 14:11 | `fix/treg-pwa-autenticacao-multiperfil-fase-3` | 2 arquivos, +72/−12 | Prefere a chave administrada do Hermes |

Os commits `71038be`, `a24cab2` e `43f0441` têm mensagens curtas, sem corpo detalhado. O motivo técnico está registrado nos relatórios 46 (Fase 2), 47 (auditoria da VPS), 48 (Fase 3) e 49 (comparação com o original).

## 3. Estado antes das alterações: versão congelada `9b34073`

### 3.1 Autenticação de serviço

Arquivo: `dashboard/plugin_api.py`

- `_api_key()` (linha 48) lia `API_SERVER_KEY` do ambiente do processo ou do `.env` principal.
- `_client()` (linha 66) usava essa chave global.
- `_proxy_json()` (linha 72) não recebia `profile`; todas as requisições, inclusive `/p/<perfil>/...`, usavam a mesma chave do processo padrão.
- `_pfx(profile)` (linha 148) já montava `/p/<perfil>`; a rota por perfil existia, mas a credencial não era por perfil.
- `run_events` (linha 386) também usava `_api_key()` global.

### 3.2 Tratamento de 401 e 403

Arquivo: `dashboard/pwa/hermes-api.js`

- O mapeamento de erro (linha 166) transformava **qualquer** 401 ou 403 em `code: "auth"`.
- `runEvents` (linhas 266–267) lançava `ApiError("login", status, "auth")` para 401/403.

Arquivo: `dashboard/pwa/app.js`

- `callApi` (linha 93) e os tratamentos locais (linhas 234, 269, 532, 996, 1222, 1592) chamavam `showLogin()` para `code === "auth"` ou status 401/403.
- Consequência: uma falha de autorização da API do perfil era apresentada como sessão do usuário expirada.

### 3.3 Seleção e conversas

- `loadProfiles()` (linha 1555) listava perfis e preenchia `#agent`.
- O evento `change` (linha 1574) já fechava a sessão aberta e usava `localStorage["treg-pwa-profile"]`.
- `loadSessions()` (linha 217) usava paginação e marcava `item.profile`.
- `openSession()` (linha 492), `loadMessages()` (linha 518) e o envio (`ctx.profile`, linha 1113) usavam o perfil da sessão.
- A versão congelada já era diferente do original em recursos, mas **preservava o modelo de autenticação do original**: uma chave global e 401/403 tratados como login.

## 4. Commit `71038be` — a alteração principal da Fase 2

### 4.1 O que mudou

Arquivos alterados: `dashboard/plugin_api.py`, `dashboard/pwa/app.js`, `dashboard/pwa/hermes-api.js`, `dashboard/pwa/index.html`, `dashboard/pwa/app.css` e testes.

#### Backend: chave por perfil

- Foi criada `_profile_api_key(profile)` (linha 79 na versão da Fase 2; linha 93 na Fase 3).
- `_api_key(profile)` passou a escolher entre a chave do `default` e a chave do perfil.
- `_client(profile)` e `_proxy_json(..., profile=...)` passaram a usar a chave do perfil.
- Todas as rotas de sessões, mensagens, runs, eventos, aprovação, parada e capabilities passaram a enviar `profile=profile` ao proxy.
- A rota em si continuou a mesma (`_pfx(profile)` + `/p/<perfil>`); o que mudou foi **qual chave** acompanha a requisição.

Comportamento antes:

```text
GET /p/trabalho/api/sessions
Authorization: Bearer <chave do processo padrão>
```

Comportamento depois:

```text
GET /p/trabalho/api/sessions
Authorization: Bearer <chave resolvida no escopo do perfil trabalho>
```

#### Backend: erros estruturados

Foi criada `_gateway_error(profile, status, detail)` (linha 130 na Fase 2; 149 na Fase 3):

- 401 de perfil → `503` com `code: "profile_api_auth_failed"`;
- 401 do default → `503` com `code: "api_key_invalid"`;
- 403 de perfil → `403` com `code: "profile_forbidden"`;
- 403 do default → `403` com `code: "forbidden"`;
- 404 de perfil → `404` com `code: "profile_not_found"`;
- 5xx → `502` com `code: "gateway_unavailable"`.

A ausência de chave no perfil passou a ser detectada antes da requisição, com `503` e `code: "profile_api_key_missing"`.

#### Frontend: classificação de erro

- `hermes-api.js` passou a preservar o `code` devolvido pelo backend e a mapear:
  - 401 sem código de perfil → `session_expired`;
  - 403 → `forbidden`;
  - 5xx → `gateway_unavailable`.
- `runEvents` deixou de lançar `"login"` para qualquer 401/403; passou a ler o corpo e a classificar o erro.
- Foram criadas `isProfileApiError()` e `isLoginRequired()` em `app.js` (linhas 93 e 97 na Fase 3).
- `callApi()` só abre o login quando `isLoginRequired()` é verdadeiro.
- Foi criada `handleProfileApiError()` (linha 141 na Fase 3), que exibe erro de configuração e oferece retorno ao perfil padrão.
- Foi criado `returnToDefaultProfile()` (linha 120 na Fase 3).
- Foi adicionado o botão `#login-default` na tela de login.
- `loadSessions`, `loadMessages`, `performSearch`, `stopRun`, `streamRun`, `resumeRun`, `loadProfiles`, `loadCapabilities` e `boot` tiveram seus **tratamentos de erro** alterados para usar a nova classificação. Os caminhos de sucesso dessas funções não foram reescritos.
- `renderSessions` e `renderChatStatus` passaram a exibir a ação “Voltar ao perfil padrão” quando o erro é de perfil.

#### Por que foi feito

O Relatório 46 registra o diagnóstico da Fase 2:

- o login oficial do usuário era aceito;
- o perfil secundário não tinha `API_SERVER_KEY` no escopo esperado;
- as requisições ao perfil voltavam 401;
- o PWA interpretava esse 401 como sessão expirada.

A correção teve dois objetivos: usar a chave do perfil e não tratar erro de API do perfil como expiração da sessão do usuário.

#### Consequência técnica

- Uma falha de chave do perfil deixou de abrir a tela de login; passou a mostrar `profile_api_key_missing` ou `profile_api_auth_failed`.
- O PWA passou a **exigir** que a chave existisse no escopo do perfil antes de enviar a requisição. No estado congelado, ele enviava a chave global e deixava o gateway decidir.
- Em um gateway que exige chave por perfil, como o Hermes v0.22.2 auditado no Relatório 47, essa exigência está correta. Em um gateway antigo que aceitasse a chave global em `/p/`, o TREG poderia recusar um perfil que o original acessaria. Essa diferença é condicional e não foi observada no gateway auditado.

### 4.2 Relação com o erro atual

**Comprovada:** o commit `71038be` é o ponto em que a resolução de autenticação por perfil surgiu (`git log -S"_profile_api_key"`). É também o commit que introduziu `profile_api_key_missing`, `profile_api_auth_failed`, `isProfileApiError`, `isLoginRequired`, `returnToDefaultProfile` e `_gateway_error`.

**Comprovada pelo Relatório 47:** o perfil secundário da VPS não tinha `API_SERVER_KEY` no escopo; o gateway respondeu 401 em 53 requisições. O código da Fase 2 transforma esse cenário em erro de configuração.

**Hipótese:** se o PWA congelado fosse usado no mesmo perfil sem chave, ele enviaria a chave global; no Hermes v0.22.2 o gateway também responderia 401, mas o app mostraria login. A diferença visível seria a tela de login, não o erro de configuração. Essa comparação não foi executada lado a lado nesta fase.

## 5. Commit `a24cab2` — execução ativa na troca de perfil

### 5.1 O que mudou

Arquivo: `dashboard/pwa/app.js`, evento `change` do seletor de perfil.

Antes (Fase 2, após `71038be`):

- o perfil era alterado, a sessão aberta era fechada e as sessões eram recarregadas;
- se houvesse uma execução em andamento, ela continuava sendo acompanhada e podia atualizar a interface.

Depois:

```js
function detachActiveRun() {
  if (state.runCtx) finishRun(state.runCtx, { failed: true, skipReload: true });
}
```

O evento `change` passou a chamar `detachActiveRun()` antes de `closeSession()`.

### 5.2 Por que foi feito

A mensagem do commit é “desanexar execucao ativa ao trocar de perfil”. O objetivo é impedir que eventos do perfil anterior atualizem a conversa do novo perfil após a troca.

### 5.3 Consequência técnica

- O cliente deixa de acompanhar a execução antiga e remove o run pendente do `localStorage`.
- O run pode continuar no servidor, mas a resposta não é mais associada à conversa aberta no cliente.
- Isso protege o isolamento entre perfis, mas altera a continuidade de uma resposta em andamento. Se o usuário trocar de perfil durante uma resposta, ela pode “desaparecer” da interface.
- Não é uma alteração de autenticação; é uma alteração de fluxo de conversa. Não há evidência de que seja a causa do erro de perfil, mas é uma mudança das Fases 2 que pode afetar a percepção de seleção/alternância.

## 6. Commit `43f0441` — a chave administrada da Fase 3

### 6.1 O que mudou

Arquivo: `dashboard/plugin_api.py` e testes.

- Foi criada `_managed_env_value(key)` (linha 64 na Fase 3), que lê o escopo administrado via `hermes_cli.managed_scope.load_managed_env()` e, como fallback, `HERMES_MANAGED_DIR/.env` ou `/etc/hermes/.env`.
- `_profile_api_key(profile)` passou a:
  1. usar `build_profile_secret_scope(home)` (composição oficial);
  2. aplicar override do valor administrado, se existir;
  3. usar o `.env` do perfil como fallback;
  4. retornar `profile_api_key_missing` se nada existir.

Antes (Fase 2):

- o `.env` do perfil era lido primeiro;
- `build_profile_secret_scope` só era consultado se o `.env` não tivesse a chave.

Depois (Fase 3):

- a precedência passou a espelhar o gateway: o escopo administrado vence o `.env` do perfil;
- versões do Hermes cujo `build_profile_secret_scope` não inclua o escopo administrado também passam a usar o override explícito.

### 6.2 Por que foi feito

O Relatório 48 registra que o Hermes v0.22.2 compõe o `.env` administrado por último e com override em `build_profile_secret_scope`. O ajuste foi necessário para o plugin usar a mesma chave que o gateway espera, especialmente quando o perfil tem uma chave própria diferente da chave administrada.

### 6.3 Consequência técnica

- Com `/etc/hermes/.env` contendo a mesma `API_SERVER_KEY` do perfil padrão, o plugin e o gateway passam a concordar.
- Sem essa fonte e sem chave no `.env` do perfil, o resultado continua sendo `profile_api_key_missing`.
- O commit não cria, gera, rotaciona ou substitui a chave; ele apenas muda a fonte/precedência da leitura.
- Não há alteração de frontend, seleção, alternância ou carregamento de conversas neste commit.

## 7. Funções substituídas, modificadas ou duplicadas

| Função/arquivo | Estado congelado | Fase 2 | Fase 3 | Classificação |
|---|---|---|---|---|
| `_api_key()` / `_api_key(profile)` | Global | Passa a aceitar perfil | Mantém | **Substituída/modificada** |
| `_profile_api_key()` | Não existia | Criada | Precedência alterada | **Nova** |
| `_managed_env_value()` | Não existia | Não existia | Criada | **Nova** |
| `_client()` | Sem perfil | Recebe perfil | Mantém | **Modificada** |
| `_proxy_json()` | Sem perfil | Recebe `profile` | Mantém | **Modificada** |
| `_gateway_error()` | Não existia | Criada | Mantém | **Nova** |
| `_gateway_sse_error()` | Não existia | Criada | Mantém | **Nova** |
| `api_key_missing` / `profile_api_key_missing` | Não existia | Criados | Mantidos | **Novos** |
| `isProfileApiError` / `isLoginRequired` | Não existiam | Criadas | Mantidas | **Novas** |
| `handleProfileApiError` / `returnToDefaultProfile` | Não existiam | Criadas | Mantidas | **Novas** |
| `detachActiveRun` | Não existia | Criada em `a24cab2` | Mantida | **Nova** |
| `loadSessions` | Paginação e marcação por perfil | Só o `catch` mudou | Sem mudança | **Preservada no sucesso** |
| `loadMessages` | Usa `state.current.profile` | Só o `catch` mudou | Sem mudança | **Preservada no sucesso** |
| `loadProfiles` | Lista e preenche `#agent` | Só o `catch` mudou | Sem mudança | **Preservada no sucesso** |
| `openSession` / `ctx.profile` | Associação por perfil | Sem mudança | Sem mudança | **Preservada** |
| `_pfx` / rotas `/p/` | Prefixo por perfil | Sem mudança | Sem mudança | **Preservada** |
| `treg-pwa-profile` | Já existia no congelado | Sem mudança | Sem mudança | **Preservada** |
| Tratamento 401/403 | `code: "auth"` → login | `session_expired` / `forbidden` / código do perfil | Sem mudança | **Substituído** |

## 8. Quando surgiu cada mudança

| Mudança | Commit | Evidência |
|---|---|---|
| Resolução de chave por perfil | `71038be` | `git log -S"_profile_api_key"` |
| `_gateway_error` e códigos de erro | `71038be` | `git log -S"_gateway_error"` |
| `isProfileApiError` / `isLoginRequired` | `71038be` | `git log -S"isProfileApiError"` |
| Retorno ao perfil padrão | `71038be` | `git log -S"returnToDefaultProfile"` |
| Desanexar execução ativa | `a24cab2` | `git log -S"detachActiveRun"` |
| Preferência pela chave administrada | `43f0441` | `git log -S"managed_key"` |
| Mudança de tratamento 401/403 | `71038be` | diff de `hermes-api.js` e `app.js` |

## 9. Como mudou o tratamento de 401 e 403

### Antes — congelado

- `hermes-api.js`: 401/403 → `code: "auth"` (linha 166); `runEvents` → `ApiError("login", status, "auth")` (linhas 266–267).
- `app.js`: `callApi` e os tratamentos locais chamavam `showLogin()` para `code === "auth"` ou status 401/403.
- Resultado: qualquer falha de autorização do perfil virava tela de login.

### Depois — Fase 2

- `hermes-api.js`: preserva o `code` do corpo; 401 sem código → `session_expired`; 403 → `forbidden`; 5xx → `gateway_unavailable`.
- `app.js`: `isLoginRequired()` abre login apenas para `session_expired` (ou 401 não classificado como perfil); `isProfileApiError()` e `handleProfileApiError()` tratam `profile_api_key_missing`, `profile_api_auth_failed`, `profile_forbidden`, `api_key_invalid` etc. como erro de configuração/autorização, não como sessão expirada.
- Resultado: erro de perfil não abre login; mostra mensagem e ação de retorno.

### Fase 3

- Sem alteração no tratamento de 401/403; apenas a origem da chave e as mensagens.

## 10. Alterações que passaram a exigir comportamento diferente da arquitetura original

1. **Chave por perfil:** o original e o congelado usavam uma chave global para todas as rotas. A Fase 2 passou a exigir que a chave existisse no escopo do perfil. O README original já documentava a mesma chave por perfil, mas o código original não fazia essa verificação no cliente; ele enviava a chave global e deixava o gateway decidir. A Fase 2 antecipa a decisão para o cliente.
2. **Erro de perfil versus login:** o original e o congelado tratavam 401/403 como login. A Fase 2 passou a exigir classificação por código. É uma mudança de arquitetura de erro, não de rota ou de seleção.
3. **Escopo administrado:** a Fase 3 passou a preferir a chave administrada, alinhada ao Hermes v0.22.2, mas isso pressupõe uma fonte externa (`/etc/hermes/.env` ou `HERMES_MANAGED_DIR`) que o código não cria.
4. **Detach de execução:** a Fase 2 passou a desligar a execução ativa na troca de perfil; o original não fazia isso. É uma mudança de fluxo de conversa, não de autenticação.

## 11. Alterações que podem afetar seleção, alternância e carregamento

Além da autenticação, as Fases 2 e 3 alteraram:

- `handleProfileApiError()` pode definir `sessionsError`, `searchError` ou `messagesError` e a ação de retorno; isso altera o que a lista/chat exibem, mas não o caminho de sucesso.
- `returnToDefaultProfile()` limpa perfil, sessões, busca, erros, execução ativa e conversa aberta; é uma nova navegação, não uma regressão de seleção.
- `loadProfiles()` ganhou `catch` com toast/login/erro de perfil; o sucesso continua igual.
- `loadCapabilities()` ganhou tratamento de `caps.error`; pode exibir o erro de perfil antes da lista de sessões.
- `detachActiveRun()` (a24cab2) interrompe o acompanhamento da execução na troca de perfil.
- `loadSessions()` e `loadMessages()` mudaram apenas o `catch`; o sucesso, a paginação, a marcação `profile` e os guardas `prof !== state.profile` permanecem.
- `openSession()`, `ctx.profile`, `pq()`, `_pfx()`, `loadProfiles()` no sucesso e `treg-pwa-profile` não mudaram nas Fases 2/3.

Não foi encontrada alteração nas Fases 2/3 que reescreva a seleção de perfil ou o carregamento bem-sucedido de conversas.

## 12. Diagnóstico técnico

### 12.1 Causa comprovada do erro observado

O erro observado nos perfis secundários é compatível com a ausência de `API_SERVER_KEY` no escopo do perfil, medida pelo Relatório 47: o gateway v0.22.2 responde 401 em `/p/<perfil>/` quando o perfil não tem a chave. O código da Fase 2 (`71038be`) é o que transforma esse cenário em `profile_api_key_missing`/`profile_api_auth_failed` e deixa de abrir a tela de login. A Fase 3 (`43f0441`) melhora a fonte da chave, mas não cria a chave ausente.

O estado congelado e o original não produzem a mensagem de configuração porque usam a chave global e tratam 401/403 como login. No gateway v0.22.2, eles também não autenticariam o perfil sem a chave; apenas mostrariam o sintoma de login. Portanto, a mudança de autenticação **explica o sintoma e a mensagem**, mas a **causa primária** é a configuração ausente no escopo do perfil.

### 12.2 O que preservar

- **Preservar** a resolução de chave por perfil (`71038be`): é compatível com o Hermes v0.22.2 e evita usar a chave do perfil padrão em um perfil secundário.
- **Preservar** a classificação de 401/403 e o retorno ao perfil padrão (`71038be`): evita o loop de login descrito na Fase 2.
- **Preservar** a preferência pela chave administrada (`43f0441`): alinhada ao escopo oficial do Hermes.
- **Preservar** a listagem, o seletor, `_pfx`, `openSession`, `ctx.profile` e o carregamento bem-sucedido de conversas: não foram alterados nas Fases 2/3.
- **Preservar** o `treg-pwa-profile` e o fechamento da conversa na troca, que já vinham do congelado.

### 12.3 O que adaptar

- **Adaptar, se necessário, a pré-checagem `profile_api_key_missing`** para compatibilidade com gateways antigos que aceitem a chave global em `/p/`. No Hermes v0.22.2 isso não é necessário; a pré-checagem está correta. Uma adaptação futura deveria ser condicionada à capacidade real do gateway, não uma reversão para a chave global.
- **Adaptar/verificar `detachActiveRun`** (`a24cab2`) se o requisito for manter a resposta em andamento visível após a troca de perfil. Hoje ele protege o isolamento, mas pode fazer uma resposta “sumir” da interface.
- **Adaptar, se desejado, o momento de exibição do erro de capabilities** para não mostrar o erro de perfil antes de a lista de perfis/sessões terminar de carregar. É uma questão de UX, não de autenticação.
- **Adaptar** a mensagem de erro para deixar explícito que a chave é uma configuração externa do Hermes, sem sugerir geração de nova chave. A Fase 3 já caminha nessa direção.

### 12.4 O que não reverter

- **Não reverter** a Fase 2 inteira para o comportamento de chave global: isso reintroduziria o risco de usar a credencial do perfil padrão em perfis secundários e o loop de login.
- **Não reverter** a classificação de erros: ela é necessária para distinguir sessão expirada de falha de API do perfil.
- **Não reverter** a Fase 3 para a leitura exclusiva do `.env` do perfil: a precedência administrada é a que o gateway v0.22.2 usa.
- **Não alterar** a versão congelada, a tag, a Release ou a `main`.

### 12.5 Conclusão sobre a causa

| Afirmação | Classificação |
|---|---|
| O seletor e o fluxo de conversas por perfil foram preservados do congelado/original | **Comprovada no código** |
| O erro atual é compatível com a falta de `API_SERVER_KEY` no escopo do perfil | **Comprovada pelo Relatório 47** |
| A Fase 2 introduziu a resolução por perfil e a mensagem de erro atual | **Comprovada pelo `git log -S` e diff** |
| A Fase 3 mudou a fonte/precedência da chave, sem criar a chave | **Comprovada no diff** |
| O congelado/original funcionaria no mesmo perfil sem a chave | **Não comprovada; o código e o Relatório 47 indicam que não** |
| O TREG é mais restritivo que gateways antigos que aceitam a chave global | **Hipótese condicional** |
| `detachActiveRun` causa perda de resposta ao trocar de perfil | **Hipótese de fluxo, não de autenticação** |
| O pré-carregamento de capabilities é a causa raiz | **Não; no máximo antecipa o erro** |

## 13. Evidências por arquivo/função

| Evidência | Original/congelado | Fase 2/3 | Impacto |
|---|---|---|---|
| `dashboard/plugin_api.py` `_api_key` | Global (congelado linha 48) | `_profile_api_key` em `71038be`; `_api_key(profile)` | Muda a credencial usada por perfil |
| `dashboard/plugin_api.py` `_proxy_json` | Sem `profile` (linha 72) | Recebe `profile` e repassa à chave | Requisições usam a chave do perfil |
| `dashboard/plugin_api.py` `_gateway_error` | Não existia | Criada em `71038be` | 401/403/5xx viram códigos próprios |
| `dashboard/plugin_api.py` `_managed_env_value` | Não existia | Criada em `43f0441` | Lê o escopo administrado |
| `dashboard/pwa/hermes-api.js` mapeamento | 401/403 → `auth` (linha 166) | `session_expired`/`forbidden` + code do payload | Muda a classificação do erro |
| `dashboard/pwa/hermes-api.js` `runEvents` | 401/403 → `ApiError("login")` (linhas 266–267) | Lê o corpo e classifica | SSE não força login |
| `dashboard/pwa/app.js` `callApi` | 401/403 → login (linha 93) | `isLoginRequired` | Login só para sessão expirada |
| `dashboard/pwa/app.js` `loadProfiles` | Sucesso igual; sem catch | Catch com erro de perfil | Exibe erro de listagem |
| `dashboard/pwa/app.js` `change` | Fecha sessão (congelado) | Também `detachActiveRun` em `a24cab2` | Interrompe acompanhamento do run |
| `dashboard/pwa/app.js` `loadSessions` | Sucesso igual | Só `catch` mudou | Sem regressão no carregamento |
| `dashboard/pwa/app.js` `loadMessages` | Sucesso igual | Só `catch` mudou | Sem regressão no carregamento |
| `dashboard/pwa/app.js` `openSession`/`ctx.profile` | Associação por perfil | Sem mudança | Preservado |
| `dashboard/pwa/index.html` | Sem botão de retorno | `#login-default` em `71038be` | Nova saída da tela de login |
| `README` múltiplos agentes | Exige a mesma chave por perfil (linhas 80–88) | TREG preserva a orientação | Requisito externo já documentado |

## 14. Declaração de não alteração

Esta fase foi exclusivamente de leitura do histórico Git e dos arquivos. Não houve:

- alteração do commit congelado `9b34073`, da tag ou da Release;
- alteração da `main` ou de qualquer branch de código;
- checkout com alterações, reset, rebase, cherry-pick ou merge;
- alteração do repositório original `AstraOnlineWeb/hermes-plugins`;
- alteração do core do Hermes, do plugin `hermes-pwa`, de configurações, `.env`, YAML, chaves ou serviços;
- acesso SSH, deploy, reinício ou alteração na VPS;
- instalação, desinstalação ou atualização de plugins.

A única escrita foi este relatório e sua entrada no índice, em branch documental nova e independente.
