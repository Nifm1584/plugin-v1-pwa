# 18 — Auditoria visual e funcional do TREG PWA

## 1. Objetivo e escopo

Auditar a interface real do TREG PWA com Browser MCP na sessão autenticada do Chrome do usuário, identificando telas, controles, estados visuais, respostas a interações e limitações da ferramenta, sem alterar código, configurações persistentes, VPS, tags, releases ou a branch `main`.

Esta execução complementa o relatório 17 e investiga a falha de interação registrada anteriormente.

> **Atualização de 2026-10-18:** a seção 16 registra a conferência dos prints manuais fornecidos pelo usuário. Ela complementa e corrige a tentativa automatizada, comprovando visualmente fluxos que o Browser MCP não conseguiu operar.
>
> **Publicação de 2026-10-19:** este relatório e as capturas do TREG são publicados em branch documental própria. A captura da página de instalação foi publicada com o nome de usuário e a chave parcialmente mascarada redigidos. As três capturas manuais do WhatsApp são analisadas no relatório 19 e não foram publicadas por conterem dados pessoais.

## 2. Ferramenta, ambiente e autenticação

| Item | Resultado |
|---|---|
| Ferramenta principal | Browser MCP conectado ao Chrome do usuário |
| Aplicativo | `https://maya.devlist.com.br/api/plugins/treg-pwa/` |
| Página de instalação | `https://maya.devlist.com.br/treg?stay=1` |
| Autenticação | Sessão existente do dashboard; o app abriu sem pedir login |
| Viewport do app | 975 × 768 px |
| Painel | Usuário autenticado; Hermes exibido como v0.22.2 |
| Playwright | Uma única verificação retornou HTTP 401; não foi usado para inspecionar o app autenticado |

A sessão autenticada foi preservada. Não houve tentativa de login alternativo, troca de credenciais ou contorno do controle de acesso.

## 3. Inventário de telas encontradas

| ID | Tela | Caminho | Browser MCP | Print manual |
|---|---|---|---|---|
| T1 | Lista de conversas | `/api/plugins/treg-pwa/` | Carregada e autenticada | Confirmada em mobile e desktop |
| T2 | Página de instalação | `/treg?stay=1` | Carregada; topo visível | Não aplicável |
| T3 | Conversa/mensagens | — | Não acessada | Confirmada em `Screenshot_8.png` |
| T4 | Menu de conversa | — | Não acessado | Confirmado em `Screenshot_9.png` |
| T5 | Configurações de autorização | — | Não acessadas | Confirmado em `Screenshot_5.png` |
| T6 | Nova conversa | — | Não acessada | Confirmado em `Screenshot_3.png` |
| T7 | Seletor de agente | — | Não exposto (apenas um perfil visível) | Não mostrado |
| T8 | Anexos/câmera/áudio | — | Não acessados | Controles visíveis em `Screenshot_8.png`, não acionados |
| T9 | Instalação PWA em celular | — | Não testada | Tela cheia mobile sugerida, sem confirmação de instalação |

O Browser MCP abriu duas telas; a conferência manual cobre oito estados visuais distintos, detalhados na seção 16.

## 4. Controles identificados e testados

Foram identificados 23 controles visíveis nas duas telas desktop: 16 na lista (atualizar, configurações, nova conversa, busca, seis botões `⋯` e seis itens de conversa) e 7 na instalação (abrir app, abrir em nova aba, copiar link, campo de chave, seletor de idioma, salvar e remover chave).

> A tabela abaixo registra **apenas a tentativa automatizada com Browser MCP**. A conferência manual dos prints, na seção 16, comprova que vários desses fluxos existem e abrem no aplicativo mobile.

