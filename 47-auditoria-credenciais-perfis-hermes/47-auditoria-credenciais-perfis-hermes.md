# 47 — Auditoria de credenciais, criação de perfis e autenticação oficial do Hermes

**Data:** 2026-11-01
**Fase:** auditoria técnica somente leitura (pré-implementação)
**Natureza:** investigação. Nenhum código, configuração, segredo, perfil ou serviço foi alterado.
**Relatórios relacionados:** 44 (diagnóstico da falha), 46 (Fase 2 — correção de autenticação no plugin)

---

## 0. Versão e commits auditados

| Item | Valor verificado |
|---|---|
| Hermes | `Hermes Agent v0.22.2 (2026.9.24) · upstream d923a5eb` (`hermes --version`) |
| Diretório de instalação | `/opt/hermes` (código-fonte auditado diretamente) |
| `HERMES_HOME` | `/opt/data` |
| Plugin TREG PWA (base congelada) | `9b34073c94f61a78b427b518cd587909cf80884b` |
| Branch da Fase 2 (implementação) | `fix/treg-pwa-autenticacao-multiperfil` |
| SHA final da Fase 2 (conforme relatório 46) | `a24cab2cf2a763c00ed2883eb2eb30741c0329c4` |
| Branch documental consultada | `docs/fase-2-autenticacao-multiperfil` |
| Último relatório existente | 46 (`46-autenticacao-multiperfil-treg-pwa.md`) |

Convenção usada neste relatório: **[FATO]** = confirmado no código ou na instalação; **[HIPÓTESE]** = inferência plausível que exige validação antes de virar decisão.

---

## 1. Fluxo de criação de perfis pelo painel oficial

### 1.1 Rota HTTP

`POST /api/profiles` — `hermes_cli/web_routers/profiles.py:815` (`create_profile_endpoint`). **[FATO]**

A tradução das opções da interface (linhas 818-828):

```python
explicit_source = (body.clone_from or "").strip()
if explicit_source:
    # Clone config/skills/SOUL (or full state when clone_all) from the named source.
    clone, clone_from, clone_config = True, explicit_source, not body.clone_all
elif body.clone_all:
    # Historical dashboard behavior: clone-all with no explicit source copies default.
    clone, clone_from, clone_config = True, "default", False
else:
    clone = body.clone_from_default
    clone_from = "default" if clone else None
    clone_config = clone
```

Ou seja:

- `clone_from` explícito → clona do perfil nomeado; `clone_config=True` salvo quando `clone_all`.
- `clone_all` sem origem → copia do perfil `default` com `clone_config=False`.
- Sem clonagem → perfil vazio, com bloco de modelo semeado.

Depois da criação, ainda no mesmo endpoint (linhas 838-841), o perfil sem clone recebe skills embutidas e um wrapper em `~/.local/bin`.

### 1.2 Criação no núcleo

`hermes_cli/profiles.py:1362` (`create_profile`). Pontos que importam para esta auditoria:

- O perfil é montado em diretório de staging e publicado com um único `os.rename` (linhas 1418-1430) — um multiplexer rodando não adota árvore pela metade.
- `_maybe_register_gateway_service(canon)` (1438) registra o gateway do perfil como serviço s6, com `start_now=False` (ver 1920-1939).
- `_notify_multiplexer(canon)` (1441) avisa o gateway multiplexer para passar a servir o perfil.
- **Em nenhum ponto há geração, cópia ou solicitação de credencial técnica.** **[FATO]**

### 1.3 O que é criado

`_bootstrap_profile_dir` (`profiles.py:1330`) + `_PROFILE_DIRS` (`profiles.py:34`):

