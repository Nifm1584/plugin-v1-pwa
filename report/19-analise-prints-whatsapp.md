# 19 — Análise visual dos prints manuais do WhatsApp

## 1. Objetivo e escopo

Analisar três prints manuais do WhatsApp fornecidos pelo usuário para extrair padrões de interface, hierarquia, estados visuais e expectativas de uso aplicáveis ao TREG PWA.

Esta análise é **somente visual e documental**:

- não abriu o WhatsApp, não acessou conta, conversa ou sessão autenticada;
- não fez novas capturas de tela;
- não executou automação, OCR ou medição de pixels;
- não alterou código, configuração, VPS, `main`, tag ou Release.

Os prints são tratados como **referência de estudo**, não como autorização para copiar marca, identidade visual ou conteúdo de terceiros.

## 2. Arquivos analisados

| # | Arquivo | Dimensão | Tema | Estado | Natureza |
|---|---|---|---|---|---|
| 1 | `Screenshot (18 de out. de 2026 21_26_38).png` | 720 × 1640 | Escuro | Lista de conversas | Captura atual do app Android, viewport completo |
| 2 | `Screenshot (18 de out. de 2026 21_28_19).png` | 720 × 1640 | Escuro | Conversa aberta | Captura atual do app Android, viewport completo |
| 3 | `Screenshot (18 de out. de 2026 21_30_42).png` | 720 × 1640 | Claro | Lista de conversas | Captura de uma captura, exibida em galeria; interface mais antiga |

Os três arquivos foram abertos e visualizados diretamente. Os originais permanecem apenas no workspace local.

> **Privacidade:** os prints 1 e 2 contêm nomes, número de telefone e conteúdo de conversas privadas. Por isso, nenhum nome, telefone, mensagem ou nome de arquivo pessoal é reproduzido neste relatório, e as imagens não foram publicadas no GitHub.

## 3. Descrição individual

### 3.1 Print 1 — lista de conversas, tema escuro

**Estrutura observada:**

- cabeçalho com o título “WhatsApp”, ação de câmera e menu de três pontos;
- campo de busca em formato de pílula, com ícone de lupa e placeholder “Pesquisar…”;
- lista densa de conversas, incluindo conversas fixadas, comunidade, grupo, empresa e contato individual;
- indicador de conversa não lida com contagem alta (representada como “999+”) e badge numérico na aba de conversas;
- ícones de fixação em duas linhas;
- prévias de texto, documento e mensagem de voz, com confirmação de leitura em azul;
- botão flutuante de nova conversa no canto inferior direito;
- barra inferior com quatro abas: Conversas, Ligações, Atualizações e Ferramentas; a aba ativa recebe uma pílula de fundo.

**Leitura de design:**

- o avatar é o principal ponto de ancoragem visual da linha;
- título, prévia, horário e badge formam uma hierarquia em três níveis;
- o horário e o badge ocupam a mesma coluna à direita;
- a linha tem altura generosa e usa separadores muito discretos;
- o tema escuro usa contraste alto no título e contraste reduzido na prévia;
- a barra inferior usa rótulos curtos e ícones com estado ativo claramente destacado.

**O que o print comprova:** a existência do padrão visual de lista, busca, fixação, não lidas, prévias multimídia, ação flutuante e navegação inferior.

**O que o print não comprova:** o comportamento funcional de busca, fixação, abertura de conversa, criação de conversa ou reprodução de áudio.

### 3.2 Print 2 — conversa aberta, tema escuro

**Estrutura observada:**

- cabeçalho com voltar, avatar, nome do contato, ação de vídeo, ação de chamada e menu;
- papel de parede escuro com padrão de desenhos;
- separadores de data em pílulas;
- aviso central de criptografia de ponta a ponta, com destaque em amarelo;
- mensagens de áudio recebidas e enviadas, com forma de onda, duração e botão de reprodução;
- confirmação de leitura em azul nas mensagens enviadas;
- reação por emoji exibida junto a uma mensagem;
- registro de chamada apagado, apresentado como aviso do sistema;
- cartão de documento PDF com nome de arquivo, extensão e ação de expansão;
- composer com emoji, campo “Mensagem”, clipe de anexo, câmera e microfone.

