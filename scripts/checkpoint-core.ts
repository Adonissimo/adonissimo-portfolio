export type TestActor = 'OWNER' | 'VIEWER';
export type ApiResult = { status: number; data: unknown; requestId?: string };
export type RequestApi = (path: string, method?: string, actor?: TestActor, value?: unknown) => Promise<ApiResult>;
export type Check = { status: 'PASS' | 'FAIL' | 'BLOCKED'; reason: string; evidence: Record<string, string | number | boolean> };
export type ApiChecks = { rolesVerified: boolean; viewerDeletion: Check; auditEdit: Check; cleanup: Check };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isIdentifier = (value: unknown): value is string => typeof value === 'string' && uuidPattern.test(value);
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
export const items = (value: unknown): Record<string, unknown>[] => Array.isArray(object(value).items) ? (object(value).items as unknown[]).map(object) : [];
export const item = (value: unknown) => object(object(value).item);
export const blocked = (reason = 'not_run'): Check => ({ status: 'BLOCKED', reason, evidence: {} });

export class CheckpointFailure extends Error {
  readonly reason: string;
  readonly httpStatus?: number;
  readonly requestId?: string;
  constructor(reason: string, httpStatus?: number, requestId?: string) { super(reason); this.name = 'CheckpointFailure'; this.reason = reason; this.httpStatus = httpStatus; this.requestId = isIdentifier(requestId) ? requestId : undefined; }
}
export function failure(error: unknown): Check {
  const evidence: Check['evidence'] = {};
  if (error instanceof CheckpointFailure) {
    if (error.httpStatus) evidence.httpStatus = error.httpStatus;
    if (error.requestId) evidence.requestId = error.requestId;
  }
  return { status: 'FAIL', reason: error instanceof CheckpointFailure ? error.reason : 'request_failed', evidence };
}
export function expectStatus(result: ApiResult, status: number, reason: string): void {
  if (result.status !== status) throw new CheckpointFailure(reason, result.status, result.requestId);
}

export function siteOrigin(value: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new CheckpointFailure('invalid_site_url'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))) throw new CheckpointFailure('invalid_site_url');
  return url.origin;
}

