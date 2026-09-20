"use client";

import { EmploymentTable, type EmploymentRow } from "@/components/employment-table";
import { BlurFade } from "@/components/ui/blur-fade";
import { motion } from "framer-motion";
import { useResume } from "@/contexts/resume-context";
import { PageContentRegistrar } from "@/components/page-content-registrar";
import { infoPageToMarkdown } from "@/lib/markdown";
import { ProfilePhoto } from "@/components/profile-photo";
import { DndHoverCard } from "@/components/dnd-hover-card";

function ActivityIndicator() {
  return (
    <motion.svg
      width="26"
      height="18"
      viewBox="0 0 26 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
    >
      <rect x="18" y="3.99951" width="2" height="2" transform="rotate(90 18 3.99951)" fill="var(--highlight)"/>
      <rect opacity="0.4" x="6" y="7.99951" width="2" height="2" transform="rotate(90 6 7.99951)" fill="var(--highlight)"/>
      <rect x="22.001" y="4" width="2" height="2" transform="rotate(90 22.001 4)" fill="var(--highlight)"/>
      <rect x="22" y="7.99951" width="2" height="2" transform="rotate(90 22 7.99951)" fill="var(--highlight)"/>
      <rect opacity="0.5" x="10" y="7.99951" width="2" height="2" transform="rotate(90 10 7.99951)" fill="var(--highlight)"/>
      <rect opacity="0.8" x="14" y="7.99951" width="2" height="2" transform="rotate(90 14 7.99951)" fill="var(--highlight)"/>
      <rect opacity="0.2" x="2" y="7.99951" width="2" height="2" transform="rotate(90 2 7.99951)" fill="var(--highlight)"/>
      <rect x="22.001" y="12" width="2" height="2" transform="rotate(90 22.001 12)" fill="var(--highlight)"/>
      <rect x="18.001" y="12" width="2" height="2" transform="rotate(90 18.001 12)" fill="var(--highlight)"/>
      <rect x="18.001" y="16" width="2" height="2" transform="rotate(90 18.001 16)" fill="var(--highlight)"/>
      <rect x="26.001" y="8" width="2" height="2" transform="rotate(90 26.001 8)" fill="var(--highlight)"/>
      <rect x="18.001" y="2.27308e-06" width="2" height="2" transform="rotate(90 18.001 2.27308e-06)" fill="var(--highlight)"/>
    </motion.svg>
  );
}

const workHistory: EmploymentRow[] = [
  {
    role: "Staff Product Designer",
    roleFlag: "Acquired",
    company: "IBM",
    companyFlag: null,
    years: "2025 – Now",
  },
  {
    role: "Staff Product Designer",
    company: "DataStax",
    roleFlag: "Promoted",
    companyFlag: null,
    years: "2024 – 2025",
  },
  {
    role: "Product Design Manager",
    company: "DataStax",
    roleFlag: "Promoted",
    companyFlag: null,
    years: "2023 – 2024",
  },
  {
    role: "Senior Product Designer",
    company: "DataStax",
    roleFlag: null,
    companyFlag: null,
    years: "2020 – 2023",
  },
];

// Generate markdown once at module level since it's static
const INFO_MARKDOWN = infoPageToMarkdown();

export default function InfoPage() {
  const { openResume } = useResume();

  return (
    <PageContentRegistrar markdown={INFO_MARKDOWN}>
      <div className="py-20">
      {/* 2-column layout: content takes more space, image is smaller */}
      <section className="grid gap-10 lg:grid-cols-[1fr_440px] lg:gap-24">
        {/* Left column: intro (unanimated) + table immediately below */}
        <div className="space-y-12 max-w-[768px]">
          <div className="space-y-4">
            {/* Spacer for visual alignment with home page */}
            <div className="h-9" aria-hidden="true" />
            <h1 className="text-[20px] font-medium leading-tight text-foreground">
              Hi, I&apos;m Simon
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground lg:max-w-[768px]">
              I&apos;m a Staff Product Designer working on AI data platforms at IBM. I turn complex systems into clear, usable, and durable products. I&apos;m experienced across OSS, startups, and enterprise.
            </p>
          </div>

          {/* Table should be the first thing below the intro paragraph */}
          <BlurFade delay={0}>
            <div className="relative">
              {/* Activity indicator pointing at current position */}
              <div className="absolute -left-10 top-[10px] hidden xl:block">
                <ActivityIndicator />
              </div>
              <EmploymentTable rows={workHistory} onViewHistory={openResume} />
            </div>
          </BlurFade>

          {/* Ways of Working */}
          <BlurFade delay={0.1}>
            <div className="space-y-4">
              <h2 className="text-[20px] font-medium leading-tight text-foreground">
                Ways of Working
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
                <li>End-to-end: problem framing through shipped UI</li>
                <li>Strong in ambiguous, zero-to-one spaces</li>
                <li>Strong product intuition. I make calls and keep momentum without waiting on perfect inputs or PM coverage</li>
                <li>Systems-minded, human-centered. Clarity, hierarchy, intent over novelty</li>
                <li>Partner tightly with engineering, often in code or prototypes</li>
                <li>Flexible on process and tools. I&apos;ll use what works and drop what doesn&apos;t</li>
                <li>Focused on developer tools and agentic systems where UX shapes what&apos;s possible</li>
              </ul>
            </div>
          </BlurFade>

          {/* Outside of Work */}
          <BlurFade delay={0.15}>
            <div className="space-y-4">
              <h2 className="text-[20px] font-medium leading-tight text-foreground">
                Outside of Work
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Outside of product design, I&apos;m a parent, husband, runner, musician, and{" "}
                <DndHoverCard>D&amp;D player</DndHoverCard>.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                I spend a lot of time thinking about creativity, constraint, and sustainability. I make music that blends ambient, electronic, and guitar-driven textures, and I&apos;m interested in long-term lifestyle design, balancing ambition with family, health, and creative output.
              </p>
            </div>
          </BlurFade>
        </div>

        {/* Right column: photo */}
        <BlurFade delay={0.06} className="w-full">
          <ProfilePhoto />
        </BlurFade>
      </section>
    </div>
    </PageContentRegistrar>
  );
}
