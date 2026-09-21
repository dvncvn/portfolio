"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "framer-motion";
import { HyperText } from "@/components/ui/hyper-text";
import { ResumeProvider, useResume } from "@/contexts/resume-context";
import { PageContentProvider, usePageContent } from "@/contexts/page-content-context";
import { AccentProvider } from "@/contexts/accent-context";

// Lazy-load overlay components – these are never visible on first paint
const CommandPalette = dynamic(
  () => import("@/components/command-palette").then((m) => ({ default: m.CommandPalette })),
  { ssr: false }
);
const RatMode = dynamic(() => import("@/components/rat-mode").then((m) => m.RatMode), { ssr: false });
const RatModeDialog = dynamic(
  () => import("@/components/rat-mode-dialog").then((m) => ({ default: m.RatModeDialog })),
  { ssr: false }
);
const ResumeTakeover = dynamic(
  () => import("@/components/resume-takeover").then((m) => ({ default: m.ResumeTakeover })),
  { ssr: false }
);
const MarkdownTakeover = dynamic(
  () => import("@/components/markdown-takeover").then((m) => ({ default: m.MarkdownTakeover })),
  { ssr: false }
);

type SiteShellProps = {
  children: React.ReactNode;
};

const navLinks = [
  { label: "Work", href: "/" },
  { label: "Play", href: "/play" },
  { label: "Info", href: "/info" },
];

const footerLinks = [
  { label: "GitHub", href: "https://github.com/dvncvn" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/simonfraserduncan" },
];

const EMAIL = "simonfraserduncan@gmail.com";

function useHideOnScroll() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    lastScrollY.current = latest;

    // Always show when near top
    if (latest < 50) {
      setHidden(false);
      return;
    }

    // Scrolling down → hide
    if (latest > previous && latest - previous > 5) {
      setHidden(true);
    }
    // Scrolling up → show
    else if (latest < previous && previous - latest > 5) {
      setHidden(false);
    }
  });

  return hidden;
}

const RAT_MODE_SEQUENCE = "ratmode";

