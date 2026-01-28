"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import type { WorkProject, WorkProjectAsset, BentoLayoutItem } from "@/content/types";
import { AsciiNoiseBackground } from "@/components/ascii-noise-background";
import { CompareView } from "@/components/compare-view";
import { GithubStarsChart } from "@/components/github-stars-chart";
import { BentoView } from "@/components/asset-renderer";
import { Marquee } from "@/components/ui/marquee";
import { DotPattern } from "@/components/ui/dot-pattern";
import { DndHoverCard } from "@/components/dnd-hover-card";

// Larger review card for presentation mode
function PresentationReviewCard({
  name,
  title,
  body,
}: {
  name: string;
  title?: string;
  body: string;
}) {
  return (
    <figure className="h-56 w-[420px] flex-shrink-0 overflow-hidden rounded-[20px] border border-white/10 bg-[#121212] p-6 transition-colors duration-200 ease-out hover:bg-white/5 xl:h-64 xl:w-[520px] xl:p-8 2xl:h-72 2xl:w-[580px]">
      <figcaption className="flex flex-col gap-1">
        <span className="text-[16px] font-medium text-foreground xl:text-[18px] 2xl:text-[20px]">{name}</span>
        {title ? (
          <span className="text-[14px] text-muted-foreground xl:text-[15px] 2xl:text-[16px]">{title}</span>
        ) : null}
      </figcaption>
      <blockquote className="mt-4 line-clamp-4 text-[15px] leading-relaxed text-muted-foreground xl:mt-5 xl:text-[16px] 2xl:text-[17px]">
        {body}
      </blockquote>
    </figure>
  );
}

type Slide = {
  type: "title" | "intro" | "personal" | "project-title" | "project-summary" | "project-visual" | "project-compare" | "project-bento" | "project-chart" | "project-impact" | "project-highlight" | "project-feedback" | "closing";
  projectSlug?: string;
  content?: {
    title?: string;
    subtitle?: string;
    body?: string;
    imageSrc?: string;
    imageAlt?: string;
    heroImageSrc?: string;
    showDotGrid?: boolean;
    showVignette?: boolean;
    beforeSrc?: string;
    afterSrc?: string;
    beforeAlt?: string;
    afterAlt?: string;
    highlightLabel?: string;
    feedbackItems?: Array<{ name: string; title?: string; body: string }>;
    stat?: { value: string; label: string };
    width?: number;
    height?: number;
    bentoAssets?: WorkProjectAsset[];
    bentoLayout?: BentoLayoutItem[];
    githubStars?: {
      startStars?: number;
      midStars?: number;
      currentStars?: number;
      startLabel?: string;
      midLabel?: string;
      endLabel?: string;
    };
  };
};

type PresentationModeProps = {
  isOpen: boolean;
  onClose: () => void;
  projects: WorkProject[];
  introText: {
    name: string;
    bio: string;
    personal?: string;
    imageSrc?: string;
  };
};