**Leitura de design:**

- o chat usa bolhas com cantos assimétricos e agrupamento por data;
- mensagens recebidas e enviadas se diferenciam por cor, alinhamento e confirmação;
- áudio é um componente rico: play, onda, duração e horário no mesmo cartão;
- o aviso de criptografia tem tratamento próprio, separado das bolhas;
- o composer mantém poucos controles visíveis e prioriza o campo de texto;
- a leitura é facilitada pela separação clara entre conteúdo, metadados e ações.

**O que o print comprova:** o padrão visual de chat, áudio, PDF, reação, confirmação de leitura, registro de chamada e composer.

**O que o print não comprova:** envio, recebimento, reprodução, download, reação ou confirmação de leitura em tempo real. O print é estático e não identifica o backend.

### 3.3 Print 3 — lista de conversas, tema claro e interface antiga

**Estrutura observada:**

- a imagem é uma captura dentro de um visualizador de galeria: há barras pretas, miniaturas de outras capturas na parte inferior e indicadores de página;
- a tela capturada tem cabeçalho verde-escuro com “WhatsApp”, busca, nova conversa e menu;
- abas superiores “CALLS”, “CHATS” e “CONTACTS”, com a aba de conversas ativa;
- lista clara com avatar, título, prévia, horário e badge de não lidas;
- prévias de texto, imagem e áudio;
- barra de navegação do Android na parte inferior da captura original;
- nomes e conversas com aparência de dados de demonstração.

**Leitura de design:**

- é uma variante mais antiga do produto, com abas no topo em vez da barra inferior;
- o contraste entre cabeçalho verde e lista branca é forte;
- a lista usa divisores claros e bastante espaço em branco;
- badges verdes e confirmações azuis continuam sendo os acentos principais;
- a presença de molduras, miniaturas e barras pretas reduz a fidelidade da imagem.

**O que o print comprova:** a existência de uma variante clara com abas no topo, lista, busca, badges e prévias.

**O que o print não comprova:** o estado atual do produto, comportamento, dimensões reais ou tokens oficiais. A imagem é uma captura de segunda geração e não deve ser tratada como especificação.

## 4. Padrões comuns aos três prints

| Dimensão | Padrão observado | Implicação para o TREG |
|---|---|---|
| Hierarquia da lista | Avatar → título → prévia → horário/badge | Manter uma linha de leitura clara e evitar competição entre metadados |
| Identidade | Avatar circular e cor de destaque | Fotos não estão disponíveis no Hermes; iniciais continuam sendo o fallback |
| Estado não lido | Badge numérico e contagem agregada | Só implementar se o backend expuser contagem; não simular |
| Multimídia na prévia | Texto, documento, foto e áudio | A prévia do TREG deve refletir o tipo real da mensagem |
| Busca | Campo dedicado, sempre visível na lista | O TREG já tem busca local; falta validar filtro e estado vazio |
| Conversa | Data, bolhas, áudio, anexo, reação e confirmação | Priorizar o que o Hermes realmente entrega; não prometer recibos |
| Composer | Campo com anexo, câmera, áudio e envio | O TREG já tem os controles; falta validar cada ação |
| Navegação | Abas inferiores no app atual; abas superiores na versão antiga | A barra inferior é uma referência, não uma obrigação de produto |
| Tema | Claro e escuro com acentos verdes | O TREG segue o sistema; toggle manual ainda não existe |

### 4.1 Tokens visuais aproximados

Os valores abaixo são **estimativas visuais**, não tokens oficiais do WhatsApp:

| Token | Tema escuro | Tema claro |
|---|---|---|
| Fundo da lista | quase preto | branco |
| Cabeçalho | preto/cinza muito escuro | verde-escuro |
| Superfície de busca | cinza escuro | branco/cinza claro |
| Texto principal | branco/quase branco | quase preto |
| Texto secundário | cinza médio | cinza médio |
| Acento de ação | verde | verde |
| Bolha enviada | verde-escuro | verde-claro |
| Bolha recebida | cinza escuro | branco |
| Confirmação de leitura | azul | azul |
| Badge de não lidas | verde com texto escuro | verde com texto branco |