function SiteShellContent({ children }: SiteShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hidden = useHideOnScroll();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ratModeDialogOpen, setRatModeDialogOpen] = useState(false);
  const [ratModeActive, setRatModeActive] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const keySequenceRef = useRef("");
  const { isOpen: isResumeOpen, closeResume, resumeData } = useResume();
  const { isViewerOpen: isMarkdownOpen, closeViewer: closeMarkdown, markdown } = usePageContent();

  // Track which overlay chunks have been loaded (load on first trigger, keep mounted for exit animations)
  const [overlayLoaded, setOverlayLoaded] = useState({
    commandPalette: false,
    resume: false,
    markdown: false,
  });

  useEffect(() => {
    if (commandPaletteOpen && !overlayLoaded.commandPalette)
      setOverlayLoaded((prev) => ({ ...prev, commandPalette: true }));
  }, [commandPaletteOpen, overlayLoaded.commandPalette]);


  useEffect(() => {
    if (isResumeOpen && !overlayLoaded.resume)
      setOverlayLoaded((prev) => ({ ...prev, resume: true }));
  }, [isResumeOpen, overlayLoaded.resume]);

  useEffect(() => {
    if (isMarkdownOpen && !overlayLoaded.markdown)
      setOverlayLoaded((prev) => ({ ...prev, markdown: true }));
  }, [isMarkdownOpen, overlayLoaded.markdown]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname.startsWith("/work");
    }
    return pathname.startsWith(href);
  };

  // Handle '/' key to open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Detect "rat mode" sequence
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or dialog is open
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        ratModeDialogOpen || ratModeActive || e.metaKey || e.ctrlKey || e.altKey || e.repeat
      ) {
        return;
      }

      // Only track printable characters
      if (e.key.length === 1) {
        keySequenceRef.current += e.key.toLowerCase();
        
        // Keep only the last N characters (length of sequence)
        if (keySequenceRef.current.length > RAT_MODE_SEQUENCE.length) {
          keySequenceRef.current = keySequenceRef.current.slice(-RAT_MODE_SEQUENCE.length);
        }

        // Check for match
        if (keySequenceRef.current === RAT_MODE_SEQUENCE) {
          keySequenceRef.current = "";
          setRatModeDialogOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ratModeDialogOpen, ratModeActive]);

  const handleRatModeConfirm = () => {
    setRatModeActive(true);
    setRatModeDialogOpen(false);
  };

  // Listen for direct rat mode toggle from welcome modal
  useEffect(() => {
    const handleDirectToggle = (e: CustomEvent<{ active: boolean }>) => {
      setRatModeActive(e.detail.active);
    };

    window.addEventListener("ratModeToggle", handleDirectToggle as EventListener);
    return () => window.removeEventListener("ratModeToggle", handleDirectToggle as EventListener);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("ratModeChanged", { detail: { active: ratModeActive } }));
  }, [ratModeActive]);

  // ESC to exit rat mode
  useEffect(() => {
    if (!ratModeActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setRatModeActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ratModeActive]);


  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-4 focus:z-[60] focus:rounded-[8px] focus:border focus:border-white/10 focus:bg-black/60 focus:px-3 focus:py-2 focus:font-mono focus:text-[14px] focus:text-foreground focus:backdrop-blur"
      >
        Skip to content
      </a>

      <motion.header
        initial={{ y: 0 }}
        animate={{ y: hidden ? -100 : 0 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="fixed left-0 right-0 top-0 z-40"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
        }}
      >
        {/* Content */}
        <div className="w-full px-6">
          <div className="mx-auto grid h-[72px] w-full max-w-[1400px] grid-cols-2 items-center">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                aria-label="Home"
                className="inline-flex items-center text-foreground -m-2 p-2"
                onPointerDown={(e) => {
                  // Navigate immediately even if the wordmark is mid-animation.
                  // Keep href="/" for accessibility, but trigger navigation on pointer down
                  // to avoid any perceived delay from ongoing animation work.
                  e.preventDefault();
                  router.push("/");
                }}
              >
                <HyperText
                  as="span"
                  className="font-mono text-[16px] font-medium uppercase leading-none"
                  animateOnHover
                >
                  SIMON DVNCVN
                </HyperText>
              </Link>
            </div>
            {/* Desktop nav */}
            <nav className="hidden min-[480px]:flex items-center justify-end gap-6 text-[16px]">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={
                    isActive(link.href)
                      ? "text-foreground"
                      : "text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile hamburger button */}
            <div className="flex min-[480px]:hidden justify-end">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-lg -mr-2"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                <div className="relative w-5 h-4 flex flex-col justify-between">
                  <span
                    className={`block h-[2px] w-5 bg-foreground transition-all duration-300 ${
                      mobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`block h-[2px] w-5 bg-foreground transition-all duration-300 ${
                      mobileMenuOpen ? "opacity-0" : ""
                    }`}
                  />
                  <span
                    className={`block h-[2px] w-5 bg-foreground transition-all duration-300 ${
                      mobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 min-[480px]:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-background/95 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu content */}
            <nav className="relative flex flex-col items-center justify-center h-full gap-8">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-[32px] font-medium transition-colors ${
                      isActive(link.href)
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              
              {/* Elsewhere section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, delay: navLinks.length * 0.05 }}
                className="flex flex-col items-center gap-8 pt-8"
              >
                <span className="text-[14px] font-medium uppercase tracking-wider text-muted-foreground/50">
                  Elsewhere
                </span>
                {footerLinks.map((link, idx) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3, delay: (navLinks.length + 1 + idx) * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[32px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, delay: (navLinks.length + 1 + footerLinks.length) * 0.05 }}
                >
                  <a
                    href={`mailto:${EMAIL}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[32px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Email
                  </a>
                </motion.div>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-[72px]" />

      <main id="main-content" tabIndex={-1} className="flex-1 w-full px-6 focus:outline-none">
        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </main>

      <footer className="mt-20">
        <div className="w-full px-6">
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 py-8 text-sm text-muted-foreground">
            <span className="group/madison inline-flex cursor-default select-none items-center gap-2 font-mono text-[#464646] transition-colors duration-300 hover:text-[#5bc4c4]">
              {/* Flag - slides in from left on hover */}
              <span className="relative h-[14px] w-0 overflow-hidden transition-all duration-300 ease-out group-hover/madison:w-[21px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/madison-flag.svg"
                  alt=""
                  className="absolute left-0 top-0 h-[14px] w-[21px] rounded-[2px] opacity-0 transition-opacity duration-300 group-hover/madison:opacity-100"
                />
              </span>
              Made in Madison WI
            </span>
            <div className="hidden items-center gap-x-6 min-[480px]:flex">
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              {/* Email - copy on desktop */}
              <a
                href={`mailto:${EMAIL}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(EMAIL);
                  setEmailCopied(true);
                  setTimeout(() => setEmailCopied(false), 2000);
                }}
                className="cursor-pointer transition-colors hover:text-foreground"
              >
                {emailCopied ? "Copied" : "Email"}
              </a>
              {/* Command Palette Trigger */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className={`h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] font-mono text-[13px] text-white/20 transition-all hover:border-white/10 hover:bg-white/[0.04] hover:text-white/40 flex ${
                  commandPaletteOpen || isResumeOpen ? "invisible" : ""
                }`}
                aria-label="Open navigator (press /)"
                title="Open navigator"
              >
                /
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Command Palette (chunk loads on first open) */}
      {overlayLoaded.commandPalette && (
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          currentPath={pathname}
        />
      )}

      {/* Rat Mode Dialog (chunk loads on first trigger) */}
      {ratModeDialogOpen && (
        <RatModeDialog
          isOpen={ratModeDialogOpen}
          onClose={() => setRatModeDialogOpen(false)}
          onConfirm={handleRatModeConfirm}
        />
      )}

      {ratModeActive && <RatMode onExit={() => setRatModeActive(false)} />}

      {/* Resume Takeover (chunk loads on first open) */}
      {overlayLoaded.resume && (
        <ResumeTakeover
          isOpen={isResumeOpen}
          onClose={closeResume}
          data={resumeData}
        />
      )}

      {/* Markdown Viewer (chunk loads on first open) */}
      {overlayLoaded.markdown && (
        <MarkdownTakeover
          isOpen={isMarkdownOpen}
          onClose={closeMarkdown}
          markdown={markdown}
        />
      )}
    </div>
  );
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <AccentProvider>
      <ResumeProvider>
        <PageContentProvider>
          <SiteShellContent>{children}</SiteShellContent>
        </PageContentProvider>
      </ResumeProvider>
    </AccentProvider>
  );
}
