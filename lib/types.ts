export type UserRole = 'admin' | 'writer' | 'reader';

export interface Profile {
  id: string;
  display_name: string | null;
  role: UserRole;
  avatar_url?: string | null;
  created_at?: string;
}

export interface Post {
  id: string;
  author: string;
  title: string;
  slug: string;
  markdown: string;
  published: boolean;
  tags: string[];
  cover_image?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: Profile | null;
}

export interface CreatePostInput {
  title: string;
  markdown: string;
  tags: string[];
  published: boolean;
  cover_image?: string;
}
