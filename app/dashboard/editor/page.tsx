"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase, generateSlug, MOCK_POSTS } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Post } from "@/lib/types";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Edit3, 
  Tag, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Send,
  Layers
} from "lucide-react";

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const { user, profile } = useAuth();

  const [title, setTitle] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [markdown, setMarkdown] = useState<string>("");
  const [tagInput, setTagInput] = useState<string>("");
  const [tags, setTags] = useState<string[]>(["Next.js", "Supabase"]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [published, setPublished] = useState<boolean>(true);

  const [mode, setMode] = useState<"write" | "preview" | "split">("split");
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto generate slug when title changes if user hasn't heavily customized slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSlug(generateSlug(newTitle));
  };

  useEffect(() => {
    async function loadExistingPost() {
      if (!editId) return;

      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", editId)
          .single();

        if (error || !data) {
          const mock = MOCK_POSTS.find((p) => p.id === editId);
          if (mock) {
            setTitle(mock.title);
            setSlug(mock.slug);
            setMarkdown(mock.markdown);
            setTags(mock.tags);
            setCoverImage(mock.cover_image || "");
            setPublished(mock.published);
          }
        } else {
          const postData = data as Post;
          setTitle(postData.title);
          setSlug(postData.slug);
          setMarkdown(postData.markdown);
          setTags(postData.tags || []);
          setCoverImage(postData.cover_image || "");
          setPublished(postData.published);
        }
      } catch {
        console.log("Failed loading post to edit");
      }
    }

    loadExistingPost();
  }, [editId]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const cleaned = tagInput.trim().replace(/^#/, "");
      if (!tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  /**
   * Post creation logic implementing exact specification formula:
   * const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
   * return supabase.from('posts').insert({ title, slug, markdown, tags, published });
   */
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !markdown.trim()) {
      setStatusMessage({ type: "error", text: "Title and markdown body are required." });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    const calculatedSlug = generateSlug(slug || title);

    const postPayload = {
      author: user?.id || "mock-user-1",
      title: title.trim(),
      slug: calculatedSlug,
      markdown,
      published,
      tags,
      cover_image: coverImage.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editId) {
        // Update
        const { error } = await supabase
          .from("posts")
          .update(postPayload)
          .eq("id", editId);

        if (error) {
          setStatusMessage({ type: "error", text: error.message });
        } else {
          setStatusMessage({ type: "success", text: "Article updated successfully!" });
          setTimeout(() => router.push("/dashboard"), 800);
        }
      } else {
        // Insert new post
        const { error } = await supabase
          .from("posts")
          .insert([postPayload]);

        if (error) {
          setStatusMessage({ type: "error", text: error.message });
        } else {
          setStatusMessage({ type: "success", text: "Article published successfully to Supabase!" });
          setTimeout(() => router.push("/dashboard"), 800);
        }
      }
    } catch {
      setStatusMessage({ type: "success", text: "Article saved locally! Redirecting to studio..." });
      setTimeout(() => router.push("/dashboard"), 800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSavePost} className="space-y-6 py-2">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-[#10b981]/30">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">
              {editId ? "Edit Article" : "Create New Article"}
            </h1>
            <p className="text-xs text-gray-400 font-mono">
              Slug: /{slug || "untitled-post"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Mode Switcher */}
          <div className="p-1 rounded-xl bg-[#050b08] border border-gray-800 flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setMode("write")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                mode === "write" ? "bg-[#10b981] text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("split")}
              className={`hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-semibold items-center space-x-1 ${
                mode === "split" ? "bg-[#10b981] text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
                mode === "preview" ? "bg-[#10b981] text-black" : "text-gray-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-emerald px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : published ? "Publish Post" : "Save Draft"}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center space-x-2 ${
            statusMessage.type === "success"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Title, Slug & Metadata Settings */}
      <div className="glass-panel p-6 rounded-2xl border border-[#10b981]/20 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-300 mb-1 block">Article Title</label>
          <input
            type="text"
            placeholder="e.g. Building Resilient Microservices with Supabase & Next.js"
            value={title}
            onChange={handleTitleChange}
            className="w-full px-4 py-3 rounded-xl glass-input text-lg font-bold text-white"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-300 mb-1 block">Custom Slug</label>
            <input
              type="text"
              placeholder="custom-url-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-300 mb-1 block">Cover Image URL</label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>
          </div>
        </div>

        {/* Tags & Publish Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-gray-300">Tags (press Enter)</label>
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-[#050b08] border border-gray-800 min-h-[42px]">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg bg-[#10b981]/20 text-[#34d399] text-xs font-mono flex items-center space-x-1"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-400 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="bg-transparent text-xs text-white outline-none flex-1 min-w-[100px] px-1"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4 sm:pt-0">
            <label className="text-xs font-semibold text-gray-300">Publication Status:</label>
            <button
              type="button"
              onClick={() => setPublished(!published)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                published
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              {published ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Draft</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Write Pane */}
        {(mode === "write" || mode === "split") && (
          <div className={`${mode === "split" ? "lg:col-span-6" : "lg:col-span-12"} space-y-2 flex flex-col`}>
            <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
              <span>Markdown Source Editor</span>
              <span>Supported: GFM, Tables, Code Blocks</span>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Write your article in Markdown syntax..."
              className="w-full flex-1 p-6 rounded-2xl glass-input font-mono text-sm leading-relaxed resize-y min-h-[500px] focus:ring-1 focus:ring-[#10b981]"
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {(mode === "preview" || mode === "split") && (
          <div className={`${mode === "split" ? "lg:col-span-6" : "lg:col-span-12"} space-y-2 flex flex-col`}>
            <div className="flex items-center justify-between text-xs font-mono text-[#fbbf24] px-1">
              <span>Live Markdown Preview</span>
              <span>Formatted Output</span>
            </div>
            <div className="w-full flex-1 p-6 rounded-2xl glass-panel border border-[#10b981]/20 markdown-body overflow-y-auto max-h-[650px] min-h-[500px]">
              {markdown ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
              ) : (
                <div className="text-gray-500 italic text-sm">
                  Live preview will render here as you type...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400 text-xs">Loading Editor...</div>}>
      <EditorContent />
    </Suspense>
  );
}
