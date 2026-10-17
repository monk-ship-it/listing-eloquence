ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS stripe_subscription_created bigint NOT NULL DEFAULT 0;
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS stripe_event_created bigint NOT NULL DEFAULT 0;
CREATE TABLE public.billing_checkout_state (user_id uuid PRIMARY KEY, attempt_id uuid NOT NULL DEFAULT gen_random_uuid(), plan text NOT NULL, origin text NOT NULL, trial_used boolean NOT NULL DEFAULT false, expires_at timestamptz NOT NULL DEFAULT now(), checkout_url text);
GRANT ALL ON public.billing_checkout_state TO service_role;
ALTER TABLE public.billing_checkout_state ENABLE ROW LEVEL SECURITY;
INSERT INTO public.billing_checkout_state(user_id,plan,origin,trial_used) SELECT user_id,plan,'https://copybymonk.com',true FROM public.subscribers WHERE stripe_subscription_id IS NOT NULL OR trial_end IS NOT NULL ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION public.claim_billing_checkout(_user_id uuid,_plan text,_origin text,_prior_trial boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.billing_checkout_state; eligible boolean;
BEGIN
INSERT INTO billing_checkout_state(user_id,plan,origin,trial_used) VALUES(_user_id,_plan,_origin,_prior_trial) ON CONFLICT DO NOTHING;
SELECT * INTO r FROM billing_checkout_state WHERE user_id=_user_id FOR UPDATE;
IF r.expires_at > now() THEN
IF r.plan<>_plan OR r.origin<>_origin THEN RAISE EXCEPTION 'CHECKOUT_PENDING'; END IF;
RETURN jsonb_build_object('attemptId',r.attempt_id,'trialDays',CASE WHEN r.plan='starter' AND NOT _prior_trial AND r.checkout_url IS NULL AND NOT r.trial_used THEN 14 ELSE 0 END,'url',r.checkout_url);
END IF;
eligible := NOT r.trial_used AND NOT _prior_trial AND _plan='starter';
UPDATE billing_checkout_state SET attempt_id=gen_random_uuid(),plan=_plan,origin=_origin,trial_used=r.trial_used OR _prior_trial,expires_at=now()+interval '24 hours',checkout_url=NULL WHERE user_id=_user_id RETURNING * INTO r;
RETURN jsonb_build_object('attemptId',r.attempt_id,'trialDays',CASE WHEN eligible THEN 14 ELSE 0 END,'url',NULL);
END $$;
REVOKE ALL ON FUNCTION public.claim_billing_checkout(uuid,text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_billing_checkout(uuid,text,text,boolean) TO service_role;
CREATE OR REPLACE FUNCTION public.apply_billing_event(_user_id uuid,_subscription_id text,_subscription_created bigint,_event_created bigint,_fields jsonb,_checkout boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.subscribers;
BEGIN
SELECT * INTO r FROM subscribers WHERE user_id=_user_id FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Subscriber missing'; END IF;
IF r.stripe_subscription_id IS DISTINCT FROM _subscription_id AND r.stripe_subscription_id IS NOT NULL THEN
IF NOT _checkout OR _subscription_created <= r.stripe_subscription_created OR r.status NOT IN ('canceled','incomplete_expired','none') THEN RETURN false; END IF;
END IF;
IF r.stripe_subscription_id=_subscription_id AND _event_created<r.stripe_event_created THEN RETURN false; END IF;
UPDATE subscribers SET stripe_subscription_id=_subscription_id,stripe_subscription_created=_subscription_created,stripe_event_created=_event_created,stripe_customer_id=_fields->>'stripe_customer_id',stripe_price_id=_fields->>'stripe_price_id',status=_fields->>'status',plan=_fields->>'plan',trial_end=(_fields->>'trial_end')::timestamptz,current_period_end=(_fields->>'current_period_end')::timestamptz,cancel_at_period_end=(_fields->>'cancel_at_period_end')::boolean,updated_at=now() WHERE user_id=_user_id;
RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.apply_billing_event(uuid,text,bigint,bigint,jsonb,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_billing_event(uuid,text,bigint,bigint,jsonb,boolean) TO service_role;