CREATE TABLE public.generation_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stage text NOT NULL CHECK (stage IN ('core','marketing','regen')),
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.generation_errors TO authenticated;
GRANT ALL ON public.generation_errors TO service_role;
ALTER TABLE public.generation_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own generation errors" ON public.generation_errors
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX generation_errors_user_created_idx ON public.generation_errors (user_id, created_at DESC);

CREATE TABLE public.regen_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.regen_usage TO authenticated;
GRANT ALL ON public.regen_usage TO service_role;
ALTER TABLE public.regen_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own regen usage" ON public.regen_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX regen_usage_user_created_idx ON public.regen_usage (user_id, kind, created_at DESC);