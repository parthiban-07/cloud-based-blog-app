import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase, MOCK_POSTS } from "@/lib/supabase";
import { Post } from "@/lib/types";
import PostDetailClient from "./PostDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPostData(slug: string): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(*)")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      const mock = MOCK_POSTS.find((p) => p.slug === slug);
      return mock || null;
    }

    return data as Post;
  } catch {
    const mock = MOCK_POSTS.find((p) => p.slug === slug);
    return mock || null;
  }
}

/**
 * Generate SEO metadata per post dynamically according to project requirements
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostData(slug);

  if (!post) {
    return {
      title: "Article Not Found | Emerald Cloud",
    };
  }

  const excerpt = post.markdown.replace(/[#*`_]/g, "").slice(0, 160);

  return {
    title: `${post.title} | Emerald Cloud Blog`,
    description: excerpt,
    openGraph: {
      title: post.title,
      description: excerpt,
      images: post.cover_image ? [{ url: post.cover_image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: excerpt,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostData(slug);

  if (!post) {
    notFound();
  }

  return <PostDetailClient initialPost={post} />;
}
