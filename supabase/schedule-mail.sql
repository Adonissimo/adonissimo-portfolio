-- Optional operator-run scheduler, after configuring Vault secrets through the
-- Supabase dashboard: portfolio_app_origin and portfolio_jobs_secret.
-- Do not put actual credentials into this file or version control.
-- pg_net holds the authorization header briefly in its private request queue;
-- restrict database login/administrative access to trusted operators.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
select cron.schedule('adonissimo-mail-retry','* * * * *',$$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='portfolio_app_origin') || '/api/jobs/email',
    headers := jsonb_strip_nulls(jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='portfolio_jobs_secret'),'x-vercel-protection-bypass',(select decrypted_secret from vault.decrypted_secrets where name='portfolio_vercel_bypass'))),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
$$);
