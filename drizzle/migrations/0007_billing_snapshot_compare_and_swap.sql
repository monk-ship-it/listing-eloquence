-- A Stripe response can arrive after a newer webhook/cancel/resume response.
-- Order every writer against the row read BEFORE its provider request.
-- The original generic trigger assigns transaction-start now(), which can
-- regress after waiting for a lock. Keep this row's version strictly increasing.
CREATE OR REPLACE FUNCTION public.update_subscriber_billing_version()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  NEW.updated_at=greatest(clock_timestamp(),coalesce(OLD.updated_at,'-infinity'::timestamptz)+interval '1 microsecond');
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.update_subscriber_billing_version() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON public.subscribers;
CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON public.subscribers
FOR EACH ROW EXECUTE FUNCTION public.update_subscriber_billing_version();

DROP FUNCTION public.apply_billing_event(uuid,text,bigint,bigint,jsonb,boolean);
CREATE FUNCTION public.apply_billing_event(
  _user_id uuid, _subscription_id text, _subscription_created bigint,
  _event_created bigint, _fields jsonb, _checkout boolean,
  _expected_updated_at timestamptz DEFAULT NULL, _check_version boolean DEFAULT false
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.subscribers;
BEGIN
  SELECT * INTO r FROM subscribers WHERE user_id=_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Subscriber missing'; END IF;
  IF _check_version AND r.updated_at IS DISTINCT FROM _expected_updated_at THEN RETURN false; END IF;
  IF r.stripe_subscription_id IS DISTINCT FROM _subscription_id AND r.stripe_subscription_id IS NOT NULL THEN
    IF NOT _checkout OR _subscription_created <= r.stripe_subscription_created
      OR r.status NOT IN ('canceled','incomplete_expired','none') THEN RETURN false; END IF;
  END IF;
  IF r.stripe_subscription_id=_subscription_id AND _event_created<r.stripe_event_created THEN RETURN false; END IF;
  UPDATE subscribers SET
    stripe_subscription_id=_subscription_id,
    stripe_subscription_created=_subscription_created,
    stripe_event_created=_event_created,
    stripe_customer_id=_fields->>'stripe_customer_id',
    stripe_price_id=_fields->>'stripe_price_id',
    status=_fields->>'status', plan=_fields->>'plan',
    trial_end=(_fields->>'trial_end')::timestamptz,
    current_period_end=(_fields->>'current_period_end')::timestamptz,
    cancel_at_period_end=(_fields->>'cancel_at_period_end')::boolean,
    updated_at=greatest(clock_timestamp(),coalesce(r.updated_at,'-infinity'::timestamptz)+interval '1 microsecond')
  WHERE user_id=_user_id;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.apply_billing_event(uuid,text,bigint,bigint,jsonb,boolean,timestamptz,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_billing_event(uuid,text,bigint,bigint,jsonb,boolean,timestamptz,boolean) TO service_role;
