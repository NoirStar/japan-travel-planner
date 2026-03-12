-- 문의 테이블 및 RLS 정책

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('bug', 'feature', 'question', 'other')),
  title text not null,
  content text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'closed')),
  admin_reply text,
  created_at timestamptz not null default now()
);

create index if not exists inquiries_user_id_idx on public.inquiries (user_id, created_at desc);
create index if not exists inquiries_status_idx on public.inquiries (status, created_at desc);

alter table public.inquiries enable row level security;

-- 본인 + 관리자만 조회
create policy "문의 조회" on public.inquiries for select using (
  auth.uid() = user_id
  or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- 로그인한 사용자만 작성
create policy "문의 작성" on public.inquiries for insert with check (auth.uid() = user_id);

-- 관리자만 답변(update)
create policy "문의 답변" on public.inquiries for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- 관리자만 삭제
create policy "문의 삭제" on public.inquiries for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