- Diretórios: `memories`, `sessions`, `skills`, `skins`, `logs`, `plans`, `workspace`, `cron`, `home`.
- Sem clone: apenas `_seed_model_config(profile_dir)` (linha 1344).
- Com clone: copia `_CLONE_CONFIG_FILES = ["config.yaml", ".env", "SOUL.md"]` (linha 37), a árvore `skills/`, `memories/MEMORY.md`, `memories/USER.md`, plugins instalados e configuração do provedor de memória.
- `clone_all`: `_clone_all_into` (1265) copia quase tudo, cria os diretórios de histórico vazios, remove arquivos de runtime (`_CLONE_ALL_STRIP`, linha 44: `gateway.pid`, `gateway_state.json`, `processes.json`, artefatos do bot-desktop) e **descarta grants OAuth de uso único** (1278-1288), deixando o clone herdar o grant raiz pelo pool de credenciais.
- Em qualquer clone, `strip_channel_settings` (`profile_channels.py:412`) remove do `.env` e do `config.yaml` apenas **credenciais de canal** (WhatsApp, Telegram etc.) e, com `clone_all`, também o estado de emparelhamento.

**Consequência verificada na instalação:** o perfil `nome` tem `.env` com 24 chaves; o `default` tem 28. A diferença é exatamente `WHATSAPP_ALLOWED_USERS`, `WHATSAPP_DM_POLICY`, `WHATSAPP_ENABLED`, `WHATSAPP_MODE` — prova de que o `.env` foi clonado e depois limpo de canais. Como o `.env` do `default` **não contém** `API_SERVER_KEY` (ela vive no ambiente do processo), o clone também não contém. **[FATO]**

---

## 2. Comportamento das opções de clonagem

| Opção do painel | Efeito no código | Copia `API_SERVER_KEY`? |
|---|---|---|
| Clonar configuração (skills, SOUL, config) | `_CLONE_CONFIG_FILES` + skills + memórias | Só se estiver no `.env` de origem — hoje não está |
| Clonar tudo (memórias, sessões, habilidades, estado) | `_clone_all_into` (copytree completo com strip) | Mesma regra: depende do `.env` de origem |
| Sem clone | perfil vazio + skills embutidas | Não |

**[FATO]** A clonagem é fiel ao `.env` da origem; a ausência da chave no destino é consequência direta da ausência na origem — não de um strip específico de `API_SERVER_KEY`.

**[FATO]** `strip_channel_settings` não conhece `API_SERVER_KEY`: o índice de chaves é montado a partir dos plugins de canal (`ChannelKeyIndex`), e `API_SERVER_KEY` não é chave de plataforma.

---

## 3. Arquitetura de credenciais e autenticação

### 3.1 Autenticação do usuário (global, não por perfil)

- Provedor `BasicAuthProvider` (`/opt/hermes/plugins/dashboard_auth/basic/__init__.py`), configurado por processo via `HERMES_DASHBOARD_BASIC_AUTH_USERNAME/PASSWORD/SECRET`.
- Sessão = token HMAC-SHA256 assinado com um `secret` único, cookie httpOnly, TTL 12 h, refresh 30 dias.
- Rota de login: `POST /auth/password-login` (`hermes_cli/dashboard_auth/routes.py:447`).
- **Não existe usuário/senha por perfil.** O mesmo login autentica o dashboard e serve de gate para `/api/plugins/*`, que é por onde o TREG PWA passa. **[FATO]**

### 3.2 Credencial serviço-a-serviço (`API_SERVER_KEY`)

- Listener: `gateway/platforms/api_server.py`, porta 8642, exigindo `Authorization: Bearer <API_SERVER_KEY>`.
- Chave mínima: `_has_usable_api_server_key` (`gateway/config.py:544`) exige `has_usable_secret(min_length=16)`; sem chave utilizável o adaptador não sobe.
- No perfil padrão, a chave esperada é a do processo: `_expected_api_key` (`api_server.py:1535-1539`).
- Em rota de perfil secundário, a chave esperada é resolvida **no escopo daquele perfil** (1540-1550):

```python
key = get_secret("API_SERVER_KEY", "") or ""
return key if has_usable_secret(key, min_length=16) else ""
```

Sem chave, `_check_auth` (1559-1572) falha fechado com 401 `gateway_auth_failed`.

### 3.3 Escopo de segredos

