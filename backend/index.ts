import "dotenv/config";
import { supabaseUrl } from "./lib/supabase.js";
import { startInboundWatcher, startOutboundPoller, stopImessage } from "./services/imessage.js";

async function main() {
  console.log("Diagon iMessage Bridge");
  console.log("──────────────────────");
  console.log(`Supabase: ${supabaseUrl}`);
  console.log(`Polling every 3s for outbound messages`);
  console.log(`Watching iMessage for inbound replies`);
  console.log("");

  await startInboundWatcher();
  startOutboundPoller();

  console.log("iMessage bridge running. Press Ctrl+C to stop.\n");
}

process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  await stopImessage();
  process.exit(0);
});

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
