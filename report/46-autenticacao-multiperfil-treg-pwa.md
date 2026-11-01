# 46 — Autenticação e troca de perfis do TREG PWA

**Data:** 2026-11-01<br>
**Fase:** Fase 2 — correção de autenticação e autorização por perfil<br>
**Repositório:** `Nifm1584/plugin-v1-pwa`<br>
**Branch de implementação:** `fix/treg-pwa-autenticacao-multiperfil`<br>
**Commit-base congelado:** `9b34073c94f61a78b427b518cd587909cf80884b`<br>
**Primeiro commit da correção:** `71038be055bff1a496bb5851004ef95fc992d5f5`<br>
**SHA final:** `a24cab2cf2a763c00ed2883eb2eb30741c0329c4`

## 1. Branch e commit-base

A branch `fix/treg-pwa-autenticacao-multiperfil` foi criada a partir do commit congelado `9b34073c94f61a78b427b518cd587909cf80884b`, que é exatamente o commit apontado pela tag `treg-pwa-v1.8.0b1-estavel-quarta-atualizacao`.

- Tag verificada: `treg-pwa-v1.8.0b1-estavel-quarta-atualizacao`
- Tag object: `674947608c20ba5a792ecf61a0817c742ef2aafd`
- Commit da tag: `9b34073c94f61a78b427b518cd587909cf80884b`
- `plugin.yaml` no commit-base: `1.8.0b1` (não alterado)
- A branch de implementação não foi mesclada na `main` e não alterou a tag ou a Release congelada.

## 2. SHAs inicial e final

| Momento | SHA |
|---|---|
| Base congelada | `9b34073c94f61a78b427b518cd587909cf80884b` |
| Primeiro commit da correção | `71038be055bff1a496bb5851004ef95fc992d5f5` |
| Commit final | `a24cab2cf2a763c00ed2883eb2eb30741c0329c4` |

O commit `a24cab2` acrescenta o desligamento da execução ativa ao trocar de perfil e o teste correspondente. O commit `71038be` contém a implementação principal.

## 3. Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `dashboard/plugin_api.py` | Resolução da `API_SERVER_KEY` por perfil, tradução dos erros do gateway e códigos de erro estruturados |
| `dashboard/pwa/hermes-api.js` | Preservação do código de erro do backend e classificação de 401/403/5xx/rede |
| `dashboard/pwa/app.js` | Separação entre sessão expirada e erro de API do perfil; retorno ao perfil padrão; desligamento da execução ativa na troca |
| `dashboard/pwa/index.html` | Botão “Voltar ao perfil padrão” na tela de login |
| `dashboard/pwa/app.css` | Estilo do botão de retorno no login |
| `tests/hermes-api.test.js` | Testes de classificação de erros HTTP e SSE |
| `tests/test_plugin_api.py` | Testes de chave por perfil, perfil sem chave e tradução de 401/403/5xx |
| `tests/ui-contract.test.js` | Contrato do botão de retorno, helpers de erro e desligamento da execução |

Nenhum arquivo de configuração, segredo, banco, VPS ou do plugin `hermes-pwa` foi alterado.

## 4. Correções implementadas

### 4.1 Autorização da API por perfil

O backend passou a resolver a chave do **próprio perfil** para cada requisição encaminhada ao gateway:

- perfil padrão: mantém o comportamento anterior — `API_SERVER_KEY` do ambiente ou do `.env` principal;
- perfil secundário: lê `API_SERVER_KEY` do `.env` do perfil (`<profile_home>/.env`);
- se a chave não estiver no `.env`, usa a resolução oficial `agent.secret_scope.build_profile_secret_scope(home)`, que também considera fontes externas de segredo e o escopo gerenciado;
- não há fallback para a chave do perfil padrão nem para `os.environ` do processo. Isso preserva o isolamento entre perfis.

Todas as chamadas de proxy passaram a receber o perfil: sessões, mensagens, criação/edição/exclusão, execuções, eventos SSE, aprovação, parada e capabilities.

Se a chave do perfil não existir, o backend responde `503` com o código `profile_api_key_missing` e uma mensagem clara. Se o gateway recusar a chave, responde `503` com `profile_api_auth_failed`; se o acesso for proibido, `403` com `profile_forbidden`. Nenhum desses casos devolve `401` ao navegador.

### 4.2 Tratamento distinto de erros

O cliente agora diferencia:

