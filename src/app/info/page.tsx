"use client";

import { useState } from "react";
import { EmploymentTable, type EmploymentRow } from "@/components/employment-table";
import { ResumeTakeover, type ResumeEntry } from "@/components/resume-takeover";
import { BlurFade } from "@/components/ui/blur-fade";
import { motion } from "framer-motion";

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
      <rect x="18" y="3.99951" width="2" height="2" transform="rotate(90 18 3.99951)" fill="#01F8A5"/>
      <rect opacity="0.4" x="6" y="7.99951" width="2" height="2" transform="rotate(90 6 7.99951)" fill="#01F8A5"/>
      <rect x="22.001" y="4" width="2" height="2" transform="rotate(90 22.001 4)" fill="#01F8A5"/>
      <rect x="22" y="7.99951" width="2" height="2" transform="rotate(90 22 7.99951)" fill="#01F8A5"/>
      <rect opacity="0.5" x="10" y="7.99951" width="2" height="2" transform="rotate(90 10 7.99951)" fill="#01F8A5"/>
      <rect opacity="0.8" x="14" y="7.99951" width="2" height="2" transform="rotate(90 14 7.99951)" fill="#01F8A5"/>
      <rect opacity="0.2" x="2" y="7.99951" width="2" height="2" transform="rotate(90 2 7.99951)" fill="#01F8A5"/>
      <rect x="22.001" y="12" width="2" height="2" transform="rotate(90 22.001 12)" fill="#01F8A5"/>
      <rect x="18.001" y="12" width="2" height="2" transform="rotate(90 18.001 12)" fill="#01F8A5"/>
      <rect x="18.001" y="16" width="2" height="2" transform="rotate(90 18.001 16)" fill="#01F8A5"/>
      <rect x="26.001" y="8" width="2" height="2" transform="rotate(90 26.001 8)" fill="#01F8A5"/>
      <rect x="18.001" y="2.27308e-06" width="2" height="2" transform="rotate(90 18.001 2.27308e-06)" fill="#01F8A5"/>
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
    years: "2023 – 2024",
  },
];

const fullWorkHistory: ResumeEntry[] = [
  { role: "Staff Product Designer", company: "IBM", years: "2025 – Now" },
  { role: "Staff Product Designer", company: "DataStax", years: "2024 – 2025" },
  { role: "Product Design Manager", company: "DataStax", years: "2023 – 2024" },
  { role: "Senior Product Designer", company: "DataStax", years: "2022 – 2023" },
  { role: "Senior Product Designer", company: "Instacart", years: "2021 – 2022" },
  { role: "Product Designer", company: "Instacart", years: "2020 – 2021" },
  { role: "Product Designer", company: "Dropbox", years: "2018 – 2020" },
  { role: "Product Designer", company: "Optimizely", years: "2016 – 2018" },
  { role: "UX Designer", company: "Optimizely", years: "2015 – 2016" },
  { role: "UX Designer", company: "Freelance", years: "2014 – 2015" },
  { role: "Visual Designer", company: "Agency", years: "2013 – 2014" },
];

export default function InfoPage() {
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  return (
    <div className="py-20">
      {/* 2-column layout: content takes more space, image is smaller */}
      <section className="grid gap-10 lg:grid-cols-[1fr_440px] lg:gap-24">
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
            <div className="relative">
              {/* Activity indicator pointing at current position */}
              <div className="absolute -left-10 top-[10px] hidden lg:block">
                <ActivityIndicator />
              </div>
              <EmploymentTable rows={workHistory} onViewHistory={() => setIsResumeOpen(true)} />
            </div>
          </BlurFade>

          {/* Ways of Working */}
          <BlurFade delay={0.1}>
            <div className="space-y-4">
              <h2 className="text-[20px] font-medium leading-tight text-foreground">
                Ways of Working
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted-foreground">
                <li>Staff-level product designer operating across strategy, systems, and execution</li>
                <li>End-to-end: problem framing and mental models through interaction design and shipped UI</li>
                <li>Strong in ambiguous, zero-to-one spaces where patterns do not exist yet</li>
                <li>Strong product intuition. I use it to make clear calls and move work forward without waiting on perfect inputs or a heavily staffed PM layer</li>
                <li>Systems thinker who designs for humans, prioritizing clarity, hierarchy, and intent over novelty</li>
                <li>Close collaboration with engineering, often working directly in code or design-adjacent prototypes</li>
                <li>Not wed to any particular process or tool. I&apos;ll use what works and drop what doesn&apos;t</li>
                <li>Here to ship, not to chase imaginary UX awards or perform a perfect process</li>
                <li>Momentum and judgment over process theater. Artifacts exist to accelerate decisions and delivery, not to perform alignment</li>
                <li>Particularly interested in developer tools, agentic systems, and products where UX meaningfully shapes what&apos;s possible</li>
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
                Outside of product design, I&apos;m a parent, runner, and musician.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                I spend a lot of time thinking about creativity, constraint, and sustainability. I make music that blends ambient, electronic, and guitar-driven textures, and I&apos;m interested in long-term lifestyle design, balancing ambition with family, health, and creative output.
              </p>
            </div>
          </BlurFade>
        </div>

        {/* Right column: photo */}
        <BlurFade delay={0.06} className="w-full">
          <div className="w-full overflow-hidden rounded-[24px] bg-[#121212]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/profile.png"
              alt="Simon Duncan"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </BlurFade>
      </section>

      <ResumeTakeover
        isOpen={isResumeOpen}
        onClose={() => setIsResumeOpen(false)}
        entries={fullWorkHistory}
        resumeUrl="/assets/resume.pdf"
      />
    </div>
  );
}
