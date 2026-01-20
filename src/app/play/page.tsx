import { getPlayItems } from "@/content/play";
import { PlayGrid } from "@/components/play-grid";

export default async function PlayPage() {
  const items = await getPlayItems();

  return (
    <div className="py-20">
      <div className="space-y-10">
        <div className="space-y-2">
          <h1 className="text-[18px] font-medium text-foreground">Play</h1>
          <p className="text-[14px] text-muted-foreground">
            Experiments, side projects, and visual explorations.
          </p>
        </div>
        <PlayGrid items={items} />
      </div>
    </div>
  );
}

