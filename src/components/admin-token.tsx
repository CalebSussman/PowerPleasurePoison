"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";

const storageKey = "ppp-admin-token";

export function getAdminHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.sessionStorage.getItem(storageKey);
  return token ? { "x-admin-token": token } : {};
}

export function AdminTokenControl() {
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(storageKey) ?? "";
  });

  return (
    <label className="inline-flex items-center gap-2 border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700">
      <KeyRound size={14} />
      <span className="font-mono uppercase tracking-[0.12em]">write token</span>
      <input
        value={token}
        onChange={(event) => {
          setToken(event.target.value);
          if (event.target.value) window.sessionStorage.setItem(storageKey, event.target.value);
          else window.sessionStorage.removeItem(storageKey);
        }}
        className="w-32 border-l border-slate-300 bg-transparent pl-2 outline-none placeholder:text-slate-400"
        placeholder="optional"
        type="password"
      />
    </label>
  );
}
