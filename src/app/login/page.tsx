"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest } from "@/lib/api";
import type { AdminLoginResponse, AdminRegisterResponse } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/admin/login" : "/admin/register";
      const data = await apiRequest<AdminLoginResponse | AdminRegisterResponse>(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify({ username, password }),
        }
      );

      localStorage.setItem("admin_id", String(data.admin_id));
      localStorage.setItem("admin_username", data.username);
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : mode === "login"
          ? "登录失败"
          : "注册失败"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Admin 管理系统</h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "login"
              ? "使用管理员账号登录后进入后台管理。"
              : "注册后自动进入后台管理。"}
          </p>
        </div>

        <div className="mb-6 flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 transition ${
              mode === "login"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-500"
            }`}
            onClick={() => setMode("login")}
          >
            登录
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 transition ${
              mode === "register"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-500"
            }`}
            onClick={() => setMode("register")}
          >
            注册
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">用户名</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-400"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="请输入管理员用户名"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">密码</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-400"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            disabled={loading}
          >
            {loading
              ? mode === "login"
                ? "登录中..."
                : "注册中..."
              : mode === "login"
              ? "登录"
              : "注册"}
          </button>
        </form>
      </div>
    </div>
  );
}
