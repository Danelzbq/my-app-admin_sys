export type AdminLoginResponse = {
  message: string;
  admin_id: number;
  username: string;
};

export type AdminUser = {
  id: number;
  username: string;
  is_admin: boolean;
};

export type Post = {
  id: number;
  type: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  tags?: string | null;
  cover_url?: string | null;
  image_urls?: string | null;
  owner_id: number;
  created_at: string;
};

export type PostCreate = {
  type?: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  tags?: string;
  cover_url?: string;
  image_urls?: string;
  owner_id?: number;
};

export type PostUpdate = Partial<PostCreate>;