`agent/secret_scope.py`:

- `_GLOBAL_ENV_EXACT` (174) lista variáveis realmente globais; o comentário nas linhas 185-189 é explícito: *"API_SERVER_KEY is a credential: NOT here."*
- `get_secret` (219-248): com escopo de perfil instalado e `serves_routed_profile()` verdadeiro, **miss devolve o default — nunca lê `os.environ`**. É o fail-closed que impede um perfil de herdar a credencial do dono.
- `build_profile_secret_scope` (390-418) compõe, nesta ordem:
  1. `<home>/.env` do próprio perfil;
  2. fontes externas de segredo do perfil (`env_loader.get_secret_source_values`, hidratadas por `hydrate_profile_secret_sources`);
  3. exceção histórica `GATEWAY_ALLOW_ALL_USERS` apenas para o home do processo;
  4. **`.env` administrado** (`load_managed_env()`), por último e com override.

---

## 4. Gateway, API Server e isolamento entre perfis

- Multiplex é o único modelo suportado: `hermes_cli/gateway_multiplex_mode.py:1-30` — o default é ligado e `gateway.multiplex_profiles: false` está aposentado; perfil isolado só via `gateway.standalone: true`, um shim temporário. **[FATO]**
- Resolução de rota: `_resolve_request_profile` (`api_server.py:1647`) valida `/p/<perfil>` contra `profiles_to_serve(multiplex=True)`; perfil desconhecido → 404.
- Escopo por requisição: `_make_profile_prefix_middleware` (1693-1716) instala o contexto de perfil **antes** do handler, com `self._profile_scope(profile)`.
- `_profile_scope` (1664-1683) chama `gateway.run._profile_runtime_scope`, que:
  - aplica `set_hermes_home_override`;
  - monta o mapa de segredos com `_load_profile_secret_scope` → `hydrate_profile_secret_sources` + `build_profile_secret_scope`;
  - instala `set_secret_scope`.
- Resultado: cada requisição `/p/<x>/` roda com home, config, skills, memória **e credenciais** daquele perfil. Isolamento e autorização são por requisição, não por processo. **[FATO]**

---

## 5. Por que o perfil padrão funciona e o secundário não

Cadeia confirmada (combinando código + instalação):

1. O backend do PWA (`dashboard/plugin_api.py`) usa `API_SERVER_KEY` do **ambiente do processo do dashboard**. Esse processo é o do perfil padrão; logo a chave enviada é a chave do `default`. **[FATO]**
2. `GET /api/sessions` → `_expected_api_key` devolve `self._api_key` (mesma chave) → 200. **[FATO, medido]**
3. `GET /p/nome/api/sessions` → escopo do `nome` → `.env` do perfil sem `API_SERVER_KEY`, fontes externas vazias, `.env` administrado inexistente → `""` → 401 `gateway_auth_failed`. **[FATO, medido: 53 requisições, 53× 401]**
4. O gateway registra o motivo exato: `API server rejected request for profile 'nome': no profile-scoped API_SERVER_KEY is configured` (`profiles/nome/logs/agent.log`, 12:08:47 → 13:09:41).

Observação adicional da instalação: o serviço `gateway-nome` do s6 está `down (not started yet)`; seu `run` usa `with-contenv` e `hermes -p nome gateway run --replace`. Como o perfil não define `API_SERVER_PORT`, ele herdaria 8642 — a mesma porta do gateway padrão. O próprio código documenta o conflito (`profiles.py:1924-1929`: *"two profiles that both leave the port at its default will both try to bind 8642"*). Ou seja: o gateway dedicado do perfil não sobe, e o perfil só é atendido pelo multiplex do gateway padrão. **[FATO + HIPÓTESE sobre a causa exata da não-subida]** — o `down` é fato; atribuí-lo exclusivamente à porta é inferência, pois o serviço foi registrado com `start_now=False` e nunca foi iniciado.

---

## 6. Respostas às perguntas da fase

