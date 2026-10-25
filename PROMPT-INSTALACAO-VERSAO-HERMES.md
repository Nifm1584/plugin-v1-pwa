# PROMPT PRONTO — Atualizar o TREG PWA existente no Hermes e validar a Fase 4F

**Este prompt está preenchido e pronto para copiar e enviar ao Hermes.** Não substitua os SHAs, não use `main` e não reinstale o plugin do zero.

## Referência exata a instalar

- **Repositório:** https://github.com/Nifm1584/plugin-v1-pwa
- **Branch publicada:** `feat/treg-pwa-preparacao-validacao-real`
- **SHA exato de destino:** `1c112805bbfae6f56ae936d323dd5ecd70707a3d`
- **SHA da árvore de código funcional:** `a33593a488a0ffa75dcfd6fadbeac68a23d9ebec`
- **Plugin:** `treg-pwa`
- **Versão declarada:** `1.8.0b1` — sozinha, essa versão não identifica o commit exato.
- **Service worker esperado:** `treg-pwa-v4`
- **Ambiente conhecido:** `HERMES_HOME=/opt/data`
- **Diretório instalado que deve ser preservado:** `/opt/data/plugins/treg-pwa`
- **Plugin original que deve continuar intacto:** `hermes-pwa`
- **Rota de uso:** `/treg`
- **Rota de API do plugin:** `/api/plugins/treg-pwa/`

O commit `1c112805...` acrescenta o relatório de preparação 36 à árvore de código `a33593a...`; ele não contém novas funcionalidades. A Fase 4F prepara o código das Fases 4D e 4E para validação no Hermes real. A versão **ainda não foi validada funcionalmente no Hermes real**.

## Objetivo

Atualizar **a instalação existente** de `treg-pwa` no próprio diretório, preservando a instalação, conversas, sessões, configurações, preferências, arquivos e quaisquer dados persistentes. Em seguida, recarregar somente o dashboard, verificar os sinais reais de instalação e registrar os testes e pendências.

## Regra crítica sobre o instalador

O relatório 36 registra que o CLI inspecionado nesta instalação do Hermes **não aceita `--ref` nem `--branch` em `hermes plugins install`**. O comando genérico clona a branch padrão `main`, portanto não seleciona o código solicitado.

Por isso, **não execute** o comando genérico de instalação do plugin, nem tente contornar o problema usando `--force`, outro SHA ou uma referência móvel. O método definido abaixo é atualizar o checkout Git que já existe, depois de comprovar que isso é seguro.

## Etapa 1 — Inspeção somente leitura antes de mudar qualquer coisa

1. Confirme que está no ambiente Hermes esperado e que `HERMES_HOME=/opt/data`.
2. Confirme que `/opt/data/plugins/treg-pwa` existe e que o caminho `/opt/data/plugins/hermes-pwa` continua sendo a instalação original separada.
3. Confirme que `/opt/data/plugins/treg-pwa` é um checkout Git e que o remoto `origin` aponta para `https://github.com/Nifm1584/plugin-v1-pwa.git` (ou a URL HTTPS equivalente desse mesmo repositório).
4. Registre o SHA atualmente instalado (`git rev-parse HEAD`), a branch/estado atual, os remotos e a saída de `git status --short`.
5. Inspecione também os arquivos não rastreados e ignorados presentes no diretório. Não presuma que são descartáveis.
6. Verifique, com os comandos de consulta disponíveis nesta instalação, se `treg-pwa` está habilitado e se o plugin original `hermes-pwa` está presente. Não altere o estado de habilitação nesta etapa.
7. Consulte o estado e os logs relevantes do dashboard, sem reiniciar serviços.

**Pare imediatamente, sem atualizar, se qualquer condição abaixo ocorrer:**

- o caminho do plugin não existir ou não for o esperado;
- o diretório não for um checkout Git;
- o remoto não corresponder ao repositório acima;
- houver alterações rastreadas, arquivos não rastreados, arquivos ignorados inesperados ou dados locais cuja função não possa ser determinada;
- o estado Git estiver divergente, incompleto ou não for possível confirmar a origem;
- a instalação original `hermes-pwa` estiver ausente ou parecer ter sido modificada;
- não houver como confirmar que o checkout de destino é alcançável a partir do histórico atual sem descartar dados.

Não tente resolver essas condições apagando arquivos, restaurando o diretório, criando outro clone ou reinstalando o plugin. Informe as evidências e aguarde.

## Etapa 2 — Buscar e conferir o commit exato

Só prossiga se a Etapa 1 demonstrar que o checkout está seguro, limpo e sem dados locais inesperados:

1. No diretório `/opt/data/plugins/treg-pwa`, atualize apenas as referências Git:

   ```bash
   git fetch --no-tags origin feat/treg-pwa-preparacao-validacao-real
   ```

2. Confirme que o commit `1c112805bbfae6f56ae936d323dd5ecd70707a3d` existe localmente após o fetch.
3. Confirme que o commit atualmente instalado é ancestral do SHA de destino. Se não for possível confirmar essa relação, pare e reporte a divergência.
4. Confirme novamente que a árvore de trabalho está limpa antes de trocar a referência.

Não use `git reset --hard`, `git clean`, `rm -rf`, não apague nem recrie `/opt/data/plugins/treg-pwa`, não use `git clone` sobre esse diretório, não faça stash e não force nenhuma operação.

