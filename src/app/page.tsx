import { Suspense } from "react";
import type { Metadata } from "next";
import { IntroBlock } from "@/components/intro-block";
import { WorkCard } from "@/components/work-card";
import { BlurFade } from "@/components/ui/blur-fade";
import { WorkSectionHeader } from "@/components/work-section-header";
import { HomePageClient } from "@/components/home-page-client";
import { getWorkProject } from "@/content/work";
import { getVisitor } from "@/content/visitors";

export const metadata: Metadata = {
  title: "Work | Simon Duncan",
};

type HomeProjectCard = {
  slug: string;
  title: string;
  date: string;
  tall: boolean;
  imageSrc: string;
  hoverImageSrc?: string;
  mobileImageSrc?: string;
  mobileHoverImageSrc?: string;
  svgPadding?: string;
  vignette?: boolean;
  dotGrid?: boolean;
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
    date: "Aug 24 – Oct 25",
    tall: true,
    imageSrc: "/assets/work/langflow-platform-redesign/lf-art_ neutral.svg",
    hoverImageSrc: "/assets/work/langflow-platform-redesign/lf-art_hover.svg",
    svgPadding: "p-4 sm:p-6 md:p-10",
  },
  {
    slug: "astra-db",
    title: "Astra: AI-First Database Design",
    date: "Aug 23 – Jan 24",
    tall: false,
    imageSrc: "/assets/work/astra-db/astra-art_neutral.svg",
    hoverImageSrc: "/assets/work/astra-db/astra-art_hover.svg",
    svgPadding: "p-4 sm:p-6 md:p-10",
  },
  {
    slug: "context-forge",
    title: "Context Forge: Reimagined",
    date: "Dec 25",
    tall: false,
    imageSrc: "/assets/work/context-forge/cf-art_neutral.svg",
    hoverImageSrc: "/assets/work/context-forge/cf-art_hover.svg",
    mobileImageSrc: "/assets/work/context-forge/mobile-cf-art_neutral.svg",
    mobileHoverImageSrc: "/assets/work/context-forge/mobile-cf-art_hover.svg",
    svgPadding: "p-4 sm:p-6 md:p-10",
    vignette: true,
  },
  {
    slug: "langflow-agent-experience",
    title: "Langflow: Agent Experience",
    date: "Nov 24 – Sep 25",
    tall: true,
    imageSrc: "/assets/work/langflow-agent-experience/agent-art-neutral.svg",
    hoverImageSrc: "/assets/work/langflow-agent-experience/agent-art-hover.svg",
    svgPadding: "p-6 sm:p-10 md:p-14",
  },
];

type HomePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const visitorParam = typeof params.visitor === "string" ? params.visitor : undefined;
  const visitor = getVisitor(visitorParam);

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
    <HomePageClient visitor={visitor}>
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

          <div className="work-grid flex flex-row gap-8 max-[900px]:flex-col max-[900px]:gap-6">
            <div className="flex flex-1 flex-col gap-6 max-[900px]:flex-none">
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
                    mobileImageSrc={project.mobileImageSrc}
                    mobileHoverImageSrc={project.mobileHoverImageSrc}
                    svgAccent={project.svgAccent}
                    svgPadding={project.svgPadding}
                    vignette={project.vignette}
                    dotGrid={project.dotGrid}
                  />
                </BlurFade>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-6 max-[900px]:flex-none">
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
                    mobileImageSrc={project.mobileImageSrc}
                    mobileHoverImageSrc={project.mobileHoverImageSrc}
                    svgAccent={project.svgAccent}
                    svgPadding={project.svgPadding}
                    vignette={project.vignette}
                    dotGrid={project.dotGrid}
                  />
                </BlurFade>
              ))}
            </div>
          </div>
        </section>
      </div>
    </HomePageClient>
  );
}
