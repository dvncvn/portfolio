import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { WorkProject } from "@/content/types";

const WORK_DIR = path.join(process.cwd(), "content", "work");

export async function getWorkProjectSlugs(): Promise<string[]> {
  const entries = await fs.readdir(WORK_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name.replace(/\.json$/, ""));
}

export async function getWorkProject(slug: string): Promise<WorkProject | null> {
  try {
    const filePath = path.join(WORK_DIR, `${slug}.json`);
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as WorkProject;
  } catch {
    return null;
  }
}

