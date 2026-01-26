"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import type { WorkProject } from "@/content/types";
import { AsciiNoiseBackground } from "@/components/ascii-noise-background";
import { CompareView } from "@/components/compare-view";

type Slide = {
  type: "title" | "intro" | "project-title" | "project-summary" | "project-visual" | "project-compare" | "project-impact" | "project-highlight" | "project-feedback";
  projectSlug?: string;
  content?: {
    title?: string;
    subtitle?: string;
    body?: string;
    imageSrc?: string;
    imageAlt?: string;
    heroImageSrc?: string;
    beforeSrc?: string;
    afterSrc?: string;
    beforeAlt?: string;
    afterAlt?: string;
    highlightLabel?: string;
    feedbackItems?: Array<{ name: string; title?: string; body: string }>;
    stat?: { value: string; label: string };
    width?: number;
    height?: number;
  };
};

type PresentationModeProps = {
  isOpen: boolean;
  onClose: () => void;
  projects: WorkProject[];
  introText: {
    name: string;
    bio: string;
  };
};

function generateSlides(projects: WorkProject[], introText: { name: string; bio: string }): Slide[] {
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
    },
  });

  // Project slides
  for (const project of projects) {
    // Project title slide
    slides.push({
      type: "project-title",
      projectSlug: project.slug,
      content: {
        title: project.title,
        subtitle: project.meta?.dates || project.timeframe,
        heroImageSrc: project.heroAsset?.src,
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

    // Impact slide - look for impact section or github-stars
    const impactSection = project.sections.find((s) => s.heading?.toLowerCase().includes("impact") || s.layout === "github-stars");
    if (impactSection) {
      slides.push({
        type: "project-impact",
        projectSlug: project.slug,
        content: {
          title: "Impact",
          body: impactSection.caption || undefined,
          stat: impactSection.githubStars
            ? {
                value: `${Math.round((impactSection.githubStars.currentStars || 0) / 1000)}k`,
                label: "GitHub Stars",
              }
            : undefined,
        },
      });
    }

    // Highlight slide - look for single-caption sections (like Jensen Huang)
    const highlightSection = project.sections.find((s) => s.layout === "single-caption");
    if (highlightSection && highlightSection.assets[0]) {
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

  return slides;
}

function SlideNumber({ index, total }: { index: number; total: number }) {
  return (
    <div className="absolute bottom-8 right-8 font-mono text-[12px] tabular-nums text-muted-foreground/40">
      {String(index + 1).padStart(2, "0")}
    </div>
  );
}

function SlideContent({ slide, slideIndex, totalSlides }: { slide: Slide; slideIndex: number; totalSlides: number }) {
  switch (slide.type) {
    case "title":
      return (
        <div className="relative flex h-full flex-col justify-center overflow-hidden">
          {/* ASCII noise background */}
          <AsciiNoiseBackground
            className="pointer-events-none absolute inset-0 h-full w-full opacity-100"
            alpha={0.08}
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
          <div className="relative z-10 flex w-full items-center justify-center px-12 md:px-24">
            <div className="w-full max-w-[1200px]">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[56px] font-medium leading-tight text-foreground md:text-[72px]"
              >
                {slide.content?.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-[20px] text-muted-foreground md:text-[24px]"
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
        <div className="relative flex h-full flex-col items-center justify-center px-8">
          <div className="max-w-[800px]">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 text-[14px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {slide.content?.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[24px] leading-relaxed text-foreground md:text-[32px]"
            >
              {slide.content?.body}
            </motion.p>
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-title":
      return (
        <div className="relative flex h-full items-center justify-center px-12 md:px-24">
          <div className="flex w-full max-w-[1200px] items-center justify-between gap-12">
            {/* Left side - Title */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-6 h-1 w-16 bg-highlight"
              />
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-[40px] font-medium leading-tight text-foreground md:text-[56px]"
              >
                {slide.content?.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4 text-[18px] text-muted-foreground"
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
                className="hidden flex-1 md:block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.content.heroImageSrc}
                  alt={slide.content?.title || ""}
                  className="h-auto max-h-[60vh] w-full object-contain"
                />
              </motion.div>
            )}
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-summary":
      return (
        <div className="relative flex h-full flex-col items-center justify-center px-8">
          <div className="max-w-[800px]">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 text-[14px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              Summary
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="whitespace-pre-line text-[20px] leading-relaxed text-foreground md:text-[24px]"
            >
              {slide.content?.body}
            </motion.p>
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-visual":
      return (
        <div className="relative flex h-full flex-col items-center justify-center px-8">
          <div className="flex max-h-[80vh] max-w-[1200px] flex-col items-center">
            {slide.content?.title && (
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-4 text-[14px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                {slide.content.title}
              </motion.h3>
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="overflow-hidden rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.content?.imageSrc}
                alt={slide.content?.imageAlt || ""}
                className="max-h-[65vh] w-auto object-contain"
              />
            </motion.div>
            {slide.content?.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4 max-w-[600px] text-center text-[14px] text-muted-foreground"
              >
                {slide.content.subtitle}
              </motion.p>
            )}
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-compare":
      return (
        <div className="relative flex h-full flex-col items-center justify-center px-6 md:px-12">
          <div className="w-full max-w-[1400px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
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

    case "project-impact":
      return (
        <div className="relative flex h-full flex-col items-center justify-center px-8">
          <div className="max-w-[800px] text-center">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 text-[14px] font-medium uppercase tracking-wider text-muted-foreground"
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
                <span className="text-[72px] font-medium text-highlight md:text-[96px]">
                  {slide.content.stat.value}
                </span>
                <p className="text-[18px] text-muted-foreground">{slide.content.stat.label}</p>
              </motion.div>
            )}
            {slide.content?.body && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="whitespace-pre-line text-[18px] leading-relaxed text-foreground/80"
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
        <div className="relative flex h-full flex-col items-center justify-center px-8">
          <div className="flex max-h-[80vh] max-w-[1000px] flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="overflow-hidden rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.content?.imageSrc}
                alt={slide.content?.imageAlt || ""}
                className="max-h-[60vh] w-auto object-contain"
              />
            </motion.div>
            {slide.content?.highlightLabel && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 max-w-[600px] text-center text-[16px] text-muted-foreground"
              >
                {slide.content.highlightLabel}
              </motion.p>
            )}
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    case "project-feedback":
      return (
        <div className="relative flex h-full flex-col items-center justify-center px-8">
          <div className="max-w-[1000px]">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-10 text-center text-[14px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {slide.content?.title}
            </motion.h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {slide.content?.feedbackItems?.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  className="rounded-lg bg-white/[0.03] p-4"
                >
                  <p className="mb-3 text-[14px] leading-relaxed text-foreground/90">
                    &ldquo;{item.body}&rdquo;
                  </p>
                  <div className="text-[12px] text-muted-foreground">
                    <span className="font-medium text-foreground/70">{item.name}</span>
                    {item.title && <span> · {item.title}</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <SlideNumber index={slideIndex} total={totalSlides} />
        </div>
      );

    default:
      return null;
  }
}

export function PresentationMode({ isOpen, onClose, projects, introText }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);

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
      document.body.style.overflow = "hidden";
      setCurrentSlide(0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          goToNextSlide();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          goToPrevSlide();
          break;
        case "Home":
          e.preventDefault();
          setCurrentSlide(0);
          break;
        case "End":
          e.preventDefault();
          setCurrentSlide(slides.length - 1);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, goToNextSlide, goToPrevSlide, slides.length]);

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
          {/* Slide counter */}
          <div className="fixed left-6 top-6 z-10 text-[13px] tabular-nums text-muted-foreground">
            {currentSlide + 1} / {slides.length}
          </div>

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
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Click zones for navigation */}
          <div
            className="fixed bottom-20 left-0 top-16 w-1/3 cursor-pointer"
            onClick={goToPrevSlide}
            aria-hidden="true"
          />
          <div
            className="fixed bottom-20 right-0 top-16 w-1/3 cursor-pointer"
            onClick={goToNextSlide}
            aria-hidden="true"
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
