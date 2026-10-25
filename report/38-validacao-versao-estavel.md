# 38 — Validação real da versão estável 1.8.0b1

**Data:** 2026-10-25  
**Projeto:** TREG PWA (treg-pwa)  
**Versão declarada no plugin.yaml:** 1.8.0b1  
**SHA do código instalado e validado no Hermes:** 16345103fcabf4347ac4225605036dcc1e1be3e6  
**Service worker:** treg-pwa-v5  
**Instalação:** /opt/data/plugins/treg-pwa  
**Plugin original preservado:** /opt/data/plugins/hermes-pwa

## 1. Decisão de validação

O usuário confirmou a validação funcional do TREG PWA no computador e no celular e confirmou que o PWA original continua com as conversas e mensagens preservadas. Esta versão fica congelada como base estável para o próximo ciclo de desenvolvimento. As novas funções e correções adicionais serão feitas em uma linha de desenvolvimento separada, sem alterar o código desta base.

## 2. Instalação real no Hermes

Segundo o relatório 38 produzido no ambiente Hermes:

- Atualização feita pelo instalador oficial para o SHA completo 16345103fcabf4347ac4225605036dcc1e1be3e6.
- git rev-parse HEAD e metadados de instalação confirmaram o mesmo SHA.
- plugin.yaml informa name: treg-pwa e version: 1.8.0b1.
- dashboard/pwa/sw.js declara treg-pwa-v5.
- Hashes de sw.js, app.js, ui-utils.js e index.html conferidos contra o commit publicado.
- Dashboard recarregado; gateway não reiniciado.
- As rotas e os assets dos dois plugins responderam conforme esperado na verificação relatada.

## 3. Testes funcionais confirmados pelo usuário

### Computador — VALIDADO

Após atualizar a página, o usuário confirmou:
- envio de perguntas e respostas;
- envio de imagem, com análise visual correta pelo Hermes;
- envio de áudio, com compreensão correta do conteúdo pelo Hermes;
- funcionamento geral da interface durante esses testes.

### Celular — VALIDADO FUNCIONALMENTE

O usuário confirmou:
- envio de imagem e resposta correta do Hermes sobre seu conteúdo;
- envio de áudio e resposta correta;
- controle de exibição da transcrição de áudio;
- tema funcionando;
- funcionamento geral do aplicativo PWA durante os testes realizados.

### Coexistência com o PWA original — VERIFICADA PELO USUÁRIO

O usuário abriu/testou o PWA original /pwa após a atualização e confirmou que as conversas e mensagens continuavam presentes e salvas. O relatório de instalação também confirmou que hermes-pwa permaneceu habilitado na versão 1.6.1, com diretório, origem e revisão inalterados.

## 4. Limitação conhecida a corrigir em versão futura

**Renderização visual de imagens no TREG:** o usuário observou que a mensagem enviada pode aparecer como um shortcode/marcador textual em vez de exibir a foto visualmente na conversa. Isso não impediu a análise da imagem pelo Hermes, que respondeu corretamente ao conteúdo visual. A capacidade de análise da imagem está funcional; a apresentação visual da imagem na interface do TREG permanece como correção planejada para a próxima versão.

Não marcar a renderização visual de imagens como corrigida. Não incluir essa correção na versão congelada.

## 5. Isolamento do service worker

O relatório 37 documenta a correção preventiva em dashboard/pwa/sw.js: a ativação limpa apenas caches antigos com prefixo treg-pwa-, preservando caches de outras aplicações, incluindo os do hermes-pwa. Os testes automatizados/simulados relatados passaram.

**Limite da evidência:** a instalação real e os testes funcionais no computador/celular não equivalem, por si sós, a uma inspeção direta do CacheStorage do navegador. Não afirmar que a limpeza seletiva de caches foi observada visualmente em DevTools, a menos que essa inspeção seja feita e registrada separadamente. A coexistência funcional do PWA original foi confirmada pelo usuário.

## 6. Preservação de dados e serviços

Segundo o relatório 38 do Hermes:
- 14 sessões antes e 14 depois da atualização;
- contagem de mensagens aumentou de 2.140 para 2.152 durante a própria sessão de trabalho; não foi relatada remoção;
- configurações, .env, credenciais e dados persistentes não foram apagados nem recriados;
- hermes-pwa permaneceu independente e inalterado;
- dashboard foi recarregado; gateway não foi reiniciado.

## 7. Testes automatizados previamente relatados

O relatório 37 registra aprovação dos testes de isolamento de cache simulado, UI, API, utilitários de UI e QR code, além de verificações de sintaxe/compilação indicadas naquele relatório. Esses resultados são evidência automatizada anterior à instalação real; não substituem os testes manuais acima.

## 8. Estado final e regra para continuidade

**Estado:** versão 1.8.0b1 validada funcionalmente no computador e no celular, com o PWA original preservado. Congelar o código desta versão.

**SHA do código instalado:** 16345103fcabf4347ac4225605036dcc1e1be3e6.

Próximo ciclo:
1. Criar/confirmar uma tag estável e uma GitHub Release apontando para o commit congelado/documentado, sem alterar o código funcional.
2. Iniciar as novas funções e correções em branch separada.
3. Corrigir a renderização visual de imagens na próxima versão.
4. Não reabrir esta versão congelada para novas implementações; registrar apenas documentação de validação quando necessário.

## 9. Fontes internas

- Relatório 37 — isolamento de cache: 37-isolamento-cache-service-worker.md
- Relatório 38 local do ambiente Hermes: /opt/data/plugins/treg-pwa/report/38-atualizacao-validacao-hermes-real.md (relatório operacional local, não publicado como artefato original).
- Commit do código validado: https://github.com/Nifm1584/plugin-v1-pwa/commit/16345103fcabf4347ac4225605036dcc1e1be3e6
