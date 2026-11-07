-- Apply to a dedicated Supabase project with `supabase db push`.
-- Authentication passwords remain exclusively in auth.users / Supabase Auth.
begin;
create schema if not exists portfolio_private;
revoke all on schema portfolio_private from public, anon, authenticated;
grant usage on schema portfolio_private to anon, authenticated, service_role;

create table public.roles (code text primary key check (code in ('owner','editor','viewer')));
insert into public.roles values ('owner'),('editor'),('viewer');
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'viewer' references public.roles(code),
  display_name text not null check (length(display_name) between 1 and 80),
  active boolean not null default true, created_at timestamptz not null default now()
);
create table portfolio_private.app_sessions (
  session_id uuid primary key references auth.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_activity_at timestamptz not null default now(),
  absolute_expires_at timestamptz not null default now() + interval '8 hours',
  revoked_at timestamptz
);
create index app_sessions_user on portfolio_private.app_sessions(user_id);
create table public.notification_preferences (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  owner_email boolean not null default true, sender_confirmation boolean not null default true,
  badge boolean not null default true
);
create table public.tags (
  id uuid primary key default gen_random_uuid(), name text not null unique check(length(name) between 1 and 40),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create table public.media (
  id uuid primary key default gen_random_uuid(), uploader_id uuid references public.profiles(user_id) on delete set null,
  original_path text not null unique, derivative_path text not null unique,
  mime text not null default 'image/webp' check(mime='image/webp'),
  width integer not null check(width between 1 and 1600), height integer not null check(height between 1 and 1600),
  bytes integer not null check(bytes between 1 and 2097152), created_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 2 and 120),
  slug text not null unique check(length(slug)<=100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null check(length(description) between 10 and 500),
  body text not null check(length(body) between 10 and 30000), published boolean not null default false,
  stage text not null default 'built' check(stage in ('built','planned')),
  live_url text check(live_url is null or (length(live_url)<=2048 and live_url ~ '^https://' and live_url !~ '^https://[^/]*@')),
  source_url text check(source_url is null or (length(source_url)<=2048 and source_url ~ '^https://' and source_url !~ '^https://[^/]*@')),
  image_id uuid references public.media(id) on delete set null,
  created_by uuid references public.profiles(user_id) on delete set null,
  updated_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.posts (like public.projects including defaults including constraints including indexes);
alter table public.posts add foreign key(image_id) references public.media(id) on delete set null;
alter table public.posts add foreign key(created_by) references public.profiles(user_id) on delete set null;
alter table public.posts add foreign key(updated_by) references public.profiles(user_id) on delete set null;
create index projects_public_order on public.projects(published,created_at desc,id);
create index posts_public_order on public.posts(published,created_at desc,id);
create table public.project_tags (
  project_id uuid references public.projects(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade, primary key(project_id,tag_id)
);
create table public.post_tags (
  post_id uuid references public.posts(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade, primary key(post_id,tag_id)
);
create index project_tags_reverse on public.project_tags(tag_id,project_id);
create index post_tags_reverse on public.post_tags(tag_id,post_id);
create table public.messages (
  id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 80),
  email text not null check(length(email) between 3 and 254), subject text not null check(length(subject) between 3 and 120),
  body text not null check(length(body) between 10 and 4000),
  status text not null default 'unread' check(status in ('unread','read','archived','spam')),
  consent_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create index messages_status_time on public.messages(status,created_at desc);
create table portfolio_private.contact_receipts (
  submission_id uuid primary key, payload_hash text not null check(length(payload_hash)=64),
  message_id uuid not null references public.messages(id) on delete cascade, created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(user_id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  read_at timestamptz, created_at timestamptz not null default now(), unique(recipient_id,message_id)
);
create index notifications_recipient_unread on public.notifications(recipient_id,read_at,created_at desc);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(user_id) on delete set null,
  actor_kind text not null, action text not null, entity text not null, entity_id text,
  created_at timestamptz not null default now()
);
create index audit_recent on public.audit_logs(created_at desc);
create table portfolio_private.outbox_jobs (
  id uuid primary key default gen_random_uuid(), message_id uuid not null references public.messages(id) on delete cascade,
  recipient_id uuid references public.profiles(user_id) on delete cascade,
  kind text not null check(kind in ('owner_message','sender_confirmation')),
  recipient_email text not null, payload jsonb not null,
  idempotency_key text not null unique,
  status text not null default 'pending' check(status in ('pending','processing','sent','skipped','dead')),
  attempts integer not null default 0, next_attempt_at timestamptz not null default now(),
  first_attempt_at timestamptz, lease_until timestamptz, lease_token uuid,
  provider_id text, last_error_code text, created_at timestamptz not null default now()
);
create index outbox_due on portfolio_private.outbox_jobs(status,next_attempt_at);
create table portfolio_private.rate_limit_buckets (
  key text not null, bucket timestamptz not null, hits integer not null default 1,
  expires_at timestamptz not null, primary key(key,bucket)
);
create index buckets_expiry on portfolio_private.rate_limit_buckets(expires_at);

-- All application tables, including private operational tables, have RLS enabled.
do $$ declare item text; begin
  foreach item in array array['roles','profiles','tags','projects','posts','project_tags','post_tags','media','messages','notifications','notification_preferences','audit_logs'] loop
    execute format('alter table public.%I enable row level security',item);
    execute format('revoke all on public.%I from public, anon, authenticated',item);
  end loop;
  foreach item in array array['app_sessions','contact_receipts','outbox_jobs','rate_limit_buckets'] loop
    execute format('alter table portfolio_private.%I enable row level security',item);
    execute format('revoke all on portfolio_private.%I from public, anon, authenticated',item);
  end loop;
end $$;
grant select on public.roles,public.tags,public.projects,public.posts,public.project_tags,public.post_tags to anon,authenticated;
grant select(id,mime,width,height,bytes,derivative_path,created_at) on public.media to anon,authenticated;
grant select on public.profiles,public.messages,public.notifications,public.notification_preferences,public.audit_logs to authenticated;
grant insert,update,delete on public.projects,public.posts,public.tags,public.project_tags,public.post_tags to authenticated;
grant delete on public.media to authenticated;
grant update(status),delete on public.messages to authenticated;
grant update(read_at) on public.notifications to authenticated;
grant update(owner_email,sender_confirmation,badge) on public.notification_preferences to authenticated;
grant all on all tables in schema portfolio_private to service_role;
grant all on public.roles,public.profiles,public.tags,public.projects,public.posts,public.project_tags,public.post_tags,public.media,public.messages,public.notifications,public.notification_preferences,public.audit_logs to service_role;

create function portfolio_private.session_eligible() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from portfolio_private.app_sessions s join auth.sessions a on a.id=s.session_id and a.user_id=s.user_id
    where s.session_id=nullif(auth.jwt()->>'session_id','')::uuid and s.user_id=auth.uid() and s.revoked_at is null
      and s.last_activity_at>now()-interval '30 minutes' and s.absolute_expires_at>now());
$$;
create function portfolio_private.current_role() returns text language sql stable security definer set search_path='' as $$
  select role from public.profiles where user_id=auth.uid() and active and portfolio_private.session_eligible();
$$;
create function public.session_eligible() returns boolean language sql stable security invoker set search_path='' as $$ select portfolio_private.session_eligible(); $$;
create policy role_vocabulary on public.roles for select to anon,authenticated using(true);
create policy tag_vocabulary on public.tags for select to anon,authenticated using(true);
create policy profile_read on public.profiles for select to authenticated using(portfolio_private.session_eligible() and (user_id=auth.uid() or portfolio_private.current_role()='owner'));
create policy projects_read on public.projects for select to anon,authenticated using(published or portfolio_private.current_role() in ('owner','editor','viewer'));
create policy projects_create on public.projects for insert to authenticated with check(portfolio_private.current_role() in ('owner','editor'));
create policy projects_edit on public.projects for update to authenticated using(portfolio_private.current_role() in ('owner','editor')) with check(portfolio_private.current_role() in ('owner','editor'));
create policy projects_delete on public.projects for delete to authenticated using(portfolio_private.current_role()='owner');
create policy posts_read on public.posts for select to anon,authenticated using(published or portfolio_private.current_role() in ('owner','editor','viewer'));
create policy posts_create on public.posts for insert to authenticated with check(portfolio_private.current_role() in ('owner','editor'));
create policy posts_edit on public.posts for update to authenticated using(portfolio_private.current_role() in ('owner','editor')) with check(portfolio_private.current_role() in ('owner','editor'));
create policy posts_delete on public.posts for delete to authenticated using(portfolio_private.current_role()='owner');
create policy tags_create on public.tags for insert to authenticated with check(portfolio_private.current_role() in ('owner','editor'));
create policy tags_edit on public.tags for update to authenticated using(portfolio_private.current_role() in ('owner','editor')) with check(portfolio_private.current_role() in ('owner','editor'));
create policy tags_delete on public.tags for delete to authenticated using(portfolio_private.current_role()='owner');
create policy project_tags_read on public.project_tags for select to anon,authenticated using(exists(select 1 from public.projects p where p.id=project_id));
create policy post_tags_read on public.post_tags for select to anon,authenticated using(exists(select 1 from public.posts p where p.id=post_id));
create policy project_tags_write on public.project_tags for all to authenticated using(portfolio_private.current_role() in ('owner','editor')) with check(portfolio_private.current_role() in ('owner','editor'));
create policy post_tags_write on public.post_tags for all to authenticated using(portfolio_private.current_role() in ('owner','editor')) with check(portfolio_private.current_role() in ('owner','editor'));
create policy media_read on public.media for select to anon,authenticated using(portfolio_private.current_role() in ('owner','editor') or exists(select 1 from public.projects p where p.image_id=media.id and p.published) or exists(select 1 from public.posts p where p.image_id=media.id and p.published));
create policy media_create on public.media for insert to authenticated with check(portfolio_private.current_role() in ('owner','editor') and uploader_id=auth.uid());
create policy media_edit on public.media for update to authenticated using(portfolio_private.current_role()='owner') with check(portfolio_private.current_role()='owner');
create policy media_delete on public.media for delete to authenticated using(portfolio_private.current_role()='owner');
create policy messages_read on public.messages for select to authenticated using(portfolio_private.current_role()='owner');
create policy messages_edit on public.messages for update to authenticated using(portfolio_private.current_role()='owner') with check(portfolio_private.current_role()='owner');
create policy messages_delete on public.messages for delete to authenticated using(portfolio_private.current_role()='owner');
create policy notifications_read on public.notifications for select to authenticated using(portfolio_private.current_role()='owner' and recipient_id=auth.uid());
create policy notifications_edit on public.notifications for update to authenticated using(portfolio_private.current_role()='owner' and recipient_id=auth.uid()) with check(portfolio_private.current_role()='owner' and recipient_id=auth.uid());
create policy preferences_read on public.notification_preferences for select to authenticated using(portfolio_private.current_role()='owner' and user_id=auth.uid());
create policy preferences_edit on public.notification_preferences for update to authenticated using(portfolio_private.current_role()='owner' and user_id=auth.uid()) with check(portfolio_private.current_role()='owner' and user_id=auth.uid());
create policy audit_read on public.audit_logs for select to authenticated using(portfolio_private.current_role()='owner');

create function portfolio_private.new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(user_id,display_name,role) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),nullif(new.raw_user_meta_data->>'full_name',''),nullif(new.raw_user_meta_data->>'name',''),'Adventurer'),80),'viewer');
  insert into public.notification_preferences(user_id) values(new.id);
  return new;
