"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase, MOCK_COMMENTS } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Post, Comment } from "@/lib/types";
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  MessageSquare, 
  Send, 
  Trash2, 
  Share2, 
  Tag, 
  CheckCircle2, 
  Sparkles,
  BookOpen
} from "lucide-react";

export default function PostDetailClient({ initialPost }: { initialPost: Post }) {
  const { user, profile } = useAuth();
  const [post] = useState<Post>(initialPost);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [loadingComments, setLoadingComments] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [realtimeCommentsActive, setRealtimeCommentsActive] = useState<boolean>(false);

  useEffect(() => {
    async function loadComments() {
      try {
        const { data, error } = await supabase
          .from("comments")
          .select("*, profiles(*)")
          .eq("post_id", post.id)
          .order("created_at", { ascending: true });

        if (error || !data || data.length === 0) {
          // Filter mock comments for this post
          const postMocks = MOCK_COMMENTS.filter((c) => c.post_id === post.id);
          setComments(postMocks.length > 0 ? postMocks : MOCK_COMMENTS);
        } else {
          setComments(data as Comment[]);
        }
      } catch {
        setComments(MOCK_COMMENTS);
      } finally {
        setLoadingComments(false);
      }
    }

    loadComments();

    // Subscribe to Realtime comment events for this post
    const channel = supabase
      .channel(`comments:${post.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${post.id}`,
        },
        async (payload) => {
          console.log('Realtime comment change:', payload);
          if (payload.eventType === 'INSERT') {
            const newCommentRecord = payload.new as Comment;
            let authorProfile = undefined;
            if (newCommentRecord.user_id) {
              const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', newCommentRecord.user_id)
                .single();
              authorProfile = prof || undefined;
            }

            const completeComment: Comment = {
              ...newCommentRecord,
              profiles: authorProfile,
            };

            setComments((current) => {
              const filtered = current.filter(
                (c) => c.id !== completeComment.id && !c.id.startsWith('comm-temp-')
              );
              return [...filtered, completeComment];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setComments((current) => current.filter((c) => c.id !== deletedId));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeCommentsActive(true);
        } else {
          setRealtimeCommentsActive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmittingComment(true);

    const commentData = {
      post_id: post.id,
      user_id: user.id,
      body: newComment.trim(),
    };

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([commentData])
        .select("*, profiles(*)")
        .single();

      if (error || !data) {
        // Fallback optimistic comment update
        const optimisticComment: Comment = {
          id: `comm-temp-${Date.now()}`,
          post_id: post.id,
          user_id: user.id,
          body: newComment.trim(),
          created_at: new Date().toISOString(),
          profiles: profile || {
            id: user.id,
            display_name: user.email?.split("@")[0] || "User",
            role: "writer",
          },
        };
        setComments([...comments, optimisticComment]);
      } else {
        setComments([...comments, data as Comment]);
      }

      setNewComment("");
    } catch {
      const optimisticComment: Comment = {
        id: `comm-temp-${Date.now()}`,
        post_id: post.id,
        user_id: user.id,
        body: newComment.trim(),
        created_at: new Date().toISOString(),
        profiles: profile || {
          id: user.id,
          display_name: "Author User",
          role: "writer",
        },
      };
      setComments([...comments, optimisticComment]);
      setNewComment("");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await supabase.from("comments").delete().eq("id", commentId);
    } catch {
      console.log("Deleted locally");
    }
    setComments(comments.filter((c) => c.id !== commentId));
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Estimate reading time
  const wordCount = post.markdown.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <article className="max-w-4xl mx-auto space-y-10 py-4">
      {/* Back button & Action Toolbar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-gray-400 hover:text-[#34d399] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </Link>

        <button
          onClick={handleShare}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg glass-panel hover:border-[#10b981]/40 text-xs font-mono text-gray-300 transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
              <span className="text-[#34d399]">URL Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>Share Article</span>
            </>
          )}
        </button>
      </div>

      {/* Header Container */}
      <header className="glass-panel p-8 sm:p-12 rounded-3xl border border-[#10b981]/30 space-y-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          {post.tags.map((t) => (
            <span
              key={t}
              className="px-3 py-1 rounded-full bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 text-xs font-mono"
            >
              #{t}
            </span>
          ))}
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-800 text-xs text-gray-400">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#f59e0b] p-0.5">
              <div className="w-full h-full bg-[#0a1510] rounded-full flex items-center justify-center text-[#34d399] font-bold text-sm">
                {post.profiles?.display_name?.charAt(0) || "A"}
              </div>
            </div>
            <div>
              <div className="font-semibold text-white">
                {post.profiles?.display_name || "Author"}
              </div>
              <div className="text-gray-400 text-[11px] capitalize">
                {post.profiles?.role || "Writer"}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 font-mono text-gray-400">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#34d399]" />
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>{readTime} min read</span>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {post.cover_image && (
        <div className="rounded-3xl overflow-hidden glass-panel border border-[#10b981]/20 max-h-[450px]">
          {/* eslint-disable-next-html-element-suppression */}
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Markdown Body Content */}
      <main className="glass-panel p-8 sm:p-12 rounded-3xl border border-[#10b981]/20 markdown-body shadow-xl">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.markdown}</ReactMarkdown>
      </main>

      {/* Author Info Footer Card */}
      <div className="glass-panel p-6 rounded-2xl border border-[#10b981]/20 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#10b981]/20 flex items-center justify-center border border-[#10b981]/40 text-[#34d399] font-bold text-lg">
            {post.profiles?.display_name?.charAt(0) || "A"}
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              Written by {post.profiles?.display_name || "Author"}
            </div>
            <div className="text-xs text-gray-400">
              Published on Emerald Cloud • Supabase Postgres RLS Secured
            </div>
          </div>
        </div>
        <Link
          href="/"
          className="btn-glass px-4 py-2 rounded-xl text-xs font-semibold"
        >
          View More Articles
        </Link>
      </div>

      {/* Comments Section */}
      <section className="glass-panel p-8 rounded-3xl border border-[#10b981]/20 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-[#34d399]" />
            <span>Discussion ({comments.length})</span>
          </h3>
          {realtimeCommentsActive && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Realtime Sync</span>
            </div>
          )}
        </div>

        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleAddComment} className="space-y-3">
            <div className="text-xs font-medium text-gray-300 flex items-center space-x-1.5">
              <span>Posting as</span>
              <span className="text-[#34d399] font-bold">
                {profile?.display_name || user.email?.split("@")[0]}
              </span>
            </div>
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Write a constructive response..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-4 rounded-xl glass-input text-sm resize-none"
                required
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="btn-emerald absolute right-3 bottom-3 px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Comment</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-[#0a1510] border border-[#10b981]/20 flex items-center justify-between text-xs text-gray-300">
            <span>Sign in to participate in the article discussion</span>
            <Link href="/login" className="btn-emerald px-4 py-2 rounded-lg font-semibold">
              Sign In to Comment
            </Link>
          </div>
        )}

        {/* Comments List */}
        {loadingComments ? (
          <div className="space-y-3">
            <div className="h-16 bg-gray-800/40 rounded-xl animate-pulse"></div>
            <div className="h-16 bg-gray-800/40 rounded-xl animate-pulse"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            No comments yet. Be the first to share your insights!
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 rounded-xl bg-[#0a1510] border border-gray-800/80 space-y-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#10b981]/20 flex items-center justify-center text-[#34d399] font-bold text-[10px]">
                      {comment.profiles?.display_name?.charAt(0) || "U"}
                    </div>
                    <span className="text-xs font-semibold text-white">
                      {comment.profiles?.display_name || "Community Member"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      • {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {user && (user.id === comment.user_id || profile?.role === "admin") && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-300 leading-relaxed pl-8">
                  {comment.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
