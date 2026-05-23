"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ResumeData } from "@/components/resume-takeover";

type ResumeContextValue = {
  isOpen: boolean;
  openResume: () => void;
  closeResume: () => void;
  resumeData: ResumeData;
  resumeUrl: string;
};

const resumeData: ResumeData = {
  name: "Simon Duncan",
  title: "Full-Stack Product Design",
  location: "Madison, WI (Remote)",
  portfolio: "simonduncan.co",
  email: "simonfraserduncan@gmail.com",
  phone: "612 704 0593",
  summary: "Mission-oriented designer building AI-native developer experiences. High-velocity IC who pairs closely with engineering and sweats interaction details. Experienced team leader who can set direction and execute.",
  sections: [
    {
      title: "Selected Experience",
      entries: [
        {
          company: "IBM (via DataStax Acquisition)",
          role: "Staff Product Designer",
          location: "Madison, WI (Remote)",
          years: "Dec 2020 – Present",
          progression: "Promoted: Sr Product Designer → Design Manager → Staff Product Designer",
          bullets: [
            "Design lead for Langflow (OSS agent builder): improved onboarding, templates, and core UX; grew from 14k → 145k+ GitHub stars",
            "Led 0→1 product design for Astra DB; shipped end-to-end cloud vector database experiences across key workflows and platform UX; contributed to growth from $0 → $70M+ ARR",
            "Built and scaled interaction patterns + design systems to improve consistency and shipping velocity across teams",
            "Defined cloud experience success metrics with product and engineering leadership; tied UX work to measurable outcomes",
            "Ellis Award recipient (only Design IC) for outstanding business impact",
          ],
        },
        {
          company: "New Relic",
          role: "Senior Product Designer",
          location: "Portland, OR (Remote)",
          years: "2020",
          bullets: [
            "Redesigned the New Relic One admin portal, simplifying key platform administration workflows for enterprise teams",
          ],
        },
        {
          company: "Scott Logic",
          role: "Lead Product Designer",
          location: "Edinburgh, UK",
          years: "2019 – 2020",
          bullets: [
            "Led FinTech engagements across retail and institutional products, partnering with engineering to ship end-to-end improvements",
            "Co-led a 10-person design team, supporting hiring and mentoring; built and ran the graduate design program",
          ],
        },
      ],
    },
  ],
  moreExperience: [
    "Branch — Product Designer (2020) • Minneapolis, MN",
    "Trek — Product Designer (2018) • Madison, WI",
    "Cloudability — Product Designer (2017–2018) • Boulder, CO",
    "IHS Markit — UX Designer (2015–2017) • Boulder, CO",
    "Scott Logic — UX Designer (2013–2015) • Edinburgh, UK",
    "Great Wolf Lodge — Content Manager (2012–2013) • Madison, WI",
  ],
  education: {
    degree: "BA, Music and Technology",
    school: "University of East Anglia",
    honors: "First Class Honours",
    years: "2009–2012",
  },
  skills: [
    "Early-stage product definition; from ambiguity to shipped",
    "Developer tools UX (DX, onboarding, workflow design)",
    "AI-native product design; Agent/RAG/LLM UX",
    "Interaction design + information architecture",
    "Prototyping in code",
    "Metrics, experimentation, and success criteria",
    "Cross-functional leadership; PM/Eng/Exec alignment",
    "High-craft UI",
  ],
  tools: [
    "Figma + Figma MCP for high-fi mocks and concepts",
    "Cursor / Claude Code / v0 for agentic building",
  ],
};

const ResumeContext = createContext<ResumeContextValue | null>(null);

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openResume = useCallback(() => setIsOpen(true), []);
  const closeResume = useCallback(() => setIsOpen(false), []);

  return (
    <ResumeContext.Provider
      value={{
        isOpen,
        openResume,
        closeResume,
        resumeData,
        resumeUrl: "/assets/simonduncan-resume.pdf",
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error("useResume must be used within a ResumeProvider");
  }
  return context;
}