end $$;
create trigger portfolio_new_user after insert on auth.users for each row execute function portfolio_private.new_user();
create function portfolio_private.audit_mutation() returns trigger language plpgsql security definer set search_path='' as $$
declare row_data jsonb; begin
  if tg_op='DELETE' then row_data=to_jsonb(old); else row_data=to_jsonb(new); end if;
  insert into public.audit_logs(actor_id,actor_kind,action,entity,entity_id)
    values(auth.uid(),case when auth.uid() is not null then 'user' else 'service' end,lower(tg_op),tg_table_name,
      coalesce(row_data->>'id',row_data->>'user_id',row_data->>'project_id',row_data->>'post_id'));
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
do $$ declare item text; begin
  foreach item in array array['profiles','tags','projects','posts','project_tags','post_tags','media','messages','notifications','notification_preferences'] loop
    execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function portfolio_private.audit_mutation()',item);
  end loop;
end $$;
create function portfolio_private.content_actor() returns trigger language plpgsql set search_path='' as $$ begin
  new.updated_at=now(); new.updated_by=coalesce(auth.uid(),new.updated_by);
  if tg_op='INSERT' then new.created_by=coalesce(auth.uid(),new.created_by); else new.created_by=old.created_by; new.created_at=old.created_at; end if;
  return new;
