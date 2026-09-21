import { NextRequest, NextResponse } from "next/server";
import { PhotoSaveBusy, readPhotoHistory, savePhotoEdit } from "@/lib/photo-store";
import { parsePhotoRecipe, photoLocation } from "@/lib/shared-photo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const respond = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", ...extraHeaders } });

export async function GET(request: NextRequest) {
  try {
    const saved = await readPhotoHistory();
    return respond({ current: saved?.history.current ?? null, previous: saved?.history.previous ?? [], location: process.env.VERCEL === "1" ? photoLocation(request.headers) : null });
  } catch {
    return respond({ error: "Couldn't load the last edit. You can still play with the photo." }, 503);
  }
}

async function readSmallJson(request: Request): Promise<unknown> {
  if (!request.body) throw new Error("Missing body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 8192) { await reader.cancel(); throw new Error("Body too large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function POST(request: NextRequest) {
  // Only same-origin browser saves; credentials and location never come from the client.
  const origin = request.headers.get("origin");
  // Next's dev server normalizes its URL to localhost even for 127.0.0.1 requests.
  const hostOrigin = `${request.nextUrl.protocol}//${request.headers.get("host")}`;
  if ((origin !== request.nextUrl.origin && origin !== hostOrigin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return respond({ error: "This edit must be saved from the portfolio." }, 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) return respond({ error: "Invalid photo settings." }, 415);
  let input;
  try {
    const body = await readSmallJson(request) as Record<string, unknown>;
    if (typeof body.id !== "string" || !/^[\da-f-]{36}$/i.test(body.id) || typeof body.shareLocation !== "boolean") throw new Error("Invalid save");
    input = { id: body.id, shareLocation: body.shareLocation, recipe: parsePhotoRecipe(body.recipe) };
  } catch { return respond({ error: "Those photo settings couldn't be saved." }, 400); }

  try {
    const result = await savePhotoEdit({
      id: input.id,
      recipe: input.recipe,
      savedAt: new Date().toISOString(),
      location: input.shareLocation && process.env.VERCEL === "1" ? photoLocation(request.headers) : null,
    });
    return respond({ current: result.history.current, previous: result.history.previous, saved: result.edit });
  } catch (error) {
    if (error instanceof PhotoSaveBusy) return respond({ error: "Another edit just arrived. Trying again…" }, 429, { "Retry-After": String(error.retryAfter) });
    return respond({ error: "Couldn't save this edit. Open and close the controls to try again." }, 503);
  }
}
