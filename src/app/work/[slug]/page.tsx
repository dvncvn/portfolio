import { notFound } from "next/navigation";
import { getWorkProject, getWorkProjectSlugs } from "@/content/work";
import { ProjectHero } from "@/components/project-hero";
import { SectionBlock } from "@/components/section-block";

export async function generateStaticParams() {
  const slugs = await getWorkProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function WorkProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getWorkProject(slug);
  if (!project) return notFound();

  return (
    <div className="py-20">
      <div className="mx-auto w-full max-w-[1200px] space-y-16">
        <ProjectHero
          title={project.title}
          heroAsset={project.heroAsset}
          summary={project.summary}
          meta={project.meta}
          responsibilities={project.responsibilities}
        />

        <div className="space-y-16">
          {project.sections.map((section, idx) => (
            <SectionBlock key={`${section.heading}-${idx}`} section={section} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

