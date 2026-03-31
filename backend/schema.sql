-- Messages table for iMessage bridge
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  borrower_id uuid references public.borrowers on delete cascade not null,
  direction text not null check (direction in ('outbound', 'inbound')),
  recipient text not null,
  body text not null,
  status text default 'queued' check (status in ('queued', 'sent', 'delivered', 'failed')),
  sent_at timestamptz,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Users can read own messages" on public.messages for select using (auth.uid() = user_id);
create policy "Users can insert own messages" on public.messages for insert with check (auth.uid() = user_id);
create policy "Users can update own messages" on public.messages for update using (auth.uid() = user_id);

-- Index for the agent to poll queued outbound messages
create index idx_messages_queued on public.messages (status, direction) where status = 'queued' and direction = 'outbound';

-- Allow all authenticated users to read all messages (for Store page)
create policy "All users can read all messages" on public.messages for select using (auth.role() = 'authenticated');
-- Service role bypass for backend agent inserts (inbound messages)
create policy "Service role can insert messages" on public.messages for insert with check (true);
create policy "Service role can update messages" on public.messages for update using (true);

-- ─────────────────────────────────────────────
-- AI Conversations
-- ─────────────────────────────────────────────
create table public.ai_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  borrower_id uuid references public.borrowers on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ai_conversations enable row level security;

create policy "Users can read own conversations" on public.ai_conversations for select using (auth.uid() = user_id);
create policy "Users can insert own conversations" on public.ai_conversations for insert with check (auth.uid() = user_id);
create policy "Users can update own conversations" on public.ai_conversations for update using (auth.uid() = user_id);
create policy "Users can delete own conversations" on public.ai_conversations for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- AI Messages
-- ─────────────────────────────────────────────
create table public.ai_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.ai_conversations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  tool_calls jsonb,
  tool_call_id text,
  status text default 'pending' check (status in ('pending', 'processing', 'complete', 'error')),
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.ai_messages enable row level security;

create policy "Users can read own ai messages" on public.ai_messages for select using (auth.uid() = user_id);
create policy "Users can insert own ai messages" on public.ai_messages for insert with check (auth.uid() = user_id);
-- Service role needs to update status (pending → processing → complete)
create policy "Service role can update ai messages" on public.ai_messages for update using (true);
-- Service role needs to insert assistant responses
create policy "Service role can insert ai messages" on public.ai_messages for insert with check (true);

create index idx_ai_messages_pending on public.ai_messages (status, role) where status = 'pending' and role = 'user';
create index idx_ai_messages_conversation on public.ai_messages (conversation_id, created_at);

-- Enable Realtime for ai_messages
alter publication supabase_realtime add table public.ai_messages;

-- ─────────────────────────────────────────────
-- Documents
-- ─────────────────────────────────────────────
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  borrower_id uuid references public.borrowers on delete cascade,
  message_id uuid references public.messages on delete set null,
  file_name text not null,
  file_type text,
  file_url text not null,
  category text,
  ai_summary text,
  status text default 'received' check (status in ('received', 'processing', 'verified', 'rejected')),
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

-- All authenticated users can read documents (Store page)
create policy "All users can read all documents" on public.documents for select using (auth.role() = 'authenticated');
create policy "Users can insert own documents" on public.documents for insert with check (auth.uid() = user_id);
create policy "Service role can insert documents" on public.documents for insert with check (true);
create policy "Service role can update documents" on public.documents for update using (true);

create index idx_documents_borrower on public.documents (borrower_id);

