# Fase C3 — Correção de publicação do TREG PWA

## Escopo
Correção isolada na branch `fix/treg-pwa-c3-publicacao-segura`, criada a partir de `fase-b-treg-pwa` no commit `a5485bd03174b02ee66ab6d338ff1b8b3cc5ed6f`. A branch `main`, o plugin `hermes-pwa` original e a VPS de produção não foram alterados.

## Arquivos corrigidos
- `dashboard/pwa/app.js`: revertida a duplicação de escapes do transporte (57 sequências de barras), preservando o código específico do TREG; a expressão regular de transcrição de áudio foi restaurada para coincidir com a linha válida do ancestral.
- `dashboard/dist/index.js`: corrigidos os oito escapes duplicados das aspas nas instruções de instalação.
- `dashboard/pwa/icon-192.png` e `dashboard/pwa/icon-512.png`: adicionados a partir dos assets do `hermes-pwa` oficial, necessários para manifesto, apple-touch-icon e precache do service worker.

## Verificações feitas antes da gravação
- `app.js`: verificado que as 57 sequências de escape ficaram com uma barra e que a expressão regular de áudio coincide com a linha válida do ancestral.
- `dist/index.js`: verificadas as oito sequências de escape e as três instruções de instalação.
- PNGs: conteúdo recuperado via API como Base64; cabeçalhos e dimensões 192×192 e 512×512 conferidos pelo prefixo IHDR.

## Testes automatizados
Ainda não executados neste momento. A validação final com `node --check` e `python -m pytest tests -q` será registrada após os testes no conteúdo publicado nesta branch. Este commit não deve ser considerado como tendo testes automatizados aprovados antes dessa etapa.

## Segurança e isolamento
Nenhum deploy ou acesso à VPS foi feito. Nenhum arquivo do núcleo Hermes ou do plugin `hermes-pwa` foi modificado.