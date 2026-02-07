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
  title: "Product Designer",
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
            "Recipient of the prestigious Ellis Award for outstanding business impact",
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
    "Cursor, Warp, Claude Code, v0, and other agentic coding tools for hands-on, rapid iteration",
    "Midjourney and image tooling for concept exploration and production assets",
    "Prompting, agent-assisted workflows, and AI-enabled prototyping to accelerate exploration and delivery",
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
        resumeUrl: "/assets/resume.pdf",
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
