# 19 — Análise dos Prints Manuais do WhatsApp

## 1. Objetivo e Escopo

Analisar três prints manuais fornecidos pelo usuário, capturados do aplicativo WhatsApp em Android, com o objetivo de comparar a interface e a experiência de usuário do TREG PWA com um produto de mensageria maduro.

Esta análise é exclusivamente de inspeção visual. Não alterou código, não reinstalou o plugin, não modificou configurações persistentes do aplicativo, não acessou a VPS e não publicou commits, tags ou releases.

## 2. Ferramenta, Ambiente e Autenticação

| Item | Resultado |
|---|---|
| Ferramenta principal | Leitura direta de arquivos de imagem (print manual) |
| Aplicativo | WhatsApp para Android |
| Imagens analisadas | 3 prints manuais fornecidos pelo usuário |
| Data | 2026-10-18 |

Os prints mostram interfaces do WhatsApp em diferentes estados e temas. Não houve acesso ao WhatsApp Web nem a contas de terceiros.

## 3. Descrição Individual dos Prints

### 3.1 Print 1 — Lista de Conversas (Tema Escuro)

**Arquivo:** `Screenshot (18 de out. de 2026 21_26_38).png`

**Elementos visíveis:**
- Cabeçalho com título "WhatsApp", ícone de câmera e menu de três pontos
- Campo de busca com placeholder "Pesquisar…"
- Lista de conversas com:
  - Conversas fixadas: Neoenergia Coelba, Cnanet Internet De Cachoeira, Comunidade Secreta (999+ não lidas)
  - Conversas comuns: Vendas Caxias Maranhão (17:53), +55 75 8706-7073 (mensagem de voz 0:15), afCodeHub #13, Sociosflix, Velum Media, Comunidade Pixel Rocket
- Badge de não lidas verde com "30" na aba Conversas
- Barra inferior com quatro abas: Conversas, Ligações, Atualizações, Ferramentas
- Botão flutuante de nova conversa (+) no canto inferior direito
- Tema escuro

### 3.2 Print 2 — Conversa Aberta (Tema Escuro)

**Arquivo:** `Screenshot (18 de out. de 2026 21_28_19).png`

**Elementos visíveis:**
- Cabeçalho com voltar, avatar do contato ("Silas"), vídeo, chamada e menu de três pontos
- Papel de parede escuro com padrão de desenhos
- Separadores de data: 14 de julho de 2026, 13 de julho de 2026, 17 de julho de 2026, 22 de setembro de 2026, 23 de setembro de 2026
- Aviso de criptografia de ponta a ponta
- Mensagens de áudio recebidas (0:36, 0:13) e enviadas (0:26, 0:05) com formas de onda
- Confirmação de leitura (duplo check azul) nas mensagens enviadas
- Reação por emoji (polegar para cima) em mensagem recebida
- Registro de ligação apagado
- Mensagem de número: 34920528515~
- Documento PDF: comprovante_picpay_PIX_...pdf
- Composer com emoji, campo "Mensagem", clipe, câmera e microfone
- Tema escuro com papel de parede ilustrado

### 3.3 Print 3 — Lista de Conversas (Tema Claro)

**Arquivo:** `Screenshot (18 de out. de 2026 21_30_42).png`

**Elementos visíveis:**
- Cabeçalho verde com título "WhatsApp", busca, nova conversa e menu de três pontos
- Abas superiores: CALLS, CHATS (ativa), CONTACTS
- Lista de conversas com:
  - Whitmans Chat (11:45 AM, badge 3 não lidas)
  - Stewart Family (11:39 AM, badge 1 não lida)
  - Alice Whitman (YESTERDAY, Image)
  - Jack Whitman (FRIDAY, 0:07, áudio)
  - Lunch Group (FRIDAY)
  - Jane Pearson (FRIDAY)
- Nomes e avatares fotográficos (exemplo/demonstração)
- Barra inferior de navegação do Android (voltar, home, aplicativos recentes)
- Barra de miniaturas inferior (visualizador de galeria)
- Tema claro

## 6. Comparação com o TREG PWA

### 6.1 Lista de Conversas

| Dimensão | WhatsApp (Prints Manuais) | TREG PWA (Relatório 18) |
|---|---|---|
| Paleta | Verde escuro, branco, cinzas claros (tema claro); verde-água, fundo quase preto (tema escuro) | Teal escuro, fundo quase preto, branco, verde-água |
| Cabeçalho | Marca, busca, ações; tabs inferiores (mobile) ou superiores (desktop) | Marca "Hermes"/"TREG", três ícones |
| Lista de conversas | Avatar fotográfico, título, prévia, horário, badge de não lidas | Avatar inicial, título, prévia truncada, horário, badge de origem |
| Estado não lido | Badge numérico verde visível | Não há indicador visual de não lidas |
| Botão flutuante | "Nova conversa" (+) no canto inferior direito | Botão nova conversa no cabeçalho |
| Menu de conversa | Renomear, silenciar, fixar, apagar | Renomear, recarregar, apagar, cancelar |
| Barra inferior | CALLS, CHATS, CONTACTS (claro) ou Conversas, Ligações, Atualizações, Ferramentas (escuro) | Não existe (lista + instalação são telas separadas) |

