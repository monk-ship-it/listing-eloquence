CREATE TABLE public.generation_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id uuid,
  plan text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_generation_usage_user_created ON public.generation_usage (user_id, created_at);
CREATE UNIQUE INDEX uq_generation_usage_generation_id ON public.generation_usage (generation_id) WHERE generation_id IS NOT NULL;

GRANT SELECT, INSERT ON public.generation_usage TO authenticated;
GRANT ALL ON public.generation_usage TO service_role;

ALTER TABLE public.generation_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.generation_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.generation_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Backfill one usage event per existing generation, idempotent via generation_id
INSERT INTO public.generation_usage (user_id, generation_id, created_at)
SELECT g.user_id, g.id, g.created_at
FROM public.generations g
WHERE NOT EXISTS (
  SELECT 1 FROM public.generation_usage u WHERE u.generation_id = g.id
);