function generateSlides(projects: WorkProject[], introText: { name: string; bio: string; personal?: string; imageSrc?: string }): Slide[] {
  const slides: Slide[] = [];

  // Title slide
  slides.push({
    type: "title",
    content: {
      title: introText.name,
      subtitle: "Staff Product Designer",
    },
  });

  // Intro slide
  slides.push({
    type: "intro",
    content: {
      title: "About",
      body: introText.bio,
      imageSrc: introText.imageSrc,
      imageAlt: "Simon Duncan",
    },
  });

  // Personal slide
  if (introText.personal) {
    slides.push({
      type: "personal",
      content: {
        title: "Outside of Work",
        body: introText.personal,
      },
    });
  }

  // Project slides
  for (const project of projects) {
    // Project title slide - use custom art for specific projects
    const isAgentExperience = project.slug === "langflow-agent-experience";
    const isContextForge = project.slug === "context-forge";
    
    // Determine hero image - use hover art for agent-experience and context-forge
    let heroImageSrc = project.heroAsset?.src;
    if (isAgentExperience) {
      heroImageSrc = "/assets/work/langflow-agent-experience/agent-art-hover.svg";
    } else if (isContextForge) {
      heroImageSrc = "/assets/work/context-forge/cf-art_hover.svg";
    }
    
    slides.push({
      type: "project-title",
      projectSlug: project.slug,
      content: {
        title: project.title,
        heroImageSrc,
        showDotGrid: isAgentExperience,
        showVignette: isContextForge,
      },
    });

    // Project summary slide
    slides.push({
      type: "project-summary",
      projectSlug: project.slug,
      content: {
        title: project.title,
        body: project.summary,
      },
    });

    // Project visuals - pull from sections with visual content
    const visualSections = project.sections.filter(
      (s) => s.assets && s.assets.length > 0 && ["single", "split", "compare", "bento", "single-caption"].includes(s.layout)
    );

    for (const section of visualSections.slice(0, 2)) {
      // Skip the "Generative Agent Building" bento for agent-experience - handled specially below
      if (isAgentExperience && section.heading === "Generative Agent Building on the Canvas") {
        continue;
      }
      
      // Skip compare slides for context-forge (no before/after available yet)
      if (isContextForge && section.layout === "compare") {
        continue;
      }
      
      // Skip single-caption sections - handled separately as highlight slides
      if (section.layout === "single-caption") {
        continue;
      }
      
      // Handle compare sections specially
      if (section.layout === "compare" && section.assets.length >= 2) {
        slides.push({
          type: "project-compare",
          projectSlug: project.slug,
          content: {
            title: section.heading || project.title,
            subtitle: section.caption || undefined,
            beforeSrc: section.assets[1].src,
            afterSrc: section.assets[0].src,
            beforeAlt: section.assets[1].alt || "After",
            afterAlt: section.assets[0].alt || "Before",
            width: section.assets[1].width || 1600,
            height: section.assets[1].height || 900,
          },
        });
      } else if (section.layout === "bento" && section.assets.length > 0) {
        // Handle bento sections
        slides.push({
          type: "project-bento",
          projectSlug: project.slug,
          content: {
            bentoAssets: section.assets,
            bentoLayout: section.bento?.items,
          },
        });
      } else {
        const asset = section.assets[0];
        if (asset) {
          slides.push({
            type: "project-visual",
            projectSlug: project.slug,
            content: {
              title: section.heading || project.title,
              subtitle: section.caption || undefined,
              imageSrc: asset.fullSrc || asset.src,
              imageAlt: asset.alt,
            },
          });
        }
      }
    }

    // Agent Experience: Add "Generative Agent Building" section slides and Impact
    if (isAgentExperience) {
      const genAgentSection = project.sections.find((s) => s.heading === "Generative Agent Building on the Canvas");
      if (genAgentSection) {
        // Text slide with heading and description
        slides.push({
          type: "project-summary",
          projectSlug: project.slug,
          content: {
            title: genAgentSection.heading,
            body: genAgentSection.caption,
          },
        });
        // Bento slide with the assets
        if (genAgentSection.assets && genAgentSection.assets.length > 0) {
          slides.push({
            type: "project-bento",
            projectSlug: project.slug,
            content: {
              bentoAssets: genAgentSection.assets,
              bentoLayout: genAgentSection.bento?.items,
            },
          });
        }
      }
      
      // Impact slide for Agent Experience
      const impactSection = project.sections.find((s) => s.heading === "Impact");
      if (impactSection) {
        slides.push({
          type: "project-summary",
          projectSlug: project.slug,
          content: {
            title: "Impact",
            body: impactSection.caption,
          },
        });
      }
    }

    // Chart slide - look for github-stars layout
    const chartSection = project.sections.find((s) => s.layout === "github-stars" && s.githubStars);
    if (chartSection && chartSection.githubStars) {
      slides.push({
        type: "project-chart",
        projectSlug: project.slug,
        content: {
          githubStars: chartSection.githubStars,
        },
      });
    }

    // Highlight slide - look for single-caption sections (like Jensen Huang)
    // Skip for context-forge (no highlight image ready yet)
    const highlightSection = project.sections.find((s) => s.layout === "single-caption");
    if (highlightSection && highlightSection.assets[0] && !isContextForge) {
      slides.push({
        type: "project-highlight",
        projectSlug: project.slug,
        content: {
          highlightLabel: highlightSection.caption,
          imageSrc: highlightSection.assets[0].src,
          imageAlt: highlightSection.assets[0].alt,
        },
      });
    }

    // Feedback slide - look for marquee sections
    const feedbackSection = project.sections.find((s) => s.layout === "marquee" && s.marquee?.items);
    if (feedbackSection && feedbackSection.marquee?.items) {
      slides.push({
        type: "project-feedback",
        projectSlug: project.slug,
        content: {
          title: "Reception",
          feedbackItems: feedbackSection.marquee.items.slice(0, 6),
        },
      });
    }
  }

  // Closing slide
  slides.push({
    type: "closing",
    content: {
      title: "Thank you",
    },
  });

  return slides;
}

