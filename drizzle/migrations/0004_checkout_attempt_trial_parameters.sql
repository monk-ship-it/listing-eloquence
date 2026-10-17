ALTER TABLE public.billing_checkout_state ADD COLUMN IF NOT EXISTS trial_days integer NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.claim_billing_checkout(_user_id uuid,_plan text,_origin text,_prior_trial boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.billing_checkout_state; eligible boolean;
BEGIN
INSERT INTO billing_checkout_state(user_id,plan,origin,trial_used) VALUES(_user_id,_plan,_origin,_prior_trial) ON CONFLICT DO NOTHING;
SELECT * INTO r FROM billing_checkout_state WHERE user_id=_user_id FOR UPDATE;
IF r.expires_at > now() THEN
IF r.plan<>_plan OR r.origin<>_origin THEN RAISE EXCEPTION 'CHECKOUT_PENDING'; END IF;
RETURN jsonb_build_object('attemptId',r.attempt_id,'trialDays',r.trial_days,'url',r.checkout_url,'expiresAt',extract(epoch from r.expires_at)::bigint);
END IF;
eligible := NOT r.trial_used AND NOT _prior_trial AND _plan='starter';
UPDATE billing_checkout_state SET attempt_id=gen_random_uuid(),plan=_plan,origin=_origin,trial_used=r.trial_used OR _prior_trial OR eligible,trial_days=CASE WHEN eligible THEN 14 ELSE 0 END,expires_at=now()+interval '23 hours',checkout_url=NULL WHERE user_id=_user_id RETURNING * INTO r;
RETURN jsonb_build_object('attemptId',r.attempt_id,'trialDays',r.trial_days,'url',NULL,'expiresAt',extract(epoch from r.expires_at)::bigint);
END $$;
REVOKE ALL ON FUNCTION public.claim_billing_checkout(uuid,text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_billing_checkout(uuid,text,text,boolean) TO service_role;