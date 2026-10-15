# 08 — Cópia independente, isolamento e coexistência lado a lado

> Requisito adicional desta fase: a versão futura deve ter identidade técnica independente e,
> **se a arquitetura do Hermes permitir**, funcionar simultaneamente com o plugin original.
> Nada foi publicado, instalado ou renomeado — abaixo, o plano técnico para fazer isso depois,
> com critérios verificáveis de coexistência. Nenhum identificador foi alterado nesta auditoria.

## 1. Fontes consultadas (Context7 + código local)

Documentação oficial do Hermes Agent obtida via Context7 (MCP), confrontada com a implementação real:

| Fonte | ID / origem | Versões disponíveis | Uso neste relatório |
|---|---|---|---|
| Hermes Agent docs (guia `extending-the-dashboard.md`) | `/nousresearch/hermes-agent` | v2026.4.8, v2026.4.16, v2026.6.5 | Manifesto de dashboard plugin, ciclo de carga, `register(name)`, rotas de API e assets |
| Hermes Agent docs (`plugins/index.md`, `user-guide/.../plugins.md`, `desktop-plugin-sdk.md`) | `/nousresearch/hermes-agent` (mesma base) | idem | Instalação/enable, `register_command`, `APIRouter`, endpoints de plugin |
| Código local do plugin | `hermes-pwa/` v1.7.1 | — | Evidência de cada identificador mapeado no §3 |

**Limitação do Context7:** a documentação cobre o contrato de *um* plugin (manifesto, montagem, registro). **Nenhuma página encontrada** sobre dois plugins com o mesmo `name`, mesma `tab.path`, mesmo comando ou mesma rota de API — o comportamento nesses casos **depende da implementação interna do Hermes** (§5, categoria 3). Nenhum contrato foi inventado: onde a doc silencia, está marcado como não confirmado.

**Contratos documentados × implementação real (conformidade do original):**

| Contrato oficial | Original | Situação |
|---|---|---|
| `manifest.name` = identificador único, usado em URLs e registro; `register(name)` deve ser igual ao `name` | `manifest.json:2` = `hermes-pwa` = `register("hermes-pwa")` (`dist/index.js:155`) | ✅ Conforme |
| `api` montado em `/api/plugins/<name>/` atrás da auth do dashboard | `plugin_api.py` com `router`, docstring e rotas conferem; `API = "api/"` relativo | ✅ Conforme |
| `entry`/`css` relativos a `dashboard/`; assets em `GET /dashboard-plugins/<name>/<path>` (anti-traversal) | `entry dist/index.js`, `css dist/style.css`, `QR_LIB /dashboard-plugins/hermes-pwa/dist/qrcode.js` | ✅ Conforme (o path que parecia "fora do padrão" no relatório 05 é rota oficial) |
| `tab.path` (ex. `/my-plugin`), `tab.position after:<segmento>` | `path /pwa`, `position after:chat` (segmento sem barra — formato correto) | ✅ Conforme |
| `icon` = nome Lucide (`MessageSquare` válido; desconhecido cai para `Puzzle`) | `icon MessageSquare` | ✅ Conforme |
| Falha de script de um plugin: warning no console, dashboard segue sem ele; registro em até ~2 s, nav reativa | Não testado localmente (exige execução) | 📄 Documentado, validação pendente |
| `register_command`: conflito com built-ins (`help`, `model`, `new`…) é rejeitado com warning; built-ins prevalecem | Comando `pwa` não colide com built-ins | ✅ Conforme; colisão plugin×plugin **não documentada** |
| `hermes plugins install <owner>/<repo>`, `list`, `enable <plugin-name>` | README usa `install … --enable` + `list` no monorepo | ✅ Conforme |

## 2. Como o Hermes registra e carrega plugins (documentado)

1. **Descoberta:** dashboard expõe `GET /api/dashboard/plugins` (lista manifestos) e `GET /api/dashboard/plugins/rescan` (re-scan sem restart). Instalação/enable via CLI (`plugins install/list/enable`).
2. **Carga do frontend:** `main.tsx` expõe `window.__HERMES_PLUGIN_SDK__` + `window.__HERMES_PLUGINS__`; `App.tsx → usePlugins()` busca manifestos; para cada um injeta `<link>` do `css` e `<script>` do `entry`; o IIFE chama `register(name, Component)` (e opcionalmente `registerSlot`). Aba entra na navegação (salvo `hidden`), montada como rota.
3. **Backend:** `router` de `plugin_api.py` montado em `/api/plugins/<name>/` (processo do gateway, atrás da auth).
4. **Comandos:** `register(ctx)` → `ctx.register_command("pwa", …)` vira `/pwa` em CLI/gateway, com help/autocomplete.
5. **Separação oficial entre plugins:** o mecanismo é o **`name` único** — dele derivam mount da API, rota de assets, chave de registro do componente e (por convenção deste plugin) `tab.path`, comando e prefixos de storage. Não há namespace adicional documentado.

