import { IntroBlock } from "@/components/intro-block";
import { WorkCard } from "@/components/work-card";
import { BlurFade } from "@/components/ui/blur-fade";

const projects = [
  {
    slug: "langflow-platform-redesign",
    title: "Langflow: Platform Redesign",
    date: "Nov 2024",
    tall: true,
    imageSrc: "/images/langflow-preview.png",
  },
  {
    slug: "langflow-agent-experience",
    title: "Langflow: Agent Experience",
    date: "2024",
    tall: false,
    backgroundVariant: "dots" as const,
  },
  {
    slug: "astra-streaming",
    title: "Astra Streaming",
    date: "2023",
    tall: false,
  },
  {
    slug: "astra-db",
    title: "Astra DB",
    date: "2022",
    tall: true,
  },
];

export default function Home() {
  const delayBySlug: Record<string, number> = {
    "langflow-platform-redesign": 0.12,
    "langflow-agent-experience": 0.18,
    "astra-streaming": 0.24,
    "astra-db": 0.3,
  };

  return (
    <div className="py-20">
      {/* Hero section */}
      <section className="grid gap-16 lg:gap-24">
        <IntroBlock animate={false} />
      </section>

      {/* Work section */}
      <section className="work-section mt-32">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-[14px] font-medium uppercase tracking-wide text-[#7D7D7D]">
            Work
          </h2>
        </div>

        <div className="work-grid flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col gap-6 md:flex-1">
            {[projects[0], projects[2]].map((project) => (
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
                  backgroundVariant={project.backgroundVariant}
                />
              </BlurFade>
            ))}
          </div>
          <div className="flex flex-col gap-6 md:flex-1">
            {[projects[1], projects[3]].map((project) => (
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
                  backgroundVariant={project.backgroundVariant}
                />
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
