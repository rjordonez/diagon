import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import type { Borrower, IncomingLead } from "@/demo/crm/data/mockData";

// Map Supabase row → Borrower interface
function mapBorrower(row: Record<string, unknown>): Borrower {
  return {
    id: row.id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    coFirstName: (row.co_first_name as string) || undefined,
    coLastName: (row.co_last_name as string) || undefined,
    email: row.email as string,
    phone: (row.phone as string) || "",
    loanAmount: Number(row.loan_amount) || 0,
    loanPurpose: (row.loan_purpose as string) || "",
    propertyAddress: (row.property_address as string) || undefined,
    stage: (row.stage as Borrower["stage"]) || "new-lead",
    leadTemp: (row.lead_temp as Borrower["leadTemp"]) || "warm",
    leadScore: (row.lead_score as number) || 50,
    daysInStage: (row.days_in_stage as number) || 0,
    leadSource: (row.lead_source as string) || "",
    docsRequested: (row.docs_requested as number) || 0,
    docsReceived: (row.docs_received as number) || 0,
    docsVerified: (row.docs_verified as number) || 0,
    aiFlags: (row.ai_flags as number) || 0,
    verificationStatus: (row.verification_status as Borrower["verificationStatus"]) || "pending",
    lastActivity: (row.last_activity as string) || "Just now",
    nextAction: (row.next_action as string) || "Initial outreach",
    assignedLO: (row.assigned_lo as string) || "You",
    notes: (row.notes as string) || "",
    createdAt: row.created_at ? new Date(row.created_at as string).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    speedToLeadEnabled: (row.speed_to_lead_enabled as boolean) || false,
  };
}

// Map Supabase row → IncomingLead interface
function mapIncomingLead(row: Record<string, unknown>): IncomingLead {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) || "",
    state: (row.state as string) || "",
    loanType: (row.loan_type as string) || "",
    loanAmount: Number(row.loan_amount) || 0,
    propertyAddress: (row.property_address as string) || undefined,
    price: Number(row.price) || 0,
    status: (row.status as IncomingLead["status"]) || "new",
    timestamp: row.created_at ? formatTimestamp(row.created_at as string) : "Just now",
    source: (row.source as string) || "",
    trustedFormCert: (row.trusted_form_cert as string) || "",
    leadIdToken: (row.lead_id_token as string) || "",
    dupeCheck: (row.dupe_check as boolean) ?? true,
  };
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today, " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return "Yesterday, " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function useBorrowers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["borrowers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("borrowers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapBorrower);
    },
    enabled: !!user,
  });
}

export function useIncomingLeads() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["incoming_leads", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incoming_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapIncomingLead);
    },
    enabled: !!user,
  });
}

export function useAcceptLead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: IncomingLead) => {
      if (!user) throw new Error("Not authenticated");

      const nameParts = lead.name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Insert borrower
      const { error: borrowerError } = await supabase.from("borrowers").insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: lead.email,
        phone: lead.phone,
        loan_amount: lead.loanAmount,
        loan_purpose: lead.loanType,
        property_address: lead.propertyAddress || null,
        stage: "new-lead",
        lead_temp: "warm",
        lead_score: 50,
        lead_source: lead.source,
      });
      if (borrowerError) throw borrowerError;

      // Update lead status
      const { error: leadError } = await supabase
        .from("incoming_leads")
        .update({ status: "accepted" })
        .eq("id", lead.id);
      if (leadError) throw leadError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowers"] });
      queryClient.invalidateQueries({ queryKey: ["incoming_leads"] });
    },
  });
}

export function useRejectLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from("incoming_leads")
        .update({ status: "rejected" })
        .eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incoming_leads"] });
    },
  });
}

export function useReturnLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from("incoming_leads")
        .update({ status: "returned" })
        .eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incoming_leads"] });
    },
  });
}

// Messages hooks
interface Message {
  id: string;
  borrowerId: string;
  direction: "outbound" | "inbound";
  recipient: string;
  body: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    borrowerId: row.borrower_id as string,
    direction: row.direction as "outbound" | "inbound",
    recipient: row.recipient as string,
    body: row.body as string,
    status: (row.status as string) || "queued",
    sentAt: row.sent_at ? (row.sent_at as string) : null,
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

export function useMessages(borrowerId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["messages", borrowerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("borrower_id", borrowerId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map(mapMessage);
    },
    enabled: !!user && !!borrowerId,
    refetchInterval: 5000, // poll every 5s for new inbound messages
  });
}

export function useSendMessage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { borrowerId: string; recipient: string; body: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("messages").insert({
        user_id: user.id,
        borrower_id: data.borrowerId,
        direction: "outbound",
        recipient: data.recipient,
        body: data.body,
        status: "queued",
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.borrowerId] });
    },
  });
}

export function useAddBorrower() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      loanPurpose: string;
      loanAmount: number;
      leadSource: string;
      notes: string;
      speedToLead: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("borrowers").insert({
        user_id: user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || "",
        loan_amount: data.loanAmount,
        loan_purpose: data.loanPurpose,
        stage: "new-lead",
        lead_temp: "warm",
        lead_score: 50,
        lead_source: data.leadSource,
        notes: data.notes,
        speed_to_lead_enabled: data.speedToLead,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrowers"] });
    },
  });
}
