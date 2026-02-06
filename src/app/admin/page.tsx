"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { AdminUser, Post, PostCreate, PostUpdate } from "@/lib/types";

type TabKey = "users" | "posts";

const emptyPostForm: PostCreate = {
  type: "文章",
  title: "",
  content: "",
  excerpt: "",
  author: "",
  tags: "",
  cover_url: "",
  image_urls: "",
};

export default function AdminPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState<number | null>(null);
  const [adminName, setAdminName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabKey>("users");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);

  const [postForm, setPostForm] = useState<PostCreate>(emptyPostForm);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);

  const adminQuery = useMemo(() => {
    if (!adminId) return "";
    return `?admin_id=${adminId}`;
  }, [adminId]);

  useEffect(() => {
    const storedId = localStorage.getItem("admin_id");
    const storedName = localStorage.getItem("admin_username");
    if (!storedId) {
      router.replace("/login");
      return;
    }
    setAdminId(Number(storedId));
    setAdminName(storedName ?? "管理员");
  }, [router]);

  useEffect(() => {
    if (!adminId) return;
    loadUsers();
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const loadUsers = async () => {
    if (!adminId) return;
    setError(null);
    setLoadingUsers(true);
    try {
      const data = await apiRequest<AdminUser[]>(`/admin/users${adminQuery}`);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载用户失败");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadPosts = async () => {
    if (!adminId) return;
    setError(null);
    setLoadingPosts(true);
    try {
      const data = await apiRequest<Post[]>(`/admin/posts${adminQuery}`);
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载文章失败");
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminId) return;
    setError(null);
    try {
      const query = `?admin_id=${adminId}&is_admin=${newIsAdmin}`;
      await apiRequest<AdminUser>(`/admin/users${query}`, {
        method: "POST",
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
        }),
      });
      setNewUsername("");
      setNewPassword("");
      setNewIsAdmin(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建用户失败");
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setPostForm({
      type: post.type,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      author: post.author,
      tags: post.tags ?? "",
      cover_url: post.cover_url ?? "",
      image_urls: post.image_urls ?? "",
      owner_id: post.owner_id,
    });
  };

  const resetPostForm = () => {
    setEditingPostId(null);
    setPostForm(emptyPostForm);
  };

  const handleSubmitPost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminId) return;
    setError(null);

    const payload: PostCreate | PostUpdate = {
      ...postForm,
      tags: postForm.tags?.trim() ? postForm.tags : undefined,
      cover_url: postForm.cover_url?.trim() ? postForm.cover_url : undefined,
      image_urls: postForm.image_urls?.trim() ? postForm.image_urls : undefined,
    };

    try {
      if (editingPostId) {
        await apiRequest<Post>(`/admin/posts/${editingPostId}${adminQuery}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest<Post>(`/admin/posts${adminQuery}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      resetPostForm();
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存文章失败");
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!adminId) return;
    if (!confirm("确认删除该文章吗？")) return;
    setError(null);
    try {
      await apiRequest<void>(`/admin/posts/${postId}${adminQuery}`, {
        method: "DELETE",
      });
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除文章失败");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_username");
    router.replace("/login");
  };

  if (!adminId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Admin 管理系统</h1>
            <p className="text-sm text-slate-500">欢迎回来，{adminName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-slate-300"
              onClick={handleLogout}
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              activeTab === "users"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
            onClick={() => setActiveTab("users")}
          >
            用户管理
          </button>
          <button
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              activeTab === "posts"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200"
            }`}
            onClick={() => setActiveTab("posts")}
          >
            文章管理
          </button>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {activeTab === "users" ? (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-semibold text-slate-900">创建用户</h2>
              <form
                className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]"
                onSubmit={handleCreateUser}
              >
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="用户名"
                  value={newUsername}
                  onChange={(event) => setNewUsername(event.target.value)}
                  required
                />
                <input
                  type="password"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="密码"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  新建用户
                </button>
                <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-3">
                  <input
                    type="checkbox"
                    checked={newIsAdmin}
                    onChange={(event) => setNewIsAdmin(event.target.checked)}
                  />
                  设为管理员
                </label>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">用户列表</h2>
                <button
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
                  onClick={loadUsers}
                  disabled={loadingUsers}
                >
                  {loadingUsers ? "刷新中..." : "刷新"}
                </button>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="py-2">ID</th>
                      <th className="py-2">用户名</th>
                      <th className="py-2">是否管理员</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-slate-100">
                        <td className="py-2">{user.id}</td>
                        <td className="py-2">{user.username}</td>
                        <td className="py-2">
                          {user.is_admin ? "是" : "否"}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && !loadingUsers ? (
                      <tr>
                        <td className="py-4 text-slate-400" colSpan={3}>
                          暂无用户数据
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  {editingPostId ? "编辑文章" : "创建文章"}
                </h2>
                {editingPostId ? (
                  <button
                    className="text-sm text-slate-500"
                    onClick={resetPostForm}
                  >
                    取消编辑
                  </button>
                ) : null}
              </div>
              <form className="mt-4 grid gap-4" onSubmit={handleSubmitPost}>
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="标题"
                    value={postForm.title}
                    onChange={(event) =>
                      setPostForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    required
                  />
                  <input
                    type="text"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="作者"
                    value={postForm.author}
                    onChange={(event) =>
                      setPostForm((prev) => ({
                        ...prev,
                        author: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <textarea
                  className="min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="摘要"
                  value={postForm.excerpt}
                  onChange={(event) =>
                    setPostForm((prev) => ({
                      ...prev,
                      excerpt: event.target.value,
                    }))
                  }
                  required
                />
                <textarea
                  className="min-h-[180px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="正文"
                  value={postForm.content}
                  onChange={(event) =>
                    setPostForm((prev) => ({
                      ...prev,
                      content: event.target.value,
                    }))
                  }
                  required
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    type="text"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="类型（默认 文章）"
                    value={postForm.type}
                    onChange={(event) =>
                      setPostForm((prev) => ({
                        ...prev,
                        type: event.target.value,
                      }))
                    }
                  />
                  <input
                    type="text"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="标签（逗号分隔）"
                    value={postForm.tags}
                    onChange={(event) =>
                      setPostForm((prev) => ({
                        ...prev,
                        tags: event.target.value,
                      }))
                    }
                  />
                  <input
                    type="text"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="封面图 URL"
                    value={postForm.cover_url}
                    onChange={(event) =>
                      setPostForm((prev) => ({
                        ...prev,
                        cover_url: event.target.value,
                      }))
                    }
                  />
                </div>
                <input
                  type="text"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="图片 URL 列表（逗号分隔或 JSON）"
                  value={postForm.image_urls}
                  onChange={(event) =>
                    setPostForm((prev) => ({
                      ...prev,
                      image_urls: event.target.value,
                    }))
                  }
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  {editingPostId ? "保存修改" : "创建文章"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">文章列表</h2>
                <button
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
                  onClick={loadPosts}
                  disabled={loadingPosts}
                >
                  {loadingPosts ? "刷新中..." : "刷新"}
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          作者：{post.author} · ID: {post.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600"
                          onClick={() => handleEditPost(post)}
                        >
                          编辑
                        </button>
                        <button
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-500"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {post.excerpt}
                    </p>
                  </div>
                ))}
                {posts.length === 0 && !loadingPosts ? (
                  <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                    暂无文章数据
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