| Controle | Tela | Ação | Resultado observado | Classificação |
|---|---|---|---|---|
| Atualizar | T1 | Clique | Nenhuma mudança visível; mesma tela e URL | Sem resposta |
| Configurações | T1 | Clique | Nenhum painel abriu | Sem resposta |
| Nova conversa | T1 | Clique | Nenhum modal abriu | Sem resposta |
| Buscar conversa | T1 | Digitação de `ola` | Campo permaneceu visualmente vazio; lista não filtrou | Sem resposta |
| Opções da 1ª conversa | T1 | Clique | Nenhum menu abriu | Sem resposta |
| Item da 1ª conversa | T1 | Clique | Browser MCP retornou “Unable to get parent”; sem navegação | Falha da ferramenta |
| Demais botões `⋯` | T1 | Não testados | Bloqueados após a falha do primeiro | Não testados |
| Demais itens de conversa | T1 | Não testados | O primeiro não pôde ser resolvido | Não testados |
| Abrir app (nesta aba) | T2 | Clique | Nenhuma navegação; URL permaneceu em `/treg?stay=1` | Sem resposta |
| Abrir em nova aba | T2 | Não testado | Evitado para não criar estado adicional sem conseguir observar | Não testado |
| Copiar link | T2 | Não testado | Sem feedback observável disponível | Não testado |
| Campo de chave STT | T2 | Não testado | Evitado para não alterar configuração persistente | Não testado |
| Seletor de idioma | T2 | Não testado | Evitado para não alterar configuração persistente | Não testado |
| Salvar e conferir | T2 | Não testado | Ação persistente; não executada | Não testado |
| Remover chave | T2 | Não testado | Ação destrutiva/persistente; não executada | Não testado |
| PageDown | T2 | Tecla | Nenhuma rolagem | Sem resposta |
| Tab/Enter | T1/T2 | Teclas | Nenhuma mudança visível de foco ou ativação | Sem resposta |
| Ctrl+Shift+M | T1 | Atalho | Nenhuma mudança de viewport observada | Sem resposta |

### 4.1 Controles que responderam na tentativa automatizada

Nenhum controle do aplicativo apresentou resposta funcional confirmada **via Browser MCP**. A navegação por URL e as capturas de tela funcionaram; os controles da interface, não. A conferência manual posterior confirmou vários fluxos, conforme a seção 16.

### 4.2 Controles que não responderam

- Atualizar, Configurações, Nova conversa, busca, menu `⋯`, item de conversa e botão “Abrir app”.
- Rolagem e navegação por teclado.
- Atalho de emulação responsiva.

## 5. Caminhos de navegação reproduzíveis

1. Abrir `https://maya.devlist.com.br/api/plugins/treg-pwa/` no Chrome autenticado via Browser MCP.
2. Observar a lista de conversas em 975 × 768.
3. Clicar em Atualizar, Configurações, Nova conversa, busca, `⋯` e item de conversa; nenhuma mudança de estado.
4. Abrir `https://maya.devlist.com.br/treg?stay=1`.
5. Observar QR, instruções, botões e cartão de transcrição.
6. Clicar em “Abrir app (nesta aba)”; nenhuma navegação.
7. Tentar PageDown, Tab/Enter e Ctrl+Shift+M; nenhuma resposta observada.

## 6. Capturas de tela

### T1 — Lista de conversas

![Lista de conversas do TREG PWA](prints-aplicativo-treg-pwa/captura-15012.png)

Caminho: `report/prints-aplicativo-treg-pwa/captura-15012.png`.

Elementos visíveis: marca TREG, atualizar, configurações, nova conversa, busca, seis conversas com avatar/inicial, título, prévia, horário, badge de origem, botão `⋯`, área vazia com logo e mensagem.

### T2 — Página de instalação

![Página de instalação do TREG PWA](prints-aplicativo-treg-pwa/02-tela-instalacao-qr.png)

Caminho: `report/prints-aplicativo-treg-pwa/02-tela-instalacao-qr.png`.

Elementos visíveis: shell do dashboard, navegação lateral, título “App móvel TREG (PWA)”, QR code, instruções, três botões, cartão de transcrição ativa e início da seção “Como funciona”.

### 6.1 Capturas manuais

A pasta foi atualizada pelo usuário com 11 imagens: 9 prints manuais de celular (`Screenshot_1.png` a `Screenshot_9.png`) e 2 capturas desktop (`02-tela-instalacao-qr.png` e `captura-15012.png`). A relação individual e os estados únicos estão na seção 16.

## 7. Funcionalidades que responderam

