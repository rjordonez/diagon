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
