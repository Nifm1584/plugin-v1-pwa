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

O relatório 36 registrou que o CLI inspecionado naquele ambiente **não aceitava `--ref` nem `--branch`** e que o comando genérico selecionava `main`. A documentação oficial online do Hermes atualmente descreve suporte a `--ref` com SHA completo ([documentação de plugins](https://hermes-agent.nousresearch.com/docs/user-guide/features/plugins)); isso pode variar conforme a versão efetivamente instalada.

Portanto, consulte a ajuda **local** antes de escolher o método. Não presuma suporte só porque aparece na documentação online, e não execute um comando com `--ref` sem que a ajuda local o confirme. Em qualquer cenário, **não use `git clone` apontando para `/opt/data/plugins/treg-pwa`**, pois esse diretório já existe.

- Se a ajuda local confirmar `--ref`, a origem existente for o mesmo repositório e todas as verificações de segurança abaixo passarem, prefira o mecanismo oficial do Hermes fixando o SHA completo.
- Se a ajuda local não oferecer `--ref`, só use o checkout Git existente se a árvore estiver limpa, `origin` for o repositório correto e não houver metadados de instalação que ficariam desatualizados. Se isso não puder ser confirmado, pare e reporte o bloqueio.
- Nunca use o comando genérico sem SHA, nem `main`, `latest` ou uma branch móvel como substituto do commit solicitado.

## Etapa 1 — Inspeção somente leitura antes de mudar qualquer coisa

1. Confirme que está no ambiente Hermes esperado, registre a versão do Hermes e confirme `HERMES_HOME=/opt/data`.
2. Consulte a ajuda local de `HERMES_HOME=/opt/data /opt/hermes/bin/hermes plugins install --help` e anote se `--ref` é aceito. Essa consulta não altera a instalação.
3. Confirme que `/opt/data/plugins/treg-pwa` existe e que `/opt/data/plugins/hermes-pwa` continua sendo a instalação original separada.
4. Confirme que `/opt/data/plugins/treg-pwa` é um checkout Git e que o remoto `origin` aponta para `https://github.com/Nifm1584/plugin-v1-pwa.git` (ou URL HTTPS equivalente do mesmo repositório).
5. Registre o SHA instalado (`git rev-parse HEAD`), branch/estado atual, remotos e a saída de `git status --short`.
6. Inspecione arquivos não rastreados e ignorados sem apagá-los; classifique o que for conhecido como dado persistente e pare se algo for inesperado ou não puder ser identificado.
7. Verifique se existe metadado de instalação do Hermes, especialmente `/opt/data/plugins/.install-metadata.json` ou o caminho efetivamente usado por esta versão. Se existir, leia somente a entrada de `treg-pwa`; não a modifique manualmente. Registre origem e SHA/revisão armazenados, se disponíveis.
8. Confirme se `treg-pwa` está habilitado e se o original `hermes-pwa` está presente. Não altere a habilitação nesta etapa.
9. Consulte o estado e os logs do dashboard sem reiniciar serviços.

**Pare imediatamente, sem atualizar, se qualquer condição abaixo ocorrer:**

- o caminho do plugin não existir ou não for o esperado;
- o diretório não for um checkout Git ou o remoto não corresponder ao repositório acima;
- houver alterações rastreadas, arquivos não rastreados/ignorados inesperados ou dados locais cuja função não possa ser determinada;
- a origem registrada nos metadados do Hermes divergir do repositório, ou uma atualização manual deixar metadados de revisão desatualizados;
- o estado Git estiver divergente, incompleto ou não for possível confirmar a origem;
- a instalação original `hermes-pwa` estiver ausente ou parecer ter sido modificada;
- não houver como confirmar que o checkout de destino é alcançável a partir do histórico atual sem descartar dados.

Não tente resolver essas condições apagando arquivos, restaurando o diretório, criando outro clone ou reinstalando o plugin. Informe as evidências e aguarde.

## Etapa 2 — Escolher a atualização segura e confirmar o SHA

Só prossiga se as verificações iniciais mostrarem que a instalação, o histórico e os dados locais estão seguros.

### Caminho A — O CLI local aceita `--ref`

Use este caminho somente se a ajuda local confirmar explicitamente `--ref`, o plugin instalado tiver a mesma origem `Nifm1584/plugin-v1-pwa`, o estado Git estiver limpo e o TREG já estiver habilitado. Execute:

```bash
HERMES_HOME=/opt/data /opt/hermes/bin/hermes plugins install Nifm1584/plugin-v1-pwa --force --ref 1c112805bbfae6f56ae936d323dd5ecd70707a3d --enable
```

Não execute este comando se a ajuda local não listar `--ref`, se a origem não corresponder, se o plugin estiver desabilitado ou se houver alterações/dados não esclarecidos. Depois do comando, confirme que o SHA efetivamente instalado é exatamente `1c112805bbfae6f56ae936d323dd5ecd70707a3d` e confira os metadados do Hermes para a revisão instalada.

### Caminho B — O CLI local não aceita `--ref`

Use este caminho somente se o diretório existente for um checkout Git correto e limpo, o SHA atualmente instalado for ancestral do destino e **não existir metadado do Hermes que fique desatualizado com uma troca manual de checkout**. Se houver `/opt/data/plugins/.install-metadata.json` ou equivalente e não for possível atualizar sua revisão por um procedimento oficialmente suportado nessa versão, pare e reporte o bloqueio; não edite o metadado manualmente.

No diretório `/opt/data/plugins/treg-pwa`, atualize apenas as referências:

```bash
git fetch --no-tags origin feat/treg-pwa-preparacao-validacao-real
```

Confirme que o commit `1c112805bbfae6f56ae936d323dd5ecd70707a3d` existe localmente e que o commit instalado é ancestral dele. Se não for possível confirmar isso, pare. Confirme novamente que a árvore está limpa.

Só então, no checkout existente:

```bash
git checkout --detach 1c112805bbfae6f56ae936d323dd5ecd70707a3d
git rev-parse HEAD
git status --short
```

O resultado de `git rev-parse HEAD` deve ser exatamente:

```text
1c112805bbfae6f56ae936d323dd5ecd70707a3d
```

### Proibições nos dois caminhos

Não use o instalador genérico sem SHA; não instale `main`; não apague nem recrie `/opt/data/plugins/treg-pwa`; não execute `git clone` apontando para o diretório existente; não use `git reset --hard`, `git clean`, `rm -rf`, stash ou outras operações de descarte. Não escolha outro SHA se o solicitado não puder ser aplicado.

Confira também, sem modificar arquivos:

- `plugin.yaml`: `name: treg-pwa` e `version: 1.8.0b1`;
- `dashboard/pwa/sw.js`: `treg-pwa-v4`;
- comando `/treg` e as rotas próprias do TREG;
- presença de `report/35-correcoes-audio-busca-navegacao.md` e `report/36-preparacao-validacao-real.md`;
- presença e estado da instalação original `hermes-pwa`.

A troca de código não deve modificar o conteúdo de `/opt/data` fora do diretório do plugin, nem bancos de sessões, histórico do Hermes, configurações globais, `.env`, credenciais ou estado persistente do navegador. Não habilite/desabilite plugins automaticamente para contornar erro. Se o estado de habilitação anterior mudar ou não puder ser confirmado, registre isso e pare.

## Etapa 4 — Recarregar somente o dashboard

Antes de reiniciar, confirme que o SHA final aplicado é exatamente o solicitado e que o estado/metadados da instalação não divergem. Se qualquer verificação falhar, não reinicie serviços; registre o problema e pare.

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