**P1. O Hermes gera automaticamente alguma credencial técnica ao criar um perfil?**
Não. `create_profile` (`profiles.py:1362-1442`) cria diretórios, clona arquivos e registra serviço/notifica o multiplexer. Não há geração de chave, token ou segredo. **[FATO]**

**P2. A `API_SERVER_KEY` é obrigatoriamente exclusiva por perfil?**
Não. A *resolução* é por perfil (cada perfil valida contra a própria cópia), mas nada no código exige valores distintos — a comparação é de igualdade com a chave do escopo (`api_server.py:1578`). O mesmo valor em todos os perfis funciona e mantém o isolamento de dados. **[FATO no código; validação experimental só no perfil padrão]** Não há, em nenhum ponto, checagem de unicidade.

**P3. O perfil secundário pode usar o API Server por meio da autenticação oficial do Hermes?**
Parcialmente. A autenticação **do usuário** é global e vale para qualquer perfil (o login do dashboard não tem noção de perfil). A autenticação **de serviço** (plugin → api_server) exige a chave no escopo do perfil. Hoje: usuário OK, serviço bloqueado. **[FATO]**

**P4. O gateway possui mecanismo nativo para resolver o perfil e suas credenciais?**
Sim: `_resolve_request_profile` + `_profile_scope` + `_profile_runtime_scope` + `build_profile_secret_scope`, aplicados por requisição. **[FATO]**

**P5. `build_profile_secret_scope` resolve automaticamente as credenciais necessárias?**
Resolve automaticamente **se** a credencial estiver em uma das fontes oficiais que ele compõe: `.env` do perfil, fontes externas do perfil ou `.env` administrado. Hoje nenhuma delas fornece `API_SERVER_KEY` para o perfil `nome` — por isso o resultado é vazio. **[FATO]**

**P6. É possível usar uma autorização central mantendo isolamento e permissões por perfil?**
Sim, por dois caminhos oficiais, ambos alimentando o mesmo escopo:
 (a) `.env` administrado em `/etc/hermes/.env` (`managed_scope.py:31,45-60,99-121`), composto **por último e com override** em todo escopo de perfil;
 (b) fontes externas de segredo configuradas por perfil (`env_loader.get_secret_source_values`), que exigem configuração por perfil — portanto não resolvem "perfil futuro sem toque manual".
O isolamento de dados e das demais credenciais permanece: o escopo continua sendo por perfil; só a chave escolhida passa a ser comum. **[FATO]**

**P7. Qual é a solução tecnicamente correta para o TREG PWA acompanhar perfis criados no futuro?**
A dupla: credencial central disponível a todo escopo de perfil + resolução no plugin já implementada na Fase 2. Detalhe na seção 8. **[RECOMENDAÇÃO]**

**P8. Existe herança, compartilhamento, resolução automática ou geração de credenciais na criação de perfis?**
- Geração: não.
- Herança automática de `API_SERVER_KEY`: não — proibida por desenho (fail-closed).
- Herança de outras credenciais: sim, por dois caminhos — `.env` clonado (cópia do valor, não vínculo) e pool de credenciais OAuth com fallback ao grant raiz (`_clone_all_into`, 1278-1288). **Não existe pool equivalente para `API_SERVER_KEY`**: o pool cobre credenciais de provedor de LLM (`hermes_cli/auth.py:948`), não a chave do gateway. **[FATO]**
- Mecanismo oficial para plugins acessarem perfis autorizados sem chave manual: **não existe helper**. `PluginContext` (`hermes_cli/plugins.py:230`) expõe config, estado, ferramentas, hooks e `platform_actions` — nenhum cliente de gateway, nenhum acesso a chave. Plugins falam HTTP por conta própria, como o TREG PWA faz. **[FATO]**

---

## 7. Alternativas técnicas avaliadas

