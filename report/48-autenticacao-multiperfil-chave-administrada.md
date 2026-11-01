# 48 — Autenticação multiperfil com a chave administrada do Hermes

**Data:** 2026-11-01<br>
**Fase:** Fase 3 — correção definitiva da autenticação multiperfil<br>
**Repositório:** `Nifm1584/plugin-v1-pwa`<br>
**Branch de implementação:** `fix/treg-pwa-autenticacao-multiperfil-fase-3`<br>
**Commit-base:** `a24cab2cf2a763c00ed2883eb2eb30741c0329c4` (Fase 2)<br>
**SHA final da implementação:** `43f0441d8e48f67711d26ed61b98c1d293ff2271`<br>
**Relatório de auditoria:** [47 — Auditoria de credenciais, criação de perfis e autenticação oficial do Hermes](https://github.com/Nifm1584/plugin-v1-pwa/blob/main/47-auditoria-credenciais-perfis-hermes/47-auditoria-credenciais-perfis-hermes.md)

## 1. Objetivo

Concluir a autenticação multiperfil do TREG PWA fazendo os perfis secundários usarem a mesma `API_SERVER_KEY` já existente no Hermes, sem criar, gerar, rotacionar ou substituir a chave, e sem alterar o core do Hermes ou o plugin `hermes-pwa`.

## 2. Leitura do Relatório 47 e confirmação da arquitetura

O Relatório 47 foi lido integralmente na `main` do repositório. Os pontos que orientaram esta fase:

- O perfil padrão autentica o PWA com a chave do **ambiente do processo** do gateway/dashboard.
- O perfil secundário autentica `/p/<perfil>/` com a chave resolvida no **escopo daquele perfil**, por `get_secret("API_SERVER_KEY")`.
- O escopo de perfil é montado por `build_profile_secret_scope`, que no Hermes v0.22.2 compõe: `.env` do perfil, fontes externas do perfil e, por último, com override, o `.env` administrado (`/etc/hermes/.env` ou `HERMES_MANAGED_DIR`).
- O `.env` do perfil `nome` **não** contém `API_SERVER_KEY`; o `.env` principal também não. A chave do perfil padrão está no ambiente do processo.
- A recomendação técnica foi **A + F**:
  - **A:** disponibilizar a chave existente no escopo administrado, para todos os perfis;
  - **F:** manter a resolução da Fase 2 no plugin.

### 2.1 Correção sobre “configuração YAML”

O Relatório 47 confirmou que a chave do perfil padrão não está no `config.yaml`: ela está no ambiente do processo. Além disso, ler `platforms.api_server.key` do YAML não resolveria a rota `/p/<perfil>/`, porque o gateway valida essa rota com `get_secret("API_SERVER_KEY")`, que não lê esse campo YAML. Se a instalação em uso tiver a chave no YAML, o valor ainda precisa estar no escopo de segredo do perfil para que o gateway o aceite.

Portanto, a fonte oficial para todos os perfis é o **escopo administrado** (`/etc/hermes/.env` ou `HERMES_MANAGED_DIR`), mantendo o valor já existente. O plugin não cria nem altera essa fonte.

## 3. Diagnóstico do código da Fase 2

A Fase 2 já fazia:

- leitura da `API_SERVER_KEY` do `.env` do perfil;
- fallback para `build_profile_secret_scope`;
- tradução de 401 de perfil para erro de configuração;
- login oficial e retorno ao perfil padrão.

Havia, porém, uma diferença de precedência em relação ao gateway:

- o plugin lia primeiro o `.env` do perfil e só usava `build_profile_secret_scope` se não encontrasse a chave;
- no Hermes v0.22.2, o `.env` administrado é aplicado **por último e com override** dentro de `build_profile_secret_scope`;
- se um perfil tivesse uma chave própria diferente da chave administrada, o plugin enviaria a chave do perfil enquanto o gateway esperaria a chave administrada, resultando em 401.

Além disso, versões mais antigas do Hermes (como a instalação local usada nos testes) podem ter um `build_profile_secret_scope` que não inclui o escopo administrado. O ajuste precisava cobrir esse caso sem alterar o core.

## 4. Ajuste implementado

### 4.1 Nova resolução da chave

Foi adicionada a função `_managed_env_value(key)` em `dashboard/plugin_api.py`:

- usa a API oficial `hermes_cli.managed_scope.load_managed_env()`;
- se essa API não estiver disponível, lê o `.env` do diretório `HERMES_MANAGED_DIR` (quando definido) ou de `/etc/hermes`;
- nunca lê `os.environ["API_SERVER_KEY"]` para um perfil secundário;
- não revela a chave em logs ou respostas.

`_profile_api_key(profile)` passou a resolver nesta ordem:

1. `build_profile_secret_scope(home)` — a mesma composição oficial usada pelo gateway;
2. **override explícito** pelo valor do escopo administrado, quando existir;
3. `.env` do próprio perfil, apenas como compatibilidade caso a API oficial falhe;
4. `profile_api_key_missing` se nada existir.

O passo 2 é o ajuste mínimo que garante o uso da **mesma chave** em todos os perfis, inclusive em versões do Hermes cujo `build_profile_secret_scope` ainda não incorpore o escopo administrado. Ele espelha a precedência do Hermes v0.22.2, no qual o `.env` administrado vence o `.env` do perfil.

### 4.2 Mensagens de erro

As mensagens de `profile_api_key_missing` e `profile_api_auth_failed` agora orientam a configurar a **mesma chave do perfil padrão** no `.env` do perfil ou no escopo administrado (`/etc/hermes/.env`). Não foi criada uma mensagem que sugira gerar uma chave nova.

### 4.3 Isolamento preservado

- A chave do perfil padrão não é usada como fallback para perfis secundários.
- O escopo administrado é uma decisão central do operador; as demais credenciais continuam por perfil.
- As chamadas continuam usando `/p/<perfil>` e o parâmetro `profile`.
- Nenhuma alteração foi feita no armazenamento de sessões, no service worker, no cache, no upload ou nas rotas de mídia.
- Nenhum segredo é devolvido ao navegador; a chave só vai no header `Authorization` do backend para o gateway.

## 5. Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `dashboard/plugin_api.py` | Resolução da chave com precedência oficial do escopo administrado e mensagens de erro atualizadas |
| `tests/test_plugin_api.py` | Testes de precedência do escopo administrado, leitura do override e não herança da chave do processo padrão |

Nenhum arquivo de configuração, `.env`, segredo, serviço, core do Hermes ou plugin `hermes-pwa` foi alterado.

## 6. Testes executados e resultados

| Teste | Forma | Resultado |
|---|---|---|
| Sintaxe Python | `python -m py_compile dashboard/plugin_api.py` | **PASS** |
| Testes Python do plugin | runner local em `tests/test_plugin.py` | **PASS** — 2 testes |
| Testes Python da API | runner local em `tests/test_plugin_api.py` | **PASS** — 13 testes |
| API layer JavaScript | `node tests/hermes-api.test.js` | **PASS** |
| Contrato de UI | `node tests/ui-contract.test.js` | **PASS** |
| Utilitários de UI | `node tests/ui-utils.test.js` | **PASS** |
| Service worker | `node tests/sw-cache-isolation.test.js` | **PASS** |
| Sintaxe JavaScript | `node --check` em `app.js` e `hermes-api.js` | **PASS** |

Os testes novos verificam:

- a chave do escopo administrado vence a chave do `.env` do perfil;
- `_managed_env_value` lê o override `HERMES_MANAGED_DIR`;
- um perfil sem chave **não** herda `os.environ["API_SERVER_KEY"]` do processo padrão;
- o comportamento anterior de leitura do `.env` do perfil e de erro `profile_api_key_missing` continua coberto.

### 6.1 Testes não executados

- **QR code (`tests/qrcode.test.js`):** a dependência `jsqr` não está instalada no ambiente local e a instalação via npm não ficou disponível.
- **`pytest`:** não está instalado no Python disponível; as mesmas funções foram executadas por um runner local que importa os módulos e chama cada `test_*`.
- **CI do GitHub Actions:** o workflow `TREG PWA validation` não é disparado por esta branch; não foi criado PR.
- **Hermes real / VPS:** não executado. A VPS não foi acessada e nenhuma configuração foi alterada.
- **Teste manual no celular/computador:** não executado nesta fase.

## 7. O que foi implementado no código e o que depende da VPS

### Implementado no código

- O plugin resolve a `API_SERVER_KEY` pela mesma fonte/precedência oficial do gateway, incluindo o escopo administrado.
- A chave administrada, quando presente, vence a chave do `.env` do perfil.
- Perfis secundários não herdam a chave do processo padrão.
- Erros de escopo ausente/recusado continuam separados do login oficial.

### Depende da homologação na VPS

O código **não cria** `/etc/hermes/.env` e **não** altera a VPS. Para o fluxo real funcionar, o operador precisa:

1. obter a `API_SERVER_KEY` **já existente** usada pelo perfil padrão, sem imprimir o valor em logs ou relatórios;
2. criar ou atualizar o `.env` administrado (`/etc/hermes/.env` ou o diretório indicado por `HERMES_MANAGED_DIR`) com:
   ```dotenv
   API_SERVER_KEY=<mesmo valor já existente>
   ```
3. garantir que o arquivo seja legível pelo usuário do Hermes e que o mesmo `HERMES_MANAGED_DIR` seja visto pelo dashboard e pelo gateway;
4. reiniciar o gateway se a leitura não ocorrer sem reinício;
5. validar `GET /p/<perfil>/api/sessions` e a troca de perfil no PWA.

Não gerar uma chave nova, não rotacionar e não substituir a chave existente. Não copiar a chave para o código, para o PWA ou para o repositório. Se `/etc/hermes` for efêmero no container, a configuração precisa ser persistida fora do container; essa é uma pendência de infraestrutura registrada no Relatório 47.

## 8. Compatibilidade e limitações

- **Compatível com o Hermes v0.22.2:** o gateway compõe o escopo administrado em `build_profile_secret_scope`; o plugin passa a usar a mesma precedência.
- **Compatível com versões anteriores:** se `build_profile_secret_scope` não incluir o escopo administrado, o override explícito do plugin ainda usa a chave administrada. A contrapartida é que, em versões antigas cujo gateway também não leia o escopo administrado, o gateway pode continuar recusando a chave; nesse caso, a arquitetura antiga não oferece o mesmo caminho oficial e a validação deve ser feita na versão em uso.
- **YAML:** a chave não é lida de `config.yaml`; o Relatório 47 confirma que a chave do perfil padrão está no ambiente do processo. Para `/p/<perfil>`, a fonte oficial é o escopo de segredo do perfil, não o YAML. Uma solução baseada apenas no YAML exigiria mudança no core do Hermes, fora do escopo e proibida nesta fase.
- **Chave compartilhada:** por decisão de arquitetura, a mesma chave passa a valer para todos os perfis. O comprometimento de um perfil expõe a API do gateway como um todo; é o trade-off documentado no Relatório 47. As demais credenciais e os dados continuam isolados por perfil.
- **Validação real pendente:** os testes locais cobrem a resolução da chave, não a leitura do arquivo administrado pelo gateway real nem a resposta 200 de `/p/<perfil>/api/sessions` na VPS.

## 9. Preservação

- A tag `treg-pwa-v1.8.0b1-estavel-quarta-atualizacao` continua apontando para `9b34073c94f61a78b427b518cd587909cf80884b`.
- A Release da Fase 1 não foi alterada.
- A `main` não foi alterada e não houve merge.
- O `plugin.yaml` continua em `1.8.0b1`.
- O core do Hermes, o `hermes-pwa`, a VPS, os dados e as credenciais não foram alterados.
- Nenhuma nova tag ou Release foi publicada.

## 10. Conclusão

O código da Fase 3 faz o TREG PWA resolver a `API_SERVER_KEY` com a mesma precedência do Hermes, incluindo o escopo administrado que vale para todos os perfis, sem criar ou substituir a chave. A implementação está publicada na branch `fix/treg-pwa-autenticacao-multiperfil-fase-3`, no commit `43f0441d8e48f67711d26ed61b98c1d293ff2271`.

A conclusão funcional na VPS depende de o operador disponibilizar a chave existente no `.env` administrado. Sem esse passo, o código continua exibindo erro de configuração com retorno ao perfil padrão, em vez de entrar em loop de login; isso é o comportamento correto e não uma falha silenciosa.