## Etapa 3 — Atualizar a instalação existente

Somente após todas as verificações anteriores passarem, no próprio checkout existente:

```bash
git checkout --detach 1c112805bbfae6f56ae936d323dd5ecd70707a3d
git rev-parse HEAD
git status --short
```

O resultado de `git rev-parse HEAD` deve ser exatamente:

```text
1c112805bbfae6f56ae936d323dd5ecd70707a3d
```

Confira também, sem modificar arquivos:

- `plugin.yaml`: `name: treg-pwa` e `version: 1.8.0b1`;
- `dashboard/pwa/sw.js`: `treg-pwa-v4`;
- comando `/treg` e as rotas próprias do TREG;
- presença de `report/35-correcoes-audio-busca-navegacao.md` e `report/36-preparacao-validacao-real.md`;
- presença e estado da instalação original `hermes-pwa`.

A troca de código não deve modificar o conteúdo de `/opt/data` fora do diretório do plugin, nem bancos de sessões, histórico do Hermes, configurações globais, `.env`, credenciais ou estado persistente do navegador. Não habilite/desabilite plugins automaticamente para contornar erro. Se o estado de habilitação anterior mudar ou não puder ser confirmado, registre isso e pare.

## Etapa 4 — Recarregar somente o dashboard

O procedimento já utilizado neste ambiente foi reiniciar apenas o serviço do dashboard. Antes de executar, confirme que `/run/service/dashboard` existe e corresponde ao dashboard desta instalação.

Se confirmado, execute **somente**:

```bash
s6-svc -r /run/service/dashboard
```

Não reinicie o gateway, não reinicie todo o contêiner e não altere outros serviços. Se o caminho do serviço não existir ou não for possível identificar o dashboard com certeza, não invente outro comando: registre o bloqueio e pare.

## Etapa 5 — Verificações reais após a atualização

Registre resultados observados, não presumidos:

1. SHA instalado e estado Git após a atualização.
2. Registro/habilitação do `treg-pwa` e presença do `hermes-pwa` original.
3. Logs do dashboard após o recarregamento, destacando erros do TREG.
4. Resposta da rota `/treg` e da rota de API `/api/plugins/treg-pwa/`, quando o acesso ao painel permitir verificá-las.
5. Carregamento do app e ausência de erro de carregamento dos arquivos estáticos.
6. Confirmação de que o acesso original `/pwa` continua presente.
7. Se a persistência de conversas, sessões e preferências pode ser verificada sem alterar nem apagar dados, faça uma conferência somente leitura. Não envie mensagens nem exclua, renomeie ou arquive conversas durante o teste.
8. Identifique testes que exigem ação manual no celular. Não declare áudio, microfone, transcrição, busca real ou funcionamento offline como validados apenas porque a página abre.

A URL usada anteriormente para o ambiente foi `https://maya.devlist.com.br/treg`. Confirme que esse domínio continua sendo o endereço correto antes de utilizá-lo; não invente nem substitua o domínio se não conseguir confirmar.

Se uma verificação falhar, não faça correções fora do escopo, não volte automaticamente para outro commit e não mexa no `hermes-pwa`. Informe o erro e aguarde.

## Etapa 6 — Relatório obrigatório

Crie o arquivo `report/37-atualizacao-validacao-real.md` no diretório do plugin, sem sobrescrever relatórios anteriores. O relatório deve registrar:

- estado inicial comprovado: SHA, branch, remoto, status Git e plugins encontrados;
- verificações que autorizaram ou bloquearam a atualização;
- referência exata aplicada, comandos executados e SHA final;
- estado do TREG e do plugin original antes e depois;
- reinício executado (ou motivo para não executar);
- cada teste, seu resultado e evidência;
- testes não executados e pendências de validação no celular;
- alterações de arquivos efetivamente feitas, incluindo o relatório;
- afirmação explícita de que nenhuma funcionalidade nova foi implementada.

Não faça commit, push, merge, PR, tag ou Release. Não declare que o relatório foi publicado no GitHub. Preserve o relatório local para publicação documental posterior. Não apague nem descarte o novo relatório por ele aparecer como arquivo não rastreado.

## ENCERRAMENTO OBRIGATÓRIO — PRESERVAR O PONTO DE RETOMADA

Ao concluir, entregue um relatório em português com o status real, o SHA inicial e final, os comandos executados, os arquivos modificados, os testes e evidências, os problemas encontrados e o que ficou pendente. Separe validação automatizada, inspeção do ambiente e teste manual.

Atualize `estado-atual.md` no repositório de histórico do projeto apenas se tiver acesso e autorização; preserve `historico.md` integralmente e não alegue ter atualizado ou publicado um arquivo sem confirmação. Se não puder gravar no GitHub, diga isso claramente.

Finalize com **PONTO EXATO DE RETOMADA** contendo:
- fase concluída ou bloqueada;
- SHA que ficou instalado (ou confirmação de que nada foi alterado);
- estado do TREG e do `hermes-pwa` original;
- relatório local criado;
- testes reais concluídos e pendentes;
- próximo passo único recomendado.

**Pare ao terminar o relatório. Não implemente melhorias, não faça publicação, não altere a main e não avance para outra fase sem revisão do usuário.**