end $$;
create trigger projects_actor before insert or update on public.projects for each row execute function portfolio_private.content_actor();
create trigger posts_actor before insert or update on public.posts for each row execute function portfolio_private.content_actor();

-- Exposed RPCs are SECURITY INVOKER. Privileged implementations are non-exposed,
-- pinned-search-path functions with explicit service-only or identity checks.
create function portfolio_private.establish_session(p_session_id uuid,p_user_id uuid) returns boolean language plpgsql security definer set search_path='' as $$ begin
  if not exists(select 1 from auth.sessions where id=p_session_id and user_id=p_user_id) then return false; end if;
  insert into portfolio_private.app_sessions(session_id,user_id) values(p_session_id,p_user_id) on conflict do nothing;
  return exists(select 1 from portfolio_private.app_sessions where session_id=p_session_id and user_id=p_user_id and revoked_at is null and last_activity_at>now()-interval '30 minutes' and absolute_expires_at>now());
end $$;
create function public.establish_app_session(p_session_id uuid,p_user_id uuid) returns boolean language sql security invoker set search_path='' as $$ select portfolio_private.establish_session(p_session_id,p_user_id); $$;
create function portfolio_private.touch_session(p_session_id uuid,p_user_id uuid) returns boolean language plpgsql security definer set search_path='' as $$ begin
  update portfolio_private.app_sessions set last_activity_at=now() where session_id=p_session_id and user_id=p_user_id and revoked_at is null and last_activity_at>now()-interval '30 minutes' and absolute_expires_at>now() and exists(select 1 from auth.sessions where id=p_session_id and user_id=p_user_id);
  return found;