| Situação | Código/status | Comportamento |
|---|---|---|
| Sessão oficial expirada ou credenciais inválidas | `session_expired` / 401 | Mostra a tela de login oficial |
| `API_SERVER_KEY` ausente no perfil | `profile_api_key_missing` / 503 | Mostra erro de configuração e ação de retorno; **não** pede login |
| Chave do perfil recusada pelo gateway | `profile_api_auth_failed` / 503 | Mostra erro de configuração e ação de retorno; **não** pede login |
| Acesso proibido | `forbidden` ou `profile_forbidden` / 403 | Mostra mensagem de acesso proibido; **não** pede login |
| Erro de conexão | `network` / 0 | Mostra falha de conexão |
| Tempo esgotado | `timeout` / 0 | Mostra falha de conexão |
| Falha interna do gateway | `gateway_unavailable` / 502 | Mostra falha do servidor |
| Perfil inexistente no gateway | `profile_not_found` / 404 | Mostra erro do perfil e ação de retorno |

O login oficial continua sendo o único mecanismo de autenticação do usuário. A tela de login permanece no PWA e continua enviando as credenciais para `/auth/password-login` com `provider: "basic"`. Não foi criado usuário, senha, banco de usuários, sessão paralela ou autenticação própria do PWA.

### 4.3 Retorno ao perfil padrão

Foram adicionados dois caminhos de retorno:

- botão **“Voltar ao perfil padrão”** na tela de login, visível quando o perfil selecionado não é o padrão;
- botão **“Voltar ao perfil padrão”** na mensagem de erro da lista ou da conversa quando o erro é de API do perfil.

O retorno:

1. seleciona o perfil `default`;
2. atualiza `localStorage` (`treg-pwa-profile`);
3. limpa busca, sessões, mensagens e erros;
4. desliga a execução ativa do perfil anterior para que ela não continue atualizando a interface;
5. recarrega perfis, capabilities e conversas do perfil padrão.

A troca de perfil continua exigindo a sessão oficial e a autorização da API do perfil. Não foi criado acesso direto às conversas de outro perfil.

## 5. Preservação da autenticação oficial

- A tela de login do PWA continua sendo a interface das credenciais oficiais do Hermes.
- O endpoint usado continua sendo o login oficial do dashboard (`/auth/password-login`).
- O cookie de sessão do dashboard continua sendo a única sessão de usuário.
- A `API_SERVER_KEY` é usada apenas entre o backend do plugin e o API server do gateway; ela não é enviada ao navegador, não é exibida em erros e não é gravada no código.
- Nenhuma senha, chave ou segredo foi incluído nos relatórios, commits ou logs.
- O plugin independente `hermes-pwa`, sua rota `/pwa` e o core do Hermes não foram alterados.

## 6. Autorização da API por perfil: pendência externa

A correção de código está implementada, mas o acesso real a um perfil secundário **ainda depende de configuração externa**. O gateway multiplexado autentica `/p/<perfil>/` com a `API_SERVER_KEY` do próprio perfil; se ela não existir, o gateway responde 401 e o PWA agora mostra erro de configuração em vez de login.

Procedimento necessário, **não executado nesta fase**:

1. Localizar o home do perfil secundário, por exemplo `~/.hermes/profiles/<perfil>/` (o caminho exato depende da instalação).
2. Gerar uma chave forte e exclusiva para o perfil, por exemplo com `openssl rand -hex 32`. Não usar a senha do usuário e não reutilizar a chave de outro perfil sem decisão explícita.
3. Adicionar ao `.env` do perfil:
   ```dotenv
   API_SERVER_KEY=<chave-forte-do-perfil>
   ```
4. Garantir que o gateway esteja servindo o perfil (`gateway.multiplex_profiles` e perfil presente na lista servida).
5. Reiniciar o gateway se a nova chave não passar a valer: `hermes gateway restart`.
6. Testar novamente a troca para o perfil e o carregamento das conversas.

A chave deve ter pelo menos 16 caracteres utilizáveis, conforme a validação do gateway. Não foi gerada, copiada ou gravada nenhuma chave nesta fase. Nenhum `.env` ou configuração da VPS foi alterado.

## 7. Funcionamento do retorno ao perfil padrão

O fluxo implementado é:

1. o usuário está em um perfil secundário;
2. ocorre uma falha de sessão oficial **ou** o usuário chega à tela de login;
3. o botão “Voltar ao perfil padrão” aparece quando o perfil não é `default`;
4. ao tocar, o PWA volta ao perfil `default` sem exigir nova autenticação;
5. as conversas do perfil padrão são carregadas;
6. se a sessão oficial também estiver expirada, o login oficial é solicitado novamente, agora no perfil padrão.

Quando o erro é de configuração da API do perfil, a tela de login **não** é aberta; a lista ou a conversa mostra a mensagem e o botão de retorno.

## 8. Testes executados e resultados