| Funcionalidade | Resultado |
|---|---|
| Abertura do app autenticado | Sim; lista carregada |
| Abertura da página de instalação | Sim; conteúdo e QR carregados |
| Snapshot de acessibilidade | Sim; elementos identificados |
| Captura de tela | Sim; duas telas desktop salvas pelo Browser MCP |
| Capturas manuais | Sim; 11 imagens adicionais conferidas na seção 16 |
| Navegação por URL | Sim; app e instalação acessíveis |

## 8. Funcionalidades que não responderam via Browser MCP

| Funcionalidade | Resultado |
|---|---|
| Atualizar lista | Sem resposta visível |
| Abrir configurações | Sem resposta |
| Abrir nova conversa | Sem resposta |
| Filtrar busca | Sem resposta |
| Abrir menu de conversa | Sem resposta |
| Abrir conversa | Ferramenta não resolveu o item |
| Abrir o app pela página de instalação | Sem navegação |
| Rolar a página | Sem rolagem |
| Navegar por teclado | Sem mudança visível |
| Emular viewport móvel | Sem mudança observada |

## 9. Problemas visuais e funcionais confirmados

### Visuais

- Layout desktop com sidebar fixa de aproximadamente 320 px e grande área vazia à direita.
- Tipografia pequena em prévia, horário e badge; hierarquia visual comprimida na lista.
- Avatares apenas com inicial; sem foto de contato ou identidade visual de agente.
- Ausência de filtros/chips, indicador de não lidas ou contagem na lista.
- Tema escuro no ambiente inspecionado, sem alternância visível.
- Página de instalação integrada ao shell escuro do dashboard, com QR e instruções, sem botão próprio de instalação no app.

### Funcionais

- Cliques reportados pelo Browser MCP não produziram mudança de estado.
- Digitação na busca não apareceu no campo nem filtrou a lista.
- PageDown, Tab/Enter e Ctrl+Shift+M não tiveram efeito observável.
- O console acessível não mostrou erro da aplicação; exibiu mensagens de extensões do Chrome.

## 10. Teste responsivo

Não foi possível testar viewport móvel. O Browser MCP não ofereceu controle de viewport, e o atalho Ctrl+Shift+M não produziu mudança observável. Não houve emulação responsiva nem teste em celular físico. Portanto, não é possível afirmar como o cabeçalho, a lista, os menus, o composer ou os botões se comportam em 360/390 px.

## 11. Áreas não inspecionadas pelo Browser MCP e justificativas

As áreas abaixo não foram abertas na tentativa automatizada. Algumas aparecem nos prints manuais e estão reconciliadas na seção 16.

| Área | Motivo |
|---|---|
| Conversa/mensagens | Itens da lista não responderam ou não puderam ser resolvidos pela ferramenta |
| Menu `⋮` do chat | Exige abrir uma conversa |
| Menu de opções da conversa | Clique no `⋯` não abriu o menu |
| Configurações de autorização | Clique em Configurações não abriu o painel |
| Nova conversa | Clique não abriu o modal |
| Seletor de agente | Não visível na captura; provavelmente um único perfil |
| Anexos/câmera/áudio | Exigem conversa aberta e interação com o composer |
| Tema | Nenhum controle de tema visível |
| Instalação PWA | Não testada em dispositivo |
| STT | Ação persistente; não executada |
| Busca funcional | Campo não respondeu à digitação |

## 12. Fatos, hipóteses e limitações

### Fatos confirmados

- O app abriu autenticado por sessão existente do dashboard.
- A lista e a página de instalação carregaram.
- Na tentativa automatizada, o Browser MCP reportou cliques, mas a interface não mudou.
- Na tentativa automatizada, o campo de busca permaneceu vazio após a digitação.
- Na tentativa automatizada, PageDown, Tab/Enter e Ctrl+Shift+M não tiveram efeito observado.
- O Playwright não compartilhou a sessão autenticada; uma verificação retornou 401.
- Nenhum erro da aplicação apareceu no console acessível; havia mensagens de extensões.
- Os prints manuais mostram lista, configurações, nova conversa, busca em foco, conversa e menu funcionando visualmente.

