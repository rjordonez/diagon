import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

// ── Types ──

export interface DocTemplate {
  id: string;
  name: string;
  borrowerType: string | null;
  description: string | null;
  isDefault: boolean;
  isAddon: boolean;
  itemCount: number;
  createdAt: string;
}

export interface TemplateItem {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  required: boolean;
  sortOrder: number;
  section: string | null;
  itemType: string;
  fieldType: string | null;
  itemKey: string | null;
  conditionKey: string | null;
}

export interface UploadLink {
  id: string;
  token: string;
  borrowerId: string;
  templateId: string;
  templateName: string;
  expiresAt: string;
  createdAt: string;
}

export interface UploadItem {
  id: string;
  uploadLinkId: string;
  templateItemId: string;
  templateItemName: string;
  templateItemDescription: string | null;
  required: boolean;
  section: string | null;
  itemType: string;
  inputType: string;
  documentId: string | null;
  status: string;
  fileName: string | null;
  fileUrl: string | null;
}

// ── Templates ──

export function useTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_templates")
        .select("*, template_items(id)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any): DocTemplate => ({
        id: row.id,
        name: row.name,
        borrowerType: row.borrower_type,
        description: row.description,
        isDefault: row.is_default || false,
        isAddon: row.is_addon || false,
        itemCount: row.template_items?.length || 0,
        createdAt: row.created_at,
      }));
    },
    enabled: !!user,
  });
}

export function useTemplateItems(templateId: string | null) {
  return useQuery({
    queryKey: ["template_items", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_items")
        .select("*")
        .eq("template_id", templateId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((row: any): TemplateItem => ({
        id: row.id,
        templateId: row.template_id,
        name: row.name,
        description: row.description,
        required: row.required,
        sortOrder: row.sort_order,
        section: row.section || null,
        itemType: row.item_type || "document",
        fieldType: row.field_type || null,
        itemKey: row.item_key || null,
        conditionKey: row.condition_key || null,
      }));
    },
    enabled: !!templateId,
  });
}

// ── Template Questions ──

export interface TemplateQuestion {
  id: string;
  templateId: string;
  label: string;
  fieldType: string;
  options: string[] | null;
  required: boolean;
  sortOrder: number;
  condition: { question_id: string; operator: string; value: string } | null;
}

export function useTemplateQuestions(templateId: string | null) {
  return useQuery({
    queryKey: ["template_questions", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_questions")
        .select("*")
        .eq("template_id", templateId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((row: any): TemplateQuestion => ({
        id: row.id,
        templateId: row.template_id,
        label: row.label,
        fieldType: row.field_type,
        options: row.options,
        required: row.required,
        sortOrder: row.sort_order,
        condition: row.condition,
      }));
    },
    enabled: !!templateId,
  });
}

export function useCreateTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      borrowerType: string;
      description: string;
      items: { name: string; description: string; required: boolean }[];
      questions: { label: string; fieldType: string; options: string[]; required: boolean; condition: any }[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: template, error: tErr } = await supabase
        .from("document_templates")
        .insert({ user_id: user.id, name: data.name, borrower_type: data.borrowerType, description: data.description })
        .select()
        .single();
      if (tErr) throw tErr;

      if (data.items.length > 0) {
        const items = data.items.map((item, i) => ({
          template_id: template.id,
          name: item.name,
          description: item.description || null,
          required: item.required,
          sort_order: i,
        }));
        const { error: iErr } = await supabase.from("template_items").insert(items);
        if (iErr) throw iErr;
      }

      const validQuestions = (data.questions || []).filter((q) => q.label.trim());
      if (validQuestions.length > 0) {
        const questions = validQuestions.map((q, i) => ({
          template_id: template.id,
          label: q.label,
          field_type: q.fieldType,
          options: q.options.length > 0 ? q.options : null,
          required: q.required,
          sort_order: i,
          condition: q.condition || null,
        }));
        const { error: qErr } = await supabase.from("template_questions").insert(questions);
        if (qErr) throw qErr;
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.from("document_templates").delete().eq("id", templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

// ── Upload Links ──

export function useUploadLink(borrowerId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["upload_link", borrowerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upload_links")
        .select("*, document_templates(name)")
        .eq("borrower_id", borrowerId!)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        token: data.token,
        borrowerId: data.borrower_id,
        templateId: data.template_id,
        templateName: (data as any).document_templates?.name || "",
        expiresAt: data.expires_at,
        createdAt: data.created_at,
      } as UploadLink;
    },
    enabled: !!user && !!borrowerId,
  });
}

export function useCreateUploadLink() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { borrowerId: string; templateId: string; addonTemplateId?: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Create the upload link
      const { data: link, error: lErr } = await supabase
        .from("upload_links")
        .insert({ user_id: user.id, borrower_id: data.borrowerId, template_id: data.templateId })
        .select()
        .single();
      if (lErr) throw lErr;

      // Get base template items
      const { data: baseItems } = await supabase.from("template_items").select("id").eq("template_id", data.templateId);

      // Get addon template items if selected
      let addonItems: any[] = [];
      if (data.addonTemplateId) {
        const { data: addons } = await supabase.from("template_items").select("id").eq("template_id", data.addonTemplateId);
        addonItems = addons || [];
      }

      const allItems = [...(baseItems || []), ...addonItems];

      if (allItems.length > 0) {
        const uploadItems = allItems.map((item: any) => ({
          upload_link_id: link.id,
          template_item_id: item.id,
        }));
        await supabase.from("upload_items").insert(uploadItems);
      }

      // Update borrower docs_requested count
      await supabase
        .from("borrowers")
        .update({ docs_requested: allItems.length })
        .eq("id", data.borrowerId);

      return link;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["upload_link", variables.borrowerId] });
      queryClient.invalidateQueries({ queryKey: ["upload_items"] });
      queryClient.invalidateQueries({ queryKey: ["borrowers"] });
    },
  });
}

