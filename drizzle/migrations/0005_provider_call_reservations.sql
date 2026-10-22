CREATE TABLE public.provider_call_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('extract','marketing','transcribe')),
  bytes bigint NOT NULL DEFAULT 0 CHECK (bytes >= 0),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','succeeded','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reserved_until timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  settled_at timestamptz
);
CREATE INDEX provider_call_reservations_user_kind_created_idx ON public.provider_call_reservations (user_id, kind, created_at DESC);
GRANT ALL ON public.provider_call_reservations TO service_role;
ALTER TABLE public.provider_call_reservations ENABLE ROW LEVEL SECURITY;

-- Reserves one paid-provider attempt before the call. Every attempt counts
-- (success, failure or expiry) so failures cannot be used to bypass limits.
CREATE OR REPLACE FUNCTION public.reserve_provider_call(_user_id uuid, _kind text, _bytes bigint) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_since timestamptz;
  v_limit int;
  v_inflight_cap int;
  v_byte_budget bigint := NULL;
  v_used int;
  v_inflight int;
  v_bytes bigint;
  v_id uuid;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED'; END IF;
  IF _bytes IS NULL OR _bytes < 0 THEN RAISE EXCEPTION 'INVALID_BYTES'; END IF;
  IF _kind = 'extract' THEN
    v_limit := 40; v_inflight_cap := 2; v_since := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  ELSIF _kind = 'marketing' THEN
    v_limit := 30; v_inflight_cap := 2; v_since := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  ELSIF _kind = 'transcribe' THEN
    IF _bytes > 10485760 THEN RAISE EXCEPTION 'PROVIDER_BYTES_EXCEEDED'; END IF;
    v_limit := 200; v_inflight_cap := 3; v_byte_budget := 41943040; v_since := now() - interval '24 hours';
  ELSE
    RAISE EXCEPTION 'INVALID_KIND';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text || '|provider|' || _kind, 0));

  SELECT count(*), count(*) FILTER (WHERE status = 'reserved' AND reserved_until > now()), COALESCE(sum(bytes), 0)
    INTO v_used, v_inflight, v_bytes
    FROM provider_call_reservations
   WHERE user_id = _user_id AND kind = _kind AND created_at >= v_since;

  -- Usage recorded before reservations existed still counts in its window.
  IF _kind = 'transcribe' THEN
    SELECT v_used + count(*), v_bytes + COALESCE(sum(bytes), 0) INTO v_used, v_bytes
      FROM transcription_usage WHERE user_id = _user_id AND created_at >= v_since;
  ELSE
    SELECT v_used + count(*) INTO v_used
      FROM regen_usage WHERE user_id = _user_id AND kind = _kind AND created_at >= v_since;
  END IF;

  IF v_inflight >= v_inflight_cap THEN RAISE EXCEPTION 'PROVIDER_IN_FLIGHT'; END IF;
  IF v_used >= v_limit THEN RAISE EXCEPTION 'PROVIDER_LIMIT_REACHED'; END IF;
  IF v_byte_budget IS NOT NULL AND v_bytes + _bytes > v_byte_budget THEN RAISE EXCEPTION 'PROVIDER_LIMIT_REACHED'; END IF;

  INSERT INTO provider_call_reservations (user_id, kind, bytes) VALUES (_user_id, _kind, _bytes) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- Settles a reservation once. Settled/expired rows still count toward limits.
CREATE OR REPLACE FUNCTION public.settle_provider_call(_user_id uuid, _reservation_id uuid, _succeeded boolean) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_count int;
BEGIN
  UPDATE provider_call_reservations
     SET status = CASE WHEN _succeeded THEN 'succeeded' ELSE 'failed' END, settled_at = now()
   WHERE id = _reservation_id AND user_id = _user_id AND status = 'reserved';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count = 1;
END $$;

REVOKE ALL ON FUNCTION public.reserve_provider_call(uuid, text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_provider_call(uuid, uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_provider_call(uuid, text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_provider_call(uuid, uuid, boolean) TO service_role;