-- Keep the concurrent-call cap across UTC-day boundaries, independently of
-- the daily allowance window. Failed/expired attempts remain in the allowance.
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

  SELECT count(*), COALESCE(sum(bytes), 0)
    INTO v_used, v_bytes
    FROM provider_call_reservations
   WHERE user_id = _user_id AND kind = _kind AND created_at >= v_since;
  SELECT count(*) INTO v_inflight
    FROM provider_call_reservations
   WHERE user_id = _user_id AND kind = _kind
     AND status = 'reserved' AND reserved_until > now();

  -- Include successful calls made before the reservation-based implementation.
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

REVOKE ALL ON FUNCTION public.reserve_provider_call(uuid, text, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_provider_call(uuid, text, bigint) TO service_role;