### Hipóteses

- A sobreposição “Fitkun Batch” pode estar interceptando eventos de ponteiro e teclado. A extensão não foi desativada nem alterada.
- A falha pode envolver o Browser MCP, o foco da janela ou a página não estar ativa, além da extensão.
- O comportamento pode ser específico desta sessão do Chrome, não necessariamente um defeito do TREG.

### Limitações

- Não foi possível confirmar a causa da falha de interação na automação.
- Na tentativa automatizada, não foi possível abrir menus, configurações, conversa ou anexos.
- Na tentativa automatizada, não foi possível testar viewport móvel; os prints manuais mostram o app em celular.
- A página de instalação foi capturada apenas no topo.
- Os prints não comprovam execução de busca, criação de conversa, renomeação, exclusão, envio de mensagem ou anexos.
- Nenhuma mensagem, upload, alteração de configuração ou ação destrutiva foi executada.

## 13. Próximos pontos de investigação

1. Repetir a auditoria em um perfil do Chrome sem a extensão “Fitkun Batch”, ou com a sobreposição removida, para confirmar se os controles voltam a responder.
2. Verificar se o Browser MCP está conectado à aba correta e se a janela está ativa.
3. Capturar antes/depois de cada clique em uma sessão controlada, com console limpo.
4. Testar a lista, busca, menus, configurações, nova conversa, agente, anexos e conversa em sequência.
5. Usar emulação responsiva do próprio Chrome se o Browser MCP permitir; caso contrário, registrar a limitação.
6. Só depois montar a matriz visual e iniciar a fase de estrutura/design.

## 14. Conclusão da tentativa automatizada

O TREG PWA abriu autenticado e foi possível capturar duas telas reais: a lista de conversas e a página de instalação. A autenticação por sessão do dashboard está funcionando.

A auditoria funcional ficou bloqueada: nenhum controle do app respondeu a cliques, digitação, teclado ou rolagem. Há uma sobreposição de extensão de terceiros no Chrome, mas a causa não foi confirmada. A auditoria não pode ser considerada completa até que a interação seja reproduzida em um ambiente controlado.

Nenhum código, configuração persistente, VPS, tag ou release foi alterado durante a auditoria. A publicação documental posterior ocorre em branch própria, sem alterar `main`, C7, tag ou Release.

## 16. Conferência dos prints manuais — 2026-10-18

Esta seção corrige e complementa as conclusões anteriores com base na inspeção visual direta dos prints manuais do usuário, sem uso de Browser MCP, Alt MCP ou Playwright.

### 16.1 Natureza e origem das imagens

A pasta contém 11 imagens:

- 9 capturas manuais do aplicativo em celular: `Screenshot_1.png` a `Screenshot_9.png`;
- 2 capturas desktop anteriores preservadas: `02-tela-instalacao-qr.png` e `captura-15012.png`.

Algumas capturas manuais contêm setas e caixas vermelhas adicionadas pelo usuário para indicar o alvo da interação. Essas marcações não fazem parte da interface do aplicativo.

### 16.2 Conferência imagem por imagem

