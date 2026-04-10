import { WorkCard } from "@/components/work-card";
import { BlurFade } from "@/components/ui/blur-fade";
import { WorkSectionHeader } from "@/components/work-section-header";
import { PageContentRegistrar } from "@/components/page-content-registrar";
import { getWorkProject } from "@/content/work";
import {
  HOME_CARD_BLUR_DELAY,
  HOME_PRESENTATION_ORDER,
  HOME_WORK_CARDS,
} from "@/content/home-cards";
import { homePageToMarkdown } from "@/lib/markdown";

/**
 * Fetches project JSON + renders the work block. Loaded inside Suspense so the
 * hero can stream first and improve FCP on `/`.
 */
export async function HomeWorkSection() {
  const fullProjects = await Promise.all(
    HOME_PRESENTATION_ORDER.map((slug) => getWorkProject(slug))
  );
  const validProjects = fullProjects.filter((p): p is NonNullable<typeof p> => p !== null);

  const markdownProjects = validProjects.map((p) => ({
    slug: p.slug,
    title: p.title,
    shortScope: p.shortScope,
    summary: p.summary,
    meta: p.meta,
  }));
  const markdown = homePageToMarkdown(markdownProjects);

  return (
    <PageContentRegistrar markdown={markdown}>
      <section className="work-section mt-32">
        <WorkSectionHeader projects={validProjects} />

        <div className="work-grid flex flex-row gap-8 max-[900px]:flex-col max-[900px]:gap-6">
          <div className="flex flex-1 flex-col gap-6 max-[900px]:flex-none">
            {[HOME_WORK_CARDS[0], HOME_WORK_CARDS[1]].map((project) => (
              <BlurFade
                key={project.slug}
                delay={HOME_CARD_BLUR_DELAY[project.slug] ?? 0}
                className="work-grid-item"
              >
                <WorkCard
                  slug={project.slug}
                  title={project.title}
                  tall={project.tall}
                  imageSrc={project.imageSrc}
                  hoverImageSrc={project.hoverImageSrc}
                  mobileImageSrc={project.mobileImageSrc}
                  mobileHoverImageSrc={project.mobileHoverImageSrc}
                  svgAccent={project.svgAccent}
                  svgPadding={project.svgPadding}
                  vignette={project.vignette}
                  dotGrid={project.dotGrid}
                  priority
                />
              </BlurFade>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-6 max-[900px]:flex-none">
            {[HOME_WORK_CARDS[2], HOME_WORK_CARDS[3]].map((project) => (
              <BlurFade
                key={project.slug}
                delay={HOME_CARD_BLUR_DELAY[project.slug] ?? 0}
                className="work-grid-item"
              >
                <WorkCard
                  slug={project.slug}
                  title={project.title}
                  tall={project.tall}
                  imageSrc={project.imageSrc}
                  hoverImageSrc={project.hoverImageSrc}
                  mobileImageSrc={project.mobileImageSrc}
                  mobileHoverImageSrc={project.mobileHoverImageSrc}
                  svgAccent={project.svgAccent}
                  svgPadding={project.svgPadding}
                  vignette={project.vignette}
                  dotGrid={project.dotGrid}
                  priority
                />
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
    </PageContentRegistrar>
  );
}

export function HomeWorkSectionFallback() {
  return (
    <section className="work-section mt-32" aria-busy="true" aria-label="Loading work">
      <div className="mb-8 flex items-baseline justify-between">
        <h2 className="text-[14px] font-medium uppercase tracking-wide text-[#7D7D7D]">Work</h2>
      </div>
      <div className="work-grid flex flex-row gap-8 max-[900px]:flex-col max-[900px]:gap-6">
        <div className="flex flex-1 flex-col gap-6 max-[900px]:flex-none">
          <div className="aspect-[4/5] w-full animate-pulse rounded-[8px] bg-white/[0.06] max-[900px]:aspect-auto max-[900px]:min-h-[280px]" />
          <div className="aspect-[4/3] w-full animate-pulse rounded-[8px] bg-white/[0.06] max-[900px]:aspect-auto max-[900px]:min-h-[220px]" />
        </div>
        <div className="flex flex-1 flex-col gap-6 max-[900px]:flex-none">
          <div className="aspect-[4/3] w-full animate-pulse rounded-[8px] bg-white/[0.06] max-[900px]:aspect-auto max-[900px]:min-h-[220px]" />
          <div className="aspect-[4/5] w-full animate-pulse rounded-[8px] bg-white/[0.06] max-[900px]:aspect-auto max-[900px]:min-h-[280px]" />
        </div>
      </div>
    </section>
  );
}
