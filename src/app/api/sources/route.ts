import { NextRequest } from "next/server";
import { searchSources } from "@/lib/repository";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const sources = await searchSources(query);
  return Response.json({ sources });
}
