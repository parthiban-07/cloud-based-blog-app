"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, MOCK_POSTS } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Post } from "@/lib/types";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Lock,
  LayoutDashboard,
  ExternalLink,
  ShieldAlert
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, role, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<"all" | "published" | "drafts">("all");
  const [realtimeActive, setRealtimeActive] = useState<boolean>(false);

  useEffect(() => {
    async function loadDashboardPosts() {
      if (!user) {
        setPosts(MOCK_POSTS);
        setLoading(false);
        return;
      }

      try {
        let query = supabase.from("posts").select("*, profiles(*)");
        if (role !== "admin") {
          query = query.eq("author", user.id);
        }

        const { data, error } = await query.order("updated_at", { ascending: false });

        if (error || !data || data.length === 0) {
          setPosts(MOCK_POSTS);
        } else {
          setPosts(data as Post[]);
        }
      } catch {
        setPosts(MOCK_POSTS);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadDashboardPosts();
    }

    // Subscribe to Realtime posts changes for dashboard
    const channel = supabase
      .channel('dashboard:posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        async (payload) => {
          console.log('Dashboard realtime event:', payload);
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as Post;
            if (role === 'admin' || !user || newRecord.author === user.id) {
              let authorProfile = undefined;
              if (newRecord.author) {
                const { data: prof } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', newRecord.author)
                  .single();
                authorProfile = prof || undefined;
              }
              const completePost: Post = {
                ...newRecord,
                profiles: authorProfile,
              };
              setPosts((curr) => {
                const withoutMocks = curr.filter((p) => !p.id.startsWith('mock-'));
                if (withoutMocks.some((p) => p.id === completePost.id)) return withoutMocks;
                return [completePost, ...withoutMocks];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as Post;
            setPosts((curr) =>
              curr.map((p) =>
                p.id === updatedRecord.id
                  ? { ...p, ...updatedRecord, profiles: p.profiles }
                  : p
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setPosts((curr) => curr.filter((p) => p.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeActive(true);
        } else {
          setRealtimeActive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role, authLoading]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this article permanently?")) return;

    try {
      await supabase.from("posts").delete().eq("id", postId);
    } catch {
      console.log("Deleted post locally");
    }

    setPosts(posts.filter((p) => p.id !== postId));
  };

  const handleTogglePublish = async (postItem: Post) => {
    const updatedStatus = !postItem.published;
    try {
      await supabase
        .from("posts")
        .update({ published: updatedStatus, updated_at: new Date().toISOString() })
        .eq("id", postItem.id);
    } catch {
      console.log("Updated local publish state");
    }

    setPosts(
      posts.map((p) =>
        p.id === postItem.id ? { ...p, published: updatedStatus } : p
      )
    );
  };

  if (authLoading) {
    return (
      <div className="text-center py-20 text-gray-400 font-mono text-xs">
        Loading Author Studio...
      </div>
    );
  }

  const filteredPosts = posts.filter((p) => {
    if (filter === "published") return p.published;
    if (filter === "drafts") return !p.published;
    return true;
  });

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;

  return (
    <div className="space-y-8 py-4">
      {/* Dashboard Top Header */}
      <div className="glass-panel p-8 rounded-3xl border border-[#10b981]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 text-xs font-mono">
              <LayoutDashboard className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>Author Studio ({role.toUpperCase()})</span>
            </div>
            {realtimeActive && (
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/30 text-[11px] font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Realtime Sync</span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Content Management Studio
          </h1>
          <p className="text-xs text-gray-300">
            Create articles, publish markdown, and enforce Supabase Postgres RLS policies.
          </p>
        </div>

        <Link
          href="/dashboard/editor"
          className="btn-emerald inline-flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-[#10b981]/25"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </Link>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 flex items-center justify-center text-[#34d399]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{posts.length}</div>
            <div className="text-xs text-gray-400">Total Articles</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{publishedCount}</div>
            <div className="text-xs text-gray-400">Published Live</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-gray-800 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{draftCount}</div>
            <div className="text-xs text-gray-400">Draft Status</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-2">
          {(["all", "published", "drafts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? "bg-[#10b981] text-black shadow-md"
                  : "bg-[#0a1510] text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Post Table / Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400">Loading articles...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="glass-panel text-center py-16 px-4 rounded-3xl space-y-4">
          <FileText className="w-10 h-10 text-[#fbbf24] mx-auto opacity-70" />
          <h3 className="text-base font-bold text-white">No Articles Found</h3>
          <p className="text-xs text-gray-400">You have no articles under the selected filter.</p>
          <Link href="/dashboard/editor" className="btn-emerald inline-block px-4 py-2 rounded-lg text-xs font-semibold">
            Create First Article
          </Link>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-[#10b981]/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050b08] text-gray-400 border-b border-gray-800 font-mono uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Title & Slug</th>
                  <th className="px-6 py-4">Tags</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {filteredPosts.map((postItem) => (
                  <tr key={postItem.id} className="hover:bg-[#10b981]/5 transition-colors">
                    <td className="px-6 py-4 space-y-1">
                      <div className="font-bold text-white text-sm hover:text-[#34d399]">
                        <Link href={`/${postItem.slug}`}>{postItem.title}</Link>
                      </div>
                      <div className="text-[11px] font-mono text-gray-400">
                        /{postItem.slug}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {postItem.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-[#10b981]/15 text-[#34d399] text-[10px] font-mono"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(postItem)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                          postItem.published
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {postItem.published ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-gray-400 font-mono">
                      {new Date(postItem.updated_at || postItem.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        href={`/${postItem.slug}`}
                        className="inline-flex p-2 rounded-lg text-gray-400 hover:text-[#fbbf24] hover:bg-white/5"
                        title="View Article"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      <Link
                        href={`/dashboard/editor?id=${postItem.id}`}
                        className="inline-flex p-2 rounded-lg text-gray-400 hover:text-[#34d399] hover:bg-white/5"
                        title="Edit Article"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDeletePost(postItem.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete Article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
