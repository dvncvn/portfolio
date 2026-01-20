import { WorkProjectSection } from "@/content/types";
import { AssetRenderer } from "@/components/asset-renderer";

type SectionBlockProps = {
  section: WorkProjectSection;
};

export function SectionBlock({ section }: SectionBlockProps) {
  return (
    <section className="space-y-4">
      <div className="mx-auto max-w-[768px] space-y-2">
        <h2 className="text-[14px] font-medium text-foreground">{section.heading}</h2>
        {section.caption ? (
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            {section.caption}
          </p>
        ) : null}
      </div>
      <div className="mx-auto w-full max-w-[1200px]">
        <AssetRenderer section={section} />
      </div>
    </section>
  );
}

