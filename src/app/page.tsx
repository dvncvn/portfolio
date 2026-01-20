import Link from "next/link";
import { IntroBlock } from "@/components/intro-block";
import { WorkCard } from "@/components/work-card";
import { WorkGridAnimated, WorkGridAnimatedItem } from "@/components/work-grid-animated";

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
  return (
    <div className="py-20">
      {/* Hero section */}
      <section className="grid gap-16 lg:gap-24">
        <IntroBlock animate={false} />
      </section>

      {/* Work section */}
      <section className="mt-32">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="text-lg font-medium text-foreground">Work</h2>
          <Link
            href="/?presentation=true"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View as presentation
          </Link>
        </div>

        <WorkGridAnimated className="flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col gap-6 md:flex-1">
            {[projects[0], projects[2]].map((project) => (
              <WorkGridAnimatedItem key={project.slug}>
                <WorkCard
                  slug={project.slug}
                  title={project.title}
                  date={project.date}
                  tall={project.tall}
                  imageSrc={project.imageSrc}
                />
              </WorkGridAnimatedItem>
            ))}
          </div>
          <div className="flex flex-col gap-6 md:flex-1">
            {[projects[1], projects[3]].map((project) => (
              <WorkGridAnimatedItem key={project.slug}>
                <WorkCard
                  slug={project.slug}
                  title={project.title}
                  date={project.date}
                  tall={project.tall}
                  imageSrc={project.imageSrc}
                />
              </WorkGridAnimatedItem>
            ))}
          </div>
        </WorkGridAnimated>
      </section>
    </div>
  );
}
