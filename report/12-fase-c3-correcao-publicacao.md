# Fase C3 — Correção de publicação do TREG PWA

## Escopo
Correção isolada na branch `fix/treg-pwa-c3-publicacao-segura`, baseada originalmente em `fase-b-treg-pwa` no commit `a5485bd03174b02ee66ab6d338ff1b8b3cc5ed6f`. A branch `main`, o plugin `hermes-pwa` original e a VPS de produção não foram alterados.

## Arquivos corrigidos
- `dashboard/pwa/app.js`: revertida a duplicação de 57 sequências de escape e restaurada a expressão regular de transcrição de áudio válida, preservando as funções específicas do TREG.
- `dashboard/dist/index.js`: corrigidos oito escapes duplicados das aspas nas instruções de instalação.
- `dashboard/dist/qrcode.js`: revertida a duplicação de oito sequências de escape.
- `dashboard/plugin_api.py`: corrigidos os escapes duplicados nos quadros SSE de erro e na leitura de chave/configuração.
- `__init__.py`: corrigidos escapes duplicados na mensagem devolvida pelo comando `/treg`.
- `dashboard/pwa/icon-192.png` e `dashboard/pwa/icon-512.png`: adicionados a partir dos assets do `hermes-pwa` oficial, necessários para manifesto, apple-touch-icon e precache do service worker.
- `.github/workflows/treg-pwa-validation.yml`: adicionada validação automatizada para JavaScript e Python.

## Validação automatizada concluída
Workflow: [TREG PWA validation](https://github.com/Nifm1584/plugin-v1-pwa/actions/runs/38984914136)  
Commit testado: `61fc3c9253bd9e4239641d04fc186b4cfd2b386d`  
Resultado geral: **success**.

- `node --check dashboard/pwa/app.js` — passou.
- `node --check dashboard/dist/index.js` — passou.
- `node --check dashboard/dist/qrcode.js` — passou.
- `node --check dashboard/pwa/sw.js` — passou.
- `python -m py_compile __init__.py dashboard/plugin_api.py` — passou.
- `python -m pytest tests -q` — **2 passed in 0.03s**.

Os arquivos foram conferidos no conteúdo publicado da branch, não apenas no conteúdo preparado antes do envio. Os ícones publicados são PNGs válidos de 192×192 (1.664 bytes) e 512×512 (4.943 bytes).

## Limites da validação
`hermes plugins validate` não foi executado porque a pipeline não instala o Hermes Agent. A validação acima cobre sintaxe e testes automatizados do repositório; não substitui o teste funcional no Hermes instalado.

## Segurança e isolamento
Nenhum deploy ou acesso à VPS foi feito. Nenhum arquivo do núcleo Hermes ou do plugin `hermes-pwa` foi modificado. A branch `main` permanece intacta.