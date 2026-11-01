# 51 — Verificação da autenticação administrada de perfis do TREG PWA

**Data:** 2026-11-01<br>
**Fase:** verificação da correção de autenticação multiperfil<br>
**Natureza:** auditoria e testes somente leitura. Nenhum código foi alterado nesta fase.<br>
**Código verificado:** Fase 3, commit `43f0441d8e48f67711d26ed61b98c1d293ff2271`<br>
**Base protegida:** `9b34073c94f61a78b427b518cd587909cf80884b`<br>
**Referências:** Relatórios 47, 49 e 50; Fases 2 (`71038be`, `a24cab2`) e 3 (`43f0441`).

## 1. Objetivo

Verificar se a implementação da Fase 3 realmente resolve a `API_SERVER_KEY` a partir do escopo administrado do Hermes e se existe algum defeito ou lacuna no TREG que impeça essa resolução.

A pergunta central era: **o código atual consegue fazer perfis atuais e futuros usarem a mesma chave já existente, sem configuração manual de `API_SERVER_KEY` em cada perfil?**

## 2. Estado atual do código

Arquivo: `dashboard/plugin_api.py` no commit `43f0441`.

### 2.1 Resolução da chave para perfis secundários

`_profile_api_key(profile)` (linha 93) faz:

1. localiza o home do perfil com `_profile_home()`;
2. valida se o diretório existe;
3. chama `build_profile_secret_scope(home)`, a composição oficial do Hermes;
4. aplica `_managed_env_value("API_SERVER_KEY")` como override, se houver;
5. usa o `.env` do próprio perfil como fallback;
6. devolve `profile_api_key_missing` se nada existir.

`_managed_env_value(key)` (linha 64):

- usa `hermes_cli.managed_scope.load_managed_env()`;
- se a API oficial não estiver disponível, lê `HERMES_MANAGED_DIR/.env` quando definido;
- caso contrário, lê `/etc/hermes/.env`;
- não cria, altera ou grava arquivos;
- não devolve a chave em logs ou respostas.

`_api_key(profile)` (linha 127) escolhe a chave do perfil para perfis secundários e mantém a chave do processo/`.env` principal para o `default`.

Todas as chamadas de proxy recebem `profile` e usam a chave correspondente (`_client`, linha 199; `_proxy_json`, linha 205).

### 2.2 O que a Fase 3 não faz

- Não cria `/etc/hermes/.env`.
- Não cria `HERMES_MANAGED_DIR`.
- Não copia a chave do processo para o perfil.
- Não gera, rotaciona ou substitui chave.
- Não altera o core do Hermes, o gateway ou a VPS.
- Não garante persistência do diretório administrado.

Essas são decisões de infraestrutura, não do plugin.

## 3. Verificação prática da resolução administrada

### 3.1 Teste direto com perfil sem chave no `.env`

Foi executada uma verificação isolada, sem alterar o repositório:

- perfil temporário com `.env` contendo apenas `OUTRA=1` (sem `API_SERVER_KEY`);
- diretório administrado temporário com `API_SERVER_KEY=chave-existente-1234`;
- `HERMES_MANAGED_DIR` apontando para o diretório administrado;
- chamada `_api_key("perfil-novo")`.

Resultado:

```text
resolved: chave-existente-1234
```

Isso confirma que a Fase 3 resolve a chave pelo escopo administrado mesmo quando o `.env` do perfil não a contém.

### 3.2 Teste sem fonte administrada

O mesmo teste, com o diretório administrado vazio e sem chave no perfil, retornou:

```text
missing: 503 {'code': 'profile_api_key_missing', 'profile': 'perfil-novo', 'message': "O perfil 'perfil-novo' não tem API_SERVER_KEY no escopo..."}
```

Isso confirma que a ausência da fonte é tratada como erro de configuração explícito, sem criar chave e sem abrir a tela de login.

### 3.3 Testes automatizados existentes

| Teste | Resultado |
|---|---|
| `node tests/hermes-api.test.js` | **PASS** |
| `node tests/ui-contract.test.js` | **PASS** |
| `node tests/ui-utils.test.js` | **PASS** |
| `node tests/sw-cache-isolation.test.js` | **PASS** |
| `tests/test_plugin.py` (runner local) | **PASS** — 2 testes |
| `tests/test_plugin_api.py` (runner local) | **PASS** — 13 testes |
| `python -m py_compile dashboard/plugin_api.py` | **PASS** |

Os 13 testes da API incluem:

- leitura da chave do `.env` do perfil;
- precedência do escopo administrado sobre o `.env` do perfil;
- leitura do override `HERMES_MANAGED_DIR`;
- perfil sem chave retornando `profile_api_key_missing`;
- não herança de `os.environ["API_SERVER_KEY"]` do processo padrão;
- 401/403/5xx classificados como erro de perfil/configuração, não como sessão expirada.

### 3.4 Testes não executados

