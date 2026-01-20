import Link from "next/link";
import { IntroBlock } from "@/components/intro-block";
import { EmploymentTable, type EmploymentRow } from "@/components/employment-table";
import { WorkCard } from "@/components/work-card";

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
      <section className="grid gap-16 lg:grid-cols-2 lg:gap-24">
        <IntroBlock />

        <EmploymentTable rows={workHistory} />
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

        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col gap-6 md:flex-1">
            {[projects[0], projects[2]].map((project) => (
              <WorkCard
                key={project.slug}
                slug={project.slug}
                title={project.title}
                date={project.date}
                tall={project.tall}
                imageSrc={project.imageSrc}
              />
            ))}
          </div>
          <div className="flex flex-col gap-6 md:flex-1">
            {[projects[1], projects[3]].map((project) => (
              <WorkCard
                key={project.slug}
                slug={project.slug}
                title={project.title}
                date={project.date}
                tall={project.tall}
                imageSrc={project.imageSrc}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
