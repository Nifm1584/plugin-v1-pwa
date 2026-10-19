# 11 — Instalação da cópia e validação da coexistência (plano prático)

Estado de cada item: [x] executado/aprovado · [ ] não executado · [?] hipótese. Nesta fase,
**todos os itens de ambiente estão [ ] não executados** — nada foi instalado; a validação real
depende de um Hermes de teste com os dois plugins habilitados, sem tocar a produção.

## Pré-condições do ambiente de teste

- Hermes Agent v0.21.6 acessível em HTTPS, com `API_SERVER_*` configurado.
- Plugin original `hermes-pwa` instalado e habilitado (baseline verde antes de começar).
- Branch `fase-b-treg-pwa` deste repositório como fonte da cópia.
- DevTools do navegador + acesso aos logs (`HERMES_PLUGINS_DEBUG=1` e `agent.log`).

## Checklist de validação

1. [ ] Descoberta: `GET /api/dashboard/plugins` lista `hermes-pwa` e `treg-pwa`; `rescan` mantém ambos.
2. [ ] Identidade/registro: abas `/pwa` e `/treg` abrem páginas distintas; console sem warnings de `register()`.
3. [ ] Comandos: `/pwa` responde link do original; `/treg` responde link da cópia; `/help` lista ambos.
4. [ ] Backend: `/api/plugins/hermes-pwa/` e `/api/plugins/treg-pwa/` respondem `index/manifest/qr/api` próprios.
5. [ ] Assets: `/dashboard-plugins/hermes-pwa/dist/qrcode.js` e `/dashboard-plugins/treg-pwa/dist/qrcode.js` retornam 200 distintos; HTML/JS/CSS/ícones carregam por app.
6. [ ] Auth: login do painel vale para os dois; 401 exibe login embutido em cada app sem cruzar rotas.
7. [ ] Sessões: listar, abrir, criar, renomear e apagar funcionam na cópia (mesmo gateway compartilhado).
8. [ ] Mensagens: envio/recebimento texto, markdown, código, links e listas na cópia.
9. [ ] Streaming/retomada: acompanhar SSE, suspender o app e retomar via polling/`localStorage treg-pwa-run`.
10. [ ] Aprovações: `once/session/always/deny` na cópia; `approvals.mode` por agente preservado.
11. [ ] Uploads/downloads: arquivo ≤ 25 MB e voz com/sem transcrição; download restrito a `~/uploads`.
12. [ ] Independência: dois escopos de SW, dois `CacheStorage` (`treg-pwa-v1` separado), storages com prefixos distintos; ação em um não altera o outro.
13. [ ] Preferências: perfil selecionado e (futuro) tema persistem por app.
14. [ ] Original intacto: fumaça do original verde antes e depois de habilitar a cópia e após `gateway restart`.
15. [ ] Isolamento reverso: desabilitar `treg-pwa` não desativa nem altera o original.

## Logs e evidências (sem expor credenciais)

- Recolher: saída de `GET /api/dashboard/plugins`, trechos de `agent.log` com `HERMES_PLUGINS_DEBUG=1`, screenshots das duas abas, DevTools (Application: SW/CacheStorage/localStorage), e o resultado de cada item acima como aprovado/reprovado/não executado.
- Nunca incluir: `API_SERVER_KEY`, `GROQ_API_KEY`, cookies, conteúdo privado de conversas. Truncar mensagens de erro em 300 chars ao anexar.

## Critério de aceite da coexistência

Itens 1–15 aprovados (ou reprovados com causa registrada e corrigida) em ambiente de teste, com o
original verde ao final. Só então decidir sobre produção — fora do escopo desta fase.