| Teste | Comando/forma | Resultado |
|---|---|---|
| Sintaxe JavaScript | `node --check` em `app.js`, `hermes-api.js`, `ui-utils.js`, `sw.js`, `dist/index.js`, `dist/qrcode.js` | **PASS** |
| API layer | `node tests/hermes-api.test.js` | **PASS** — paginação, busca, criação, pin, stop, SSE, capabilities e classificação de erros |
| Contrato de UI | `node tests/ui-contract.test.js` | **PASS** |
| Utilitários de UI | `node tests/ui-utils.test.js` | **PASS** |
| Service worker | `node tests/sw-cache-isolation.test.js` | **PASS** — cache v6 e isolamento preservados |
| Testes Python do plugin | runner local chamando as funções de `tests/test_plugin.py` | **PASS** — 2 testes |
| Testes Python da API | runner local chamando as funções de `tests/test_plugin_api.py` | **PASS** — 10 testes |
| Compilação Python | `python -m py_compile dashboard/plugin_api.py` | **PASS** |

Os testes novos cobrem:

- leitura da `API_SERVER_KEY` do `.env` do perfil;
- perfil sem chave retornando `profile_api_key_missing`;
- 401 do gateway virando `profile_api_auth_failed` em vez de erro de sessão;
- 401 do perfil padrão virando `api_key_invalid`;
- 403 virando `profile_forbidden`/`forbidden`;
- 5xx virando `gateway_unavailable`;
- classificação de 401/403/5xx no cliente e no SSE;
- preservação do contrato do botão de retorno e do desligamento da execução ativa.

## 9. Testes não executados e motivos

- **Teste de QR code (`tests/qrcode.test.js`):** não executado porque a dependência `jsqr` não estava instalada no clone local e a instalação via npm não ficou disponível neste ambiente.
- **`pytest`:** não estava instalado no Python disponível. As mesmas funções de teste foram executadas por um runner local que importa os módulos e chama cada `test_*`.
- **CI do GitHub Actions:** o workflow `TREG PWA validation` só é disparado em pushes para branches específicas (`fix/treg-pwa-c3-publicacao-segura` e `fix/treg-pwa-c7-qrcode-fix`) ou em pull requests para `main`. A branch desta fase não dispara o workflow; não foi criado PR.
- **Teste real no Hermes/VPS:** não executado. Não havia acesso à VPS neste ambiente e a chave do perfil secundário depende da configuração externa descrita na seção 6.
- **Teste manual no celular/computador:** não executado nesta fase; a validação existente é a da versão congelada.

## 10. Pendências de configuração externa

1. Adicionar `API_SERVER_KEY` ao `.env` de cada perfil secundário que será usado, com chave forte e exclusiva.
2. Confirmar que o gateway multiplexado está servindo esses perfis.
3. Reiniciar o gateway se necessário.
4. Validar a troca de perfil no Hermes real, no celular e no computador.
5. Se o gateway continuar respondendo 401, conferir os logs do gateway para a mensagem `no profile-scoped API_SERVER_KEY is configured` e revisar o `.env` do perfil.

O relatório 44, citado no prompt como origem do diagnóstico, não foi localizado em nenhuma branch, tag ou Release do repositório. O diagnóstico desta fase foi feito diretamente no código do plugin e no código oficial do Hermes (`agent/secret_scope.py` e `gateway/platforms/api_server.py`). Por isso, este relatório é o **46**, sequencial ao 45.

## 11. Evidências de isolamento dos perfis

- Todas as chamadas ao gateway continuam usando o prefixo `/p/<perfil>` e o parâmetro `profile`.
- A chave usada para um perfil secundário é lida do próprio perfil; não há fallback para a chave do perfil padrão.
- A troca de perfil limpa sessões, busca, mensagens e erros antes de carregar o novo perfil.
- A execução ativa é desligada da interface ao trocar de perfil, evitando que eventos do perfil anterior atualizem a conversa do novo perfil.
- Os testes da camada de API verificam que o `profile` continua presente nas URLs de sessões, mensagens, runs e SSE.
- Não foi alterado o armazenamento de sessões, o service worker, o cache, o upload ou as rotas de mídia.

## 12. Versão congelada intacta

- A tag `treg-pwa-v1.8.0b1-estavel-quarta-atualizacao` continua apontando para `9b34073c94f61a78b427b518cd587909cf80884b`.
- A Release `TREG PWA 1.8.0b1 — Quarta atualização validada (estável)` não foi alterada.
- O `plugin.yaml` continua em `1.8.0b1`; não houve atualização de versão.
- A `main` não foi alterada e não houve merge.
- O `hermes-pwa`, o core do Hermes, a VPS, os dados e as credenciais não foram alterados.
- Nenhuma nova tag ou Release foi publicada nesta fase.
