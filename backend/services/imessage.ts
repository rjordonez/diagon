import { IMessageSDK } from "@photon-ai/imessage-kit";
import { supabase } from "../lib/supabase.js";
import { processDiagonReply } from "./diagon-agent.js";

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

  // Mark all as "sending" first to prevent duplicate picks on next poll
  const ids = (queued || []).map((m) => m.id);
  if (ids.length > 0) {
    await supabase.from("messages").update({ status: "sending" }).in("id", ids);
  }

  for (const msg of queued || []) {
    try {
      let phone = cleanPhone(msg.recipient);

      // If no recipient (e.g. Diagon-generated), look up borrower phone
      if (!phone && msg.borrower_id) {
        const { data: b } = await supabase.from("borrowers").select("phone").eq("id", msg.borrower_id).single();
        if (b?.phone) phone = cleanPhone(b.phone);
      }

      if (!phone) {
        console.error(`✗ No phone for message ${msg.id}`);
        await supabase.from("messages").update({ status: "failed" }).eq("id", msg.id);
        continue;
      }

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

        // Check if borrower has active Diagon sequence
        const { data: bData } = await supabase
          .from("borrowers")
          .select("diagon_sequence")
          .eq("id", borrower.id)
          .single();

        if (bData?.diagon_sequence && !["completed", "opted_out"].includes(bData.diagon_sequence)) {
          processDiagonReply(borrower.id, msg.text || "").catch((err) =>
            console.error("Diagon agent error:", err.message)
          );
        }
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
