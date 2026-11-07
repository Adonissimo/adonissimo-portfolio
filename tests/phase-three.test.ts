import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changeDemo, initialDemo, contactErrors, entryError, readDemo, safeMarkdownHref, isRole } from '../lib/phase-three.ts';
test('preview entry workflow creates, edits, publishes and deletes without mutating its input',()=>{const state=initialDemo();const entry={...state.projects[0],id:'new',slug:'new-quest',published:false};const created=changeDemo(state,'editor',{type:'save',collection:'projects',entry});assert.equal(state.projects.length,1);assert.equal(created.projects.length,2);const published=changeDemo(created,'editor',{type:'save',collection:'projects',entry:{...entry,published:true}});assert.equal(published.projects[1].published,true);assert.equal(changeDemo(published,'owner',{type:'delete',collection:'projects',id:'new'}).projects.length,1);});
test('preview role constraints preserve content for viewers and deletion for editors',()=>{const state=initialDemo();assert.equal(changeDemo(state,'viewer',{type:'delete',collection:'projects',id:'portfolio'}),state);assert.equal(changeDemo(state,'editor',{type:'delete',collection:'projects',id:'portfolio'}),state);assert.equal(changeDemo(state,'viewer',{type:'save',collection:'posts',entry:state.posts[0]}),state);assert.equal(changeDemo(state,'editor',{type:'settings',settings:{ownerEmail:false,confirmation:false,badge:false}}),state);});
test('entry validation rejects duplicate slugs, empty content and invalid slugs',()=>{const state=initialDemo();const entry={...state.posts[0],id:'different'};assert.match(entryError(entry,state.posts)!,/already used/);assert.ok(entryError({...entry,slug:'Bad slug'},[]));assert.ok(entryError({...entry,body:''},[]));assert.equal(entryError(state.posts[0],state.posts),undefined);});
test('contact validation reports all errors and accepts bounded sample messages',()=>{assert.equal(Object.keys(contactErrors({name:'',email:'bad',subject:'',body:''})).length,4);assert.deepEqual(contactErrors({name:'Demo visitor',email:'visitor@example.test',subject:'An adventure',body:'A sample message for the journal.'}),{});assert.ok(contactErrors({name:'Demo',email:'a@example.test',subject:'Hello',body:'a'.repeat(4001)}).body);});
test('demo contact inbox tracks unread, archived and spam states',()=>{let state=initialDemo();state=changeDemo(state,'owner',{type:'receive',message:{id:'new',name:'Sample',email:'a@example.test',subject:'Hello',body:'Sample message',status:'unread'}});assert.equal(state.messages.filter(item=>item.status==='unread').length,2);state=changeDemo(state,'owner',{type:'message',id:'new',status:'archived'});assert.equal(state.messages[0].status,'archived');assert.equal(state.messages.filter(item=>item.status==='unread').length,1);});
test('Markdown link allowlist blocks executable protocols and protocol-relative URLs',()=>{for(const link of ['javascript:alert(1)','data:text/html,test','//evil.test','https://user:pass@evil.test'])assert.equal(safeMarkdownHref(link),undefined);assert.equal(safeMarkdownHref('/projects'),'/projects');assert.equal(safeMarkdownHref('https://example.test'),'https://example.test/');});
test('corrupt session data can be rejected and reset rather than crashing an editor',()=>{for(const raw of ['null','{}','not json',JSON.stringify({...initialDemo(),posts:[{}]})])assert.throws(()=>readDemo(raw));assert.deepEqual(readDemo(JSON.stringify(initialDemo())),initialDemo());assert.equal(isRole('superadmin'),false);});
test('preview Owner cannot demote its locked owner record',()=>{const state=initialDemo();assert.equal(changeDemo(state,'owner',{type:'role',id:'owner',role:'viewer'}),state);const next=changeDemo(state,'owner',{type:'role',id:'editor',role:'viewer'});assert.equal(next.users.find(user=>user.id==='editor')?.role,'viewer');});

test('saved demo data rejects duplicate keys, invalid optional URLs and oversized lists',()=>{
 const duplicate=initialDemo();duplicate.projects.push({...duplicate.projects[0]});assert.throws(()=>readDemo(JSON.stringify(duplicate)));
 const malformed=initialDemo();malformed.posts[0].liveUrl='javascript:alert(1)';assert.throws(()=>readDemo(JSON.stringify(malformed)));
 const tooMany=initialDemo();tooMany.messages=Array.from({length:51},(_,i)=>({...tooMany.messages[0],id:String(i)}));assert.throws(()=>readDemo(JSON.stringify(tooMany)));
});

test('entry limits allow editing existing records while blocking a fifty-first record',()=>{
 const base=initialDemo().projects[0];const entries=Array.from({length:50},(_,i)=>({...base,id:String(i),slug:`quest-${i}`}));
 assert.equal(entryError({...entries[0],title:'An edited title'},entries),undefined);
 assert.match(entryError({...base,id:'new',slug:'new'},entries)!,/50 entries/);
});

test('Markdown links reject literal control characters and backslash redirects',()=>{
 for(const href of ['/\\evil.test','/a\u0000b','/a\nb','https://example.test/a b'])assert.equal(safeMarkdownHref(href),undefined);
 assert.equal(safeMarkdownHref('/blog/inside-the-field-journal'),'/blog/inside-the-field-journal');
});

test('demo record creation works without secure-context randomUUID support',async()=>{
 const {createDemoId}=await import('../lib/phase-three.ts');
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 try {
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:undefined});
  assert.match(createDemoId(),/^demo-[a-z0-9]+-[a-z0-9]+$/);
 } finally {
  if(descriptor)Object.defineProperty(globalThis,'crypto',descriptor);
  else Reflect.deleteProperty(globalThis,'crypto');
 }
});