| Arquivo | Aberta e visualizada? | Tela/estado observado | Elementos relevantes | Legibilidade | Estado único? |
|---|---|---|---|---|---|
| `Screenshot_1.png` | Sim | Lista de conversas em celular, tema escuro | Status bar; marca “Hermes”; atualizar; configurações; nova conversa; busca; conversas “Saudação amigável” e “App”; avatar, prévia, horário, badge e `⋯`; home indicator | Legível; captura completa do viewport | Sim, lista mobile |
| `Screenshot_2.png` | Sim | Mesma lista, com seta vermelha apontando para Configurações | Lista e controles iguais a `Screenshot_1`; marcação manual | Legível | Não; anotação sobre a lista |
| `Screenshot_3.png` | Sim | Modal “Nova conversa” aberto sobre a lista | Campo “Nome (opcional)”, botões “Cancelar” e “Criar”, teclado virtual, cabeçalho da lista ao fundo | Legível; teclado ocupa a parte inferior | Sim, modal de nova conversa |
| `Screenshot_4.png` | Sim | Mesma lista, com seta vermelha apontando para Configurações | Mesmos controles de `Screenshot_1`; marcação manual | Legível | Não; repetição anotada |
| `Screenshot_5.png` | Sim | Painel “Autorização de comandos” aberto | “Agente: default”; “Sempre perguntar”; “Inteligente ✓ ativo”; “Não perguntar”; “Fechar”; caixa vermelha de destaque | Legível; painel completo no viewport | Sim, configurações de autorização |
| `Screenshot_6.png` | Sim | Busca em foco, com teclado virtual aberto | Campo “Buscar conversa” vazio; caixa vermelha em volta; teclado; lista ao fundo | Legível | Sim, foco na busca (sem consulta) |
| `Screenshot_7.png` | Sim | Lista com setas vermelhas apontando para a conversa “Saudação amigável” | Lista mobile; marcação manual no título/linha | Legível | Não; anotação sobre a lista |
| `Screenshot_8.png` | Sim | Conversa aberta | Cabeçalho com voltar, título “Saudação amigável”, subtítulo “Terminal · deepseek-flash” e menu `⋮`; bolhas de mensagens; composer com clipe, campo “Mensagem”, microfone e enviar; setas vermelhas | Legível; viewport de celular | Sim, conversa aberta |
| `Screenshot_9.png` | Sim | Menu da conversa aberto | Título da conversa; “Renomear conversa”; “Recarregar mensagens”; “Apagar conversa”; “Cancelar”; caixa vermelha; menu `⋮` destacado no topo | Legível; menu completo | Sim, menu de conversa |
| `02-tela-instalacao-qr.png` | Sim | Página desktop de instalação | Shell do dashboard; QR; instruções; três botões; início da transcrição de áudio | Legível; topo da página | Sim, instalação desktop |
| `captura-15012.png` | Sim | Lista de conversas desktop | Sidebar de 320 px; seis conversas; busca; três controles; empty state do chat | Legível | Sim, lista desktop |

Total: **11 imagens encontradas, 11 abertas e visualizadas, 0 não visualizadas**.

### 16.3 Estados únicos e duplicatas

Há **8 estados visuais únicos**:

1. lista mobile;
2. modal de nova conversa;
3. painel de autorização de comandos;
4. busca em foco com teclado;
5. conversa aberta;
6. menu da conversa aberto;
7. página desktop de instalação;
8. lista desktop.

`Screenshot_2`, `Screenshot_4` e `Screenshot_7` são variações anotadas da lista e não representam estados funcionais novos.

### 16.4 Funcionalidades comprovadas pelas imagens

| Funcionalidade | Evidência visual | O que está comprovado |
|---|---|---|
| Lista de conversas em celular | `Screenshot_1` | A interface mobile carrega com busca, conversas, avatares, horários e badges |
| Botão Configurações | `Screenshot_5` | O painel “Autorização de comandos” abre e exibe três modos e “Fechar” |
| Botão Nova conversa | `Screenshot_3` | O modal “Nova conversa” abre com campo de nome, Cancelar e Criar |
| Campo de busca | `Screenshot_6` | O campo recebe foco e o teclado é aberto |
| Abrir conversa | `Screenshot_8` | A conversa “Saudação amigável” abre, com cabeçalho, histórico e composer |
| Menu da conversa | `Screenshot_9` | O menu abre com renomear, recarregar, apagar e cancelar |
| Composer | `Screenshot_8` | Clipe, campo, microfone e botão de enviar estão visíveis |
| Instalação desktop | `02-tela-instalacao-qr.png` | QR, instruções e botões de abertura estão presentes |
| Lista desktop | `captura-15012.png` | A versão desktop tem seis conversas e empty state |

### 16.5 O que as imagens não comprovam

