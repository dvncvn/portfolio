import { getPlayItems } from "@/content/play";
import { PlayGrid } from "@/components/play-grid";

export default async function PlayPage() {
  const items = await getPlayItems();

  return (
    <div className="py-20">
      <PlayGrid items={items} />
    </div>
  );
}

