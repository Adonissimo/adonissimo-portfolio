import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { demoPosts } from '@/lib/phase-three';
import { Markdown } from '@/components/markdown';
import { RealmScene } from '@/components/realm-scene';
import { WorldDivider } from '@/components/world-divider';
import { CmsDetail } from '@/components/cms-detail';
import { CinematicLink as Link } from '@/components/cinematic-link';
import { backendConfigured } from '@/lib/backend/config';
import { publishedEntry } from '@/lib/backend/content';
import { getSiteUrl } from '@/lib/site';
type Props={params:Promise<{slug:string}>};
export const dynamic = 'force-dynamic';
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;
  const post=backendConfigured()?await publishedEntry('posts',slug):demoPosts.find(post=>post.slug===slug&&post.published);
  return {title:post?.title??'Entry not found',description:post?.description,...(post&&getSiteUrl()?{alternates:{canonical:`/blog/${post.slug}`}}:{})};
}
export default async function Page({params}:Props){
  const {slug}=await params;
  if(backendConfigured()){const entry=await publishedEntry('posts',slug);if(!entry)notFound();return <CmsDetail entry={entry} kind="posts"/>;}
  const post=demoPosts.find(post=>post.slug===slug&&post.published);if(!post)notFound();
  return <main id="main" data-realm="depths" className="chapter-page page-shell reading-page"><Link className="quiet-link" href="/blog">Back to field notes</Link><h1>{post.title}</h1><p className="preview-note">Sample article</p><RealmScene realm="depths" className="reading-vista"/><WorldDivider realm="depths"/><Markdown source={post.body}/><Link className="quiet-link" href="/blog">Return to field notes</Link></main>;
}