- Não há evidência de que a busca tenha filtrado uma consulta; `Screenshot_6` mostra apenas o campo em foco.
- Não há evidência de que uma conversa tenha sido criada; o modal está aberto, sem confirmação de “Criar”.
- Não há evidência de alteração de modo de autorização; o painel está aberto, sem ação de salvar.
- Não há evidência de que renomear, recarregar ou apagar tenham sido executados.
- Não há evidência de envio de mensagem, anexo, áudio ou câmera.
- Apenas uma conversa e um menu são mostrados; as outras cinco conversas e os outros cinco menus não aparecem.
- Não há captura de tema claro, seletor de agente, perfil ou tela de instalação PWA no celular.
- As imagens não mostram a URL, a versão do build ou o hash do commit.

### 16.6 Divergências em relação ao relatório anterior

| Ponto | Relatório 18 anterior | Evidência manual |
|---|---|---|
| Interação geral | Nenhum controle respondeu via Browser MCP | As capturas manuais mostram configurações, nova conversa, busca focada, conversa e menu abertos |
| Telas | 2 telas | 8 estados visuais únicos |
| Conversa | Não acessada | Uma conversa é mostrada aberta |
| Menu de conversa | Não acessado | Menu com quatro opções é mostrado |
| Configurações | Não acessadas | Painel de autorização é mostrado |
| Nova conversa | Não acessada | Modal é mostrado |
| Marca no topo | “TREG” nas capturas desktop | “Hermes” nas capturas mobile |
| Lista | Seis conversas na desktop | Duas conversas na mobile |

As diferenças de marca e quantidade de conversas precisam ser esclarecidas. As imagens mobile podem ser de outra versão, outra instalação, outro perfil ou outro estado de sessão; não é seguro assumir que sejam exatamente o mesmo build TREG das capturas desktop.

### 16.7 Problemas visuais observados

- A marca “Hermes” no topo das capturas mobile difere de “TREG” na versão desktop.
- A lista mobile mostrada tem apenas duas conversas, enquanto a desktop tem seis.
- A tipografia de prévia, horário e badge é pequena e compacta.
- O tema é escuro e não há alternância de tema visível.
- A busca não tem chip de filtro nem indicador de resultados.
- O modal de nova conversa usa um campo simples de nome, sem seletor de agente visível.
- O painel de autorização mostra “Inteligente” como ativo; não há confirmação de que a alteração seja persistida ou de quem a alterou.
- O menu da conversa inclui “Apagar conversa” em vermelho, mas não foi executado.

### 16.8 Conclusão revisada

A conferência manual comprova que a interface do aplicativo **funciona em celular** para os fluxos mostrados: lista, abertura de conversa, configurações, modal de nova conversa, foco de busca, composer e menu de conversa. Portanto, a falha observada nas tentativas com Browser MCP deve ser tratada como **limitação da ferramenta/ambiente de automação**, não como prova de que o aplicativo esteja quebrado.

A auditoria ainda não está completa: faltam os outros cinco menus, as outras cinco conversas, a execução real da busca, a criação de conversa, envio de mensagem/anexos, tema claro, agente e instalação PWA. Também permanece pendente esclarecer a diferença de marca (“Hermes” × “TREG”) e de quantidade de conversas entre as capturas mobile e desktop.

Nenhum código, configuração, VPS, tag ou release foi alterado durante a auditoria. A publicação documental posterior ocorre em branch própria, sem alterar `main`, C7, tag ou Release.

## 15. Tentativa guiada adicional — 2026-10-18

Esta seção registra a tentativa guiada posterior, com foco nos controles da captura fornecida pelo usuário (viewport de referência 1792 × 800).

### 15.1 Correspondência com a captura do usuário

| Item | Resultado |
|---|---|
| Cabeçalho TREG | Presente |
| Três controles do topo | Presentes |
| Busca “Buscar conversa” | Presente |
| Seis conversas na lateral | Presentes, na mesma ordem |
| Painel “Escolha uma conversa ou crie uma nova.” | Presente |
| Sessão autenticada | Ativa; nenhum login solicitado |
| Viewport do Browser MCP | 975 × 768, diferente da captura fornecida (1792 × 800) |

A tela corresponde em conteúdo à captura do usuário, mas o Browser MCP está renderizando em viewport menor. Por isso, as coordenadas aproximadas da captura de 1792 px não foram usadas; os cliques foram feitos por referências de acessibilidade.

