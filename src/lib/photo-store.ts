import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import { parsePhotoHistory, photoStoragePath, type PhotoEdit, type PhotoHistory } from "./shared-photo";

const pathname = () => photoStoragePath(process.env.VERCEL_ENV, process.env.VERCEL_URL);

export class PhotoSaveBusy extends Error {
  constructor(public retryAfter: number) { super("Another photo was just saved"); }
}

export async function readPhotoHistory(): Promise<{ history: PhotoHistory; etag: string } | null> {
  // Compression weakens the response ETag, which cannot be used for ifMatch writes.
  const blob = await get(pathname(), { access: "private", useCache: false, headers: { "Accept-Encoding": "identity" } });
  if (!blob) return null;
  if (blob.statusCode !== 200) throw new Error("Unexpected photo response");
  return { history: parsePhotoHistory(await new Response(blob.stream).json()), etag: blob.blob.etag };
}

export async function savePhotoEdit(edit: PhotoEdit): Promise<PhotoEdit> {
  const existing = await readPhotoHistory();
  // Retried requests must not rotate the same edit into history a second time.
  if (existing?.history.current.id === edit.id) return existing.history.current;
  if (existing?.history.previous?.id === edit.id) return existing.history.previous;
  if (existing) {
    const remaining = 3000 - (Date.now() - Date.parse(existing.history.current.savedAt));
    if (remaining > 0) throw new PhotoSaveBusy(Math.ceil(remaining / 1000));
  }
  const history: PhotoHistory = { version: 1, current: edit, previous: existing?.history.current ?? null };
  try {
    await put(pathname(), JSON.stringify(history), {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
      ...(existing ? { ifMatch: existing.etag } : { allowOverwrite: false }),
    });
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError) throw new PhotoSaveBusy(1);
    // First-save races are rejected by Blob's create-only write as well.
    if (!existing && error instanceof Error && /already exists/i.test(error.message)) throw new PhotoSaveBusy(1);
    throw error;
  }
  return edit;
}
