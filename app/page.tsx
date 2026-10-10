"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, MOCK_POSTS } from "@/lib/supabase";
import { Post } from "@/lib/types";
import { 
  Search, 
  Tag, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  User, 
  BookOpen, 
  PlusCircle, 
  Database,
  Flame,
  CheckCircle2,
  AlertCircle,
  Radio,
  Zap,
  RefreshCw
} from "lucide-react";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [realtimeActive, setRealtimeActive] = useState<boolean>(false);
  const [realtimeEventsCount, setRealtimeEventsCount] = useState<number>(0);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; isLiveDb: boolean; message: string }>({
    connected: false,
    isLiveDb: false,
    message: "Connecting to Supabase Postgres...",
  });

  async function loadPosts() {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles(*)")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        console.log("Supabase table empty or fallback preview active:", error?.message);
        setPosts(MOCK_POSTS);
        setDbStatus({
          connected: !error,
          isLiveDb: false,
          message: error
            ? "Supabase table query error - check SQL Schema tab"
            : "Connected to Supabase PostgreSQL (0 live rows; previewing seed articles)",
        });
      } else {
        setPosts(data as Post[]);
        setDbStatus({
          connected: true,
          isLiveDb: true,
          message: `Connected to Live Supabase Postgres (${data.length} published articles)`,
        });
      }
    } catch {
      setPosts(MOCK_POSTS);
      setDbStatus({
        connected: false,
        isLiveDb: false,
        message: "Using fallback offline demo feed",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();

    // Subscribe to Supabase Postgres Realtime changes on posts table
    const channel = supabase
      .channel('public:posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        async (payload) => {
          console.log('Realtime post update received:', payload);
          setRealtimeEventsCount((prev) => prev + 1);

          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as Post;
            if (newRecord.published) {
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

              setPosts((current) => {
                const withoutMocks = current.filter((p) => !p.id.startsWith('mock-'));
                const exists = withoutMocks.some((p) => p.id === completePost.id);
                if (exists) return withoutMocks;
                return [completePost, ...withoutMocks];
              });
              setDbStatus((prev) => ({
                ...prev,
                isLiveDb: true,
                message: "Live Supabase Postgres (Realtime post added!)",
              }));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedRecord = payload.new as Post;
            setPosts((current) => {
              if (!updatedRecord.published) {
                return current.filter((p) => p.id !== updatedRecord.id);
              }
              return current.map((p) =>
                p.id === updatedRecord.id
                  ? { ...p, ...updatedRecord, profiles: p.profiles }
                  : p
              );
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setPosts((current) => current.filter((p) => p.id !== deletedId));
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
  }, []);

  // Collect all unique tags across posts
  const allTags = Array.from(
    new Set(posts.flatMap((p) => p.tags || []))
  );

  // Filter posts based on search & tag
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.markdown.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag ? post.tags.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  const featuredPost = posts[0];

  return (
    <div className="space-y-12">
      {/* Database & Realtime Status Toast Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#0a1510] border border-[#10b981]/30 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            {dbStatus.connected ? (
              <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#fbbf24]" />
            )}
            <span className="text-gray-200 font-medium">{dbStatus.message}</span>
          </div>

          {/* Realtime Pulsing Status Indicator */}
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#10b981]/15 border border-[#10b981]/40 text-[#34d399] font-mono text-[11px]">
            {realtimeActive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold">Realtime WebSockets: Active</span>
                {realtimeEventsCount > 0 && (
                  <span className="text-[#fbbf24] font-bold">({realtimeEventsCount} updates)</span>
                )}
              </>
            ) : (
              <>
                <Radio className="w-3 h-3 text-[#fbbf24] animate-pulse" />
                <span className="text-[#fbbf24]">Connecting Realtime...</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadPosts()}
            className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            href="/db-setup"
            className="flex items-center space-x-1 text-[#fbbf24] hover:underline font-mono"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Connection Diagnostics</span>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 border border-[#10b981]/30">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-br from-[#10b981]/20 to-[#f59e0b]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 text-xs text-[#34d399] font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>Next.js App Router + Supabase RLS Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Publishing for the Next Era of{" "}
            <span className="bg-gradient-to-r from-[#34d399] via-[#10b981] to-[#fbbf24] bg-clip-text text-transparent">
              Cloud Architects
            </span>
          </h1>

          <p className="text-lg text-gray-300 leading-relaxed">
            Write markdown articles, secure content with Row-Level Security, render dynamic SEO metadata, and deploy globally in seconds.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="btn-emerald inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Article</span>
            </Link>
            <Link
              href="/db-setup"
              className="btn-glass inline-flex items-center space-x-2 px-5 py-3 rounded-xl font-medium text-sm"
            >
              <Database className="w-4 h-4 text-[#fbbf24]" />
              <span>Database SQL Schema</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Search & Tag Filtering Bar */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search titles, tags, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm focus:ring-1 focus:ring-[#10b981]"
            />
          </div>

          {/* Tags Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTag === null
                  ? "bg-[#10b981] text-black font-semibold shadow-md shadow-[#10b981]/30"
                  : "bg-[#0a1510] text-gray-300 border border-gray-800 hover:border-[#10b981]/40"
              }`}
            >
              All Topics
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedTag === tag
                    ? "bg-[#fbbf24] text-black font-semibold shadow-md shadow-[#fbbf24]/30"
                    : "bg-[#0a1510] text-gray-300 border border-gray-800 hover:border-[#fbbf24]/40"
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Article Card (if available and no active search) */}
      {!searchQuery && !selectedTag && featuredPost && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#fbbf24]">
            <Flame className="w-4 h-4 text-[#f59e0b]" />
            <span>Featured Publication</span>
          </div>

          <div className="glass-panel glass-panel-hover rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 border border-[#10b981]/30">
            {featuredPost.cover_image && (
              <div className="lg:col-span-6 relative h-64 lg:h-full min-h-[300px] overflow-hidden">
                {/* eslint-disable-next-html-element-suppression */}
                <img
                  src={featuredPost.cover_image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050b08] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#091610]" />
              </div>
            )}

            <div className={`p-8 lg:p-10 flex flex-col justify-between space-y-6 ${featuredPost.cover_image ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {featuredPost.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-md bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 text-xs font-mono"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-white hover:text-[#34d399] transition-colors leading-tight">
                  <Link href={`/${featuredPost.slug}`}>{featuredPost.title}</Link>
                </h2>

                <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
                  {featuredPost.markdown.replace(/[#*`_]/g, "").slice(0, 220)}...
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#10b981]/20 flex items-center justify-center border border-[#10b981]/40 text-[#34d399] font-bold text-xs">
                    {featuredPost.profiles?.display_name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {featuredPost.profiles?.display_name || "Author"}
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-[#fbbf24]" />
                      <span>{new Date(featuredPost.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/${featuredPost.slug}`}
                  className="btn-emerald inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  <span>Read Post</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Blog Post Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#34d399]" />
            <span>Articles & Tutorials ({filteredPosts.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl h-64 animate-pulse space-y-4">
                <div className="h-4 bg-gray-800 rounded w-1/3"></div>
                <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                <div className="h-16 bg-gray-800/50 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="glass-panel text-center py-16 px-4 rounded-3xl space-y-4">
            <AlertCircle className="w-12 h-12 text-[#fbbf24] mx-auto opacity-70" />
            <h4 className="text-lg font-bold text-white">No Articles Found</h4>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              No published articles match your current search query &quot;{searchQuery}&quot;. Try resetting your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTag(null);
              }}
              className="btn-emerald px-4 py-2 rounded-lg text-xs font-semibold"
            >
              Clear Search Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between space-y-5 border border-[#10b981]/20"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {post.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-[#10b981]/10 text-[#34d399] text-[11px] font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <h4 className="text-lg font-bold text-white hover:text-[#34d399] transition-colors leading-snug line-clamp-2">
                    <Link href={`/${post.slug}`}>{post.title}</Link>
                  </h4>

                  <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                    {post.markdown.replace(/[#*`_]/g, "").slice(0, 140)}...
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#10b981]/20 flex items-center justify-center text-[#34d399] font-bold text-[11px]">
                      {post.profiles?.display_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className="text-xs text-gray-200 font-medium">
                        {post.profiles?.display_name || "Author"}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(post.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/${post.slug}`}
                    className="text-xs font-semibold text-[#fbbf24] hover:text-[#f59e0b] flex items-center space-x-1"
                  >
                    <span>Read</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}