# Fase C3 — Correção de publicação do TREG PWA

## Escopo
Correção isolada na branch `fix/treg-pwa-c3-publicacao-segura`, baseada originalmente em `fase-b-treg-pwa` no commit `a5485bd03174b02ee66ab6d338ff1b8b3cc5ed6f`. A branch `main`, o plugin `hermes-pwa` original e a VPS de produção não foram alterados.

## Arquivos corrigidos
- `dashboard/pwa/app.js`: revertida a duplicação de 57 sequências de escape e restaurada a expressão regular de transcrição de áudio válida, preservando as funções específicas do TREG.
- `dashboard/dist/index.js`: corrigidos oito escapes duplicados das aspas nas instruções de instalação.
- `dashboard/dist/qrcode.js`: revertida a duplicação de oito sequências de escape.
- `dashboard/plugin_api.py`: corrigidos os escapes duplicados nos quadros SSE de erro e na leitura de chave/configuração.
- `__init__.py`: corrigidos escapes duplicados na mensagem devolvida pelo comando `/treg`.
- `dashboard/pwa/icon-192.png` e `dashboard/pwa/icon-512.png`: adicionados a partir dos assets do `hermes-pwa` oficial, para satisfazer manifesto, apple-touch-icon e precache do service worker.
- `.github/workflows/treg-pwa-validation.yml`: adicionada validação automatizada para conferir a sintaxe dos JavaScripts e executar os testes Python.

## Verificações estáticas
Os arquivos corrigidos foram comparados com as versões correspondentes do plugin ancestral. As barras duplicadas/triplas encontradas foram normalizadas para a forma usada no ancestral, sem substituir o código exclusivo do TREG. A expressão regular de áudio coincide com a expressão válida do ancestral. Os dois PNGs têm cabeçalhos IHDR compatíveis com 192×192 e 512×512, respectivamente.

A compilação de sintaxe no runtime V8, sem executar o código, passou para `app.js`, `dist/index.js`, `dist/qrcode.js` e `sw.js`.

## Testes automatizados
O workflow agora executa `node --check` nos quatro JavaScripts e `python -m pytest tests -q`. O resultado do workflow será atualizado aqui depois que o GitHub Actions terminar; não presumir aprovação antes da execução.

## Segurança e isolamento
Nenhum deploy ou acesso à VPS foi feito. Nenhum arquivo do núcleo Hermes ou do plugin `hermes-pwa` foi modificado.