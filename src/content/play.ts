import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { PlayItem } from "@/content/types";

const PLAY_FILE = path.join(process.cwd(), "content", "play", "items.json");

export async function getPlayItems(): Promise<PlayItem[]> {
  try {
    const raw = await fs.readFile(PLAY_FILE, "utf8");
    return JSON.parse(raw) as PlayItem[];
  } catch {
    return [];
  }
}

