import { MetadataRoute } from 'next';
import { supabase, MOCK_POSTS } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cloud-blog-platform.vercel.app';

  let postRoutes: MetadataRoute.Sitemap = [];

  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, updated_at')
      .eq('published', true);

    if (posts && posts.length > 0) {
      postRoutes = posts.map((post: { slug: string; updated_at?: string }) => ({
        url: `${baseUrl}/${post.slug}`,
        lastModified: new Date(post.updated_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    } else {
      postRoutes = MOCK_POSTS.map((post) => ({
        url: `${baseUrl}/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch {
    postRoutes = MOCK_POSTS.map((post) => ({
      url: `${baseUrl}/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/db-setup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...postRoutes,
  ];
}