- **QR code (`tests/qrcode.test.js`):** dependência `jsqr` não instalada no ambiente local; a instalação via npm não ficou disponível.
- **`pytest`:** não instalado no Python disponível; as mesmas funções foram executadas por um runner local que importa os módulos e chama cada `test_*`.
- **CI do GitHub Actions:** o workflow `TREG PWA validation` não é disparado por esta branch; não foi criado PR.
- **Integração real no Hermes/VPS:** não executada nesta fase; nenhuma VPS foi acessada ou alterada.
- **Teste manual no celular/computador:** não executado nesta fase.

## 4. Defeitos e lacunas encontrados

### 4.1 Código

**Não foi encontrado defeito no código da Fase 3 que impeça a resolução da chave pelo escopo administrado para perfis secundários.** A função `_profile_api_key` consulta a composição oficial e aplica o override administrado; os testes e a verificação direta confirmam.

Também não foi encontrado defeito na seleção de perfis: a listagem, o seletor, `_pfx`, `openSession` e `ctx.profile` permanecem como no congelado/original.

### 4.2 Lacuna operacional

A lacuna é externa ao código:

- o Relatório 47 registra que `/etc/hermes/.env` não existia e que o `.env` do perfil não tinha `API_SERVER_KEY`;
- sem uma fonte administrada (ou chave no `.env` do perfil), o gateway responde 401 e o plugin retorna `profile_api_key_missing`;
- o código não pode criar essa fonte, copiar a chave do processo ou garantir a persistência do diretório;
- o usuário informou que não devemos presumir que `/etc/hermes/.env` esteja configurado ou persistente. O código não presume: ele falha com erro claro quando a fonte não existe.

### 4.3 Assimetria do perfil padrão

O `default` continua usando a chave do processo/`.env` principal. Isso é coerente com o gateway, cuja chave do listener padrão é fixada no start e exige `API_SERVER_KEY` para subir. A fonte administrada é o caminho para os perfis secundários. Não foi alterada essa assimetria.

### 4.4 Limitações de validação

- Não houve teste de integração real com o gateway v0.22.2 e seus escopos por requisição.
- Não foi possível confirmar leitura e persistência de `/etc/hermes` no container.
- Não foi possível confirmar se dashboard e gateway compartilham o mesmo `HERMES_MANAGED_DIR`.

## 5. Justificativa para não alterar código

Não foi inventada uma correção porque:

1. a resolução administrada já está implementada e testada;
2. a falha observada é compatível com a ausência da fonte externa, não com um defeito de resolução;
3. criar, copiar ou gravar a chave a partir do plugin contrariaria as restrições e a arquitetura de segredos do Hermes;
4. reverter a Fase 2/3 reintroduziria a chave global e o loop de login;
5. a próxima ação necessária é operacional e deve ser feita com autorização específica.

## 6. Próximo passo operacional

Para concluir a autenticação automática dos perfis atuais e futuros, é necessário disponibilizar a chave **já existente** em uma fonte administrada persistente, sem gerar ou trocar a chave:

1. Escolher um diretório administrado persistente e visível pelo gateway e pelo dashboard (por exemplo, `/etc/hermes` ou um `HERMES_MANAGED_DIR` persistente).
2. Criar/atualizar `<diretório>/.env` com:
   ```dotenv
   API_SERVER_KEY=<mesmo valor já usado pelo perfil padrão>
   ```
3. Garantir leitura pelo usuário do Hermes (por exemplo, arquivo `0640` com grupo adequado), sem expor a chave em logs.
4. Garantir que gateway e dashboard usem o **mesmo** `HERMES_MANAGED_DIR`; se um deles usa `/etc/hermes` e o outro um override, os escopos podem divergir.
5. Garantir persistência do diretório no rebuild do container; se `/etc/hermes` for efêmero, montar um volume persistente ou usar um `HERMES_MANAGED_DIR` persistente.
6. Reiniciar o gateway/dashboard se a nova fonte não for lida em runtime.
7. Validar:
   - `GET /p/<perfil>/api/sessions` retorna 200;
   - a troca de perfil no PWA carrega as conversas;
   - um perfil criado depois da configuração também autentica sem `API_SERVER_KEY` individual.

Se não houver um diretório persistente disponível, o plano B é colocar a mesma chave no `.env` de cada perfil. Isso funciona, mas volta a exigir configuração por perfil e não atende integralmente ao objetivo de perfis futuros sem toque manual.

## 7. Conclusão

A Fase 3 **resolve corretamente a chave a partir do escopo administrado** para perfis secundários e não apresenta defeito de código que impeça essa resolução. O que falta é a existência de uma fonte administrada persistente com a chave já existente; sem ela, o comportamento correto do plugin é retornar `profile_api_key_missing` e permitir voltar ao perfil padrão.

Nenhuma alteração de código foi feita nesta fase. A única publicação é este relatório, em branch documental própria. A validação final continua dependendo da configuração operacional da VPS e de um teste de integração real.

## 8. Declaração de não alteração

Não houve alteração de código, testes, configuração, `.env`, YAML, chave, segredo, plugin, serviço, VPS, tag, Release, `main` ou commit congelado. Não houve instalação, deploy ou reinício. A única escrita foi este relatório na branch documental.
