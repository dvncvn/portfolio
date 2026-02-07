import type { WorkProject, WorkProjectAsset, PlayItem } from "@/content/types";

// Site-level context that gets prepended to each page
const SITE_CONTEXT = `---
**Source:** Simon Duncan's Portfolio (simonduncan.co)
**Author:** Simon Duncan – Staff Product Designer at IBM
**Focus:** AI platforms, developer tools, and complex systems design
**Contact:** simonfraserduncan@gmail.com
---

`;

/**
 * Extract a meaningful description from an asset
 */
function describeAsset(asset: WorkProjectAsset): string | null {
  // Prefer explicit alt text
  if (asset.alt && asset.alt.trim()) {
    return asset.alt;
  }

  // Extract meaningful name from src path
  if (asset.src) {
    const filename = asset.src.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
    // Clean up filename: replace dashes/underscores with spaces, remove common prefixes
    const cleaned = filename
      .replace(/[-_]/g, " ")
      .replace(/^\d+\s*/, "") // Remove leading numbers
      .replace(/\b(img|image|asset|hero|thumb|thumbnail)\b/gi, "")
      .trim();

    if (cleaned.length > 3) {
      return `Visual: ${cleaned}`;
    }
  }

  return null;
}

/**
 * Describe multiple assets in a section
 */
function describeAssets(assets: WorkProjectAsset[]): string[] {
  const descriptions: string[] = [];

  for (const asset of assets) {
    const desc = describeAsset(asset);
    if (desc) {
      const typeLabel = asset.type === "video" ? "Video" : "Image";
      descriptions.push(`- [${typeLabel}] ${desc}`);
    }
  }

  return descriptions;
}

// All work projects for navigation
const ALL_PROJECTS = [
  { slug: "langflow-platform-redesign", title: "Langflow: Platform Redesign" },
  { slug: "langflow-agent-experience", title: "Langflow: Agent Experience" },
  { slug: "context-forge", title: "Context Forge" },
  { slug: "astra-db", title: "Astra DB" },
];

type ProjectNavigation = {
  nextProject?: { slug: string; title: string } | null;
};

/**
 * Convert a work project to markdown format
 */
export function workProjectToMarkdown(project: WorkProject, navigation?: ProjectNavigation): string {
  const lines: string[] = [];

  // Add site context
  lines.push(SITE_CONTEXT);

  // Page context
  lines.push(`*This is a case study from Simon Duncan's design portfolio.*`);
  lines.push("");

  // Title and summary
  lines.push(`# ${project.title}`);
  lines.push("");
  lines.push(project.summary);
  lines.push("");

  // Meta information
  const metaParts: string[] = [];
  if (project.meta?.company) metaParts.push(`**Company:** ${project.meta.company}`);
  if (project.meta?.role) metaParts.push(`**Role:** ${project.meta.role}`);
  if (project.meta?.dates) metaParts.push(`**Timeline:** ${project.meta.dates}`);
  if (project.timeframe) metaParts.push(`**Timeframe:** ${project.timeframe}`);
  if (project.meta?.team?.length) metaParts.push(`**Team:** ${project.meta.team.join(", ")}`);
  if (project.shortScope) metaParts.push(`**Scope:** ${project.shortScope}`);

  if (metaParts.length > 0) {
    lines.push("## Project Details");
    lines.push("");
    lines.push(metaParts.join("  \n"));
    lines.push("");
  }

  // Responsibilities if present
  if (project.responsibilities?.length) {
    lines.push("## Responsibilities");
    lines.push("");
    for (const resp of project.responsibilities) {
      lines.push(`- ${resp}`);
    }
    lines.push("");
  }

  // Hero asset description
  if (project.heroAsset) {
    const heroDesc = describeAsset(project.heroAsset);
    if (heroDesc) {
      lines.push("## Hero Visual");
      lines.push("");
      lines.push(`[${project.heroAsset.type === "video" ? "Video" : "Image"}] ${heroDesc}`);
      lines.push("");
    }
  }

  // Sections
  for (const section of project.sections) {
    lines.push(`## ${section.heading}`);
    lines.push("");

    if (section.caption) {
      lines.push(section.caption);
      lines.push("");
    }

    // Handle special layouts
    if (section.layout === "marquee" && section.marquee?.items) {
      lines.push("### Testimonials");
      lines.push("");
      for (const item of section.marquee.items) {
        lines.push(`> "${item.body}"`);
        lines.push(`> — **${item.name}**${item.title ? `, ${item.title}` : ""}`);
        lines.push("");
      }
    }

    if (section.layout === "github-stars" && section.githubStars) {
      const gh = section.githubStars;
      lines.push("### GitHub Metrics");
      lines.push("");
      if (gh.repo) lines.push(`**Repository:** ${gh.repo}`);
      if (gh.startStars) lines.push(`**Starting stars:** ${gh.startStars.toLocaleString()}${gh.startLabel ? ` (${gh.startLabel})` : ""}`);
      if (gh.midStars) lines.push(`**Mid-point:** ${gh.midStars.toLocaleString()}${gh.midLabel ? ` (${gh.midLabel})` : ""}`);
      if (gh.currentStars) lines.push(`**Current stars:** ${gh.currentStars.toLocaleString()}${gh.endLabel ? ` (${gh.endLabel})` : ""}`);
      lines.push("");
    }

    // Describe visual assets
    if (section.assets?.length > 0) {
      const assetDescriptions = describeAssets(section.assets);
      if (assetDescriptions.length > 0) {
        lines.push("### Visuals");
        lines.push("");
        lines.push(...assetDescriptions);
        lines.push("");
      } else {
        lines.push(`*[${section.assets.length} visual asset${section.assets.length > 1 ? "s" : ""} without descriptions]*`);
        lines.push("");
      }
    }
  }

  // Navigation section
  lines.push("---");
  lines.push("");
  lines.push("## More Work");
  lines.push("");

  // Next project link
  if (navigation?.nextProject) {
    lines.push(`**Next:** ${navigation.nextProject.title}`);
    lines.push("");
  }

  // All projects
  lines.push("**All Projects:**");
  for (const proj of ALL_PROJECTS) {
    const isCurrent = proj.slug === project.slug;
    if (isCurrent) {
      lines.push(`- ${proj.title} *(current)*`);
    } else {
      lines.push(`- ${proj.title}`);
    }
  }
  lines.push("");

  return lines.join("\n").trim();
}

