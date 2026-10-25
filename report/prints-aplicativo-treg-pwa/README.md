# Capturas — aplicativo TREG PWA

Pasta conferida em 2026-10-18. Contém 11 imagens, todas abertas e visualizadas diretamente. As 11 capturas foram publicadas nesta branch em 2026-10-24.

> **Privacidade:** `02-tela-instalacao-qr.png` foi publicada em versão redigida, com o nome de usuário e a chave parcialmente mascarada cobertos. O original permanece apenas no workspace local. As capturas manuais do WhatsApp não fazem parte desta pasta e não foram publicadas.


- 9 capturas manuais do usuário em celular: `Screenshot_1.png` a `Screenshot_9.png`;
- 2 capturas desktop preservadas: `02-tela-instalacao-qr.png` e `captura-15012.png`.

## Relação individual

| Arquivo | Origem | Estado observado | Elementos relevantes | Legibilidade |
|---|---|---|---|---|
| `Screenshot_1.png` | Manual, celular | Lista de conversas | Marca "Hermes", atualizar, configurações, nova conversa, busca, conversas "Saudação amigável" e "App"; avatares, prévias, horários, badges e `⋯` | Legível, viewport completo |
| `Screenshot_2.png` | Manual, celular | Lista com seta vermelha para Configurações | Mesma lista de `Screenshot_1`; anotação manual | Legível |
| `Screenshot_3.png` | Manual, celular | Modal "Nova conversa" | Campo "Nome (opcional)", "Cancelar", "Criar", teclado virtual, lista ao fundo | Legível, teclado ocupa a parte inferior |
| `Screenshot_4.png` | Manual, celular | Lista com seta vermelha para Configurações | Mesma lista; anotação manual | Legível |
| `Screenshot_5.png` | Manual, celular | Painel "Autorização de comandos" | "Agente: default"; "Sempre perguntar"; "Inteligente ✓ ativo"; "Não perguntar"; "Fechar" | Legível, painel completo |
| `Screenshot_6.png` | Manual, celular | Busca em foco | Campo "Buscar conversa" vazio, teclado virtual, lista ao fundo | Legível, sem consulta digitada |
| `Screenshot_7.png` | Manual, celular | Lista com setas para "Saudação amigável" | Conversa indicada por anotação manual | Legível |
| `Screenshot_8.png` | Manual, celular | Conversa aberta | Cabeçalho com voltar, título, subtítulo "Terminal · deepseek-flash", menu `⋮`; bolhas de mensagens; composer com clipe, campo "Mensagem", microfone e enviar | Legível, viewport de celular |
| `Screenshot_9.png` | Manual, celular | Menu da conversa | "Renomear conversa", "Recarregar mensagens", "Apagar conversa", "Cancelar"; menu `⋮` destacado | Legível, menu completo |
| `02-tela-instalacao-qr.png` | Desktop, captura anterior | Página de instalação | QR, instruções, "Abrir app", "Abrir em nova aba", "Copiar link", início da transcrição de áudio | Legível, topo da página |
| `captura-15012.png` | Desktop, captura anterior | Lista de conversas | Sidebar de 320 px, seis conversas, busca, três controles, empty state do chat | Legível |

## Estados únicos

Há 8 estados visuais únicos:

1. lista mobile;
2. modal de nova conversa;
3. painel de autorização de comandos;
4. busca em foco;
5. conversa aberta;
6. menu da conversa;
7. instalação desktop;
8. lista desktop.

`Screenshot_2`, `Screenshot_4` e `Screenshot_7` são variações anotadas da lista, não estados funcionais novos. As setas e caixas vermelhas são anotações do usuário, não elementos do aplicativo.

## O que está comprovado visualmente

- O aplicativo mobile carrega e mostra lista, busca, avatares, horários, badges e botões.
- O painel de autorização abre e mostra três modos e "Fechar".
- O modal de nova conversa abre com campo de nome, Cancelar e Criar.
- O campo de busca recebe foco e o teclado é aberto.
- A conversa "Saudação amigável" abre com cabeçalho, histórico e composer.
- O menu da conversa abre com renomear, recarregar, apagar e cancelar.
- O composer mostra clipe, campo de mensagem, microfone e enviar.
- A página desktop de instalação mostra QR, instruções e botões.

## O que ainda precisa de teste funcional

- Executar uma busca e confirmar o filtro e o estado sem resultados.
- Criar uma conversa de teste e confirmar a persistência.
- Abrir as outras cinco conversas e os outros cinco menus.
- Executar ou cancelar renomear, recarregar e apagar.
- Enviar mensagem, anexo ou áudio; testar microfone e câmera.
- Inspecionar tema claro, seletor de agente e perfil.
- Testar a instalação PWA no celular e confirmar a versão/build.

## Divergências e limitações

- As capturas mobile mostram a marca "Hermes"; as capturas desktop mostram "TREG".
- A lista mobile mostra 2 conversas; a desktop mostra 6.
- As imagens não informam URL, versão, build ou commit.
- A busca aparece em foco, mas não há texto digitado nem resultado filtrado.
- O modal de nova conversa não mostra confirmação de criação.
- Não há captura de tema claro, agente, perfil, anexos, áudio ou PWA instalado.
- As tentativas com Browser MCP não responderam, mas os prints manuais comprovam que os fluxos visuais existem. A falha de automação não deve ser tratada como defeito comprovado do app.
- Nenhum código, configuração persistente, VPS, tag ou release foi alterado nesta conferência. A publicação posterior é feita em branch documental própria.