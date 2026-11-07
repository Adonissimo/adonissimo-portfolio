import type { MetadataRoute } from 'next';
import { projects } from '@/lib/content';
import { getSiteUrl } from '@/lib/site';
import { backendConfigured } from '@/lib/backend/config';
import { listEntries } from '@/lib/backend/content';
import { publicDb } from '@/lib/backend/db';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site=getSiteUrl();if(!site)return [];
  const paths=['','about','projects','blog','contact','privacy'];
  if(backendConfigured()){
    const db=publicDb();
    for(const kind of ['projects','posts'] as const){
      for(let page=1;page<=20;page++){
        const result=await listEntries(db,kind,new URLSearchParams({page:String(page),limit:'50'}),true);
        paths.push(...result.items.map(item=>`${kind==='posts'?'blog':'projects'}/${item.slug}`));
        if(page*result.limit>=result.total)break;
      }
    }
  }else paths.push(...projects.filter(project=>project.status==='built').map(project=>`projects/${project.slug}`));
  return paths.map(path=>({url:new URL(path,site).href}));
}
