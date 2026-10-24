# Template: pedir ao Hermes para instalar uma versão específica do TREG PWA

Use este modelo para pedir ao Hermes que instale **uma versão exata** do plugin. A ideia é não deixar o Hermes escolher automaticamente a versão mais recente da branch `main).

## 1. O que substituir antes de enviar

Substitua somente os campos entre colchetes:

- `[REPOSITORIO]`: proprietário e nome do repositório, por exemplo `Nifm1584/plugin-v1-pwa`.
- `[VERSAO]`: número/nome da versão documentada na Release, por exemplo `1.8.0b1`.
- `[COMMIT_SHA_COMPLETO]`: SHA completo de 40 caracteres do commit que corresponde à versão escolhida.
- `[ID_DO_PLUGIN]`: identificador do plugin no Hermes, conforme o manifesto da versão.
- `[DIRETORIO_DE_INSTALACAO]`: diretório esperado da instalação, se aplicável.
- `[URL_DA_RELEASE]`: link da Release usada para conferir a versão e o commit.

**Não invente o SHA.** Abra a tag/Release no GitHub e confirme que o commit corresponde à versão que você quer instalar. Se não conseguir confirmar o SHA, pare e peça essa informação em vez de instalar `main` ou `latest`.

## 2. Prompt para copiar e colar no Hermes

Copie o bloco abaixo, substitua os campos e envie ao Hermes:

---

Quero instalar uma versão específica do plugin TREG PWA. Siga os dados abaixo e não escolha automaticamente a versão mais recente.

- Repositório GitHub: `[REPOSITORIO]`
- Versão solicitada: `[VERSAO]`
- Commit obrigatório (SHA completo): `[COMMIT_SHA_COMPLETO]`
- ID esperado do plugin: `[ID_DO_PLUGIN]`
- Diretório esperado, se aplicável: `[DIRETORIO_DE_INSTALACAO]`
- Release de referência: `[URL_DA_RELEASE]`

### Procedimento obrigatório

1. Antes de instalar, confira a ajuda do comando oficial de instalação de plugins disponível nesta instalação do Hermes.
2. Instale pelo mecanismo oficial do Hermes, fixando a referência no SHA completo informado acima. Não use a branch `main`, `latest) nem uma referência móvel no lugar do SHA.
3. Se o plugin já estiver instalado, verifique o estado atual e explique se a instalação substituirá arquivos existentes. Não remova nem substitua outro plugin, especialmente o plugin original `hermes-pwa`, sem autorização explícita.
4. Não altere o núcleo do Hermes, configurações globais ou outros plugins para contornar problemas.
5. Depois da instalação, verifique o resultado real: versão registrada, ID do plugin, diretório e commit/referência efetivamente instalada, quando disponíveis.
6. Se o Hermes não conseguir fixar e confirmar o SHA solicitado, não instale outra versão como alternativa. Informe o erro exato e pare sem declarar sucesso.

### Resposta final obrigatória

Informe:
- se a instalação foi concluída ou ficou bloqueada;
- a versão solicitada;
- o SHA solicitado e o SHA efetivamente instalado, se verificável;
- o ID e o diretório do plugin;
- os testes/verificações realmente executados;
- qualquer pendência ou risco identificado.

Não declare sucesso sem evidência verificável.

---

## 3. Regras para preservar versões

- Cada Release/tag publicada deve continuar apontando para o seu commit original.
- Para instalar uma versão antiga, use o SHA daquela versão, não o SHA da versão mais recente.
- Não mova nem apague tags antigas para publicar versões novas.
- Não confunda o commit de um relatório/documentação com o commit do código funcional do plugin.
- Uma Release é a documentação da versão; a referência exata de instalação precisa ser confirmada pelo mecanismo de instalação do Hermes.

## 4. Exemplo de preenchimento

Exemplo meramente ilustrativo de preenchimento dos campos:

- Repositório: `Nifm1584/plugin-v1-pwa`
- Versão: `1.8.0b1`
- Commit: `5af6cd5c3221b429a80ee543ec55b0c2b98c00e4`
- Diretório: `/opt/data/plugins/treg-pwa`

Antes de usar esse exemplo numa instalação real, confirme no GitHub que o commit ainda corresponde à versão pretendida e que ela é compatível com o ambiente. Não copie um SHA de exemplo para instalar outra versão.
