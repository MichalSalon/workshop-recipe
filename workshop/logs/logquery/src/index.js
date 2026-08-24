import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const TOKEN = process.env.LOG_QUERY_TOKEN ?? "";
const ES = (process.env.ELASTICSEARCH_URL ?? "").replace(/\/$/, "");

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function unauthorized(res) {
  json(res, 401, { error: "unauthorized" });
}

function tokenOf(req) {
  const header = req.headers.authorization ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1] ?? new URL(req.url ?? "/", "http://local").searchParams.get("token");
}

async function search(hostname, q, limit) {
  if (!ES) {
    return { hits: [], note: "ELASTICSEARCH_URL unset" };
  }
  const must = [];
  if (hostname) {
    must.push({ term: { "hostname.keyword": hostname } });
  }
  if (q) {
    must.push({ query_string: { query: q } });
  }
  const response = await fetch(`${ES}/_search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      size: limit,
      sort: [{ "@timestamp": { order: "desc" } }],
      query: must.length ? { bool: { must } } : { match_all: {} },
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`elasticsearch ${response.status}: ${text}`);
  }
  const body = await response.json();
  const hits = (body.hits?.hits ?? []).map((hit) => hit._source);
  return { hits };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://local");
  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, { ok: true });
    return;
  }
  if (req.method === "GET" && url.pathname === "/logs") {
    if (!TOKEN || tokenOf(req) !== TOKEN) {
      unauthorized(res);
      return;
    }
    try {
      const payload = await search(
        url.searchParams.get("hostname") ?? "",
        url.searchParams.get("q") ?? "",
        Number(url.searchParams.get("limit") ?? 50),
      );
      json(res, 200, payload);
    } catch (err) {
      json(res, 502, { error: err.message });
    }
    return;
  }
  json(res, 404, { error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`logquery listening on ${HOST}:${PORT}`);
});
