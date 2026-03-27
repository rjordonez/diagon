import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { UIMessage } from "ai";

// ── Types ──

export interface AIConversation {
  id: string;
  userId: string;
  borrowerId: string | null;
  borrowerName?: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoreMessage {
  id: string;
  borrowerId: string;
  borrowerName: string;
  direction: "outbound" | "inbound";
  recipient: string;
  body: string;
  status: string;
  createdAt: string;
}

export interface Document {
  id: string;
  borrowerId: string | null;
  borrowerName: string;
  fileName: string;
  fileType: string | null;
  fileUrl: string;
  category: string | null;
  aiSummary: string | null;
  status: string;
  createdAt: string;
}

// ── Conversations ──

export function useAIConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ai_conversations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("*, borrowers(first_name, last_name)")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any): AIConversation => ({
        id: row.id,
        userId: row.user_id,
        borrowerId: row.borrower_id,
        borrowerName: row.borrowers
          ? `${row.borrowers.first_name} ${row.borrowers.last_name}`
          : undefined,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    enabled: !!user,
  });
}

export function useCreateAIConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (borrowerId: string | null) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: user.id,
          borrower_id: borrowerId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai_conversations"] });
    },
  });
}

// ── Load conversation messages for initialMessages ──

export function useConversationMessages(conversationId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversation_messages", conversationId],
    queryFn: async (): Promise<UIMessage[]> => {
      const { data, error } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .in("role", ["user", "assistant"])
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((row: any): UIMessage => ({
        id: row.id,
        role: row.role,
        parts: [{ type: "text", text: row.content }],
      }));
    },
    enabled: !!user && !!conversationId,
  });
}

// ── Auth token helper ──

export async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

// ── Store: All Messages ──

export function useAllMessages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["store_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, borrowers(first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []).map((row: any): StoreMessage => ({
        id: row.id,
        borrowerId: row.borrower_id,
        borrowerName: row.borrowers
          ? `${row.borrowers.first_name} ${row.borrowers.last_name}`
          : "Unknown",
        direction: row.direction,
        recipient: row.recipient,
        body: row.body,
        status: row.status,
        createdAt: row.created_at,
      }));
    },
    enabled: !!user,
    refetchInterval: 10000,
  });
}

// ── Store: All Documents ──

export function useDocuments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["store_documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, borrowers(first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []).map((row: any): Document => ({
        id: row.id,
        borrowerId: row.borrower_id,
        borrowerName: row.borrowers
          ? `${row.borrowers.first_name} ${row.borrowers.last_name}`
          : "Unknown",
        fileName: row.file_name,
        fileType: row.file_type,
        fileUrl: row.file_url,
        category: row.category,
        aiSummary: row.ai_summary,
        status: row.status,
        createdAt: row.created_at,
      }));
    },
    enabled: !!user,
  });
}