| # | Alternativa | Como funcionaria | Prós | Contras | Veredito |
|---|---|---|---|---|---|
| A | `API_SERVER_KEY` no `.env` administrado (`/etc/hermes/.env`) | `build_profile_secret_scope` compõe `load_managed_env()` em todo perfil, com override | Central; vale para perfis atuais e futuros sem toque; sem mudança no Hermes nem no plugin | Arquivo root-owned (o usuário `hermes` não escreve); amplia o alcance da chave a todos os perfis; exige validação de que o cache por assinatura de arquivo a pega sem reiniciar | **Recomendada** |
| B | Semear `API_SERVER_KEY` no `.env` de cada perfil na criação | Gancho pós-criação gravando a chave | Simples de entender; isolamento intacto | Não há evento `profile_created` para plugins (verificado: `plugin_events.py` só define o prefixo `plugin.`); exigiria mudança no núcleo ou automação externa | Boa como plano B |
| C | Gateway aceitar a chave do default em rotas `/p/<x>/` | Uma chave "mestre" para todos | Zero configuração | Quebra o fail-closed e o isolamento; qualquer perfil passaria a responder à credencial do dono | **Rejeitada** |
| D | Gateway dedicado por perfil em porta própria | `hermes -p nome gateway run`, `API_SERVER_PORT` distinto, chave vinda do `with-contenv` | Funciona com a chave do ambiente, sem `.env` por perfil | Topologia multiplex-only trata gateway por perfil como shim temporário (`gateway.standalone`); conflito de porta hoje; mais processos e mais superfície | Rejeitada como solução principal |
| E | Proxy interno do dashboard com cookie (sem chave) | Plugin chamaria o gateway por uma rota same-origin autenticada por cookie | Eliminaria a chave do caminho | Essa rota não existe para plugins; exigiria mudança no núcleo | Fora de escopo |
| F | Plugin resolver a chave por perfil (Fase 2) | `_profile_api_key` lê `.env` do perfil e `build_profile_secret_scope` | Já implementado; não exige núcleo novo; mensagens de erro claras | Só funciona se a chave existir no escopo — não elimina a necessidade da credencial | **Necessária, insuficiente sozinha** |

---

## 8. Recomendação final para o TREG PWA

**Combinação A + F**, nesta ordem:

1. **Fonte da credencial (A):** manter a `API_SERVER_KEY` em um `.env` administrado (`/etc/hermes/.env`) com o mesmo valor já usado pelo gateway padrão. Como `build_profile_secret_scope` compõe esse arquivo em todo escopo de perfil, perfis criados no futuro passam a autenticar sem nenhuma configuração individual. Alternativa operacional equivalente, se `/etc/hermes` não for viável: garantir que o `.env` de cada perfil contenha a chave (plano B).
2. **Resolução no plugin (F):** manter como está na Fase 2 — `_profile_api_key` lê `.env` do perfil e, na falta, `build_profile_secret_scope` (que já inclui fontes externas e o escopo administrado), com erro estruturado `profile_api_key_missing` quando não houver nada.
3. **UX:** manter a tradução de 401 de perfil para erro próprio (Fase 2) e o botão de retorno ao perfil padrão — nada de tela de login em laço.
4. **Nada de autenticação paralela:** a credencial continua sendo a do Hermes; o plugin apenas a resolve no lugar certo.

O que isso resolve: perfis novos passam a funcionar sem geração manual de chave, com o mesmo login de usuário e o mesmo isolamento de conversas, sessões e demais segredos.

---

## 9. Riscos, limitações e pontos a validar

