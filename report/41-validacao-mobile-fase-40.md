# 41 — Validação funcional do TREG PWA no celular

**Data:** 2026-10-27  
**Fase relacionada:** 40 — imagens persistentes e mídias de saída do Hermes  
**Repositório:** `Nifm1584/plugin-v1-pwa`  
**Branch documental:** `docs/validacao-mobile-fase-40`  
**Base técnica testada:** instalação da Fase 40, commit `9b34073c94f61a78b427b518cd587909cf80884b`  
**Tipo de evidência:** validação manual relatada pelo usuário em celular; não é um teste automatizado.

## 1. Objetivo

Registrar os resultados observados pelo usuário ao utilizar o TREG PWA no celular após a instalação da Fase 40. Este relatório documenta apenas o comportamento efetivamente relatado, sem afirmar validação da versão web ou de formatos que ainda não foram testados.

## 2. Resultado geral

**A validação funcional mobile relatada pelo usuário foi aprovada**, com duas pendências de experiência de uso registradas separadamente no relatório 42:

1. Imagens: falta menu de três pontos com opção de baixar.
2. PDFs: falta menu de três pontos para escolher visualizar ou baixar; tocar no cartão atualmente inicia o download diretamente.

Essas pendências não invalidam a persistência dos arquivos nem os fluxos que o usuário já confirmou.

## 3. Testes aprovados

### 3.1 Persistência de conversas e anexos

O usuário informou que saiu do aplicativo, removeu-o do segundo plano, retornou e recarregou a conversa diversas vezes, em comportamento semelhante a atualizar a página. Após essas repetições:

- as conversas permaneceram no lugar;
- os arquivos continuaram visíveis;
- a imagem e o PDF continuaram associados às mensagens;
- não foi observada perda dos itens após voltar ao aplicativo.

**Resultado:** aprovado conforme teste manual no celular.

### 3.2 Imagem recebida

O usuário confirmou que:

- a miniatura da imagem aparece no balão;
- tocar na miniatura abre a imagem completa;
- a imagem continua visível após sair e retornar/recarregar a conversa.

**Resultado:** exibição, ampliação e persistência aprovadas.

**Limitação observada:** a miniatura não apresenta o menu de três pontos nem a ação de baixar. Essa melhoria fica registrada como pendência, sem alterar a aprovação da visualização atual.

### 3.3 PDF recebido e leitura pelo Hermes

O usuário confirmou que:

- o Hermes conseguiu ler o PDF enviado;
- o cartão do PDF permaneceu visível após as recargas e retornos ao aplicativo;
- ao tocar no cartão, o download do PDF é iniciado.

**Resultado:** leitura pelo Hermes, presença do cartão e persistência aprovadas.

**Limitação observada:** tocar no cartão inicia o download diretamente. Ainda não existe o fluxo desejado para escolher primeiro entre visualizar o PDF e baixar o arquivo. A correção está registrada no relatório 42.

### 3.4 Áudio enviado pelo agente

O usuário solicitou que o Hermes enviasse um áudio e confirmou que o arquivo foi entregue na conversa. Também testou as velocidades de reprodução e informou que os controles funcionaram corretamente. O menu de três pontos apresenta a opção de baixar o áudio.

**Resultado:** entrega, reprodução, controles de velocidade e opção de download aprovados conforme teste manual relatado.

**Escopo:** não abrir correção para áudio; o usuário declarou esse fluxo correto.

### 3.5 PDF: conteúdo

Em um teste específico, o usuário confirmou a leitura integral do PDF: arquivo de aproximadamente 107 KB, 276 linhas de texto extraídas e nenhuma página faltando, conforme o resultado apresentado pelo Hermes.

**Resultado:** leitura e extração de texto aprovadas nesse arquivo de teste.

## 4. Matriz de validação

| Área | Resultado | Evidência |
|---|---|---|
| Conversas após sair e voltar ao app | Aprovado | Usuário repetiu o ciclo várias vezes |
| Persistência de anexos após recarga | Aprovado | Imagem e PDF continuaram visíveis |
| Miniatura e ampliação de imagem | Aprovado | Miniatura abre a imagem completa |
| Baixar imagem pelo menu | Pendente | Menu de três pontos ausente |
| Leitura de PDF pelo Hermes | Aprovado | Documento lido; extração completa relatada |
| Cartão de PDF após recarga | Aprovado | Cartão permaneceu visível |
| Escolha visualizar/baixar PDF | Pendente | Clique inicia download diretamente |
| Áudio de saída do agente | Aprovado | Áudio entregue e reproduzido |
| Velocidade e controles do áudio | Aprovado | Usuário testou e confirmou |
| Baixar áudio pelo menu | Aprovado | Opção disponível no menu de três pontos |
| Vídeo de saída | Não testado neste registro | Sem confirmação manual do usuário |
| Versão web em navegador | Pendente | O usuário informou que testará posteriormente |

## 5. Limites desta validação

- Os resultados acima são evidências de uso real no celular relatadas pelo usuário, não logs de automação anexados ao repositório.
- A validação no celular não implica aprovação automática da versão web; navegador, sessão e comportamento de abertura de arquivos ainda precisam de teste próprio.
- Não se declara vídeo validado, pois o usuário ainda não confirmou esse fluxo.
- A possibilidade de gerar e entregar outras mídias depende também das ferramentas ou APIs de geração disponíveis para o agente; o sucesso do áudio não comprova sozinho a criação de imagens ou vídeos.
- Este relatório não altera nem reinterpreta os testes automatizados descritos no relatório 40.

## 6. Preservação e próximo passo

Nenhum código foi alterado nesta tarefa documental. Não foram solicitadas reinstalação, alteração de configuração, mudança de versão, merge, tag, Release ou deploy.

**Próximo passo:** testar a versão web quando o usuário desejar. As duas melhorias de imagem e PDF permanecem registradas como pendências futuras no relatório 42 e não devem ser implementadas sem autorização específica.

## 7. Conclusão

O TREG PWA passou nos testes mobile relatados de persistência das conversas e anexos, exibição/ampliação da imagem, presença e leitura do PDF, e entrega/reprodução do áudio com controles e download. Permanecem duas melhorias de interface deliberadamente adiadas: menu de download para imagem e menu de PDF com escolha entre visualizar e baixar.