-- ─────────────────────────────────────────────
-- Document Templates (form builder)
-- ─────────────────────────────────────────────
create table public.document_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  borrower_type text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.document_templates enable row level security;
create policy "Users can read own templates" on public.document_templates for select using (auth.uid() = user_id);
create policy "Users can insert own templates" on public.document_templates for insert with check (auth.uid() = user_id);
create policy "Users can update own templates" on public.document_templates for update using (auth.uid() = user_id);
create policy "Users can delete own templates" on public.document_templates for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Template Items (required docs per template)
-- ─────────────────────────────────────────────
create table public.template_items (
  id uuid default gen_random_uuid() primary key,
  template_id uuid references public.document_templates on delete cascade not null,
  name text not null,
  description text,
  required boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.template_items enable row level security;
create policy "Users can manage own template items" on public.template_items for all
  using (exists (select 1 from document_templates dt where dt.id = template_id and dt.user_id = auth.uid()))
  with check (exists (select 1 from document_templates dt where dt.id = template_id and dt.user_id = auth.uid()));
create policy "Anon can read items via valid upload link" on public.template_items for select
  using (exists (
    select 1 from upload_links ul
    where ul.template_id = template_items.template_id
      and ul.expires_at > now()
  ));

-- ─────────────────────────────────────────────
-- Upload Links (unique token per borrower)
-- ─────────────────────────────────────────────
create table public.upload_links (
  id uuid default gen_random_uuid() primary key,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  user_id uuid references auth.users on delete cascade not null,
  borrower_id uuid references public.borrowers on delete cascade not null,
  template_id uuid references public.document_templates on delete cascade not null,
  expires_at timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now()
);

alter table public.upload_links enable row level security;
create policy "Users can CRUD own upload links" on public.upload_links for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Anon can read link by token" on public.upload_links for select using (true);
create index idx_upload_links_token on public.upload_links (token);

-- ─────────────────────────────────────────────
-- Upload Items (per-doc upload status)
-- ─────────────────────────────────────────────
create table public.upload_items (
  id uuid default gen_random_uuid() primary key,
  upload_link_id uuid references public.upload_links on delete cascade not null,
  template_item_id uuid references public.template_items on delete cascade not null,
  document_id uuid references public.documents on delete set null,
  status text default 'pending' check (status in ('pending', 'uploaded', 'verified', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.upload_items enable row level security;
create policy "Users can read own upload items" on public.upload_items for select
  using (exists (select 1 from upload_links ul where ul.id = upload_link_id and ul.user_id = auth.uid()));
create policy "Anon can read upload items" on public.upload_items for select using (true);
create policy "Anon can update upload items" on public.upload_items for update using (true);

-- ─────────────────────────────────────────────
-- Function: borrower uploads a file via public link
-- ─────────────────────────────────────────────
create or replace function public.submit_borrower_upload(
  p_token text,
  p_template_item_id uuid,
  p_file_name text,
  p_file_type text,
  p_file_url text
) returns uuid as $$
declare
  v_link record;
  v_doc_id uuid;
begin
  select ul.*, dt.name as template_name
  into v_link
  from upload_links ul
  join document_templates dt on dt.id = ul.template_id
  where ul.token = p_token and ul.expires_at > now();

  if not found then
    raise exception 'Invalid or expired upload link';
  end if;

  insert into documents (user_id, borrower_id, file_name, file_type, file_url, category, status)
  values (v_link.user_id, v_link.borrower_id, p_file_name, p_file_type, p_file_url, v_link.template_name, 'received')
  returning id into v_doc_id;

  update upload_items
  set document_id = v_doc_id, status = 'uploaded', updated_at = now()
  where upload_link_id = v_link.id and template_item_id = p_template_item_id;

  update borrowers
  set docs_received = docs_received + 1
  where id = v_link.borrower_id;

  return v_doc_id;
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────────
-- Alter profiles: add role (lo vs borrower)
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'lo'
  CHECK (role IN ('lo', 'borrower'));

-- ─────────────────────────────────────────────
-- Template Questions (form fields in templates)
-- ─────────────────────────────────────────────
create table public.template_questions (
  id uuid default gen_random_uuid() primary key,
  template_id uuid references public.document_templates on delete cascade not null,
  label text not null,
  field_type text not null check (field_type in ('text','number','select','date','multiselect','file','boolean')),
  options jsonb,
  required boolean default false,
  sort_order integer default 0,
  condition jsonb,
  created_at timestamptz default now()
);

alter table public.template_questions enable row level security;
create policy "Users can manage own template questions" on public.template_questions for all
  using (exists (select 1 from document_templates dt where dt.id = template_id and dt.user_id = auth.uid()))
  with check (exists (select 1 from document_templates dt where dt.id = template_id and dt.user_id = auth.uid()));
create policy "Borrowers can read questions via application" on public.template_questions for select
  using (exists (
    select 1 from borrower_applications ba
    join upload_links ul on ul.id = ba.upload_link_id
    where ul.template_id = template_questions.template_id
      and ba.borrower_user_id = auth.uid()
  ));
create policy "Anon can read questions via valid upload link" on public.template_questions for select
  using (exists (
    select 1 from upload_links ul
    where ul.template_id = template_questions.template_id
      and ul.expires_at > now()
  ));

-- ─────────────────────────────────────────────
-- Alter upload_links: add borrower_user_id
-- ─────────────────────────────────────────────
ALTER TABLE public.upload_links ADD COLUMN IF NOT EXISTS borrower_user_id uuid references auth.users on delete set null;
create policy "Borrowers can read own links" on public.upload_links for select
  using (borrower_user_id = auth.uid());
create policy "Borrowers can update own links" on public.upload_links for update
  using (borrower_user_id = auth.uid());

-- ─────────────────────────────────────────────
-- Borrower Applications
-- ─────────────────────────────────────────────
create table public.borrower_applications (
  id uuid default gen_random_uuid() primary key,
  borrower_user_id uuid references auth.users on delete cascade not null,
  upload_link_id uuid references public.upload_links on delete cascade not null,
  lo_user_id uuid references auth.users on delete cascade not null,
  status text default 'invited' check (status in ('invited','in_progress','submitted','quoted')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.borrower_applications enable row level security;
create policy "Borrowers can read own applications" on public.borrower_applications for select
  using (borrower_user_id = auth.uid());
create policy "Borrowers can update own applications" on public.borrower_applications for update
  using (borrower_user_id = auth.uid());
create policy "Borrowers can insert own applications" on public.borrower_applications for insert
  with check (borrower_user_id = auth.uid());
create policy "LOs can read own applications" on public.borrower_applications for select
  using (lo_user_id = auth.uid());

-- ─────────────────────────────────────────────
-- Form Responses (borrower answers)
-- ─────────────────────────────────────────────
create table public.form_responses (
  id uuid default gen_random_uuid() primary key,
  application_id uuid references public.borrower_applications on delete cascade not null,
  question_id uuid references public.template_questions on delete cascade not null,
  value text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(application_id, question_id)
);

alter table public.form_responses enable row level security;
create policy "Borrowers can CRUD own responses" on public.form_responses for all
  using (exists (select 1 from borrower_applications ba where ba.id = application_id and ba.borrower_user_id = auth.uid()))
  with check (exists (select 1 from borrower_applications ba where ba.id = application_id and ba.borrower_user_id = auth.uid()));
create policy "LOs can read responses" on public.form_responses for select
  using (exists (select 1 from borrower_applications ba where ba.id = application_id and ba.lo_user_id = auth.uid()));

-- ─────────────────────────────────────────────
-- Template system upgrades: sections + defaults
-- ─────────────────────────────────────────────
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;
ALTER TABLE public.document_templates ADD COLUMN IF NOT EXISTS is_addon boolean DEFAULT false;
ALTER TABLE public.template_items ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE public.template_items ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'document'; -- 'document' or 'question'
ALTER TABLE public.template_items ADD COLUMN IF NOT EXISTS field_type text;                   -- 'boolean', 'text' for questions
ALTER TABLE public.template_items ADD COLUMN IF NOT EXISTS item_key text;                     -- unique key for conditions to reference
ALTER TABLE public.template_items ADD COLUMN IF NOT EXISTS condition_key text;                 -- show only if item with this key = 'yes'
ALTER TABLE public.template_items ADD COLUMN IF NOT EXISTS input_type text DEFAULT 'upload';   -- 'upload' or 'text'
ALTER TABLE public.template_questions ADD COLUMN IF NOT EXISTS section text;
