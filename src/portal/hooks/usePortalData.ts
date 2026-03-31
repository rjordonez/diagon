import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

// ── Types ──

export interface BorrowerApplication {
  id: string;
  uploadLinkId: string;
  loName: string;
  templateName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormResponse {
  questionId: string;
  value: string;
}

// ── Applications ──

export function useMyApplications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_applications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("borrower_applications")
        .select("*, upload_links(token, template_id, document_templates(name))")
        .eq("borrower_user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any): BorrowerApplication => ({
        id: row.id,
        uploadLinkId: row.upload_link_id,
        loName: "Your Loan Officer",
        templateName: row.upload_links?.document_templates?.name || "Application",
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    enabled: !!user,
  });
}

export function useApplication(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["application", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("borrower_applications")
        .select("*, upload_links(id, token, template_id, borrower_id, document_templates(name))")
        .eq("id", id!)
        .eq("borrower_user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });
}

// ── Questions for a template ──

export function useApplicationQuestions(templateId: string | undefined) {
  return useQuery({
    queryKey: ["app_questions", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_questions")
        .select("*")
        .eq("template_id", templateId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        label: row.label,
        fieldType: row.field_type as string,
        options: row.options as string[] | null,
        required: row.required as boolean,
        sortOrder: row.sort_order as number,
        condition: row.condition as { question_id: string; operator: string; value: string } | null,
      }));
    },
    enabled: !!templateId,
  });
}

// ── Form Responses ──

export function useFormResponses(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["form_responses", applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_responses")
        .select("question_id, value")
        .eq("application_id", applicationId!);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data || []) map[row.question_id] = row.value || "";
      return map;
    },
    enabled: !!applicationId,
  });
}

export function useSaveFormResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { applicationId: string; questionId: string; value: string }) => {
      const { error } = await supabase.from("form_responses").upsert(
        { application_id: data.applicationId, question_id: data.questionId, value: data.value, updated_at: new Date().toISOString() },
        { onConflict: "application_id,question_id" }
      );
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["form_responses", variables.applicationId] });
    },
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from("borrower_applications")
        .update({ status: "submitted", updated_at: new Date().toISOString() })
        .eq("id", applicationId);
      if (error) throw error;
    },
    onSuccess: (_data, applicationId) => {
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["my_applications"] });
    },
  });
}

// ── Claim Invite ──

export function useClaimInvite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      if (!user) throw new Error("Not authenticated");

      // Get the upload link
      const { data: link, error: lErr } = await supabase
        .from("upload_links")
        .select("id, user_id, borrower_id, template_id")
        .eq("token", token)
        .single();
      if (lErr || !link) throw new Error("Invalid or expired invite link");

      // Claim the link
      await supabase
        .from("upload_links")
        .update({ borrower_user_id: user.id })
        .eq("id", link.id);

      // Check if application already exists
      const { data: existing } = await supabase
        .from("borrower_applications")
        .select("id")
        .eq("upload_link_id", link.id)
        .eq("borrower_user_id", user.id)
        .maybeSingle();

      if (existing) return existing.id;

      // Create application
      const { data: app, error: aErr } = await supabase
        .from("borrower_applications")
        .insert({
          borrower_user_id: user.id,
          upload_link_id: link.id,
          lo_user_id: link.user_id,
        })
        .select()
        .single();
      if (aErr) throw aErr;

      return app.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_applications"] });
    },
  });
}