### 6.2 Conversa Aberta

| Dimensão | WhatsApp (Prints Manuais) | TREG PWA (Relatório 18) |
|---|---|---|
| Cabeçalho | Avatar, nome, vídeo, chamada, menu | Título, subtítulo, menu ⋮ |
| Mensagens | Bolhas com cauda, áudio com onda, data separadora | Bolhas, texto, anexo, áudio |
| Confirmação de leitura | Duplo check azul | Não existe |
| Reações | Emoji polegar para cima | Não existe |
| Documento | Cartão PDF com nome e ação | Não existe |
| Composer | Emoji, campo, clipe, câmera, microfone, enviar | Clipe, campo, microfone, enviar |
| Comprimento da prévia | Não truncada (largura total) | Truncada |

## 7. Matriz de Compatibilidade com o Hermes

| Recurso do WhatsApp | Evidência nos Prints | Estado no TREG PWA | Classificação |
|---|---|---|---|
| Listar conversas | Lista com avatar, título, prévia, horário, badge | `app.js:96-123` → `GET api/sessions` | Suportado |
| Buscar conversa | Campo "Pesquisar..." funcional | `app.js:124` — campo existe, não filtra | Não suportado |
| Nova conversa | Botão flutuante "+" | `app.js:126-133` → `POST /api/sessions` | Suportado |
| Renomear conversa | Menu de conversa | `app.js:624-628` → `PATCH api/sessions/:id` | Suportado |
| Apagar conversa | Menu de conversa | `app.js:629-633` → `DELETE /api/sessions/:id` | Suportado |
| Fixar conversa | Ícone de alfinete nas conversas | Modelo existe no backend, UI não expõe | Parcial |
| Chat de texto | Bolhas, texto, data separadora | `app.js:268-273`, `POST /api/sessions/:id/chat/stream` | Suportado |
| Imagem anexada | Cartão de imagem em conversa | `app.js:470-534` → `POST api/upload` | Suportado |
| Arquivo (PDF/Documento) | Cartão PDF com nome e download | `plugin_api.py:266-291` → `POST api/upload` | Suportado |
| Áudio | Waveform, play, duração | `app.js:543-573` → `POST /api/audio/transcribe` | Parcial (depende de config STT) |
| Confirmação de leitura | Duplo check azul | Não existe no Hermes | Não suportado |
| Reações por emoji | Polegar para cima | Não existe no Hermes | Não suportado |
| Chamada de voz/vídeo | Ícones no cabeçalho | Não existe | Não suportado |
| Filtros (Todas/Não lidas/Grupos) | Chips na lista | Não existem | Não suportado |
| Tema claro/escuro alternável | Ambos os temas disponíveis | Só `prefers-color-scheme`, sem toggle | Parcial |
| PWA Instalação | Não aplicável (app nativo) | Página com QR, manifest, `sw.js` | Suportado |

## 8. Recomendações de Melhoria Visual

### 8.1 Hierarquia da Lista
- Aumentar tipografia da prévia (atual 13 px) para pelo menos 14 px
- Aumentar tipografia do horário e badge (atual 10-11 px) para 12 px
- Adicionar badge de não lidas verde no canto superior direito do item
- Adicionar chips de filtro (Todas, Não lidas, Grupos)

### 6.2 Avatar e Identidade
- Substituir avatares de inicial por fotos de contato (opcional, com fallback para inicial)
- Manter a cor por origem como cor de fundo do avatar

### 6.3 Cabeçalho
- Adicionar rótulos textuais aos ícones de ação (Atualizar, Configurações, Nova conversa)
- Aumentar a marca "TREG" para maior destaque visual

### 6.4 Conversa
- Adicionar data separadora entre dias diferentes
- Adicionar confirmação de leitura (duplo check) nas mensagens enviadas
- Adicionar botão de anexo com opções: câmera, galeria, arquivo, áudio

## 7. Riscos e Limitações

- Os três prints são capturas manuais; não houve interação automatizada com o WhatsApp
- O print 3 é uma captura dentro de uma galeria de imagens, não uma captura nativa completa do app
- Os nomes e números de telefone nos prints são pessoais e não foram reproduzidos neste relatório
- O TREG PWA é um produto distinto do WhatsApp; a comparação serve de referência, não de modelo obrigatório

## 8. Conclusão

Os três prints manuais do WhatsApp confirmam um padrão de mensageiro maduro: lista com hierarquia clara, busca, não lidas, conversa com áudio e anexos, confirmações e composer enxuto. O TREG já cobre o núcleo funcional (lista, busca local, conversa, streaming, texto, imagens, uploads, áudio, PWA), mas não cobre reações, recibos de leitura, contagem de não lidas, chamadas e status.

A direção segura é evoluir a hierarquia visual e os estados reais, sem copiar a marca ou prometer recursos que o Hermes não fornece.

---
*Este relatório é parte da documentação do plugin hermes-pwa e não altera código, configuração, VPS, tag ou Release.*