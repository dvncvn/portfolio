import { Suspense } from "react";
import { IntroBlock } from "@/components/intro-block";
import { WorkCard } from "@/components/work-card";
import { BlurFade } from "@/components/ui/blur-fade";
import { WorkSectionHeader } from "@/components/work-section-header";
import { getWorkProject } from "@/content/work";

type HomeProjectCard = {
  slug: string;
  title: string;
  date: string;
  tall: boolean;
  imageSrc: string;
  hoverImageSrc?: string;
  svgPadding?: string;
  vignette?: boolean;
  svgAccent?: {
    matchStrokeHex?: string | string[];
    matchFillHex?: string | string[];
    matchStopColorHex?: string | string[];
    baseColorHex?: string;
    hoverColorHex: string;
    transitionMs?: number;
  };
};

const projects: HomeProjectCard[] = [
  {
    slug: "langflow-platform-redesign",
    title: "Langflow: Platform Redesign",
    date: "Nov 2024",
    tall: true,
    imageSrc: "/assets/work/langflow-platform-redesign/lf-art_ neutral.svg",
    hoverImageSrc: "/assets/work/langflow-platform-redesign/lf-art_hover.svg",
    svgPadding: "p-0",
  },
  {
    slug: "astra-db",
    title: "Astra DB: Designing an AI-Native Database",
    date: "Aug 2023 – Jan 2024",
    tall: false,
    imageSrc: "/assets/work/astra-db/astra-art.svg",
    svgAccent: {
      matchStrokeHex: "#00FFAA",
      baseColorHex: "#E9E9E2",
      hoverColorHex: "#00FFAA",
      transitionMs: 850,
    },
  },
  {
    slug: "context-forge",
    title: "Context Forge: Reimagined",
    date: "Dec 2025",
    tall: false,
    imageSrc: "/assets/work/context-forge/cf-art_neutral.svg",
    hoverImageSrc: "/assets/work/context-forge/cf-art_hover.svg",
    svgPadding: "p-0",
    vignette: true,
  },
  {
    slug: "langflow-agent-experience",
    title: "Langflow: Agent Experience",
    date: "Nov 2024 – Sep 2025",
    tall: true,
    imageSrc: "/assets/work/langflow-agent-experience/agent-art.svg",
    svgAccent: {
      matchFillHex: ["#7528FC", "#FF3276", "#F480FF", "#F62B54", "#3ECF8E"],
      matchStrokeHex: "#7078CF",
      baseColorHex: "#E9E9E2",
      hoverColorHex: "#3ECF8E",
      transitionMs: 850,
    },
  },
];

export default async function Home() {
  const delayBySlug: Record<string, number> = {
    "langflow-platform-redesign": 0.12,
    "astra-db": 0.18,
    "context-forge": 0.24,
    "langflow-agent-experience": 0.3,
  };

  // Fetch full project data for presentation mode
  const projectOrder = ["langflow-platform-redesign", "langflow-agent-experience", "context-forge", "astra-db"];
  const fullProjects = await Promise.all(
    projectOrder.map((slug) => getWorkProject(slug))
  );
  const validProjects = fullProjects.filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className="py-20">
      {/* Hero section */}
      <section className="grid gap-16 lg:gap-24">
        <IntroBlock animate={false} />
      </section>

      {/* Work section */}
      <section className="work-section mt-32">
        <Suspense fallback={
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="text-[14px] font-medium uppercase tracking-wide text-[#7D7D7D]">Work</h2>
          </div>
        }>
          <WorkSectionHeader projects={validProjects} />
        </Suspense>

        <div className="work-grid flex flex-col gap-6 md:flex-row md:gap-8">
          <div className="flex flex-col gap-6 md:flex-1">
            {/* Left column */}
            {[projects[0], projects[1]].map((project) => (
              <BlurFade
                key={project.slug}
                delay={delayBySlug[project.slug] ?? 0}
                className="work-grid-item"
              >
                <WorkCard
                  slug={project.slug}
                  title={project.title}
                  date={project.date}
                  tall={project.tall}
                  imageSrc={project.imageSrc}
                  hoverImageSrc={project.hoverImageSrc}
                  svgAccent={project.svgAccent}
                  svgPadding={project.svgPadding}
                  vignette={project.vignette}
                />
              </BlurFade>
            ))}
          </div>
          <div className="flex flex-col gap-6 md:flex-1">
            {/* Right column */}
            {[projects[2], projects[3]].map((project) => (
              <BlurFade
                key={project.slug}
                delay={delayBySlug[project.slug] ?? 0}
                className="work-grid-item"
              >
                <WorkCard
                  slug={project.slug}
                  title={project.title}
                  date={project.date}
                  tall={project.tall}
                  imageSrc={project.imageSrc}
                  hoverImageSrc={project.hoverImageSrc}
                  svgAccent={project.svgAccent}
                  svgPadding={project.svgPadding}
                  vignette={project.vignette}
                />
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