function SlideNumber({ index, total }: { index: number; total: number }) {
  return (
    <div className="absolute bottom-8 right-8 font-mono text-[12px] tabular-nums text-muted-foreground/40">
      {String(index + 1).padStart(2, "0")}
    </div>
  );
}

function ClosingSlide({ slide }: { slide: Slide }) {
  const [copied, setCopied] = useState(false);
  const email = "simonfraserduncan@gmail.com";

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = email;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden">
      {/* ASCII noise background */}
      <AsciiNoiseBackground
        className="pointer-events-none absolute inset-0 h-full w-full opacity-100"
        alpha={0.14}
        threshold={0.19}
        exponent={1.25}
        freq={0.035}
        speed={0.115}
        cell={12}
        fps={30}
      />
      {/* Edge fade overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            linear-gradient(to right, rgba(11,10,9,1) 0%, rgba(11,10,9,0) 14%, rgba(11,10,9,0) 86%, rgba(11,10,9,1) 100%),
            linear-gradient(to bottom, rgba(11,10,9,1) 0%, rgba(11,10,9,0) 14%, rgba(11,10,9,0) 86%, rgba(11,10,9,1) 100%)
          `,
        }}
      />
      {/* Content */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-6 text-center md:px-12 lg:px-16">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 text-[14px] text-muted-foreground md:mb-6 md:text-[16px]"
        >
          {slide.content?.title}
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleCopyEmail}
          className="group relative cursor-pointer text-[32px] font-medium leading-tight text-foreground transition-all duration-200 hover:text-highlight md:text-[48px] lg:text-[56px] xl:text-[64px]"
        >
          <span className={`decoration-highlight/50 underline-offset-8 transition-all duration-200 group-hover:underline ${copied ? "opacity-0" : "opacity-100"}`}>
            {email}
          </span>
          <span
            className={`absolute inset-0 flex items-center justify-center text-highlight transition-opacity duration-200 ${
              copied ? "opacity-100" : "opacity-0"
            }`}
          >
            Copied!
          </span>
        </motion.button>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-10 flex items-center gap-4"
        >
          <button
            onClick={() => window.location.href = "/"}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-white/[0.06] px-4 py-2 text-[14px] text-muted-foreground transition-all duration-200 ease-out hover:bg-white/[0.1] hover:text-foreground"
          >
            Back to Website
          </button>
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", { key: "Home" });
              window.dispatchEvent(event);
            }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-white/[0.06] px-4 py-2 text-[14px] text-muted-foreground transition-all duration-200 ease-out hover:bg-white/[0.1] hover:text-foreground"
          >
            Restart Presentation
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function SlideContent({ slide, slideIndex, totalSlides, onLightboxStateChange }: { slide: Slide; slideIndex: number; totalSlides: number; onLightboxStateChange?: (isOpen: boolean) => void }) {
  switch (slide.type) {
    case "title":
      return (
        <div className="relative flex h-full flex-col justify-center overflow-hidden">
          {/* ASCII noise background */}
          <AsciiNoiseBackground
            className="pointer-events-none absolute inset-0 h-full w-full opacity-100"
            alpha={0.14}
            threshold={0.19}
            exponent={1.25}
            freq={0.035}
            speed={0.115}
            cell={12}
            fps={30}
          />
          {/* Edge fade overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                linear-gradient(to right, rgba(11,10,9,1) 0%, rgba(11,10,9,0) 14%, rgba(11,10,9,0) 86%, rgba(11,10,9,1) 100%),
                linear-gradient(to bottom, rgba(11,10,9,1) 0%, rgba(11,10,9,0) 14%, rgba(11,10,9,0) 86%, rgba(11,10,9,1) 100%)
              `,
            }}
          />
          {/* Content */}
          <div className="relative z-10 flex w-full items-center justify-center px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
            <div className="w-full max-w-[900px] lg:max-w-[1000px] xl:max-w-[1100px] 2xl:max-w-[1200px]">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[40px] font-medium leading-tight text-foreground md:text-[56px] lg:text-[64px] xl:text-[72px] 2xl:text-[80px]"
              >
                {slide.content?.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-3 text-[17px] text-muted-foreground md:mt-4 md:text-[20px] lg:text-[22px] xl:text-[24px] 2xl:text-[26px]"
              >
                {slide.content?.subtitle}
              </motion.p>
            </div>
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "intro":
      return (
        <div className="relative flex h-full items-center justify-center px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
          <div className="flex w-full max-w-[900px] flex-col items-center gap-8 md:flex-row md:items-center md:justify-between lg:max-w-[1000px] lg:gap-12 xl:max-w-[1100px] xl:gap-16 2xl:max-w-[1200px] 2xl:gap-20">
            {/* Left side - Text */}
            <div className="flex-1">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-4 text-[13px] font-medium uppercase tracking-wider text-muted-foreground md:mb-6 md:text-[14px] xl:text-[15px]"
              >
                {slide.content?.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[20px] leading-relaxed text-foreground md:text-[24px] lg:text-[28px] xl:text-[32px] 2xl:text-[36px]"
              >
                {slide.content?.body}
              </motion.p>
            </div>
            {/* Right side - Image */}
            {slide.content?.imageSrc && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="hidden w-full max-w-[240px] flex-shrink-0 md:block lg:max-w-[280px] xl:max-w-[320px] 2xl:max-w-[360px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.content.imageSrc}
                  alt={slide.content.imageAlt || ""}
                  className="aspect-[4/5] w-full rounded-[16px] object-cover xl:rounded-[20px]"
                />
              </motion.div>
            )}
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "personal":
      return (
        <div className="relative flex h-full flex-col items-center justify-center px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
          <div className="max-w-[700px] lg:max-w-[800px] xl:max-w-[900px] 2xl:max-w-[1000px]">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4 text-[13px] font-medium uppercase tracking-wider text-muted-foreground md:mb-6 md:text-[14px] xl:text-[15px]"
            >
              {slide.content?.title}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[20px] leading-relaxed text-foreground md:text-[24px] lg:text-[28px] xl:text-[32px] 2xl:text-[36px]"
            >
              <p>
                Outside of product design, I&apos;m a parent, husband, runner, musician, and{" "}
                <DndHoverCard zIndex={9999} position="below">D&D player</DndHoverCard>.
              </p>
              <p className="mt-5 md:mt-6 xl:mt-8">
                I spend a lot of time thinking about creativity, constraint, and sustainability. I make music that blends ambient, electronic, and guitar-driven textures, and I&apos;m interested in long-term lifestyle design, balancing ambition with family, health, and creative output.
              </p>
            </motion.div>
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-title":
      return (
        <div className="relative flex h-full items-center justify-center px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
          <div className="flex w-full max-w-[900px] items-center justify-between gap-8 lg:max-w-[1000px] lg:gap-12 xl:max-w-[1200px] xl:gap-16 2xl:max-w-[1400px] 2xl:gap-20">
            {/* Left side - Title */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-4 h-1 w-12 bg-highlight md:mb-6 md:w-16 xl:w-20"
              />
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-[32px] font-medium leading-tight text-foreground md:text-[40px] lg:text-[48px] xl:text-[56px] 2xl:text-[64px]"
              >
                {slide.content?.title?.includes(": ") ? (
                  <>
                    {slide.content.title.split(": ")[0]}:
                    <br />
                    {slide.content.title.split(": ").slice(1).join(": ")}
                  </>
                ) : (
                  slide.content?.title
                )}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-3 text-[15px] text-muted-foreground md:mt-4 md:text-[16px] xl:text-[18px] 2xl:text-[20px]"
              >
                {slide.content?.subtitle}
              </motion.p>
            </div>
            {/* Right side - Hero image */}
            {slide.content?.heroImageSrc && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative hidden flex-[1.2] md:block"
              >
                {/* Dot grid background */}
                {slide.content?.showDotGrid && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                    <DotPattern
                      width={12}
                      height={12}
                      cx={1}
                      cy={1}
                      cr={1}
                      className="text-white/[0.08] [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)]"
                    />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.content.heroImageSrc}
                  alt={slide.content?.title || ""}
                  className="relative h-auto max-h-[55vh] w-full object-contain lg:max-h-[60vh] xl:max-h-[65vh] 2xl:max-h-[70vh]"
                />
                {/* Vignette overlay */}
                {slide.content?.showVignette && (
                  <div
                    className="pointer-events-none absolute inset-0 z-10"
                    style={{
                      background: "radial-gradient(ellipse 62% 55% at center, transparent 45%, #0B0A09 95%)",
                    }}
                  />
                )}
              </motion.div>
            )}
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-summary":
      return (
        <div className="relative flex h-full flex-col items-center justify-center px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
          <div className="max-w-[600px] md:max-w-[700px] lg:max-w-[750px] xl:max-w-[850px] 2xl:max-w-[950px]">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 text-[13px] font-medium uppercase tracking-wider text-muted-foreground md:mb-8 md:text-[14px] xl:text-[15px]"
            >
              {slide.content?.title || "Summary"}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="whitespace-pre-line text-[17px] leading-relaxed text-foreground md:text-[20px] lg:text-[22px] xl:text-[26px] 2xl:text-[30px]"
            >
              {slide.content?.body}
            </motion.p>
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-visual":
      return (
        <div className="relative h-full w-full">
          <div className="absolute inset-x-0 inset-y-8 flex flex-col items-center justify-center px-6 md:inset-y-12 md:px-12 lg:inset-y-16 xl:px-16 2xl:px-20">
            <div className="flex w-full max-w-[900px] flex-col items-center lg:max-w-[1000px] xl:max-w-[1200px] 2xl:max-w-[1400px]">
              {slide.content?.title && (
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-4 text-[13px] font-medium uppercase tracking-wider text-muted-foreground md:text-[14px] xl:text-[15px]"
                >
                  {slide.content.title}
                </motion.h3>
              )}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="overflow-hidden rounded-lg xl:rounded-xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.content?.imageSrc}
                  alt={slide.content?.imageAlt || ""}
                  className="max-h-[50vh] w-auto object-contain md:max-h-[55vh] lg:max-h-[60vh] xl:max-h-[68vh] 2xl:max-h-[72vh]"
                />
              </motion.div>
              {slide.content?.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mt-4 max-w-[500px] text-center text-[13px] text-muted-foreground md:text-[14px] lg:max-w-[600px] xl:max-w-[700px] xl:text-[15px] 2xl:max-w-[800px]"
                >
                  {slide.content.subtitle}
                </motion.p>
              )}
            </div>
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-compare":
      return (
        <div className="relative h-full w-full">
          <div className="absolute inset-x-0 inset-y-12 flex items-center justify-center px-6 md:inset-y-16 md:px-12 lg:inset-y-20 lg:px-16 xl:px-20 2xl:px-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-[900px] lg:max-w-[1000px] xl:max-w-[1200px] 2xl:max-w-[1400px] [&>div]:!space-y-3"
            >
              {slide.content?.beforeSrc && slide.content?.afterSrc && (
                <CompareView
                  beforeSrc={slide.content.beforeSrc}
                  afterSrc={slide.content.afterSrc}
                  beforeAlt={slide.content.beforeAlt}
                  afterAlt={slide.content.afterAlt}
                  width={slide.content.width}
                  height={slide.content.height}
                  description={slide.content.subtitle}
                />
              )}
            </motion.div>
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-bento":
      return (
        <div className="relative h-full w-full overflow-hidden">
          <div className="absolute inset-x-0 inset-y-10 flex items-center justify-center px-8 md:inset-y-14 md:px-12 lg:inset-y-16 lg:px-16 xl:px-20 2xl:px-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 * 0.72 }}
              animate={{ opacity: 1, scale: 0.72 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-[1400px] origin-center xl:max-w-[1600px] xl:scale-100 2xl:max-w-[2000px] 2xl:scale-[1.2]"
            >
              {slide.content?.bentoAssets && (
                <BentoView
                  assets={slide.content.bentoAssets}
                  layout={slide.content.bentoLayout}
                  onLightboxStateChange={onLightboxStateChange}
                />
              )}
            </motion.div>
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-chart":
      return (
        <div className="relative flex h-full flex-col items-center justify-center px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
          <div className="flex w-full max-w-[768px] flex-col items-center xl:max-w-[900px] xl:scale-110 2xl:max-w-[1000px] 2xl:scale-125">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 self-start text-[13px] font-medium uppercase tracking-wider text-muted-foreground md:mb-8 md:text-[14px] xl:text-[15px]"
            >
              Impact
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full"
            >
              {slide.content?.githubStars && (
                <GithubStarsChart
                  startStars={slide.content.githubStars.startStars}
                  midStars={slide.content.githubStars.midStars}
                  currentStars={slide.content.githubStars.currentStars}
                  startLabel={slide.content.githubStars.startLabel}
                  midLabel={slide.content.githubStars.midLabel}
                  endLabel={slide.content.githubStars.endLabel}
                />
              )}
            </motion.div>
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-impact":
      return (
        <div className="relative flex h-full flex-col items-center justify-center px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
          <div className="max-w-[800px] text-center xl:max-w-[900px] 2xl:max-w-[1000px]">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 text-[14px] font-medium uppercase tracking-wider text-muted-foreground xl:text-[15px]"
            >
              {slide.content?.title}
            </motion.h3>
            {slide.content?.stat && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="mb-8"
              >
                <span className="text-[72px] font-medium text-highlight md:text-[96px] xl:text-[112px] 2xl:text-[128px]">
                  {slide.content.stat.value}
                </span>
                <p className="text-[18px] text-muted-foreground xl:text-[20px] 2xl:text-[22px]">{slide.content.stat.label}</p>
              </motion.div>
            )}
            {slide.content?.body && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="whitespace-pre-line text-[18px] leading-relaxed text-foreground/80 xl:text-[20px] 2xl:text-[22px]"
              >
                {slide.content.body}
              </motion.p>
            )}
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-highlight":
      return (
        <div className="relative flex h-full w-full flex-col items-center justify-center px-6 py-16 md:px-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1 overflow-hidden rounded-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.content?.imageSrc}
              alt={slide.content?.imageAlt || ""}
              className="h-full w-auto object-contain"
            />
          </motion.div>
          {slide.content?.highlightLabel && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 max-w-[700px] text-center text-[14px] text-muted-foreground md:text-[15px]"
            >
              {slide.content.highlightLabel}
            </motion.p>
          )}
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-feedback": {
      const items = slide.content?.feedbackItems ?? [];
      const splitIndex = Math.ceil(items.length / 2);
      const firstRow = items.slice(0, splitIndex);
      const secondRow = items.slice(splitIndex);
      
      // Duplicate items to ensure enough cards to fill the screen
      const duplicateItems = <T,>(arr: T[], times: number): T[] => {
        const result: T[] = [];
        for (let i = 0; i < times; i++) {
          result.push(...arr);
        }
        return result;
      };
      
      const firstRowItems = duplicateItems(firstRow, 3);
      const secondRowItems = duplicateItems(secondRow, 3);

      return (
        <div className="relative flex h-full flex-col items-center justify-center">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10 text-[14px] font-medium uppercase tracking-wider text-muted-foreground xl:mb-12 xl:text-[15px] 2xl:mb-14"
          >
            {slide.content?.title}
          </motion.h3>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative flex w-full flex-col gap-6 overflow-hidden xl:gap-8 2xl:gap-10"
          >
            <Marquee reverse pauseOnHover speed={30}>
              {firstRowItems.map((review, idx) => (
                <PresentationReviewCard key={`${review.name}-${review.body}-${idx}`} {...review} />
              ))}
            </Marquee>
            <Marquee pauseOnHover speed={30}>
              {secondRowItems.map((review, idx) => (
                <PresentationReviewCard key={`${review.name}-${review.body}-${idx}`} {...review} />
              ))}
            </Marquee>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[45%] bg-gradient-to-r from-background from-30%" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[45%] bg-gradient-to-l from-background from-30%" />
          </motion.div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );
    }

    case "closing":
      return (
        <ClosingSlide slide={slide} />
      );

    default:
      return null;
  }
}

export function PresentationMode({ isOpen, onClose, projects, introText }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (projects.length > 0) {
      setSlides(generateSlides(projects, introText));
    }
  }, [projects, introText]);

  const goToNextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

  const goToPrevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      setCurrentSlide(0);
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "Escape":
          // Only close presentation if no lightbox is open
          if (!isLightboxOpen) {
            onClose();
          }
          break;
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          // Skip slide navigation if lightbox is open (lightbox handles its own arrow nav)
          if (isLightboxOpen) return;
          e.preventDefault();
          goToNextSlide();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          // Skip slide navigation if lightbox is open (lightbox handles its own arrow nav)
          if (isLightboxOpen) return;
          e.preventDefault();
          goToPrevSlide();
          break;
        case "Home":
          if (isLightboxOpen) return;
          e.preventDefault();
          setCurrentSlide(0);
          break;
        case "End":
          if (isLightboxOpen) return;
          e.preventDefault();
          setCurrentSlide(slides.length - 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, goToNextSlide, goToPrevSlide, slides.length, isLightboxOpen]);

  if (typeof window === "undefined" || slides.length === 0) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Keyboard hints - top right */}
          <div className="fixed right-6 top-6 z-10 flex items-center gap-4 text-[12px] text-muted-foreground/60">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5">←</kbd>
              <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5">→</kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5">Esc</kbd>
              <span className="ml-1">Exit</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-white/[0.06]">
            <motion.div
              className="h-full bg-highlight"
              initial={{ width: 0 }}
              animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Slide content */}
          <div className="h-full w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="h-full w-full"
              >
                <SlideContent
                  slide={slides[currentSlide]}
                  slideIndex={currentSlide}
                  totalSlides={slides.length}
                  onLightboxStateChange={setIsLightboxOpen}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
