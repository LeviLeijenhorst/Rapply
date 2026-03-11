create table if not exists public.input_transcripts (
  input_id text primary key references public.inputs (id) on delete cascade,
  transcript_text text not null default '',
  language_code text,
  created_at_unix_ms bigint not null,
  updated_at_unix_ms bigint not null,
  constraint input_transcripts_language_code_length check (language_code is null or char_length(language_code) <= 20)
);