1. **Escrita em `/etc/hermes`** — o diretório é `root:root`; o processo roda como `hermes`. A criação do `.env` administrado exige root na VPS (fora do meu alcance nesta fase). **[FATO]**
2. **Persistência do `/etc/hermes`** em rebuild do container — precisa ser verificado; se o diretório é efêmero, a solução A não sobrevive a um redeploy. **[HIPÓTESE]**
3. **Cache do escopo administrado** — `_cached_read` usa assinatura de `stat` (`managed_scope.py:69-88`), portanto uma alteração deveria ser lida sem reiniciar o gateway; confirmar na prática antes de depender disso. **[HIPÓTESE]**
4. **Alcance da chave** — uma chave única para todos os perfis significa que o comprometimento de um perfil expõe a API de todos. Trade-off consciente; se o requisito for chaves distintas por perfil, a única saída oficial é o plano B (semeadura por perfil), sem herança. **[FATO/risco]**
5. **Gateways dedicados por perfil** — `gateway-nome` está `down` e herdaria a porta 8642; não é pré-requisito para o multiplex, mas explicar por que o serviço existe e não sobe evita confusão futura. **[FATO + HIPÓTESE]**
6. **Ausência de evento de criação de perfil** — impede que um plugin reaja sozinho a perfis novos; qualquer automação nesse sentido depende de mudança no núcleo. **[FATO]**
7. **Validação pendente** — a solução A não foi testada nesta fase (proibido alterar configuração). A prova experimental exige criar `/etc/hermes/.env`, reiniciar ou não o gateway, e repetir `GET /p/<perfil>/api/sessions`.

---

## 10. Arquivos investigados

**Núcleo do Hermes (somente leitura)**
- `hermes_cli/web_routers/profiles.py` — `create_profile_endpoint` (815), tradução das opções de clone (818-828)
- `hermes_cli/profiles.py` — `create_profile` (1362), `_bootstrap_profile_dir` (1330), `_clone_all_into` (1265), `_CLONE_CONFIG_FILES` (37), `_PROFILE_DIRS` (34), `_CLONE_ALL_STRIP` (44), `_maybe_register_gateway_service` (1920), nota de porta (1924-1929)
- `hermes_cli/profile_channels.py` — `strip_channel_settings` (412)
- `agent/secret_scope.py` — `_GLOBAL_ENV_EXACT` (174), `get_secret` (219), `build_profile_secret_scope` (390)
- `hermes_cli/managed_scope.py` — `get_managed_dir` (45), `_cached_read` (69), `load_managed_env` (112)
- `hermes_cli/env_loader.py` — `get_secret_source_values` (162), `hydrate_profile_secret_sources` (167)
- `gateway/platforms/api_server.py` — `_expected_api_key` (1535), `_check_auth` (1559), `_resolve_request_profile` (1647), `_profile_scope` (1664), middleware (1693)
- `gateway/run.py` — `_load_profile_secret_scope` (1772), `_profile_runtime_scope` (1788)
- `gateway/config.py` — `_has_usable_api_server_key` (544)
- `hermes_cli/gateway_multiplex_mode.py` — topologia multiplex-only (1-30)
- `hermes_cli/plugins.py` — `PluginContext` (230)
- `hermes_cli/auth.py` — `read_credential_pool` (948)

**Plugin (Fase 2, branch `fix/treg-pwa-autenticacao-multiperfil`)**
- `dashboard/plugin_api.py` — `_profile_api_key` (79), `_api_key` (108), `_gateway_error` (130)

**Instalação**
- `/opt/data/profiles/nome/.env` (24 chaves; sem `API_SERVER_KEY`)
- `/opt/data/.env` (28 chaves; sem `API_SERVER_KEY`)
- `/run/service/gateway-nome/run` (`with-contenv`, `hermes -p nome gateway run`)
- `/etc/hermes/` (existe, sem `.env`)

---

## 11. Declaração de não alteração

Esta auditoria foi exclusivamente de leitura. Executado apenas leitura de arquivos e logs, consulta HTTP `GET` local e leitura de APIs públicas do GitHub (`raw.githubusercontent.com` e `api.github.com`) para conferir a branch documental e o código da Fase 2.

Não houve: alteração de código, de configuração, de `.env`, criação ou remoção de chaves, alteração de perfis, sessões, banco de dados ou serviços, reinício de container/gateway/dashboard, instalação de dependências, deploy, push, merge, tag ou release. A branch `fix/treg-pwa-autenticacao-multiperfil` e a `main` permanecem intocadas.

Única escrita: este relatório e a proposta de índice (arquivo `report/README.md.47`), ambos não commitados.