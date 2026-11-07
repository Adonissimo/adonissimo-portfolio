// Real HTTP authorization tests. Requires the configured app and three real
// confirmed accounts; no mocked auth, public demo roles or skipped success.
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
if (existsSync('.env.integration')) process.loadEnvFile('.env.integration');
const needed = name => { const value=process.env[name]; if(!value)throw new Error(`Integration setup missing: ${name}. See docs/PHASE_4.md. No live test has run.`); return value; };
const origin = new URL(needed('BACKEND_TEST_URL')).origin;
const accounts = Object.fromEntries(['OWNER','EDITOR','VIEWER'].map(role=>[role,{email:needed(`TEST_${role}_EMAIL`),password:needed(`TEST_${role}_PASSWORD`)}]));
const sessions = {}; let fixtureId; let ownerId; const marker=`phase4-check-${randomUUID()}`;
async function request(path, method='GET', role, value) {
  const response=await fetch(`${origin}${path}`,{method,headers:{Origin:origin,'Content-Type':'application/json',...(role?{Cookie:sessions[role]}:{})},...(value===undefined?{}:{body:JSON.stringify(value)}),redirect:'manual',signal:AbortSignal.timeout(20000)});
  return {response,body:await response.json().catch(()=>null)};
}
before(async()=>{
  for(const [role,account] of Object.entries(accounts)){
    const result=await request('/api/auth/login','POST',undefined,account);
    assert.equal(result.response.status,200,`Real ${role} sign-in failed. Check configuration and confirmed test accounts.`);
    sessions[role]=result.response.headers.getSetCookie().map(cookie=>cookie.split(';')[0]).join('; ');
    assert.ok(sessions[role],`No authenticated ${role} cookie was returned.`);
    const identity=await request('/api/session','GET',role);
    assert.equal(identity.response.status,200,'Deploy the protected session endpoint before integration tests.');
    assert.equal(identity.body?.user?.role,role.toLowerCase(),'Test account has the wrong server-side role.');
    if(role==='OWNER')ownerId=identity.body.user.id;
  }
  const created=await request('/api/admin/projects','POST','OWNER',{title:marker,slug:marker,description:'A disposable authorization test fixture.',body:'This project is created only for the live authorization test.',published:false,tags:[],stage:'built'});
  assert.equal(created.response.status,201);fixtureId=created.body.item.id;
});
after(async()=>{
  if(fixtureId)await request(`/api/admin/projects/${fixtureId}`,'DELETE','OWNER');
  for(const role of Object.keys(sessions))await request('/api/auth/logout','POST',role,{});
});
test('real Viewer is denied content creation with 403',async()=>{
  const result=await request('/api/admin/projects','POST','VIEWER',{title:'Denied entry'});assert.equal(result.response.status,403);
});
test('real Viewer is denied project deletion with 403',async()=>{
  const result=await request(`/api/admin/projects/${fixtureId}`,'DELETE','VIEWER');assert.equal(result.response.status,403);
});
test('real Editor is denied project deletion with 403',async()=>{
  const result=await request(`/api/admin/projects/${fixtureId}`,'DELETE','EDITOR');assert.equal(result.response.status,403);
});
test('real Editor is denied user role management with 403',async()=>{
  const result=await request(`/api/admin/users/${randomUUID()}`,'PATCH','EDITOR',{role:'owner',active:true});assert.equal(result.response.status,403);
});
test('real Editor is denied private visitor correspondence with 403',async()=>{
  const result=await request('/api/admin/messages','GET','EDITOR');assert.equal(result.response.status,403);
});
test('an old public demo Owner cookie cannot authenticate',async()=>{
  const response=await fetch(`${origin}/api/admin/projects`,{headers:{Cookie:'adonissimo-demo-role=owner'},redirect:'manual'});assert.equal(response.status,401);
});
test('unpublished content is excluded from public data',async()=>{
  const result=await request(`/api/content/projects?q=${marker}`);assert.equal(result.response.status,200);assert.equal(result.body.items.some(item=>item.id===fixtureId),false);
  const detail=await request(`/api/content/projects/${marker}`);assert.equal(detail.response.status,404);
});
test('a real Owner edit persists and creates an attributable audit entry',async()=>{
  const loaded=await request(`/api/admin/projects?q=${marker}`,'GET','OWNER');
  assert.equal(loaded.response.status,200);
  const current=loaded.body.items.find(item=>item.id===fixtureId);assert.ok(current);
  const updated=await request(`/api/admin/projects/${fixtureId}`,'PATCH','OWNER',{...current,title:`${marker} edited`});
  assert.equal(updated.response.status,200);
  const reloaded=await request(`/api/admin/projects?q=${marker}`,'GET','OWNER');
  assert.equal(reloaded.body.items.find(item=>item.id===fixtureId)?.title,`${marker} edited`);
  const audit=await request('/api/admin/audit','GET','OWNER');assert.equal(audit.response.status,200);
  assert.ok(audit.body.items.some(item=>item.entity==='projects'&&item.entity_id===fixtureId&&item.action==='update'&&item.actor_id===ownerId&&item.actor_kind==='user'));
});
