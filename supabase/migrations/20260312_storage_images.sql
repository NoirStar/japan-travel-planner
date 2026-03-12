-- Supabase Storage: images 버킷 생성 + RLS 정책

-- 버킷 생성 (public: 누구나 읽기 가능, 5MB 파일 제한)
insert into storage.buckets (id, name, public, file_size_limit)
values ('images', 'images', true, 5242880)
on conflict (id) do nothing;

-- 인증된 사용자: posts/ 경로에 업로드 허용
create policy "이미지 업로드"
on storage.objects for insert
to authenticated
with check (bucket_id = 'images' and (storage.foldername(name))[1] = 'posts');

-- 누구나 읽기 (public 버킷)
create policy "이미지 조회"
on storage.objects for select
to public
using (bucket_id = 'images');

-- 본인 업로드 파일 삭제 (owner 기반)
create policy "이미지 삭제"
on storage.objects for delete
to authenticated
using (bucket_id = 'images' and owner = auth.uid());
