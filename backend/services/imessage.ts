import { IMessageSDK } from "@photon-ai/imessage-kit";
import { supabase } from "../lib/supabase.js";

const POLL_INTERVAL = 3000;

const sdk = new IMessageSDK({ debug: false });

function cleanPhone(raw: string): string {
  return raw.replace(/[^\d+]/g, "");
}

export async function processOutboundQueue() {
  const { data: queued, error } = await supabase
    .from("messages")
    .select("*")
    .eq("direction", "outbound")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error polling outbound queue:", error.message);
    return;
  }

  for (const msg of queued || []) {
    try {
      let phone = cleanPhone(msg.recipient);
      if (!phone.startsWith("+")) {
        phone = "+1" + phone.replace(/^1/, "");
      }

      await sdk.send(phone, msg.body);

      await supabase
        .from("messages")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", msg.id);

      console.log(`✓ Sent to ${phone}: "${msg.body.slice(0, 50)}..."`);
    } catch (err: any) {
      console.error(`✗ Failed to send to ${msg.recipient}:`, err.message);

      await supabase
        .from("messages")
        .update({ status: "failed" })
        .eq("id", msg.id);
    }
  }
}

export async function startInboundWatcher() {
  await sdk.startWatching({
    onDirectMessage: async (msg) => {
      if (msg.isFromMe) return;

      const sender = msg.sender;
      const senderClean = cleanPhone(sender);

      const { data: borrowers } = await supabase
        .from("borrowers")
        .select("id, user_id, phone, email");

      const borrower = (borrowers || []).find((b) => {
        if (b.email && b.email === sender) return true;
        if (b.phone && cleanPhone(b.phone) === senderClean) return true;
        const bDigits = cleanPhone(b.phone || "").replace(/^\+?1/, "");
        const sDigits = senderClean.replace(/^\+?1/, "");
        return bDigits.length >= 10 && bDigits === sDigits;
      });

      if (!borrower) {
        console.log(`? Inbound from unknown sender: ${sender}`);
        return;
      }

      // Save inbound message
      const { error } = await supabase.from("messages").insert({
        user_id: borrower.user_id,
        borrower_id: borrower.id,
        direction: "inbound",
        recipient: sender,
        body: msg.text || "[attachment]",
        status: "delivered",
        sent_at: msg.date.toISOString(),
      });

      if (error) {
        console.error("Error saving inbound message:", error.message);
      } else {
        console.log(`← Inbound from ${sender}: "${(msg.text || "").slice(0, 50)}"`);
      }

    },

    onError: (error) => {
      console.error("Watcher error:", error.message);
    },
  });
}

export function startOutboundPoller() {
  setInterval(processOutboundQueue, POLL_INTERVAL);
  processOutboundQueue();
}

export function stopImessage() {
  sdk.stopWatching();
  return sdk.close();
}
