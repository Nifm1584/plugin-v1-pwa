# 42 — Pendências de correção da interface multimídia

**Data:** 2026-10-27  
**Projeto:** TREG PWA  
**Repositório:** `Nifm1584/plugin-v1-pwa`  
**Branch documental:** `docs/validacao-mobile-fase-40`  
**Origem:** observações do usuário durante a validação manual da Fase 40 no celular  
**Status:** documentado para fase futura; implementação não autorizada nesta etapa.

## 1. Objetivo

Manter uma lista clara das duas melhorias de interface solicitadas após a validação mobile. Os fluxos atuais de visualização de imagem, leitura/persistência de PDF e áudio foram testados e não devem ser quebrados pelas correções futuras.

## 2. Correção A — imagem: menu de três pontos e download

### Comportamento atual confirmado

- A miniatura da imagem aparece no balão.
- Tocar na miniatura abre a imagem em tamanho completo.
- A imagem permanece visível após sair e voltar ao aplicativo ou recarregar a conversa.
- A miniatura não exibe menu de três pontos e não oferece uma ação explícita para baixar.

### Comportamento desejado

- Manter o toque na miniatura para abrir e visualizar a imagem completa.
- Adicionar um menu de três pontos no cartão/miniatura, inspirado na experiência do WhatsApp.
- Disponibilizar a ação **Baixar imagem** nesse menu.
- Não iniciar o download automaticamente ao tocar na miniatura.
- Preservar persistência, autenticação e rotas atuais de mídia.

### Critérios de aceite futuros

- [ ] A miniatura continua visível na conversa.
- [ ] Tocar na miniatura continua abrindo a imagem completa.
- [ ] O menu de três pontos aparece e é utilizável no celular.
- [ ] A ação “Baixar imagem” baixa o arquivo correto.
- [ ] A imagem continua visível após recarregar a conversa.
- [ ] A interação funciona sem prejudicar a coexistência com o plugin original `hermes-pwa`.

## 3. Correção B — PDF: menu com visualização e download

### Comportamento atual confirmado

- O Hermes conseguiu ler o PDF de teste.
- O cartão do PDF permanece visível depois de recarregar/retornar ao aplicativo.
- Tocar no cartão inicia o download imediatamente.
- O usuário não quer que o toque no cartão inicie o download sem escolha prévia.

### Comportamento desejado

- Adicionar um menu de três pontos ao cartão do PDF.
- Oferecer duas ações explícitas:
  1. **Visualizar PDF**
  2. **Baixar PDF**
- Não iniciar download automático apenas por tocar no cartão.
- A opção “Visualizar PDF” deve abrir o documento em um visualizador compatível com o celular e, quando suportado pelo sistema, permitir escolher um aplicativo disponível, como Google Drive.
- A opção “Baixar PDF” deve baixar o arquivo diretamente.
- Preservar a referência persistida do arquivo e a autenticação das rotas existentes.

### Considerações de compatibilidade

A possibilidade de apresentar um seletor de aplicativos depende do navegador, do sistema operacional e dos aplicativos instalados. A implementação deve oferecer uma visualização compatível e usar mecanismos suportados pelo ambiente, sem prometer que o Google Drive estará instalado ou disponível em todos os dispositivos.

### Critérios de aceite futuros

- [ ] O cartão do PDF continua visível após recarregar a conversa.
- [ ] O menu de três pontos aparece no cartão.
- [ ] A opção “Visualizar PDF” abre um visualizador compatível.
- [ ] Quando suportado, o usuário consegue escolher um aplicativo de visualização.
- [ ] A opção “Baixar PDF” inicia o download correto.
- [ ] Tocar no cartão, fora das ações explícitas, não dispara download automático.
- [ ] Arquivo indisponível ou erro de sessão é apresentado de maneira compreensível.
- [ ] A solução funciona no celular sem quebrar a versão web.

## 4. Fora do escopo

- **Áudio:** nenhuma correção solicitada. O usuário confirmou reprodução, controles de velocidade e menu com opção de baixar.
- **Vídeo:** ainda precisa de validação manual específica; não é uma correção definida por este relatório.
- **Geração de imagem/vídeo por IA:** depende das ferramentas ou APIs disponíveis ao agente e deve ser testada separadamente.
- **Backend e persistência:** não há pedido para alterar rotas, autenticação, banco ou armazenamento nesta fase.
- **Reinstalação/atualização:** não autorizada por este documento.

## 5. Requisitos de implementação para a fase futura

Antes de alterar o código:

1. Inspecionar a implementação atual dos cartões e do lightbox em `dashboard/pwa/app.js` e `dashboard/pwa/app.css`.
2. Reutilizar padrões de menu e download que já funcionam no cartão de áudio, quando tecnicamente aplicável.
3. Preservar a compatibilidade com as rotas autenticadas existentes; não criar endpoints novos sem demonstrar necessidade.
4. Manter ações acessíveis em telas pequenas, com rótulos claros e alvos de toque adequados.
5. Não alterar a tag/release estável, não modificar o plugin original `hermes-pwa` e não instalar automaticamente.
6. Adicionar testes automatizados para menus, ações, caminhos de arquivo e regressões.
7. Validar no celular e na web antes de declarar as correções concluídas.

## 6. Estado e autorização

**Estado atual:** pendências documentadas; nenhuma correção implementada.

Este relatório não autoriza alterações de código. A implementação deverá ocorrer somente em uma fase posterior explicitamente iniciada pelo usuário, com branch e relatório próprios. Os relatórios anteriores e a versão estável devem permanecer intactos.

## 7. Resumo

| Item | Estado atual | Mudança futura |
|---|---|---|
| Imagem: visualizar/ampliar | Funciona | Preservar |
| Imagem: menu de três pontos | Ausente | Adicionar |
| Imagem: baixar pelo menu | Ausente | Adicionar |
| PDF: leitura e persistência | Funciona | Preservar |
| PDF: clique inicia download automático | Comportamento atual indesejado | Remover como ação padrão do cartão |
| PDF: menu de três pontos | Ausente | Adicionar |
| PDF: visualizar | Não oferecido pelo fluxo atual do cartão | Adicionar ação de visualização |
| PDF: baixar explicitamente | Download direto ao tocar no cartão | Disponibilizar no menu |
| Áudio: player, velocidades e download | Validado pelo usuário | Nenhuma correção solicitada |
