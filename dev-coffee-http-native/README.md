# Dev Coffee API

API RESTful para gerenciamento de pedidos da cafeteria Dev Coffee, desenvolvida em Node.js utilizando exclusivamente módulos nativos, conforme a atividade prática AP2.

**Autor:** Hilquias Mateus Vasconcelos Venancio

## 1. Requisitos

- Node.js instalado (versão 18 ou superior recomendada).
- Visual Studio Code (opcional, mas recomendado).
- Postman, Thunder Client ou cURL para testar as rotas.

Não é necessário executar `npm install`: o projeto não possui dependências externas.

## 2. Como executar no VS Code

1. Extraia a pasta `dev-coffee-http-native`.
2. Abra o VS Code e selecione **File > Open Folder** (Arquivo > Abrir Pasta).
3. Abra o terminal integrado em **Terminal > New Terminal**.
4. Execute:

```bash
npm start
```

Também é possível iniciar diretamente com:

```bash
node server.js
```

Quando aparecer a mensagem `Dev Coffee API disponível em http://localhost:3000`, o servidor estará funcionando.

Para encerrar, pressione `Ctrl + C` no terminal.

Se a porta 3000 estiver ocupada, defina outra porta antes de iniciar:

**Windows PowerShell**
```powershell
$env:PORT=3001
npm start
```

**Linux/macOS**
```bash
PORT=3001 npm start
```

## 3. Modelo de pedido

Cada pedido possui o seguinte formato:

```json
{
  "id": 1,
  "client": "Nome do Cliente",
  "item": "Nome do Café/Produto",
  "status": "pendente"
}
```

Os status aceitos são exclusivamente:

- `pendente`
- `pronto`
- `cancelado`

Os pedidos ficam armazenados em memória. Portanto, são apagados quando o servidor é encerrado ou reiniciado.

## 4. Endpoints disponíveis

| Método | Endpoint | Sucesso | Finalidade |
|---|---|---:|---|
| GET | `/orders` | 200 | Lista todos os pedidos |
| GET | `/orders?status=pendente` | 200 | Filtra pedidos por status |
| GET | `/orders/:id` | 200 | Consulta um pedido pelo ID |
| POST | `/orders` | 201 | Cadastra um pedido |
| PATCH | `/orders/:id/status` | 200 | Atualiza somente o status |
| DELETE | `/orders/:id` | 204 | Exclui um pedido |

Erros previstos: `400 Bad Request`, `404 Not Found` e, para corpo acima de 1 MB, `413 Payload Too Large`.

## 5. Exemplos de requisições

A URL-base dos exemplos é `http://localhost:3000`.

### 5.1. Criar pedido — POST /orders

**Requisição**

```http
POST http://localhost:3000/orders
Content-Type: application/json
```

Corpo JSON:

```json
{
  "client": "Maria Silva",
  "item": "Cappuccino"
}
```

**Resposta esperada — 201 Created**

```json
{
  "id": 1,
  "client": "Maria Silva",
  "item": "Cappuccino",
  "status": "pendente"
}
```

O ID é gerado automaticamente em sequência e o status inicial é sempre `pendente`.

### 5.2. Listar pedidos — GET /orders

```http
GET http://localhost:3000/orders
```

Retorna uma lista JSON com todos os pedidos cadastrados. Se ainda não houver pedidos, retorna `[]`.

### 5.3. Filtrar por status — GET /orders?status=pendente

```http
GET http://localhost:3000/orders?status=pendente
```

Retorna somente os pedidos que possuem o status informado. Os valores aceitos são `pendente`, `pronto` e `cancelado`.

### 5.4. Consultar pedido — GET /orders/:id

Exemplo:

```http
GET http://localhost:3000/orders/1
```

Retorna o pedido de ID 1. Se o ID não existir, retorna `404 Not Found`.

### 5.5. Atualizar status — PATCH /orders/:id/status

**Requisição**

```http
PATCH http://localhost:3000/orders/1/status
Content-Type: application/json
```

Corpo JSON:

```json
{
  "status": "pronto"
}
```

**Resposta esperada — 200 OK**

```json
{
  "id": 1,
  "client": "Maria Silva",
  "item": "Cappuccino",
  "status": "pronto"
}
```

O endpoint altera somente o status do pedido. Um status diferente dos três valores permitidos retorna `400 Bad Request`.

### 5.6. Excluir pedido — DELETE /orders/:id

```http
DELETE http://localhost:3000/orders/1
```

Quando a exclusão é realizada, retorna `204 No Content`, sem corpo de resposta. Se o pedido não existir, retorna `404 Not Found`.

## 6. Testes rápidos com cURL

Com o servidor em execução, abra outro terminal.

**Criar pedido**
```bash
curl -i -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{\"client\":\"Maria Silva\",\"item\":\"Cappuccino\"}"
```

**Listar**
```bash
curl -i http://localhost:3000/orders
```

**Filtrar**
```bash
curl -i "http://localhost:3000/orders?status=pendente"
```

**Consultar ID 1**
```bash
curl -i http://localhost:3000/orders/1
```

**Atualizar status**
```bash
curl -i -X PATCH http://localhost:3000/orders/1/status \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"pronto\"}"
```

**Excluir ID 1**
```bash
curl -i -X DELETE http://localhost:3000/orders/1
```

## 7. Exemplos de erros para validar

- Enviar POST sem `client` ou `item`: `400 Bad Request`.
- Enviar POST com JSON malformado: `400 Bad Request`.
- Enviar PATCH com status fora da lista permitida: `400 Bad Request`.
- Consultar, atualizar ou excluir um ID inexistente: `404 Not Found`.
- Acessar uma rota ou método não previsto: `404 Not Found`.

As respostas com corpo utilizam o cabeçalho:

```http
Content-Type: application/json; charset=utf-8
```

A resposta `204 No Content` é enviada sem corpo.

## 8. Estrutura do projeto

```text
dev-coffee-http-native/
├── server.js
├── package.json
├── README.md
└── .gitignore
```

## 9. Tecnologias e requisitos atendidos

- Node.js e módulo nativo `http`.
- Módulo nativo `url` (classe `URL`).
- Armazenamento em memória, sem banco de dados.
- Leitura do corpo com `req.on('data')` e `req.on('end')`.
- Desserialização com `JSON.parse` protegida por `try/catch`.
- Validação dos campos e dos status permitidos.
- Respostas HTTP com códigos e cabeçalhos apropriados.
- Nenhuma dependência externa ou instalação via npm.

## 10. Publicação no GitHub

Crie no GitHub um repositório com o nome exato:

`dev-coffee-http-native`

Depois, no terminal do VS Code, dentro da pasta do projeto, execute:

```bash
git init
git add .
git commit -m "Implementa Dev Coffee API com HTTP nativo"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/dev-coffee-http-native.git
git push -u origin main
```

Substitua `SEU-USUARIO` pelo seu usuário do GitHub. Se o Git solicitar autenticação, siga o procedimento de login indicado pelo próprio GitHub.

Por fim, abra o repositório publicado e copie a URL para o campo de entrega do portal educacional.