end $$;
create function public.touch_app_session(p_session_id uuid,p_user_id uuid) returns boolean language sql security invoker set search_path='' as $$ select portfolio_private.touch_session(p_session_id,p_user_id); $$;
create function portfolio_private.revoke_session(p_session_id uuid,p_user_id uuid) returns void language sql security definer set search_path='' as $$ update portfolio_private.app_sessions set revoked_at=now() where session_id=p_session_id and user_id=p_user_id; $$;
create function public.revoke_app_session(p_session_id uuid,p_user_id uuid) returns void language sql security invoker set search_path='' as $$ select portfolio_private.revoke_session(p_session_id,p_user_id); $$;

create function public.save_content(p_kind text,p_entry jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare record_id uuid; tag_id uuid; label text; tag_slug text; count_rows integer; exists_row boolean; join_table text; join_column text;
begin
  if portfolio_private.current_role() not in ('owner','editor') or portfolio_private.current_role() is null then raise insufficient_privilege; end if;
  if p_kind not in ('projects','posts') then raise invalid_parameter_value; end if;
  if jsonb_typeof(p_entry->'tags')<>'array' or jsonb_array_length(p_entry->'tags')>12 then raise invalid_parameter_value; end if;
  record_id=nullif(p_entry->>'id','')::uuid;
  if record_id is null then
    execute format('insert into public.%I(title,slug,description,body,published,stage,live_url,source_url,image_id) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id',p_kind)
      into record_id using p_entry->>'title',p_entry->>'slug',p_entry->>'description',p_entry->>'body',(p_entry->>'published')::boolean,coalesce(p_entry->>'stage','built'),nullif(p_entry->>'live_url',''),nullif(p_entry->>'source_url',''),nullif(p_entry->>'image_id','')::uuid;
  else
    execute format('update public.%I set title=$1,slug=$2,description=$3,body=$4,published=$5,stage=$6,live_url=$7,source_url=$8,image_id=$9 where id=$10 and updated_at=$11',p_kind)
      using p_entry->>'title',p_entry->>'slug',p_entry->>'description',p_entry->>'body',(p_entry->>'published')::boolean,coalesce(p_entry->>'stage','built'),nullif(p_entry->>'live_url',''),nullif(p_entry->>'source_url',''),nullif(p_entry->>'image_id','')::uuid,record_id,(p_entry->>'updated_at')::timestamptz;
    get diagnostics count_rows=row_count;
    if count_rows=0 then
      execute format('select exists(select 1 from public.%I where id=$1)',p_kind) into exists_row using record_id;
      if not exists_row then raise no_data_found; end if;
      raise exception using errcode='40001',message='revision_conflict';
    end if;
  end if;
  join_table=case when p_kind='projects' then 'project_tags' else 'post_tags' end;
  join_column=case when p_kind='projects' then 'project_id' else 'post_id' end;
  execute format('delete from public.%I where %I=$1',join_table,join_column) using record_id;
  for label in select distinct jsonb_array_elements_text(p_entry->'tags') loop
    label=trim(label); tag_slug=trim(both '-' from regexp_replace(lower(label),'[^a-z0-9]+','-','g'));
    if length(label) not between 1 and 40 or tag_slug='' then raise invalid_parameter_value; end if;
    insert into public.tags(name,slug) values(label,tag_slug) on conflict(name) do update set name=excluded.name returning id into tag_id;
    execute format('insert into public.%I(%I,tag_id) values($1,$2) on conflict do nothing',join_table,join_column) using record_id,tag_id;
  end loop;
  return record_id;
end $$;
create function portfolio_private.change_role(p_user_id uuid,p_role text,p_active boolean) returns void language plpgsql security definer set search_path='' as $$
declare previous public.profiles; begin
  if portfolio_private.current_role()<>'owner' or portfolio_private.current_role() is null then raise insufficient_privilege; end if;
  if p_role not in ('owner','editor','viewer') then raise invalid_parameter_value; end if;
  perform pg_advisory_xact_lock(724019);
  select * into previous from public.profiles where user_id=p_user_id for update;
  if not found then raise no_data_found; end if;
  if previous.role='owner' and previous.active and (p_role<>'owner' or not p_active) and (select count(*) from public.profiles where role='owner' and active)<=1 then raise exception 'last_owner'; end if;
  update public.profiles set role=p_role,active=p_active where user_id=p_user_id;
end $$;
create function public.change_user_role(p_user_id uuid,p_role text,p_active boolean) returns void language sql security invoker set search_path='' as $$ select portfolio_private.change_role(p_user_id,p_role,p_active); $$;
create function portfolio_private.bootstrap_owner(p_user_id uuid) returns void language plpgsql security definer set search_path='' as $$ begin
  perform pg_advisory_xact_lock(724019);
  if exists(select 1 from public.profiles where role='owner' and active and user_id<>p_user_id) then raise exception 'owner_already_exists'; end if;
  update public.profiles set role='owner',active=true where user_id=p_user_id;
  if not found then raise no_data_found; end if;
end $$;
create function public.bootstrap_owner(p_user_id uuid) returns void language sql security invoker set search_path='' as $$ select portfolio_private.bootstrap_owner(p_user_id); $$;

create function portfolio_private.take_limit(p_key text,p_limit integer,p_window_seconds integer) returns boolean language plpgsql security definer set search_path='' as $$
declare start_at timestamptz; used integer; begin
  if length(p_key)<>64 or p_limit not between 1 and 1000 or p_window_seconds not between 10 and 86400 then raise invalid_parameter_value; end if;
  start_at=to_timestamp(floor(extract(epoch from now())/p_window_seconds)*p_window_seconds);
  insert into portfolio_private.rate_limit_buckets(key,bucket,expires_at) values(p_key,start_at,start_at+make_interval(secs=>p_window_seconds))
    on conflict(key,bucket) do update set hits=portfolio_private.rate_limit_buckets.hits+1 returning hits into used;
  delete from portfolio_private.rate_limit_buckets where expires_at<now()-interval '1 day';
  return used<=p_limit;
end $$;
create function public.take_rate_limit(p_key text,p_limit integer,p_window_seconds integer) returns boolean language sql security invoker set search_path='' as $$ select portfolio_private.take_limit(p_key,p_limit,p_window_seconds); $$;
create function portfolio_private.accept_contact(p_submission_id uuid,p_payload_hash text,p_name text,p_email text,p_subject text,p_body text) returns jsonb language plpgsql security definer set search_path='' as $$
declare receipt portfolio_private.contact_receipts; new_id uuid; person record; payload jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_submission_id::text,0));
  select * into receipt from portfolio_private.contact_receipts where submission_id=p_submission_id;
  if found then
    if receipt.payload_hash<>p_payload_hash then raise exception 'idempotency_conflict'; end if;
    return jsonb_build_object('id',receipt.message_id,'replayed',true);
  end if;
  if not exists(select 1 from public.profiles where role='owner' and active) then raise exception 'owner_not_configured'; end if;
  insert into public.messages(name,email,subject,body) values(p_name,p_email,p_subject,p_body) returning id into new_id;
  insert into portfolio_private.contact_receipts(submission_id,payload_hash,message_id) values(p_submission_id,p_payload_hash,new_id);
  payload=jsonb_build_object('name',p_name,'email',p_email,'subject',p_subject,'body',p_body);
  for person in select p.user_id,u.email,n.owner_email,n.badge from public.profiles p join auth.users u on u.id=p.user_id join public.notification_preferences n on n.user_id=p.user_id where p.role='owner' and p.active loop
    if person.badge then insert into public.notifications(recipient_id,message_id) values(person.user_id,new_id); end if;
    if person.owner_email then insert into portfolio_private.outbox_jobs(message_id,recipient_id,kind,recipient_email,payload,idempotency_key) values(new_id,person.user_id,'owner_message',person.email,payload,'contact/'||new_id||'/owner/'||person.user_id); end if;
  end loop;
  if exists(select 1 from public.profiles p join public.notification_preferences n on n.user_id=p.user_id where p.role='owner' and p.active and n.sender_confirmation) then
    insert into portfolio_private.outbox_jobs(message_id,kind,recipient_email,payload,idempotency_key) values(new_id,'sender_confirmation',p_email,payload,'contact/'||new_id||'/confirmation');
  end if;
  return jsonb_build_object('id',new_id,'replayed',false);
