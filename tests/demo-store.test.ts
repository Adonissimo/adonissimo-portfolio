import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DemoStore, type DemoStorage } from '../lib/demo-store.ts';
import { demoKey, initialDemo } from '../lib/phase-three.ts';

function storage(initial: string | null = null): DemoStorage {
  const values = new Map<string,string>();
  if(initial !== null) values.set(demoKey,initial);
  return { getItem: key => values.get(key) ?? null, setItem: (key,value) => { values.set(key,value); }, removeItem: key => { values.delete(key); } };
}

test('demo store hydrates after SSR without changing its stable server snapshot',()=>{
  const store=new DemoStore();const server=store.getServerSnapshot();let reads=0;
  assert.equal(store.getSnapshot().ready,false);
  store.hydrate(()=>{reads++;return storage();});
  store.hydrate(()=>{reads++;return storage();});
  assert.equal(reads,1);assert.equal(store.getSnapshot().ready,true);assert.equal(store.getServerSnapshot(),server);
  assert.equal(server.ready,false);
});

test('consecutive commits use the latest state and notify every mounted consumer',()=>{
  const store=new DemoStore();store.hydrate(()=>storage());let notifications=0;const unsubscribe=store.subscribe(()=>notifications++);
  const first={...initialDemo().projects[0],id:'one',slug:'one'};
  const second={...first,id:'two',slug:'two'};
  assert.equal(store.commit('editor',{type:'save',collection:'projects',entry:first}),'stored');
  assert.equal(store.commit('editor',{type:'save',collection:'projects',entry:second}),'stored');
  assert.deepEqual(store.getSnapshot().state.projects.map(item=>item.id),['portfolio','one','two']);assert.equal(notifications,2);
  unsubscribe();store.reset();assert.equal(notifications,2);
});

test('a storage quota failure preserves edits and leaves the demo usable without claiming a stored save',()=>{
  const store=new DemoStore();store.hydrate(()=>({getItem:()=>null,setItem:()=>{throw Error('Quota');},removeItem:()=>{}}));
  const entry={...initialDemo().posts[0],title:'Updated in memory'};
  assert.equal(store.commit('editor',{type:'save',collection:'posts',entry}),'memory');
  assert.equal(store.getSnapshot().state.posts[0].title,'Updated in memory');
  assert.equal(store.getSnapshot().fatal,false);assert.match(store.getSnapshot().error,/memory only/);
});

test('corrupted storage is recoverable and cannot be silently overwritten by an edit',()=>{
  const disk=storage('not json');const store=new DemoStore();store.hydrate(()=>disk);
  assert.equal(store.getSnapshot().fatal,true);
  assert.equal(store.commit('owner',{type:'settings',settings:initialDemo().settings}),'rejected');
  assert.equal(disk.getItem(demoKey),'not json');store.reset();
  assert.equal(disk.getItem(demoKey),null);assert.equal(store.getSnapshot().fatal,false);assert.equal(store.getSnapshot().error,'');
});

test('denied storage access starts a usable in-memory demo and a failed reset is reported honestly',()=>{
  const store=new DemoStore();store.hydrate(()=>{throw Error('Denied');});
  assert.equal(store.getSnapshot().ready,true);assert.equal(store.getSnapshot().fatal,false);
  assert.equal(store.commit('owner',{type:'settings',settings:{ownerEmail:false,confirmation:false,badge:false}}),'memory');
  store.reset();assert.match(store.getSnapshot().error,/memory only/);assert.equal(store.getSnapshot().fatal,false);
});

test('successful persistence survives a fresh store and clears a previous quota warning',()=>{
  const disk=storage();let reject=true;const store=new DemoStore();store.hydrate(()=>({...disk,setItem:(key,value)=>{if(reject)throw Error('Quota');disk.setItem(key,value);}}));
  const action={type:'settings' as const,settings:{ownerEmail:false,confirmation:true,badge:false}};
  assert.equal(store.commit('owner',action),'memory');reject=false;
  assert.equal(store.commit('owner',action),'stored');assert.equal(store.getSnapshot().error,'');
  const next=new DemoStore();next.hydrate(()=>disk);assert.equal(next.getSnapshot().state.settings.badge,false);
});

test('rejected preview-role changes do not mutate or persist the state',()=>{
  const disk=storage();const store=new DemoStore();store.hydrate(()=>disk);const state=store.getSnapshot().state;
  assert.equal(store.commit('viewer',{type:'delete',collection:'projects',id:'portfolio'}),'rejected');
  assert.equal(store.getSnapshot().state,state);assert.equal(disk.getItem(demoKey),null);
});