export function createApiClient(origin: string, fetcher: (url: string, init: RequestInit) => Promise<Response> = fetch) {
  const base = siteOrigin(origin);
  const jars = { OWNER: new Map<string, string>(), VIEWER: new Map<string, string>() };
  const request: RequestApi = async (path, method = 'GET', actor, value) => {
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.includes('\r') || path.includes('\n')) throw new CheckpointFailure('invalid_request_path');
    const url = new URL(path, base);
    if (url.origin !== base) throw new CheckpointFailure('invalid_request_path');
    const headers: Record<string, string> = { Origin: base, 'Content-Type': 'application/json' };
    if (actor) headers.Cookie = [...jars[actor]].map(([name, content]) => `${name}=${content}`).join('; ');
    let response: Response;
    try {
      response = await fetcher(url.href, { method, headers, redirect: 'manual', signal: AbortSignal.timeout(20000), ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
    } catch { throw new CheckpointFailure('network_unavailable'); }
    if (actor) for (const raw of response.headers.getSetCookie()) {
      const [pair, ...attributes] = raw.split(';');
      const separator = pair.indexOf('=');
      if (separator < 1) continue;
      const name = pair.slice(0, separator).trim(); const content = pair.slice(separator + 1);
      if (!content || attributes.some(attribute => /^\s*max-age=0\s*$/i.test(attribute))) jars[actor].delete(name);
      else jars[actor].set(name, content);
    }
    let data: unknown = null;
    try { data = await response.json(); } catch { /* A non-JSON response fails the relevant assertion below. */ }
    const candidate = response.headers.get('x-request-id') || object(data).requestId;
    return { status: response.status, data, ...(isIdentifier(candidate) ? { requestId: candidate } : {}) };
  };
  return { request, clear: () => { jars.OWNER.clear(); jars.VIEWER.clear(); } };
}

async function identity(request: RequestApi, actor: TestActor) {
  const result = await request('/api/session', 'GET', actor);
  expectStatus(result, 200, result.status === 404 ? 'deploy_session_endpoint_first' : 'session_identity_unavailable');
  const user = object(object(result.data).user);
  if (!isIdentifier(user.id) || user.role !== actor.toLowerCase()) throw new CheckpointFailure('test_account_role_mismatch');
  return user.id;
}

// Only a generated draft fixture is mutated. Both identities are verified from
// the protected server endpoint before a deletion denial can count as a pass.
export async function runApiChecks(request: RequestApi, runId: string): Promise<ApiChecks> {
  if (!isIdentifier(runId)) throw new CheckpointFailure('invalid_run_id');
  const result: ApiChecks = { rolesVerified: false, viewerDeletion: blocked(), auditEdit: blocked(), cleanup: blocked('no_fixture') };
  const marker = `phase4-check-${runId}`;
  let fixtureId: string | undefined;
  let creationAttempted = false;
  let creationRejected = false;
  let step: 'viewerDeletion' | 'auditEdit' = 'viewerDeletion';
  try {
    const ownerId = await identity(request, 'OWNER');
    const viewerId = await identity(request, 'VIEWER');
    if (ownerId === viewerId) throw new CheckpointFailure('distinct_test_accounts_required');
    result.rolesVerified = true;
    const draft = { title: marker, slug: marker, description: 'Disposable Phase 4 checkpoint fixture.', body: `Only for the authorized Phase 4 checkpoint: ${runId}`, published: false, stage: 'built', tags: [] };
    creationAttempted = true;
    const created = await request('/api/admin/projects', 'POST', 'OWNER', draft);
    if (created.status >= 400 && created.status < 500) creationRejected = true;
    expectStatus(created, 201, 'owner_fixture_creation_failed');
    const saved = item(created.data);
    if (!isIdentifier(saved.id) || saved.slug !== marker || saved.published !== false) throw new CheckpointFailure('invalid_fixture_response');
    fixtureId = saved.id;
    const query = `/api/admin/projects?q=${encodeURIComponent(marker)}&limit=50`;
    const viewerRead = await request(query, 'GET', 'VIEWER');
    expectStatus(viewerRead, 200, 'viewer_read_failed');
    if (!items(viewerRead.data).some(entry => entry.id === fixtureId)) throw new CheckpointFailure('viewer_cannot_read_fixture');
    const denied = await request(`/api/admin/projects/${fixtureId}`, 'DELETE', 'VIEWER');
    expectStatus(denied, 403, 'viewer_delete_was_not_forbidden');
    const retained = await request(query, 'GET', 'OWNER');
    expectStatus(retained, 200, 'owner_fixture_reload_failed');
    const current = items(retained.data).find(entry => entry.id === fixtureId);
    if (!current) throw new CheckpointFailure('fixture_missing_after_viewer_attempt');
    result.viewerDeletion = { status: 'PASS', reason: 'verified_viewer_received_403_and_fixture_survived', evidence: { httpStatus: 403, authenticatedRole: 'viewer', projectId: fixtureId, fixtureSurvived: true } };
    step = 'auditEdit';
    if (typeof current.updated_at !== 'string') throw new CheckpointFailure('fixture_revision_missing');
    const title = `${marker} edited`;
    const edited = await request(`/api/admin/projects/${fixtureId}`, 'PATCH', 'OWNER', { ...current, title });
    expectStatus(edited, 200, 'owner_edit_failed');
    const reloaded = await request(query, 'GET', 'OWNER');
    expectStatus(reloaded, 200, 'edited_fixture_reload_failed');
    if (!items(reloaded.data).some(entry => entry.id === fixtureId && entry.title === title)) throw new CheckpointFailure('edit_did_not_persist');
    const audit = await request('/api/admin/audit', 'GET', 'OWNER');
    expectStatus(audit, 200, 'audit_read_failed');
    const event = items(audit.data).find(entry => entry.entity === 'projects' && entry.entity_id === fixtureId && entry.action === 'update' && entry.actor_id === ownerId && entry.actor_kind === 'user' && isIdentifier(entry.id));
    if (!event) throw new CheckpointFailure('attributable_edit_audit_missing');
    result.auditEdit = { status: 'PASS', reason: 'persisted_edit_has_matching_owner_audit_entry', evidence: { projectId: fixtureId, auditId: event.id as string, actorMatchesOwner: true, persistedEdit: true } };
  } catch (error) { result[step] = failure(error); }
  finally {
    // If a save response was lost, recover only this run's unique draft marker.
    if (!fixtureId && creationAttempted && !creationRejected && result.rolesVerified) {
      try {
        const lookup = await request(`/api/admin/projects?q=${encodeURIComponent(marker)}&limit=50`, 'GET', 'OWNER');
        expectStatus(lookup, 200, 'fixture_recovery_failed');
        const recovered = items(lookup.data).find(entry => entry.slug === marker && typeof entry.body === 'string' && entry.body.includes(runId));
        if (recovered && isIdentifier(recovered.id)) fixtureId = recovered.id;
        else result.cleanup = { status: 'PASS', reason: 'no_fixture_found_for_this_run', evidence: {} };
      } catch (error) { result.cleanup = failure(error); }
    }
    if (fixtureId) {
      try {
        const removed = await request(`/api/admin/projects/${fixtureId}`, 'DELETE', 'OWNER');
        if (removed.status !== 200 && removed.status !== 404) throw new CheckpointFailure('fixture_cleanup_failed', removed.status);
        result.cleanup = { status: 'PASS', reason: removed.status === 200 ? 'draft_fixture_deleted' : 'fixture_already_absent', evidence: { projectId: fixtureId } };
      } catch (error) { result.cleanup = failure(error); }
    }
  }
  return result;
}

export function contactEvidence(input: { messageId?: string; notificationId?: string; unreadBefore: number; unreadAfter: number; badgeEnabled: boolean; ownerEmail: boolean; senderEmail: boolean; badgeObserved: boolean }): Check {
  const apiConfirmed = isIdentifier(input.messageId) && isIdentifier(input.notificationId) && input.badgeEnabled && Number.isSafeInteger(input.unreadBefore) && input.unreadBefore >= 0 && Number.isSafeInteger(input.unreadAfter) && input.unreadAfter > input.unreadBefore;
  const passed = apiConfirmed && input.ownerEmail === true && input.senderEmail === true && input.badgeObserved === true;
  const evidence: Check['evidence'] = { inboxAndNotificationConfirmed: apiConfirmed, unreadBefore: input.unreadBefore, unreadAfter: input.unreadAfter, ownerEmailObserved: input.ownerEmail === true, senderEmailObserved: input.senderEmail === true, badgeObserved: input.badgeObserved === true, emailVerification: 'operator_observation' };
  if (isIdentifier(input.messageId)) evidence.messageId = input.messageId;
  if (isIdentifier(input.notificationId)) evidence.notificationId = input.notificationId;
  return {
    status: passed ? 'PASS' : 'FAIL', reason: passed ? 'contact_api_and_operator_delivery_observations_confirmed' : 'contact_checkpoint_incomplete',
    evidence
  };
}