## 3. Mapa completo de colisões (original × cópia)

Chave da coluna Risco: 🔴 colide se igual · 🟢 compartilhável · 🟡 depende do Hermes.

| # | Elemento | Valor no original | Risco se igual | Categoria (§5) |
|---|---|---|---|---|
| C1 | `plugin.yaml: name` (id de instalação/enable) | `hermes-pwa` | 🔴 dois installs com mesmo id: um sombreia o outro / enable ambíguo | 1 — exclusivo obrigatório |
| C2 | `manifest.json: name` + `register("…")` (chave do registro frontend) | `hermes-pwa` | 🔴 segundo `register` sobrescreve o componente do primeiro (mesma chave) | 1 |
| C3 | Mount `/api/plugins/<name>/` (todo o backend + app) | `/api/plugins/hermes-pwa/` | 🔴 rotas idênticas: uma montagem prevalece; app/QR/STT respondidos pelo vencedor | 1 |
| C4 | `tab.path` (rota da aba no SPA) | `/pwa` | 🔴 mesma rota: uma página cobre a outra | 1 |
| C5 | Comando `/pwa` (+ `pwa_url()` → `/pwa`) | `pwa` | 🔴 dois handlers p/ mesmo comando; proteção documentada só contra built-ins | 1 (comport. exato = 3) |
| C6 | Assets `/dashboard-plugins/<name>/…` (`qrcode.js`) | `…/hermes-pwa/…` | 🔴 deriva do `name`; iguala se C1 igualar | 1 |
| C7 | SW `VERSION` + `CacheStorage` (origem + escopo `./`) | `hermes-pwa-v12`, escopo = mount da API | 🔴 com mounts distintos os escopos já separam; com mesmo mount, caches se misturam | 1 (renomear junto com C3) |
| C8 | `localStorage hermes-pwa-run / hermes-pwa-profile` (+ futuro `*-theme`) | prefixos `hermes-pwa-*` | 🔴 mesma origem + mesma chave: cópia retoma `run_id` alheio / herda perfil | 1 |
| C9 | PWA `manifest {id, start_url, scope}` + `Service-Worker-Allowed` | derivados do mount (`…/hermes-pwa/`) | 🔴 idênticos: SO trata como o mesmo app instalado | 1 (derivado de C3) |
| C10 | Env `HERMES_PWA_API_HOST`, `API_SERVER_*`, `HERMES_DASHBOARD_PUBLIC_URL` | compartilhadas | 🟢 mesma máquina/gateway: **devem** ser compartilhadas | 2 — compartilhável |
| C11 | `~/uploads` (`get_hermes_home()/home/uploads`) + `api/uploads/:nome` | único por host | 🟢 compartilhável (conteúdo por arquivo, nomes com timestamp+uuid); serve pelos dois mounts sem conflito | 2 |
| C12 | Sessões/runs do gateway (`source=api_server`, `?profile=` → `/p/:perfil`) | mesmos por host | 🟢 ambas as cópias veem as mesmas conversas — comportamento desejado, não colisão | 2 |
| C13 | `approvals.mode`, config STT (`GROQ_API_KEY`, `stt.*`) | por perfil/global | 🟢 mesma fonte de verdade; mudar por uma cópia reflete na outra (documentar, não duplicar) | 2 |
| C14 | Gateway `/v1/runs`, `/api/sessions`, `/api/audio/transcribe`, `/auth/password-login` | do núcleo | 🟢 consumir, nunca duplicar | 2 |
| C15 | Ordem de montagem/registro entre dois plugins distintos (quem vence se algo igualar) | implementação do host | 🟡 não documentado | 3 — depende do Hermes |
| C16 | `tab.position after:chat` com duas abas novas | navegação do SPA | 🟡 ordem relativa de terceiros não especificada; `register` tardio (>2 s) ainda aparece (nav reativa) | 3 |
| C17 | CSS da aba (`.hp-*`) × tema do painel; `app.css` × outro app | escopos distintos | 🟢 isolados hoje (prefixo `hp-`; app em página própria) desde que a cópia use prefixo próprio (ex. `.tg-*`) | 2 (com renome) |
| C18 | Limite arquitetural: dois PWAs instaláveis lado a lado no mesmo aparelho | SO + mounts distintos | 🟡 possível se C3/C7/C9 distintos; iOS sem manifest dinâmico pleno pode exigir validação | 3/4 |
| C19 | `plugin.yaml kind/version/tags`, textos de ajuda, QR `target /pwa` | metadados | 🟢/🔴 versão/tags livres; QR e textos devem apontar a rota nova | 1 p/ o que endereça rota |