## 5. Comparação com o TREG PWA

A base do TREG está no relatório 18 e nos relatórios 02/04.

| Elemento do WhatsApp | TREG PWA atual | Diferença relevante |
|---|---|---|
| Lista de conversas | Sim | TREG usa sidebar no desktop e lista no mobile |
| Busca | Sim, local | Falta comprovar filtro e estado sem resultados |
| Nova conversa | Sim | Modal com nome; sem seletor de agente visível |
| Menu da conversa | Sim | Renomear, recarregar, apagar e cancelar |
| Conversa e composer | Sim | Histórico, texto, anexo, áudio e enviar |
| Áudio | Sim, com player e transcrição | Sem onda sonora no estilo WhatsApp |
| Documento/PDF | Parcial | Upload para `~/uploads`; não há cartão nativo de PDF |
| Reação | Não | Sem reação por mensagem no TREG atual |
| Confirmação de leitura | Não | Hermes não expõe recibo por mensagem; `run.completed` não equivale a “lido” |
| Não lidas/contagem | Não | Não há contagem de não lidas exposta na API usada |
| Fixar/arquivar | Parcial | Modelo de backend existe; UI não expõe |
| Filtros/chips | Não | Busca local simples, sem chips |
| Chamadas | Não | Fora do escopo do Hermes |
| Status/atualizações | Não | Fora do escopo |
| Tema claro/escuro | Parcial | Segue `prefers-color-scheme`; sem toggle |
| Notificações push | Não | Polling; sem push |
| Instalação PWA | Sim | QR, manifest e service worker |

## 6. Matriz de compatibilidade com o Hermes

Legenda: **Suportado** = existe no TREG e usa recurso observado; **Parcial** = existe com limite ou depende de configuração; **Não suportado** = não há recurso no Hermes/TREG atual; **Exige validação** = contrato não confirmado.

| Recurso de referência | Evidência nos prints | Base no Hermes/TREG | Classificação |
|---|---|---|---|
| Listar sessões | Lista com avatar, prévia e horário | `GET /api/sessions`; `app.js:96-123` | Suportado |
| Busca na lista | Campo “Pesquisar…” | Filtro local em `app.js:124` | Suportado, mas falta teste funcional |
| Criar conversa | Botão flutuante | `POST /api/sessions`; `app.js:126-133` | Suportado |
| Renomear/apagar | Menu de conversa (print 18) | `PATCH`/`DELETE` de sessão | Suportado |
| Fixar/arquivar | Ícones de fixação | Modelo `PatchSession`; UI ausente | Parcial |
| Chat de texto | Bolhas e composer | Runs/SSE; `app.js:268-273` | Suportado |
| Imagens | Prévia de foto | Anexo inline e upload | Suportado |
| Documento/PDF | Cartão de PDF | Upload para `~/uploads`; sem cartão nativo | Parcial |
| Áudio | Onda, play, duração | Player + transcrição via dashboard/Groq | Parcial/suportado com configuração |
| Reação | Emoji junto à mensagem | Sem reação por mensagem no TREG | Não suportado |
| Confirmação de leitura | Duplo check azul | Sem recibo por mensagem; run não é leitura | Não suportado |
| Contagem de não lidas | Badge “999+” e “3” | Sem contagem exposta | Não suportado |
| Filtros/chips | Abas de lista | Sem chips; busca local | Não suportado |
| Chamadas de voz/vídeo | Ícones no cabeçalho | Fora do escopo do Hermes | Não suportado |
| Status/atualizações | Aba “Atualizações” | Fora do escopo | Não suportado |
| Grupos/comunidades | Linhas de comunidade/grupo | Sessões podem ter origem de grupo; sem gestão | Não suportado como função de UI |
| Foto de contato/perfil | Avatares fotográficos | Hermes não expõe foto; TREG usa inicial | Não suportado |
| Tema manual | Claro e escuro | Apenas `prefers-color-scheme` | Parcial |
| Push | Notificação implícita | Polling de 12/30 s | Não suportado |
| Instalação PWA | — | Manifest, service worker e QR | Suportado |

