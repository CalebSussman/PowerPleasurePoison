import type { NextRequest } from "next/server";

export function requireWriteAccess(request: NextRequest) {
  const expected = process.env.APP_ADMIN_TOKEN;
  if (!expected) return null;

  const supplied = request.headers.get("x-admin-token");
  if (supplied === expected) return null;

  return Response.json(
    { error: "Missing or invalid x-admin-token header." },
    { status: 401 },
  );
}
