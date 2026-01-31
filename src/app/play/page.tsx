import type { Metadata } from "next";
import { getPlayItems } from "@/content/play";
import { PlayGrid } from "@/components/play-grid";
import { PageContentRegistrar } from "@/components/page-content-registrar";
import { playPageToMarkdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Play | Simon Duncan",
};

export default async function PlayPage() {
  const items = await getPlayItems();
  const markdown = playPageToMarkdown(items);

  return (
    <PageContentRegistrar markdown={markdown}>
      <div className="py-20">
        <PlayGrid items={items} />
      </div>
    </PageContentRegistrar>
  );
}

