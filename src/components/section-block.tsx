"use client";

import { motion } from "framer-motion";
import { WorkProjectSection } from "@/content/types";
import { AssetRenderer } from "@/components/asset-renderer";

type SectionBlockProps = {
  section: WorkProjectSection;
  index?: number;
};

export function SectionBlock({ section, index = 0 }: SectionBlockProps) {
  const caption = section.caption?.trim();
  const captionLines = caption ? caption.split("\n").map((line) => line.trim()).filter(Boolean) : [];
  const firstBulletIndex = captionLines.findIndex((line) => line.startsWith("- "));
  const captionIntro =
    firstBulletIndex === -1 ? captionLines.join(" ") : captionLines.slice(0, firstBulletIndex).join(" ");
  const captionBullets =
    firstBulletIndex === -1
      ? []
      : captionLines
          .slice(firstBulletIndex)
          .filter((line) => line.startsWith("- "))
          .map((line) => line.replace(/^- /, ""));

  return (
    <motion.section
      initial={{ opacity: 1, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: 0.08 + index * 0.06,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="space-y-4"
    >
      {section.layout !== "compare" ? (
        <div className="mx-auto max-w-[768px] space-y-4">
          <h2 className="text-[20px] font-medium text-foreground">{section.heading}</h2>
          {captionIntro ? (
            <p className="text-[16px] leading-relaxed text-muted-foreground">{captionIntro}</p>
          ) : null}
          {captionBullets.length > 0 ? (
            <ul className="list-disc space-y-2 pl-5 text-[16px] leading-relaxed text-muted-foreground">
              {captionBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-[1200px]">
        <AssetRenderer section={section} />
      </div>
    </motion.section>
  );
}
