-- 1) Tighten generation_usage insert policy: plan must match the caller's real
-- subscription plan, and direct inserts may only be completed usage records.
DROP POLICY IF EXISTS "Users can insert own usage" ON public.generation_usage;
CREATE POLICY "Users can insert own usage"
ON public.generation_usage
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND reservation_status = 'completed'
  AND reserved_until IS NULL
  AND (
    plan IS NULL
    OR plan = (SELECT s.plan FROM public.subscribers s WHERE s.user_id = auth.uid())
  )
);

-- 2) Quota RPCs: remove direct callability by signed-in users. They now take an
-- explicit user id and are executable only by trusted server-side code.
DROP FUNCTION IF EXISTS public.reserve_generation_slot();
DROP FUNCTION IF EXISTS public.finalize_generation_slot(uuid, uuid);
DROP FUNCTION IF EXISTS public.release_generation_slot(uuid);

CREATE OR REPLACE FUNCTION public.reserve_generation_slot(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := _user_id;
  v_plan text;
  v_limit int;
  v_used int;
  v_month_start timestamptz;
  v_month_end timestamptz;
  v_lock_key bigint;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  SELECT COALESCE(plan, 'starter') INTO v_plan
    FROM public.subscribers WHERE user_id = v_uid;
  v_plan := COALESCE(v_plan, 'starter');

  v_limit := CASE lower(v_plan)
    WHEN 'pro' THEN 50
    WHEN 'growth' THEN 120
    ELSE 15
  END;

  v_month_start := date_trunc('month', (now() AT TIME ZONE 'UTC')) AT TIME ZONE 'UTC';
  v_month_end := (v_month_start + interval '1 month');

  v_lock_key := hashtextextended(v_uid::text || '|' || to_char(v_month_start, 'YYYY-MM'), 0);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  DELETE FROM public.generation_usage
   WHERE user_id = v_uid
     AND reservation_status = 'reserved'
     AND reserved_until IS NOT NULL
     AND reserved_until < now()
     AND created_at >= v_month_start
     AND created_at < v_month_end;

  SELECT count(*) INTO v_used
    FROM public.generation_usage
   WHERE user_id = v_uid
     AND created_at >= v_month_start
     AND created_at < v_month_end
     AND (
       reservation_status = 'completed'
       OR (reservation_status = 'reserved' AND (reserved_until IS NULL OR reserved_until >= now()))
     );

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'LISTING_LIMIT_REACHED' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.generation_usage (user_id, plan, reservation_status, reserved_until)
  VALUES (v_uid, v_plan, 'reserved', now() + interval '15 minutes')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.finalize_generation_slot(_user_id uuid, reservation_id uuid, generation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := _user_id;
  v_owned boolean;
  v_updated int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.generations
     WHERE id = finalize_generation_slot.generation_id AND user_id = v_uid
  ) INTO v_owned;
  IF NOT v_owned THEN
    RETURN false;
  END IF;

  UPDATE public.generation_usage
     SET reservation_status = 'completed',
         reserved_until = NULL,
         generation_id = finalize_generation_slot.generation_id
   WHERE id = finalize_generation_slot.reservation_id
     AND user_id = v_uid
     AND reservation_status = 'reserved';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated = 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.release_generation_slot(_user_id uuid, reservation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := _user_id;
  v_deleted int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE = '28000';
  END IF;

  DELETE FROM public.generation_usage
   WHERE id = release_generation_slot.reservation_id
     AND user_id = v_uid
     AND reservation_status = 'reserved';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted = 1;
END;
$function$;

REVOKE ALL ON FUNCTION public.reserve_generation_slot(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalize_generation_slot(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_generation_slot(uuid, uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_generation_slot(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_generation_slot(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_generation_slot(uuid, uuid) TO service_role;