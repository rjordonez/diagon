import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PublicUploadLink {
  id: string;
  token: string;
  borrowerName: string;
  templateName: string;
  expiresAt: string;
  expired: boolean;
}

export interface PublicUploadItem {
  id: string;
  templateItemId: string;
  templateItemName: string;
  templateItemDescription: string | null;
  required: boolean;
  status: string;
  section: string | null;
  itemType: string;
  fieldType: string | null;
  itemKey: string | null;
  conditionKey: string | null;
  inputType: string;
  fileName: string | null;
}

export function useUploadLinkByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["public_upload_link", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upload_links")
        .select("*, borrowers(first_name, last_name), document_templates(name)")
        .eq("token", token!)
        .single();

      if (error || !data) return null;

      const expired = new Date(data.expires_at) < new Date();
      return {
        id: data.id,
        token: data.token,
        borrowerName: `${(data as any).borrowers?.first_name} ${(data as any).borrowers?.last_name}`,
        templateName: (data as any).document_templates?.name || "",
        expiresAt: data.expires_at,
        expired,
      } as PublicUploadLink;
    },
    enabled: !!token,
  });
}

export function usePublicUploadItems(uploadLinkId: string | null | undefined) {
  return useQuery({
    queryKey: ["public_upload_items", uploadLinkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upload_items")
        .select("*, template_items(name, description, required, section, item_type, field_type, item_key, condition_key, input_type)")
        .eq("upload_link_id", uploadLinkId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []).map((row: any): PublicUploadItem => ({
        id: row.id,
        templateItemId: row.template_item_id,
        templateItemName: row.template_items?.name || "",
        templateItemDescription: row.template_items?.description || null,
        required: row.template_items?.required ?? true,
        status: row.status,
        section: row.template_items?.section || null,
        itemType: row.template_items?.item_type || "document",
        fieldType: row.template_items?.field_type || null,
        itemKey: row.template_items?.item_key || null,
        conditionKey: row.template_items?.condition_key || null,
        inputType: row.template_items?.input_type || "upload",
        fileName: null,
      }));
    },
    enabled: !!uploadLinkId,
  });
}

export function useSubmitUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      token: string;
      templateItemId: string;
      file: File;
      borrowerId: string;
    }) => {
      const timestamp = Date.now();
      const ext = data.file.name.split(".").pop() || "file";
      const path = `${data.borrowerId}/${data.templateItemId}_${timestamp}.${ext}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("borrower-uploads")
        .upload(path, data.file);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // Get the public URL
      const { data: urlData } = supabase.storage.from("borrower-uploads").getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      // Call the database function
      const { error: rpcError } = await supabase.rpc("submit_borrower_upload", {
        p_token: data.token,
        p_template_item_id: data.templateItemId,
        p_file_name: data.file.name,
        p_file_type: data.file.type,
        p_file_url: fileUrl,
      });

      if (rpcError) throw new Error(`Submit failed: ${rpcError.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public_upload_items"] });
    },
  });
}
