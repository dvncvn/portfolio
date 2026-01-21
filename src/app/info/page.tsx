"use client";

import { EmploymentTable, type EmploymentRow } from "@/components/employment-table";
import { BlurFade } from "@/components/ui/blur-fade";

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
    years: "2023 – 2024",
  },
];

export default function InfoPage() {
  return (
    <div className="py-20">
      {/* 2-column layout with max 80px gap at large sizes */}
      <section className="grid gap-10 lg:grid-cols-2 lg:gap-20">
        {/* Left column: intro (unanimated) + table immediately below */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-[20px] font-medium leading-tight text-foreground">
              Hi, I&apos;m Simon
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground lg:max-w-[768px]">
              I&apos;m a Staff Product Designer working on AI and developer platforms
              at IBM. I turn complex systems into products that are clear, usable, and
              durable. I&apos;m experienced across OSS, startups, and enterprise.
            </p>
          </div>

          {/* Table should be the first thing below the intro paragraph */}
          <BlurFade delay={0}>
            <EmploymentTable rows={workHistory} />
          </BlurFade>
        </div>

        {/* Right column: photo (placeholder for now) */}
        <BlurFade delay={0.06} className="w-full">
          <div className="w-full overflow-hidden rounded-[8px] bg-[#121212]">
            <div className="aspect-[4/5] w-full bg-gradient-to-b from-white/[0.06] to-transparent" />
          </div>
        </BlurFade>
      </section>
    </div>
  );
}
