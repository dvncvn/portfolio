import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWorkProject, getWorkProjectSlugs, getNextProject } from "@/content/work";
import { ProjectHero } from "@/components/project-hero";
import { SectionBlock } from "@/components/section-block";
import { ProjectNavigator } from "@/components/project-navigator";
import { PageContentRegistrar } from "@/components/page-content-registrar";
import { getGithubStars } from "@/lib/github";
import { workProjectToMarkdown } from "@/lib/markdown";
import type { WorkProjectSection } from "@/content/types";

export const metadata: Metadata = {
  title: "Work | Simon Duncan",
};

export async function generateStaticParams() {
  const slugs = await getWorkProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

async function enrichSectionsWithGithubStars(
  sections: WorkProjectSection[]
): Promise<WorkProjectSection[]> {
  return Promise.all(
    sections.map(async (section) => {
      if (section.layout === "github-stars" && section.githubStars?.repo) {
        const stars = await getGithubStars(section.githubStars.repo);
        if (stars !== null) {
          return {
            ...section,
            githubStars: {
              ...section.githubStars,
              currentStars: stars,
            },
          };
        }
      }
      return section;
    })
  );
}

export default async function WorkProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getWorkProject(slug);
  if (!project) return notFound();

  // Fetch dynamic GitHub stars for sections that need it
  const sections = await enrichSectionsWithGithubStars(project.sections);
  const nextProject = await getNextProject(slug);

  // Generate markdown for the copy feature
  const projectWithEnrichedSections = { ...project, sections };
  const markdown = workProjectToMarkdown(projectWithEnrichedSections);

  return (
    <PageContentRegistrar markdown={markdown} title={project.title}>
      <div className="py-20">
        <div className="space-y-24">
          <ProjectHero
            title={project.title}
            heroAsset={project.heroAsset}
            summary={project.summary}
            meta={project.meta}
          />

          <div className="space-y-[88px]">
            {sections.map((section, idx) => (
              <SectionBlock key={`${section.heading}-${idx}`} section={section} index={idx} />
            ))}
          </div>

          <ProjectNavigator nextProject={nextProject ?? undefined} />
        </div>
      </div>
    </PageContentRegistrar>
  );
}