// ── Upload Items (for LO view) ──

export function useUploadItems(uploadLinkId: string | null | undefined) {
  return useQuery({
    queryKey: ["upload_items", uploadLinkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upload_items")
        .select("*, template_items(name, description, required, section, item_type, input_type), documents(file_name, file_url)")
        .eq("upload_link_id", uploadLinkId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((row: any): UploadItem => ({
        id: row.id,
        uploadLinkId: row.upload_link_id,
        templateItemId: row.template_item_id,
        templateItemName: row.template_items?.name || "",
        templateItemDescription: row.template_items?.description || null,
        required: row.template_items?.required ?? true,
        section: row.template_items?.section || null,
        itemType: row.template_items?.item_type || "document",
        inputType: row.template_items?.input_type || "upload",
        documentId: row.document_id,
        status: row.status,
        fileName: row.documents?.file_name || null,
        fileUrl: row.documents?.file_url || null,
      }));
    },
    enabled: !!uploadLinkId,
    refetchInterval: 10000, // poll for new uploads
  });
}

// ── Seed Default Templates ──

export function useSeedDefaults() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Check if defaults already exist
      const { data: existing } = await supabase
        .from("document_templates")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .limit(1);

      if (existing && existing.length > 0) return; // already seeded

      const { DEFAULT_DSCR_TEMPLATE, BORROWER_PROFILE_ADDONS } = await import("../data/defaultTemplates");

      const allTemplates = [DEFAULT_DSCR_TEMPLATE, ...BORROWER_PROFILE_ADDONS];

      for (const tmpl of allTemplates) {
        const { data: created, error: tErr } = await supabase
          .from("document_templates")
          .insert({
            user_id: user.id,
            name: tmpl.name,
            borrower_type: tmpl.borrowerType,
            description: tmpl.description,
            is_default: tmpl.isDefault,
            is_addon: tmpl.isAddon,
          })
          .select()
          .single();
        if (tErr) throw tErr;

        let sortIndex = 0;
        for (const section of tmpl.sections) {
          const allItems: any[] = [];
          const gateKey = (section as any).gateQuestion ? `gate_${section.title.toLowerCase().replace(/\s+/g, "_")}` : null;

          // Add gate question as first item if present
          if ((section as any).gateQuestion) {
            allItems.push({
              template_id: created.id,
              name: (section as any).gateQuestion,
              description: null,
              required: true,
              sort_order: sortIndex++,
              section: section.title,
              item_type: "question",
              field_type: "boolean",
              item_key: gateKey,
              condition_key: null,
            });
          }

          // Add document items
          for (const item of section.items) {
            allItems.push({
              template_id: created.id,
              name: item.name,
              description: item.description || null,
              required: item.required,
              sort_order: sortIndex++,
              section: section.title,
              item_type: "document",
              field_type: null,
              item_key: null,
              condition_key: gateKey,
              input_type: (item as any).inputType || "upload",
            });
          }

          if (allItems.length > 0) await supabase.from("template_items").insert(allItems);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

// ── Save Template (full page builder) ──

export function useSaveTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id?: string; // if editing
      name: string;
      borrowerType: string;
      description: string;
      isAddon: boolean;
      sections: { title: string; items: { name: string; description: string; required: boolean; itemType?: string; fieldType?: string | null; itemKey?: string | null; conditionKey?: string | null }[] }[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      let templateId = data.id;

      if (templateId) {
        // Update existing
        await supabase.from("document_templates").update({
          name: data.name, borrower_type: data.borrowerType, description: data.description,
          is_addon: data.isAddon, updated_at: new Date().toISOString(),
        }).eq("id", templateId);

        // Delete old items and re-insert
        await supabase.from("template_items").delete().eq("template_id", templateId);
      } else {
        // Create new
        const { data: created, error } = await supabase.from("document_templates").insert({
          user_id: user.id, name: data.name, borrower_type: data.borrowerType,
          description: data.description, is_addon: data.isAddon,
        }).select().single();
        if (error) throw error;
        templateId = created.id;
      }

      // Insert all items with sections
      let sortIndex = 0;
      for (const section of data.sections) {
        const items = section.items.filter((i) => i.name.trim()).map((item) => ({
          template_id: templateId,
          name: item.name,
          description: item.description || null,
          required: item.required,
          sort_order: sortIndex++,
          section: section.title,
          item_type: item.itemType || "document",
          field_type: item.fieldType || null,
          item_key: item.itemKey || null,
          condition_key: item.conditionKey || null,
        }));
        if (items.length > 0) await supabase.from("template_items").insert(items);
      }

      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template_items"] });
    },
  });
}

// ── Borrower Documents ──

export function useBorrowerDocuments(borrowerId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["borrower_documents", borrowerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("borrower_id", borrowerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!borrowerId,
  });
}
