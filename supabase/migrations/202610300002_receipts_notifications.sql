begin;
create function portfolio_private.lookup_receipt(p_submission_id uuid,p_payload_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare receipt portfolio_private.contact_receipts; begin
  select * into receipt from portfolio_private.contact_receipts where submission_id=p_submission_id;
  if not found then return null; end if;
  if receipt.payload_hash<>p_payload_hash then raise exception 'idempotency_conflict'; end if;
  return jsonb_build_object('id',receipt.message_id,'replayed',true);
end $$;
create function public.lookup_contact_receipt(p_submission_id uuid,p_payload_hash text) returns jsonb language sql security invoker set search_path='' as $$ select portfolio_private.lookup_receipt(p_submission_id,p_payload_hash); $$;
revoke all on function portfolio_private.lookup_receipt(uuid,text),public.lookup_contact_receipt(uuid,text) from public,anon,authenticated;
grant execute on function portfolio_private.lookup_receipt(uuid,text),public.lookup_contact_receipt(uuid,text) to service_role;
create function portfolio_private.sync_message_notifications() returns trigger language plpgsql security definer set search_path='' as $$ begin
  if old.status is distinct from new.status then
    update public.notifications set read_at=case when new.status='unread' then null else coalesce(read_at,now()) end where message_id=new.id;
  end if;
  return new;
end $$;
revoke all on function portfolio_private.sync_message_notifications() from public,anon,authenticated;
create trigger message_notification_state after update of status on public.messages for each row execute function portfolio_private.sync_message_notifications();
commit;
