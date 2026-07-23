-- Extend generation_usage with reservation state and add race-safe quota RPCs.

ALTER TABLE public.generation_usage
  ADD COLUMN IF NOT EXISTS reservation_status text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS reserved_until timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'generation_usage_reservation_status_chk'
  ) THEN
    ALTER TABLE public.generation_usage
      ADD CONSTRAINT generation_usage_reservation_status_chk
      CHECK (reservation_status IN ('reserved','completed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_generation_usage_reserved
  ON public.generation_usage (user_id, reserved_until)
  WHERE reservation_status = 'reserved';

-- Server-authoritative reservation: atomically checks the monthly cap and
-- inserts a reserved usage row. Client cannot pass plan or limit.
CREATE OR REPLACE FUNCTION public.reserve_generation_slot()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
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

  -- Per user + UTC month advisory lock, transaction scoped.
  v_lock_key := hashtextextended(v_uid::text || '|' || to_char(v_month_start, 'YYYY-MM'), 0);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Clean the caller's own expired reservations for this month.
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
$$;

ALTER FUNCTION public.reserve_generation_slot() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.reserve_generation_slot() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_generation_slot() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.finalize_generation_slot(reservation_id uuid, generation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
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
$$;

ALTER FUNCTION public.finalize_generation_slot(uuid, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.finalize_generation_slot(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_generation_slot(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.release_generation_slot(reservation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
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
$$;

ALTER FUNCTION public.release_generation_slot(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.release_generation_slot(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_generation_slot(uuid) TO authenticated, service_role;