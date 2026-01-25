"use client";

import { useState } from "react";
import { EmploymentTable, type EmploymentRow } from "@/components/employment-table";
import { ResumeTakeover, type ResumeData } from "@/components/resume-takeover";
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

const resumeData: ResumeData = {
  name: "Simon Duncan",
  title: "Staff Product Designer",
  location: "Madison, WI (Remote)",
  portfolio: "simonduncan.co",
  email: "simonfraserduncan@gmail.com",
  phone: "612 704 0593",
  summary: "Focused on developer tools and AI products. Strong product intuition, high judgment in ambiguity, and end-to-end execution from framing to shipped UI. Close engineering partner, often prototyping in code.",
  sections: [
    {
      title: "Experience",
      entries: [
        {
          company: "IBM (via DataStax acquisition)",
          role: "Staff Product Designer",
          location: "Madison, WI (Remote)",
          years: "Dec 2020 – Present",
          progression: "Senior Product Designer → Design Manager → Staff Product Designer",
          bullets: [
            "Design lead for Langflow, an open-source visual GenAI agent builder. Helped scale adoption from 14k to 140k+ GitHub stars by improving onboarding, templates, and the core developer experience",
            "Led product design for Astra DB, contributing to growth from 0 to $70M+ ARR",
            "Managed a team of 4 designers during DataStax's pivot to an AI-first company, maintaining momentum through organizational change",
            "Defined cloud experience success metrics with product and engineering leadership to tie UX investment to measurable outcomes",
            "Contributed to securing $115M Series E funding through product narrative, experience storytelling, and customer-ready demos",
            "Only design IC recipient of the Ellis Award for outstanding business impact",
          ],
        },
        {
          company: "New Relic",
          role: "Senior Product Designer",
          location: "Portland, OR",
          years: "2020",
          bullets: [
            "Redesigned the New Relic One admin portal, simplifying key platform administration workflows and improving usability for enterprise teams",
          ],
        },
        {
        company: "Scott Logic",
        role: "Lead Product Designer",
        location: "Edinburgh, United Kingdom",
        years: "2019 – 2020",
          bullets: [
            "Led FinTech engagements across retail and institutional products, partnering with engineering to ship end-to-end improvements",
            "Co-led a 10-person design team, supporting hiring and mentoring",
            "Built and ran the graduate design program, including recruiting, onboarding, and coaching",
          ],
        },
        {
          company: "Branch",
          role: "Product Designer",
          location: "Minneapolis, MN (Remote)",
          years: "2020",
          bullets: [
            "Established foundational user research practices during COVID-era volatility, capturing customer anxieties and translating insights into product decisions",
          ],
        },
        {
          company: "Trek Bicycle",
          role: "Product Designer",
          location: "Madison, WI",
          years: "2018",
          bullets: [
            "Led UX research, experimentation, and analytics for Trekbikes.com, including A/B testing and funnel analysis to drive iterative improvements",
          ],
        },
        {
          company: "Cloudability",
          role: "Product Designer",
          location: "Boulder, CO",
          years: "2017",
          bullets: [
            "Led design for automation and container-related experiences, with emphasis on operational clarity and data visualization",
          ],
        },
        {
          company: "IHS Markit",
          role: "Product Designer",
          location: "Boulder, CO",
          years: "2015 – 2017",
          bullets: [
            "Led product design engagements with FinTech teams across discovery, interaction design, and shipped UI",
          ],
        },
        {
        company: "Scott Logic",
        role: "UX Designer",
        location: "Edinburgh, United Kingdom",
        years: "2013 – 2015",
          bullets: [
            "Delivered product design for FinTech clients, from discovery through execution",
          ],
        },
        {
          company: "Great Wolf Lodge",
          role: "Content Manager",
          location: "Madison, WI",
          years: "2012 – 2013",
          bullets: [
            "Owned A/B testing and site optimization for a high-traffic, revenue-critical site",
          ],
        },
      ],
    },
  ],
  education: {
    degree: "BA, Music and Technology",
    school: "University of East Anglia, Norwich, England",
    honors: "First Class Honours",
  },
  skills: "Product strategy, problem framing, information architecture, interaction design, UI design, design systems, prototyping, discovery, qualitative research, quantitative analysis, experimentation and A/B testing, metrics definition, stakeholder management, team leadership, basic front-end development",
  tools: [
    "Figma, prototyping, design systems tooling",
    "Cursor, Warp, hands-on coding and rapid iteration",
    "Midjourney and image tooling for concept exploration and production assets",
    "Prompting, agent-assisted workflows, and AI-enabled prototyping to accelerate exploration and delivery",
  ],
};

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
                Outside of product design, I&apos;m a parent, husband, runner, and musician.
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
        data={resumeData}
        resumeUrl="/assets/resume.pdf"
      />
    </div>
  );
}