/**
 * Convert the info page content to markdown
 */
export function infoPageToMarkdown(): string {
  return `${SITE_CONTEXT}*This is the About page from Simon Duncan's design portfolio.*

# About Simon Duncan

## Introduction

I'm a Staff Product Designer working on AI and developer platforms at IBM. I turn complex systems into clear, usable, and durable products. I'm experienced across OSS, startups, and enterprise.

## Current Role

**Position:** Staff Product Designer at IBM (via DataStax acquisition)  
**Location:** Madison, WI (Remote)  
**Tenure:** December 2020 – Present

### Career Progression
- Senior Product Designer → Design Manager → Staff Product Designer

## Key Accomplishments

- Design lead for Langflow, an open-source visual GenAI agent builder. Helped scale adoption from 14k to 140k+ GitHub stars
- Led product design for Astra DB, contributing to growth from 0 to $70M+ ARR
- Managed a team of 4 designers during DataStax's pivot to an AI-first company
- Contributed to securing $115M Series E funding through product narrative and demos
- Recipient of the Ellis Award for outstanding business impact

## Ways of Working

- End-to-end: problem framing through shipped UI
- Strong in ambiguous, zero-to-one spaces
- Strong product intuition. I make calls and keep momentum without waiting on perfect inputs or PM coverage
- Systems-minded, human-centered. Clarity, hierarchy, intent over novelty
- Partner tightly with engineering, often in code or prototypes
- Flexible on process and tools. I'll use what works and drop what doesn't
- Focused on developer tools and agentic systems where UX shapes what's possible

## Skills

Product strategy, problem framing, information architecture, interaction design, UI design, design systems, prototyping, discovery, qualitative research, quantitative analysis, experimentation and A/B testing, metrics definition, stakeholder management, team leadership, basic front-end development

## Tools

- Figma, prototyping, design systems tooling
- Cursor, Warp, Claude Code, v0, and other agentic coding tools for hands-on, rapid iteration
- Midjourney and image tooling for concept exploration
- Prompting, agent-assisted workflows, and AI-enabled prototyping

## Outside of Work

Outside of product design, I'm a parent, husband, runner, musician, and D&D player.

I spend a lot of time thinking about creativity, constraint, and sustainability. I make music that blends ambient, electronic, and guitar-driven textures, and I'm interested in long-term lifestyle design, balancing ambition with family, health, and creative output.

## Contact

- **Portfolio:** simonduncan.co
- **Email:** simonfraserduncan@gmail.com
- **LinkedIn:** linkedin.com/in/simonfraserduncan
- **GitHub:** github.com/dvncvn
`;
}

