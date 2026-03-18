-- 여행별 첨부파일 보관함 (e-ticket, 바우처, QR 캡처 등)

-- 스토리지 버킷: trip-attachments (비공개, 10MB 제한)
insert into storage.buckets (id, name, public, file_size_limit)
values ('trip-attachments', 'trip-attachments', false, 10485760)
on conflict (id) do nothing;

-- 기존 정책 제거 후 재생성 (중복 실행 안전)
drop policy if exists "첨부파일 업로드" on storage.objects;
drop policy if exists "첨부파일 조회" on storage.objects;
drop policy if exists "첨부파일 삭제" on storage.objects;

-- 인증된 사용자: 자기 폴더에만 업로드
create policy "첨부파일 업로드"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'trip-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 자기 폴더만 읽기
create policy "첨부파일 조회"
on storage.objects for select
to authenticated
using (
  bucket_id = 'trip-attachments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 자기 파일만 삭제
create policy "첨부파일 삭제"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'trip-attachments'
  and owner = auth.uid()
);
