CREATE TABLE public.transcription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lang text,
  bytes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transcription_usage_user_created_idx ON public.transcription_usage (user_id, created_at DESC);
GRANT SELECT ON public.transcription_usage TO authenticated;
GRANT ALL ON public.transcription_usage TO service_role;
ALTER TABLE public.transcription_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own transcription usage" ON public.transcription_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);