/**
 * Convert a play item to markdown
 */
export function playItemToMarkdown(item: PlayItem): string {
  const lines: string[] = [];

  lines.push(`# ${item.title}`);
  lines.push("");
  lines.push(item.description);
  lines.push("");

  if (item.summary) {
    lines.push(item.summary);
    lines.push("");
  }

  const meta: string[] = [];
  if (item.tool) meta.push(`**Tool:** ${item.tool}`);
  if (item.year) meta.push(`**Year:** ${item.year}`);
  if (item.tags?.length) meta.push(`**Tags:** ${item.tags.join(", ")}`);

  if (meta.length > 0) {
    lines.push(meta.join("  \n"));
    lines.push("");
  }

  if (item.href) {
    lines.push(`[${item.ctaLabel || "View project"}](${item.href})`);
  }

  return lines.join("\n").trim();
}

/**
 * Convert the play page (listing of all play items) to markdown
 */
export function playPageToMarkdown(items: PlayItem[]): string {
  const lines: string[] = [];

  // Add site context
  lines.push(SITE_CONTEXT);
  lines.push(`*This is the Play page from Simon Duncan's design portfolio – a collection of side projects and experiments.*`);
  lines.push("");

  lines.push("# Play – Side Projects & Experiments");
  lines.push("");
  lines.push("A collection of side projects, experiments, and creative work outside of my professional practice. These projects explore different tools, techniques, and creative directions.");
  lines.push("");

  for (const item of items) {
    lines.push(`## ${item.title}`);
    lines.push("");
    lines.push(item.description);
    lines.push("");

    if (item.summary) {
      lines.push(item.summary);
      lines.push("");
    }

    const meta: string[] = [];
    if (item.tool) meta.push(`**Tool:** ${item.tool}`);
    if (item.year) meta.push(`**Year:** ${item.year}`);
    if (item.tags?.length) meta.push(`**Tags:** ${item.tags.join(", ")}`);

    if (meta.length > 0) {
      lines.push(meta.join("  \n"));
      lines.push("");
    }

    if (item.href) {
      lines.push(`[${item.ctaLabel || "View project"}](${item.href})`);
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

type HomePageProject = {
  slug: string;
  title: string;
  shortScope: string;
  summary: string;
  meta?: {
    company?: string;
    dates?: string;
    role?: string;
  };
};

/**
 * Convert the home page (work listing) to markdown
 */
export function homePageToMarkdown(projects: HomePageProject[]): string {
  const lines: string[] = [];

  // Add site context
  lines.push(SITE_CONTEXT);
  lines.push(`*This is the home page of Simon Duncan's design portfolio, featuring selected work.*`);
  lines.push("");

  lines.push("# Simon Duncan – Staff Product Designer");
  lines.push("");
  lines.push("Staff Product Designer focused on AI and developer platforms at IBM. I turn complex systems into clear, usable, and durable products. Experienced across OSS, startups, and enterprise.");
  lines.push("");

  lines.push("## Selected Work");
  lines.push("");
  lines.push("The following case studies represent my recent professional work:");
  lines.push("");

  for (const project of projects) {
    lines.push(`### ${project.title}`);
    lines.push("");
    
    // Add meta info
    const meta: string[] = [];
    if (project.meta?.company) meta.push(`**Company:** ${project.meta.company}`);
    if (project.meta?.role) meta.push(`**Role:** ${project.meta.role}`);
    if (project.meta?.dates) meta.push(`**Timeline:** ${project.meta.dates}`);
    
    if (meta.length > 0) {
      lines.push(meta.join(" | "));
      lines.push("");
    }
    
    // Add summary
    lines.push(project.summary);
    lines.push("");
  }

  lines.push("## About");
  lines.push("");
  lines.push("I'm based in Madison, WI and work remotely. I partner tightly with engineering, often prototyping in code. I focus on developer tools and agentic systems where UX shapes what's possible.");
  lines.push("");

  lines.push("## Contact");
  lines.push("");
  lines.push("- **Portfolio:** simonduncan.co");
  lines.push("- **Email:** simonfraserduncan@gmail.com");
  lines.push("- **LinkedIn:** linkedin.com/in/simonfraserduncan");

  return lines.join("\n").trim();
}