end $$;
create function public.accept_contact(p_submission_id uuid,p_payload_hash text,p_name text,p_email text,p_subject text,p_body text) returns jsonb language sql security invoker set search_path='' as $$ select portfolio_private.accept_contact(p_submission_id,p_payload_hash,p_name,p_email,p_subject,p_body); $$;
create function portfolio_private.claim_mail(p_limit integer) returns setof jsonb language plpgsql security definer set search_path='' as $$
declare job portfolio_private.outbox_jobs; allowed boolean; begin
  update portfolio_private.outbox_jobs set status='dead',last_error_code='retry_window_expired' where status in ('pending','processing') and (attempts>=6 or first_attempt_at<now()-interval '23 hours') and (lease_until is null or lease_until<now());
  for job in select * from portfolio_private.outbox_jobs where (status='pending' and next_attempt_at<=now()) or (status='processing' and lease_until<now()) order by created_at limit least(greatest(p_limit,1),10) for update skip locked loop
    if job.kind='owner_message' then
      allowed=exists(select 1 from public.profiles p join auth.users u on u.id=p.user_id join public.notification_preferences n on n.user_id=p.user_id where p.user_id=job.recipient_id and p.role='owner' and p.active and n.owner_email and u.email=job.recipient_email);
    else
      allowed=exists(select 1 from public.profiles p join public.notification_preferences n on n.user_id=p.user_id where p.role='owner' and p.active and n.sender_confirmation);
    end if;
    if not allowed then update portfolio_private.outbox_jobs set status='skipped' where id=job.id; continue; end if;
    update portfolio_private.outbox_jobs set status='processing',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=now()+interval '2 minutes',first_attempt_at=coalesce(first_attempt_at,now()) where id=job.id returning * into job;
    return next to_jsonb(job);
  end loop;