### 15.2 Controles testados nesta tentativa

| Controle | Ação realizada | Resultado visual observado | Status |
|---|---|---|---|
| Atualizar | Clique | Nenhuma recarga, indicador ou mudança de lista | Não funcionou |
| Configurações | Clique, espera de 2 s, novo snapshot | Nenhum painel, modal ou menu | Não funcionou |
| Configurações após Ctrl+Tab | Clique, espera de 2 s | Nenhuma mudança | Não funcionou |
| Nova conversa | Clique | Nenhum modal ou tela nova | Não funcionou |
| Buscar conversa | Digitação de `ola` | Campo permaneceu visualmente vazio; lista não filtrou | Não funcionou |
| `⋯` de `plugin-pwa-2` | Clique | Nenhum menu abriu | Não funcionou |
| `⋯` de `teste` | Clique | Nenhum menu abriu | Não funcionou |
| Corpo da conversa `teste` | Clique via referência | Browser MCP retornou `Unable to get parent` | Falha da ferramenta |
| Abrir app (instalação) | Clique | Nenhuma navegação; URL permaneceu em `/treg?stay=1` | Não funcionou |
| PageDown | Tecla | Nenhuma rolagem | Não funcionou |
| Tab/Enter | Teclas | Nenhuma mudança visível | Não funcionou |
| Ctrl+Shift+M | Atalho | Nenhuma mudança de viewport | Não funcionou |

### 15.3 Conversas e menus

Não foi possível abrir nenhuma das seis conversas. O primeiro item testado retornou `Unable to get parent`; os demais não foram tentados após a falha estrutural da ferramenta. Como consequência, cabeçalho do chat, mensagens, compositor, navegação de retorno e menus internos não foram examinados.

Dos seis menus `⋯`, dois foram testados (`plugin-pwa-2` e `teste`); nenhum abriu. Os outros quatro não foram testados porque o comportamento já havia falhado de forma consistente e repetir cliques não produziria evidência nova.

### 15.4 Busca

O teste de busca não chegou a criar um estado filtrável: o texto digitado não apareceu no campo e a lista permaneceu com as seis conversas. Portanto, os casos “teste”, “plugin-pwa-2”, “sem resultados” e “limpar busca” não puderam ser concluídos. Não é possível afirmar se o filtro local funciona.

### 15.5 Diagnóstico atualizado

**Fatos confirmados:**

- A tela do TREG está carregada e autenticada.
- O Browser MCP identifica os controles por acessibilidade, mas os cliques não geram mudança visual.
- O clique em um item de conversa falha na própria ferramenta com `Unable to get parent`.
- O Browser MCP vê uma sobreposição “Fitkun Batch” na árvore de acessibilidade; ela não aparece na captura fornecida pelo usuário.
- O viewport do Browser MCP (975 × 768) difere do viewport da captura do usuário (1792 × 800).
- O console acessível não mostrou erro da aplicação; as mensagens anteriores eram de extensões.

**Hipóteses:**

- O Browser MCP pode estar conectado a uma aba/janela não ativa ou a uma segunda instância da página, o que explicaria a diferença de viewport e a ausência de resposta aos eventos.
- A sobreposição da extensão “Fitkun Batch” pode estar interceptando cliques e teclado na aba controlada.
- A falha pode ser da ferramenta de automação, não necessariamente do TREG PWA.

A causa não foi isolada. Repetir cliques no mesmo estado não acrescentaria evidência.

### 15.6 Capturas

Nenhuma nova captura distinta foi produzida nesta tentativa, porque nenhuma interação criou um estado visual novo. As evidências válidas continuam sendo:

- `prints-aplicativo-treg-pwa/captura-15012.png`
- `prints-aplicativo-treg-pwa/02-tela-instalacao-qr.png`

### 15.7 Conclusão da tentativa guiada

A tentativa automatizada permanece **parcial**. Foram confirmadas a autenticação e a presença das duas telas, mas não foi possível verificar nenhum controle interativo, nenhuma conversa e nenhum menu. A conferência manual posterior, na seção 16, complementa esta análise com evidências de telas que o Browser MCP não conseguiu operar.
