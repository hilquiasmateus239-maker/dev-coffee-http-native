// Dev Coffee API
// Servidor HTTP construído somente com módulos nativos do Node.js.

const http = require("node:http");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT) || 3000;
const VALID_STATUSES = ["pendente", "pronto", "cancelado"];

// Banco de dados em memória. Os dados são perdidos quando o servidor é reiniciado.
const orders = [];
let nextId = 1;

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(data));
}

function sendNoContent(res) {
  // Respostas 204 não devem conter corpo nem Content-Type.
  res.writeHead(204);
  res.end();
}

function sendNotFound(res, message = "Recurso não encontrado.") {
  sendJson(res, 404, { error: message });
}

/**
 * Lê o corpo da requisição por meio dos eventos nativos de stream.
 * O limite evita que um corpo excessivamente grande seja acumulado em memória.
 */
function readRequestBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";
    let receivedBytes = 0;
    let settled = false;

    req.on("data", (chunk) => {
      if (settled) return;

      receivedBytes += chunk.length;
      if (receivedBytes > maxBytes) {
        settled = true;
        reject(Object.assign(new Error("Corpo da requisição excede o limite de 1 MB."), {
          statusCode: 413,
        }));
        req.resume();
        return;
      }

      body += chunk.toString("utf8");
    });

    req.on("end", () => {
      if (settled) return;
      settled = true;

      if (!body.trim()) {
        reject(Object.assign(new Error("O corpo da requisição não pode estar vazio."), {
          statusCode: 400,
        }));
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error("JSON inválido. Verifique a formatação do corpo."), {
          statusCode: 400,
        }));
      }
    });

    req.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(Object.assign(new Error("Falha ao receber o corpo da requisição."), {
        statusCode: 400,
        cause: error,
      }));
    });

    req.on("aborted", () => {
      if (settled) return;
      settled = true;
      reject(Object.assign(new Error("A requisição foi interrompida pelo cliente."), {
        statusCode: 400,
      }));
    });
  });
}

function parseOrderId(rawId) {
  // Aceita somente IDs inteiros positivos.
  if (!/^[1-9]\d*$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) ? id : null;
}

function findOrderIndex(id) {
  return orders.findIndex((order) => order.id === id);
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = requestUrl.pathname;
  const method = req.method;

  // GET /orders[?status=pendente]
  if (method === "GET" && pathname === "/orders") {
    const status = requestUrl.searchParams.get("status");

    if (status !== null && !VALID_STATUSES.includes(status)) {
      return sendJson(res, 400, {
        error: `Status inválido. Use: ${VALID_STATUSES.join(", ")}.`,
      });
    }

    const result = status
      ? orders.filter((order) => order.status === status)
      : orders;

    return sendJson(res, 200, result);
  }

  // POST /orders
  if (method === "POST" && pathname === "/orders") {
    let body;
    try {
      body = await readRequestBody(req);
    } catch (error) {
      return sendJson(res, error.statusCode || 400, { error: error.message });
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      typeof body.client !== "string" ||
      typeof body.item !== "string" ||
      !body.client.trim() ||
      !body.item.trim()
    ) {
      return sendJson(res, 400, {
        error: 'Dados inválidos. Informe "client" e "item" como textos não vazios.',
      });
    }

    const newOrder = {
      id: nextId++,
      client: body.client.trim(),
      item: body.item.trim(),
      status: "pendente",
    };

    orders.push(newOrder);
    res.setHeader("Location", `/orders/${newOrder.id}`);
    return sendJson(res, 201, newOrder);
  }

  // GET /orders/:id
  const orderMatch = pathname.match(/^\/orders\/([^/]+)$/);
  if (method === "GET" && orderMatch) {
    const id = parseOrderId(orderMatch[1]);
    if (id === null) return sendNotFound(res, "ID de pedido inválido.");

    const order = orders.find((item) => item.id === id);
    if (!order) return sendNotFound(res, `Pedido com ID ${id} não encontrado.`);

    return sendJson(res, 200, order);
  }

  // PATCH /orders/:id/status
  const statusMatch = pathname.match(/^\/orders\/([^/]+)\/status$/);
  if (method === "PATCH" && statusMatch) {
    const id = parseOrderId(statusMatch[1]);
    if (id === null) return sendNotFound(res, "ID de pedido inválido.");

    const index = findOrderIndex(id);
    if (index === -1) return sendNotFound(res, `Pedido com ID ${id} não encontrado.`);

    let body;
    try {
      body = await readRequestBody(req);
    } catch (error) {
      return sendJson(res, error.statusCode || 400, { error: error.message });
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      !VALID_STATUSES.includes(body.status)
    ) {
      return sendJson(res, 400, {
        error: `Status inválido. Use: ${VALID_STATUSES.join(", ")}.`,
      });
    }

    orders[index].status = body.status;
    return sendJson(res, 200, orders[index]);
  }

  // DELETE /orders/:id
  if (method === "DELETE" && orderMatch) {
    const id = parseOrderId(orderMatch[1]);
    if (id === null) return sendNotFound(res, "ID de pedido inválido.");

    const index = findOrderIndex(id);
    if (index === -1) return sendNotFound(res, `Pedido com ID ${id} não encontrado.`);

    orders.splice(index, 1);
    return sendNoContent(res);
  }

  // Qualquer método ou rota não prevista retorna 404, conforme o enunciado.
  return sendNotFound(res, `Rota não encontrada: ${method} ${pathname}`);
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    // Evita que uma falha inesperada encerre o processo do servidor.
    console.error("Erro inesperado ao processar requisição:", error);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "Erro interno do servidor." });
    } else {
      res.end();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Dev Coffee API disponível em http://localhost:${PORT}`);
});

server.on("error", (error) => {
  console.error("Não foi possível iniciar o servidor:", error.message);
  process.exitCode = 1;
});
