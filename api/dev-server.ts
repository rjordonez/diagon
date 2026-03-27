import { config } from "dotenv";
config();

const PORT = 3001;

async function start() {
  const { default: handler } = await import("./chat.js");
  const http = await import("http");

  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === "POST" && req.url === "/api/chat") {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", async () => {
        try {
          // Add Vercel-like helpers to req/res
          const vercelReq = req as any;
          vercelReq.body = JSON.parse(body);

          const vercelRes = res as any;
          vercelRes.status = (code: number) => {
            res.statusCode = code;
            return {
              json: (data: any) => {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(data));
              },
              end: (data?: string) => res.end(data),
            };
          };
          vercelRes.json = (data: any) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          };

          await handler(vercelReq, vercelRes);
        } catch (err: any) {
          console.error("API error:", err.message || err);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
          }
        }
      });
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  server.listen(PORT, () => {
    console.log(`API dev server running on http://localhost:${PORT}/api/chat`);
  });
}

start();
