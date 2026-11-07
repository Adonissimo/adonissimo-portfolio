-- Runs against the actual migrated database. Every fixture is rolled back.
begin;
set local search_path = public, extensions;
create extension if not exists pgtap with schema extensions;
select plan(12);
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000101','rls-owner@example.test','{"display_name":"RLS Owner"}'),
 ('00000000-0000-4000-8000-000000000102','rls-editor@example.test','{"display_name":"RLS Editor","role":"owner"}'),
 ('00000000-0000-4000-8000-000000000103','rls-viewer@example.test','{"display_name":"RLS Viewer","role":"owner"}');
select is((select role from public.profiles where user_id='00000000-0000-4000-8000-000000000103'),'viewer','signup metadata cannot self-promote');
update public.profiles set role='owner' where user_id='00000000-0000-4000-8000-000000000101';
update public.profiles set role='editor' where user_id='00000000-0000-4000-8000-000000000102';
insert into auth.sessions(id,user_id,created_at,updated_at) values
 ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000101',now(),now()),
 ('00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000102',now(),now()),
 ('00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000103',now(),now());
select public.establish_app_session(id,user_id) from auth.sessions where id in ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000203');
insert into public.projects(id,title,slug,description,body,published) values('00000000-0000-4000-8000-000000000301','RLS private fixture','rls-private-fixture','Private test description.','Private test content for database authorization.',false);
insert into public.messages(name,email,subject,body) values('Fixture Sender','fixture@example.test','RLS private letter','This letter must remain restricted to the Owner.');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000103","role":"authenticated","session_id":"00000000-0000-4000-8000-000000000203"}',true);
select throws_ok($$insert into public.projects(title,slug,description,body) values('Denied project','denied-project','Test description.','Test content is denied to a Viewer.')$$,'42501',null,'Viewer cannot create content through the Data API role');
select throws_ok($$update public.profiles set role='owner' where user_id='00000000-0000-4000-8000-000000000103'$$,'42501',null,'Viewer cannot promote itself directly');
select is((select count(*)::integer from public.messages),0,'Viewer cannot read private messages');
select throws_ok($$select public.change_user_role('00000000-0000-4000-8000-000000000103','owner',true)$$,'42501',null,'Viewer cannot invoke Owner role changes');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000102","role":"authenticated","session_id":"00000000-0000-4000-8000-000000000202"}',true);
with removed as(delete from public.projects where id='00000000-0000-4000-8000-000000000301' returning id) select is((select count(*)::integer from removed),0,'Editor cannot delete a project');
select throws_ok($$select public.change_user_role('00000000-0000-4000-8000-000000000103','owner',true)$$,'42501',null,'Editor cannot promote a user');
select is((select count(*)::integer from public.messages),0,'Editor cannot read private messages');
select throws_ok($$insert into public.media(uploader_id,original_path,derivative_path,width,height,bytes) values('00000000-0000-4000-8000-000000000102','arbitrary-original','arbitrary-derivative',100,100,100)$$,'42501',null,'Editor cannot forge media paths to bypass the validated upload pipeline');
select throws_ok($$select public.claim_mail_jobs(1)$$,'42501',null,'Editor cannot access private mail payloads');
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
select is((select count(*)::integer from public.projects where id='00000000-0000-4000-8000-000000000301'),0,'Guest cannot read a draft directly');
reset role;
update portfolio_private.app_sessions set last_activity_at=now()-interval '31 minutes' where session_id='00000000-0000-4000-8000-000000000203';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000103","role":"authenticated","session_id":"00000000-0000-4000-8000-000000000203"}',true);
select is(public.session_eligible(),false,'Idle-expired JWT cannot bypass application session policy');
select * from finish();
rollback;
