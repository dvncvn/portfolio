import { WorkProjectAsset, WorkProjectSection } from "@/content/types";
import { CompareView } from "@/components/compare-view";

type AssetRendererProps = {
  section: WorkProjectSection;
};

function ImageAsset({
  asset,
}: {
  asset: WorkProjectAsset;
}) {
  const w = asset.width ?? 1600;
  const h = asset.height ?? 900;
  return (
    <div
      className="overflow-hidden rounded-[8px] border border-white/10 bg-[#121212]"
      style={{ aspectRatio: asset.aspectRatio ?? `${w}/${h}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.src}
        alt={asset.alt ?? ""}
        className="h-full w-full object-cover"
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

export function AssetRenderer({ section }: AssetRendererProps) {
  if (section.layout === "compare") {
    const [left, right] = section.assets;
    if (!left || !right) return null;
    return (
      <CompareView
        beforeSrc={right.src}
        afterSrc={left.src}
        beforeAlt={right.alt ?? "Before"}
        afterAlt={left.alt ?? "After"}
        width={left.width}
        height={left.height}
        description={section.caption}
      />
    );
  }

  const assets = section.assets;
  if (assets.length === 0) return null;

  if (section.layout === "split") {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {assets.slice(0, 2).map((asset, idx) => (
          <ImageAsset key={`${asset.src}-${idx}`} asset={asset} />
        ))}
      </div>
    );
  }

  if (section.layout === "stacked") {
    return (
      <div className="space-y-6">
        {assets.map((asset, idx) => (
          <ImageAsset key={`${asset.src}-${idx}`} asset={asset} />
        ))}
      </div>
    );
  }

  // single
  return <ImageAsset asset={assets[0]} />;
}

