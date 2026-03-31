import { config } from "dotenv";
config();

const PORT = 3001;

function addVercelHelpers(req: any, res: any, body: string) {
  req.body = JSON.parse(body);
  res.status = (code: number) => {
    res.statusCode = code;
    return {
      json: (data: any) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(data)); },
      end: (data?: string) => res.end(data),
    };
  };
  res.json = (data: any) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(data)); };
}

async function start() {
  const { default: chatHandler } = await import("./chat.js");
  const { default: borrowerChatHandler } = await import("./borrower-chat.js");
  const http = await import("http");

  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

    if (req.method === "POST" && (req.url === "/api/chat" || req.url === "/api/borrower-chat")) {
      let body = "";
      req.on("data", (chunk: string) => { body += chunk; });
      req.on("end", async () => {
        try {
          addVercelHelpers(req, res, body);
          const handler = req.url === "/api/borrower-chat" ? borrowerChatHandler : chatHandler;
          await handler(req as any, res as any);
        } catch (err: any) {
          console.error("API error:", err.message || err);
          if (!res.headersSent) { res.writeHead(500, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: err.message })); }
        }
      });
    } else {
      res.writeHead(404); res.end("Not found");
    }
  });

  server.listen(PORT, () => {
    console.log(`API dev server running on http://localhost:${PORT}`);
    console.log(`  POST /api/chat          (LO AI agent)`);
    console.log(`  POST /api/borrower-chat (Borrower copilot)`);
  });
}

start();