## 4. Plano técnico de isolamento (executar só quando autorizado)

**Identidade proposta (exemplo):** id `treg-pwa`, aba `/treg` (label `TREG`, ícone Lucide próprio), comando `/treg`, env `TREG_PWA_API_HOST` (com fallback de leitura do legado por 1 versão), storage `treg-pwa-*`, SW `treg-pwa-v1`, CSS `.tg-*`, brand/manifest PWA próprios.
**Passos:** (i) copiar repo; (ii) renomear C1–C2–C4–C5–C8–C19 + `tests/test_plugin.py` (que hoje fixa `hermes-pwa` e `/pwa`); (iii) versionar SW (C7) e conferir `id/start_url/scope` sob o novo mount (C9); (iv) trocar prefixo CSS da aba e marca/ícones/`theme_color`; (v) `hermes plugins validate .` + `pytest`; (vi) publicar em repositório novo mantendo `LICENSE` MIT, autoria `AstraOnlineWeb`, cabeçalho do `qrcode-generator` e nota de independência da Nous Research (sem remover créditos); (vii) teste lado a lado (§6) com o original instalado.
**Compartilhar sem duplicar:** C10–C14 (env, uploads, sessões/runs, approvals/STT, endpoints do núcleo).

## 5. Classificação exigida

1. **Exclusivos obrigatórios:** C1, C2, C3, C4, C5, C6, C7, C8, C9 (e os textos/QR que os endereçam, C19).
2. **Compartilháveis com segurança:** C10, C11, C12, C13, C14, C17 (com prefixo CSS próprio).
3. **Dependem do Hermes (não confirmado):** C15 (precedência em colisão), C16 (ordem de abas/registro tardio), comportamento exato de C5 entre plugins, C18 (instalação dupla no aparelho).
4. **Limitações que podem impedir a coexistência:** se o Hermes não aceitar dois diretórios com `plugin.yaml` distinto mas funcionalidade idêntica (não há evidência dessa restrição — o sistema é keyed por `name`); `tab.override` não será usado (ele *substitui* página built-in — inadequado aqui); no iOS, dois PWAs da mesma origem exigem `start_url/scope` distintos e validação real de instalação.

## 6. Critérios verificáveis de coexistência bem-sucedida

Executar com **original + cópia instalados e habilitados** no mesmo Hermes, mesma origem HTTPS:

- [ ] **Carregamento independente:** `GET /api/dashboard/plugins` lista os dois `name`s; `rescan` mantém os dois; log/console sem warning de `register()`; desabilitar um não afeta o outro.
- [ ] **Interface acessível:** abas `/pwa` e `/treg` abrem suas páginas; acesso direto de cada uma cai no app correto (sem redirect cruzado); QR de cada aba aponta seu próprio mount.
- [ ] **Sem colisão de rotas/assets:** `/api/plugins/hermes-pwa/*` e `/api/plugins/treg-pwa/*` respondem seus próprios `index/manifest/qr/api`; `/dashboard-plugins/<cada>/dist/qrcode.js` distintos (200 cada).
- [ ] **Caches/preferências isolados:** DevTools mostra dois escopos de SW e dois `CacheStorage`; `localStorage` com os dois prefixos; criar run/perfil/tema em um não altera o outro; `~/uploads` legível pelos dois.
- [ ] **Original preservado:** matriz de fumaça do original (sessões, envio, retomada de run, aprovação, STT, `/pwa`) verde antes/depois de instalar a cópia; nenhuma regressão após `gateway restart`.
- [ ] **Comandos:** `/pwa` e `/treg` respondem seus links; `/help` lista ambos sem warnings de conflito no log.
- [ ] **Aparelho real:** ambos instaláveis lado a lado (Android + iOS), cada um abre seu `start_url`, polling independente.

## 7. Checklist de renomeação (quando autorizado, fora desta fase)

- [ ] `plugin.yaml` (name, description, homepage, author) + `manifest.json` (name, label, icon, tab.path, version) + `register("…")` + comando + textos de ajuda.
- [ ] Rotas/README/env (`TREG_PWA_API_HOST` + fallback legado)/SW `VERSION`/localStorage/manifest PWA (`id/start_url/scope` sob o novo mount).
- [ ] Ícones + brand + `theme_color`; QR/`/pwa` → nova rota; prefixo CSS da aba `.hp-*` → novo.
- [ ] `tests/test_plugin.py` (nomes/paths esperados) + fumaça original × fork **instalados juntos**.
