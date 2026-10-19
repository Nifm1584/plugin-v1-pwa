# 10 — Fase B: isolamento do TREG-PWA (execução documentada)

## 1. Objetivo da fase

Transformar a cópia local do `hermes-pwa` 1.7.1 em variante independente (`treg-pwa`) instalável
lado a lado com o original no Hermes Agent v0.21.6, sem conflitos de identidade, rotas,
comandos, storage, service worker, manifesto PWA ou estilos. Escopo exclusivo: isolamento,
compatibilidade, validação e publicação. Sem melhorias visuais, sem novas funcionalidades,
sem deploy na VPS.

## 2. Baseline utilizada

- **Origem local:** pasta `hermes-pwa/` (sem `.git`; árvore-fonte, não clone). Referência de
  conteúdo: blobs publicados na `main` do remoto (verificação de fidelidade na §9).
- **Remoto antes da fase:** branch única `main` @ `07cacfeb` (histórico preservado, sem force-push
  em nenhum momento).
- **Branch de trabalho:** `fase-b-treg-pwa` (criada a partir da ponta da `main`; sem merge na
  `main`, sem release).
- **Versão do plugin:** 1.7.1 mantida nos dois manifestos (mudança de identidade, não de versão).
- **Versão-alvo do Hermes:** v0.21.6 (2026.9.24), informada pelo usuário; contratos confrontados
  com a documentação oficial via Context7 (base `/nousresearch/hermes-agent`).

## 3. Arquivos modificados (11, todos locais + publicados na branch)

| Arquivo | Mudança | Conflito resolvido |
|---|---|---|
| `plugin.yaml` | `name` → `treg-pwa`; `description` identifica a cópia; `homepage` → novo repo (autor e MIT mantidos) | C1 |
| `dashboard/manifest.json` | `name` → `treg-pwa`; `label` → `TREG`; `tab.path` → `/treg`; descrição identifica a cópia | C2, C4 |
| `__init__.py` | comando `pwa` → `treg`; `pwa_url()` → `/treg`; textos e log identificam TREG (nomes internos de função preservados) | C5 |
| `tests/test_plugin.py` | expectativas → `treg-pwa`, `/treg`, comando `treg` | consistência |
| `dashboard/dist/index.js` | `APP` → `/api/plugins/treg-pwa/`; `QR_LIB` → `/dashboard-plugins/treg-pwa/…`; rota `/treg`; `register("treg-pwa")`; título e textos; classes `hp-*` → `tg-*` | C2, C3, C4, C5, C6, C17 |
| `dashboard/dist/style.css` | prefixo `hp-` → `tg-*` (todas as classes) | C17 |
| `dashboard/pwa/app.js` | `RUN_KEY` → `treg-pwa-run`; `localStorage` perfil → `treg-pwa-profile`; comentários de mount atualizados (lógica intacta) | C8 |
| `dashboard/pwa/sw.js` | `VERSION` → `treg-pwa-v1`; comentários atualizados (escopo `./` e limpeza restritos ao próprio cache) | C7 |
| `dashboard/pwa/app.css` | só comentário de cabeçalho (classes são escopadas ao documento próprio; sem renomeação necessária) | — (documentado) |
| `dashboard/pwa/index.html` | `<title>`/brand/`apple-mobile-web-app-title` → TREG (logo, cores e layout intactos) | C9 (parcial; nome exibido) |
| `dashboard/plugin_api.py` | docstring; `TREG_PWA_API_HOST` com fallback ao legado; `qr` default → `/treg`; logs → `treg-pwa:`; manifesto PWA `name/short_name` → TREG | C3, C7, C9, C10 |

Não modificados: `qrcode.js` (terceiros, MIT preservado), `icon.svg`, PNGs, `README.md` original local, relatórios 01–09, `LICENSE`, `.gitignore`.

## 4. Contratos compartilhados preservados

`HERMES_DASHBOARD_PUBLIC_URL`, `API_SERVER_*`, `/api/sessions`, `/v1/runs`, `approvals.mode`
(`manual/smart/off` — valores públicos documentados em `security.md`), `profile.yaml`,
`/p/{profile}` (espelhamento confirmado em `api_server.py`), SDK do dashboard, `kind:
standalone`, `~/uploads`, cookies/sessão do painel. Nenhum endpoint do núcleo foi renomeado.

## 5. Dependências privadas (mantidas com fallback + documento)

`hermes_cli.web_server_profiles._config_profile_scope` (`plugin_api.py:456-459`): nenhuma
alternativa pública localizada na documentação consultada para escopo de config por perfil via
plugin de dashboard no Hermes v0.21.6. Mantido o comportamento original (import tardio +
HTTP 501 degradando para o perfil default). Sem mudança nas regras de autorização.

## 6. Testes executados (reais) e resultados

Estáticos por busca no código (único meio disponível; shell local inoperante, sem `pytest`/`node`):
- [x] `hermes-pwa|hermes_pwa|HERMES_PWA` residual só em menções legítimas ao upstream (docstrings, descrições "versão independente de…", fallback de env, relatórios históricos). Aprovado.
- [x] Zero ocorrências de `/pwa` e `hp-` em `dashboard/` (colisões C4/C17 eliminadas). Aprovado.
- [x] Identidade nova presente em todos os pontos: `treg-pwa` (manifestos, registro, comando, storage, SW, CSS, logs). Aprovado.
- [x] `_config_profile_scope` presente com fallback; licenças/atribuições intactas; varredura de segredos limpa. Aprovado.
- [ ] `pytest tests -q`, `node --check`, `hermes plugins validate .` — **não executados** (sem runtime/terminal funcional; proibido instalar). Pendentes para a máquina do usuário ou CI.
- [ ] Validação de coexistência real (dois plugins instalados) — **não executada** (exige ambiente Hermes de teste; ver relatório 11).

## 7. Achado de publicação a corrigir (transparência)

Durante a validação, detectei que a cópia de `dashboard/dist/index.js` publicada anteriormente na
`main` contém 3 linhas com escapes decodificados pelo transporte da API (aspas em
`Toque em "Abrir app"` e afins), o que a tornaria sintaticamente inválida naquele branch. O
código-fonte local está intacto; o defeito existe só no artefato publicado. Na branch
`fase-b-treg-pwa` o arquivo sobe com os bytes corretos. Correção da `main` fica como decisão
pendente do usuário (não toco na `main` sem autorização).

## 8. Limitações conhecidas

- PNGs (`icon-192/512.png`) seguem fora do remoto (binários fora do alcance das ferramentas).
- Descrição do repositório segue pendente (sem endpoint na API disponível).
- Coexistência real não comprovada estaticamente (pendência explícita, relatório 11).

## 9. Instalação manual (usuário, em ambiente de teste — nunca em produção sem validar)

```text
hermes plugins install Nifm1584/plugin-v1-pwa --enable   (ou o fluxo de branch do seu ambiente)
hermes gateway restart  (+ restart do dashboard)
```

Pré-requisitos: Hermes v0.21.6, HTTPS, `API_SERVER_*` (opcional `TREG_PWA_API_HOST` só se o
host do gateway diferir do default). Conferir depois: aba TREG em `/treg`, comando `/treg`,
`GET /api/dashboard/plugins` listando os dois nomes.

## 10. Checklist de coexistência (resumo; detalhe no relatório 11)

Descoberta dos dois nomes · rotas e assets independentes · comandos `/pwa` e `/treg` · storage,
SW e CSS isolados · auth/sessões/runs compartilhados funcionando · original intacto antes/depois
· desabilitar a cópia não afeta o original.
