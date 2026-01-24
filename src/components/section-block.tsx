"use client";

import { motion } from "framer-motion";
import { WorkProjectSection } from "@/content/types";
import { AssetRenderer } from "@/components/asset-renderer";

type SectionBlockProps = {
  section: WorkProjectSection;
  index?: number;
};

export function SectionBlock({ section, index = 0 }: SectionBlockProps) {
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
        <div className="mx-auto max-w-[768px] space-y-2">
          <h2 className="text-[20px] font-medium text-foreground">{section.heading}</h2>
          {section.caption ? (
            <p className="text-[16px] leading-relaxed text-muted-foreground">
              {section.caption}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-[1200px]">
        <AssetRenderer section={section} />
      </div>
    </motion.section>
  );
}