### 6.1 Regras para não superestimar a paridade

1. **`run.completed` não é confirmação de leitura.** O TREG pode indicar que uma execução terminou, mas não que o destinatário leu.
2. **Contagem de não lidas não deve ser inventada.** Se a API não expõe o dado, o badge seria decorativo.
3. **Reação e citação não existem no chat do TREG atual.** Não copiar o padrão visual sem o contrato de dados.
4. **Chamadas e status estão fora do escopo.** Não incluir ícones que não tenham ação real.
5. **PDF é um upload, não um visualizador.** O agente pode ler o arquivo; a UI não deve prometer prévia de PDF.
6. **Áudio depende da configuração de transcrição.** Sem chave/provedor, o envio pode funcionar sem transcrição, mas o recurso não está completo.

## 7. Oportunidades de evolução (não implementadas)

1. **Hierarquia da lista:** alinhar título, prévia, horário e badge para reduzir a densidade do TREG.
2. **Estado não lido:** implementar somente após confirmar que o gateway expõe contagem ou marcador confiável.
3. **Filtros:** chips “Todas”, “Não lidas” e “Grupos” apenas com dados reais; caso contrário, manter busca local.
4. **Áudio:** evoluir o player para uma forma de onda simples, preservando o player nativo como fallback.
5. **Documento:** mostrar cartão com nome, tipo e ação de download; não simular prévia de PDF.
6. **Tema:** manter a preferência do sistema e avaliar toggle manual persistido no cliente.
7. **Acessibilidade:** preservar rótulos, foco e contraste; badges não devem ser o único indicador de estado.

Nenhuma dessas oportunidades foi implementada nesta fase.

## 8. Riscos e limitações

- A análise cobre **três prints estáticos**, não o produto completo.
- O print 1 e o print 2 são do app Android atual; o print 3 é uma captura antiga dentro de uma galeria, com molduras e miniaturas.
- Não há interação, medição, inspeção de acessibilidade ou acesso ao código do WhatsApp.
- As cores e dimensões são estimativas visuais; não são tokens oficiais.
- Os prints 1 e 2 contêm dados pessoais e não foram publicados.
- Os prints não comprovam que o TREG deva reproduzir a identidade visual do WhatsApp; a referência é comportamental e estrutural.
- A compatibilidade foi classificada a partir do código local e dos relatórios 02/04; contratos do gateway continuam sujeitos a validação no host.

## 9. Conclusão

Os prints confirmam um padrão de mensageiro maduro: lista com hierarquia clara, busca, não lidas, conversa com áudio e anexos, confirmações e composer enxuto. O TREG já cobre o núcleo funcional — lista, busca local, conversa, streaming, texto, imagens, upload, áudio e PWA —, mas não cobre reações, recibos de leitura, contagem de não lidas, chamadas, status e gestão de grupos.

A direção segura é evoluir a **hierarquia visual** e os **estados reais** sem copiar marca ou prometer recursos que o Hermes não fornece. Em especial, não tratar conclusão de execução como leitura e não exibir badges ou ícones sem contrato de dados.

## 10. Referências internas

- `report/02-inventario-de-funcionalidades.md` — inventário e limites do TREG.
- `report/04-integracao-hermes-api.md` — contratos observados e classificação de compatibilidade.
- `report/17-levantamento-visual-treg-pwa.md` — levantamento visual inicial.
- `report/18-auditoria-visual-funcional-treg-pwa.md` — auditoria do app e prints manuais do TREG.
- `report/prints-aplicativo-treg-pwa/README.md` — relação das capturas do app.

## 11. Publicação

- Relatórios 17, 18 e 19 e as capturas do TREG PWA são publicados em branch documental própria.
- As três capturas manuais do WhatsApp permanecem no workspace local e **não** foram enviadas ao GitHub por conterem dados pessoais de terceiros.
- Nenhum código, configuração, VPS, `main`, tag ou Release foi alterado.
