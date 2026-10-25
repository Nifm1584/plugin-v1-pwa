# Histórico dos prompts de instalação do TREG PWA no Hermes

Este arquivo preserva os prompts e as referências históricas recuperados do repositório de histórico do projeto. Não substitui o prompt atual em [PROMPT-INSTALACAO-VERSAO-HERMES.md](./PROMPT-INSTALACAO-VERSAO-HERMES.md).

**Atenção:** alguns prompts antigos usavam `hermes plugins install --ref`. O relatório 36 informa que o CLI atualmente inspecionado não aceita `--ref` nem `--branch` nesse comando e que a instalação genérica seleciona `main`. Os comandos abaixo são registros históricos, não instruções para executar novamente no ambiente atual. Para a atualização atual, use somente o prompt pronto no arquivo acima.

## 1. Instalação histórica — Fase B

**Fonte original recuperada:** [Prompt 03 — “Instale e habilite agora o plugin independente treg-pwa no Hermes”](https://github.com/Nifm1584/historico-de-conversas-ia/blob/main/conversas/ChatGPT/An%C3%A1lise%20do%20plugin%20PWA/Prompt/03-instale-e-habilite-agora-o-plugin-independente-treg-pwa-no-hermes-us.md)

**Referência histórica:** branch `fase-b-treg-pwa`, SHA `a5485bd03174b02ee66ab6d338ff1b8b3cc5ed6f`.

Prompt recuperado:

> Instale e habilite agora o plugin independente `treg-pwa` no Hermes, usando o repositório `Nifm1584/plugin-v1-pwa` e exclusivamente o commit `a5485bd03174b02ee66ab6d338ff1b8b3cc5ed6f`, correspondente à versão de teste da branch `fase-b-treg-pwa`.
>
> Execute:
>
> ```bash
> hermes plugins install Nifm1584/plugin-v1-pwa --ref a5485bd03174b02ee66ab6d338ff1b8b3cc5ed6f --enable
> ```
>
> Mantenha o `hermes-pwa` original instalado e habilitado. Após a instalação, recarregue ou reinicie os serviços necessários, confirme que `/treg` e `/api/plugins/treg-pwa/` funcionam e verifique se `/pwa` continua funcionando normalmente. Não altere o núcleo do Hermes, não desinstale o original e não substitua a revisão solicitada por `main` ou outra versão. Ao terminar, apresente o resultado da instalação, os testes executados e eventuais erros.

Esse texto foi recuperado do arquivo histórico; o comando deve ser tratado como histórico devido à limitação posterior do CLI.

## 2. Atualização histórica — validação C6

**Referência registrada no histórico:** branch `fix/treg-pwa-c6-validacao-publicacao`, SHA `a1bbe18553998284dcaf7ac99751624f6fd7e1e7`.

O registro histórico informa que o prompt pedia uma reinstalação com backup. **Não localizei o texto integral desse prompt** nas fontes recuperadas nesta tarefa; por isso, não vou inventar uma versão e apresentá-la como se fosse a redação original. A referência foi preservada aqui para localizar a execução na cronologia.

## 3. Atualização histórica — versão C7 validada

**Referência histórica:** branch `fix/treg-pwa-c7-qrcode-fix`, SHA `6218f0fd25a2047b5caba09cf854af74058db03d`. Tag posterior: [`treg-pwa-v1.0.0-estavel`](https://github.com/Nifm1584/plugin-v1-pwa/releases/tag/treg-pwa-v1.0.0-estavel).

A sessão histórica registra que o prompt solicitava **atualizar somente o plugin `treg-pwa`** para o commit exato C7, mantendo o plugin original `hermes-pwa` intacto. O comando executado e registrado foi:

```bash
HERMES_HOME=/opt/data /opt/hermes/bin/hermes plugins install Nifm1584/plugin-v1-pwa --ref 6218f0fd25a2047b5caba09cf854af74058db03d --force --enable
```

A intenção registrada do prompt era manter o alvo C7, não trocar pela `main`, confirmar o comando `/treg`, a rota `/api/plugins/treg-pwa/` e o funcionamento do `/pwa` original.

A descrição acima preserva as instruções e o comando recuperados no histórico, mas **não é apresentada como transcrição literal integral do prompt original**. O registro de origem está em [Retomar-projeto-TREG-PWA.md](https://github.com/Nifm1584/historico-de-conversas-ia/blob/main/conversas/ChatGPT/An%C3%A1lise%20do%20plugin%20PWA/sessoes/Retomar-projeto-TREG-PWA.md).

## 4. Referência de versão posterior mencionada no template

O antigo template de instalação usava `5af6cd5c3221b429a80ee543ec55b0c2b98c00e4` como exemplo de commit para `1.8.0b1`. A referência aparece na branch `feat/treg-pwa-fase-5a-p1`. Como não localizei o texto integral do prompt Hermes correspondente, ela fica registrada como referência histórica e não como um prompt original recuperado.

## 5. Prompt atual — Fase 4F

O prompt atual, já preenchido com ambiente, diretório, branch, SHA e procedimento de atualização segura, está em:

[**PROMPT-INSTALACAO-VERSAO-HERMES.md — atualização atual**](./PROMPT-INSTALACAO-VERSAO-HERMES.md)

Ele atualiza o checkout já existente em `/opt/data/plugins/treg-pwa` para o SHA `1c112805bbfae6f56ae936d323dd5ecd70707a3d`, sem apagar/recriar a instalação, sem usar o comando genérico do CLI, sem tocar no `hermes-pwa` original e sem reiniciar o gateway.

## Regras de preservação

- Não alterar commits, tags ou versões históricas para fazê-los apontar para código novo.
- Não executar os comandos históricos sem conferir a compatibilidade do CLI atual.
- Não tratar o número `1.8.0b1` como identificação suficiente: usar o SHA exato.
- Não declarar que a Fase 4F foi validada no Hermes real até executar e registrar os testes reais.
- Os prompts históricos permanecem como registro; o arquivo de prompt atual é a única instrução a usar para a próxima atualização.
