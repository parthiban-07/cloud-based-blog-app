import { createClient } from '@supabase/supabase-js';
import { Post, Comment, Profile } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgbypwayhefvowgohjny.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_F5RnrOO-Hwnas7SLNdAAAA_3w5z_N60';
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
/**
 * Generate URL-friendly slug from title according to specification formula:
 * title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
 */
export function generateSlug(title: string): string {
  if (!title) return 'untitled-post';
  const slug = title
    .toLowerCase()  
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug || 'untitled-post';
}

// Fallback seed posts in case database connection returns empty or table not created yet
export const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    author: 'mock-user-1',
    title: 'Architecting High-Scale Next.js Applications with Supabase & RLS',
    slug: 'architecting-high-scale-nextjs-applications',
    markdown: `
# Architecting Modern Full-Stack Applications

Building modern cloud applications requires selecting an architecture that balances **velocity**, **security**, and **developer experience**.

## Why Next.js + Supabase?

Combining **Next.js App Router** with **Supabase Postgres** grants real-time backend capabilities with zero server management overhead.

> Row-Level Security (RLS) guarantees that access control rules are enforced at the database layer, keeping multi-tenant applications safe from unauthorized access.

### Code Sample: Custom RLS Policies

\`\`\`sql
-- Enable RLS
alter table public.posts enable row level security;

-- Public select policy
create policy "public read published" on public.posts
  for select using (published = true);
\`\`\`

### Key Architecture Pillars:
1. **Server-Side Rendering (SSR)** for blazing fast SEO performance
2. **Instant Auth Context** powered by Supabase JWT tokens
3. **Decoupled Asset Management** using Supabase Storage buckets

Stay tuned for part two of our cloud-native architecture series!
    `,
    published: true,
    tags: ['Next.js', 'Supabase', 'Postgres', 'Architecture'],
    cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    profiles: {
      id: 'mock-user-1',
      display_name: 'Elena Rostova',
      role: 'admin',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    }
  },
  {
    id: 'mock-2',
    author: 'mock-user-2',
    title: 'Designing Emerald-Obsidian Cyber Aesthetics for Web Apps',
    slug: 'designing-emerald-obsidian-cyber-aesthetics',
    markdown: `
# Elevating UI/UX Beyond Generic Themes

Standard default color palettes often feel cold and repetitive. By transitioning to rich **Emerald & Amber Obsidian** themes, we craft memorable visual hierarchy.

## Design Token Blueprint

- **Background Obsidian**: \`#050b08\`
- **Glass Panel Surface**: \`rgba(15, 32, 24, 0.65)\`
- **Neon Emerald Accent**: \`#10b981\`
- **Warm Champagne Gold**: \`#f59e0b\`

\`\`\`css
.glass-panel {
  background: rgba(15, 32, 24, 0.65);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(16, 185, 129, 0.15);
}
\`\`\`

> "A great user interface does not merely display information; it creates an immersive atmosphere."
    `,
    published: true,
    tags: ['UI/UX', 'Design', 'TailwindCSS', 'Frontend'],
    cover_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    profiles: {
      id: 'mock-user-2',
      display_name: 'Marcus Vance',
      role: 'writer',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    }
  },
  {
    id: 'mock-3',
    author: 'mock-user-1',
    title: 'Mastering Dynamic Metadata & Sitemaps in Next.js App Router',
    slug: 'mastering-dynamic-metadata-sitemaps',
    markdown: `
# SEO Mastery with Next.js 16

Dynamic route metadata generation ensures that every single article posted on your platform gets indexed with optimal Open Graph tags, canonical URLs, and structured JSON-LD data.

## Implementing \`generateMetadata\`

\`\`\`typescript
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await fetchPostBySlug(params.slug);
  return {
    title: \`\${post.title} | Cloud Blog\`,
    description: post.markdown.slice(0, 160),
  };
}
\`\`\`

Dynamic sitemap generation guarantees search engine crawlers find new posts immediately after publication!
    `,
    published: true,
    tags: ['SEO', 'Next.js', 'WebDev'],
    cover_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    profiles: {
      id: 'mock-user-1',
      display_name: 'Elena Rostova',
      role: 'admin',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    }
  }
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'comm-1',
    post_id: 'mock-1',
    user_id: 'mock-user-2',
    body: 'Outstanding walkthrough on Row-Level Security! The trigger setup makes multi-tenant security effortless.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    profiles: {
      id: 'mock-user-2',
      display_name: 'Marcus Vance',
      role: 'writer',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    }
  },
  {
    id: 'comm-2',
    post_id: 'mock-1',
    user_id: 'mock-user-3',
    body: 'The emerald dark aesthetics are visually stunning compared to standard blue templates.',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    profiles: {
      id: 'mock-user-3',
      display_name: 'Aria Sterling',
      role: 'reader',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
    }
  }
];

/**
 * Test connectivity to Supabase and Realtime WebSocket channel
 */
export async function testSupabaseRealtimeConnection(): Promise<{
  restOk: boolean;
  realtimeOk: boolean;
  postsCount: number;
  message: string;
}> {
  try {
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        restOk: false,
        realtimeOk: false,
        postsCount: 0,
        message: `Database REST query failed: ${error.message}`,
      };
    }

    return new Promise((resolve) => {
      const channel = supabase.channel(`ping-test-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {})
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            supabase.removeChannel(channel);
            resolve({
              restOk: true,
              realtimeOk: true,
              postsCount: count || 0,
              message: 'Connected to Supabase PostgreSQL & Realtime WebSockets (SUBSCRIBED)',
            });
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            supabase.removeChannel(channel);
            resolve({
              restOk: true,
              realtimeOk: false,
              postsCount: count || 0,
              message: `REST connected (${count || 0} posts), but Realtime status: ${status}`,
            });
          }
        });

      // Timeout fallback
      setTimeout(() => {
        supabase.removeChannel(channel);
        resolve({
          restOk: true,
          realtimeOk: false,
          postsCount: count || 0,
          message: 'Realtime subscription timed out after 5s',
        });
      }, 5000);
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return {
      restOk: false,
      realtimeOk: false,
      postsCount: 0,
      message: `Connection error: ${errMsg}`,
    };
  }
}