end $$;
create function public.claim_mail_jobs(p_limit integer) returns setof jsonb language sql security invoker set search_path='' as $$ select * from portfolio_private.claim_mail(p_limit); $$;
create function portfolio_private.finish_mail(p_id uuid,p_lease uuid,p_success boolean,p_provider_id text,p_error_code text,p_permanent boolean) returns void language plpgsql security definer set search_path='' as $$ begin
  update portfolio_private.outbox_jobs set status=case when p_success then 'sent' when p_permanent or attempts>=6 then 'dead' else 'pending' end,
    provider_id=left(p_provider_id,200),last_error_code=left(p_error_code,80),lease_until=null,lease_token=null,
    next_attempt_at=now()+make_interval(secs=>least(3600,(30*power(2,greatest(0,attempts-1)))::integer))
    where id=p_id and status='processing' and lease_token=p_lease;
end $$;
create function public.finish_mail_job(p_id uuid,p_lease uuid,p_success boolean,p_provider_id text,p_error_code text,p_permanent boolean) returns void language sql security invoker set search_path='' as $$ select portfolio_private.finish_mail(p_id,p_lease,p_success,p_provider_id,p_error_code,p_permanent); $$;
create function public.healthcheck() returns boolean language sql stable security invoker set search_path='' as $$ select true; $$;

-- Strip default PUBLIC function execution, then grant only the intended callers.
do $$ declare fn record; begin
  for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='portfolio_private' or (n.nspname='public' and p.proname in ('session_eligible','establish_app_session','touch_app_session','revoke_app_session','save_content','change_user_role','bootstrap_owner','take_rate_limit','accept_contact','claim_mail_jobs','finish_mail_job','healthcheck')) loop
    execute format('revoke all on function %s from public, anon, authenticated',fn.signature);
    execute format('grant execute on function %s to service_role',fn.signature);
  end loop;
end $$;
grant execute on function portfolio_private.session_eligible(),portfolio_private.current_role() to anon,authenticated;
grant execute on function public.session_eligible(),public.save_content(text,jsonb),public.change_user_role(uuid,text,boolean),portfolio_private.change_role(uuid,text,boolean) to authenticated;
grant execute on function public.healthcheck() to anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('portfolio-media','portfolio-media',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- No browser storage-object write/read policies: validated uploads and authorized
-- downloads go through the server; the bucket and all originals stay private.
commit;
