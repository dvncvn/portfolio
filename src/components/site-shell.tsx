"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { HyperText } from "@/components/ui/hyper-text";
import { CommandPalette } from "@/components/command-palette";
import { RatModeDialog } from "@/components/rat-mode-dialog";
import { ResumeProvider, useResume } from "@/contexts/resume-context";
import { ResumeTakeover } from "@/components/resume-takeover";

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
  { label: "LinkedIn", href: "https://linkedin.com/in/simonduncan" },
];

const EMAIL = "hello@simonduncan.com";

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

const RAT_MODE_SEQUENCE = "rat mode";

function SiteShellContent({ children }: SiteShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hidden = useHideOnScroll();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [ratModeDialogOpen, setRatModeDialogOpen] = useState(false);
  const [ratModeActive, setRatModeActive] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const keySequenceRef = useRef("");
  const { isOpen: isResumeOpen, closeResume, resumeData, resumeUrl } = useResume();

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
        ratModeDialogOpen
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
  }, [ratModeDialogOpen]);

  const handleRatModeConfirm = () => {
    setRatModeActive(true);
    setRatModeDialogOpen(false);
    console.log("🐀 Rat mode activated!");
  };

  // ESC to exit rat mode
  useEffect(() => {
    if (!ratModeActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setRatModeActive(false);
        console.log("🐀 Rat mode deactivated");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ratModeActive]);

  // Apply rat-mode class to html element for full effect
  useEffect(() => {
    if (ratModeActive) {
      document.documentElement.classList.add("rat-mode");
    } else {
      document.documentElement.classList.remove("rat-mode");
    }
    return () => {
      document.documentElement.classList.remove("rat-mode");
    };
  }, [ratModeActive]);

  // 🐀 RAT MODE MUSIC - chaotic chiptune generator
  useEffect(() => {
    if (!ratModeActive) return;

    let audioContext: AudioContext | null = null;
    let isPlaying = true;

    const startMusic = () => {
      audioContext = new AudioContext();
      const masterGain = audioContext.createGain();
      masterGain.gain.value = 0.15;
      masterGain.connect(audioContext.destination);

      // Chaotic arpeggio notes (pentatonic for less dissonance but still chaotic)
      const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
      
      const playNote = () => {
        if (!audioContext || !isPlaying) return;

        const osc = audioContext.createOscillator();
        const noteGain = audioContext.createGain();
        
        // Random waveform for variety
        const waveforms: OscillatorType[] = ["square", "sawtooth", "triangle"];
        osc.type = waveforms[Math.floor(Math.random() * waveforms.length)];
        
        // Random note from our scale, sometimes octave up
        const baseNote = notes[Math.floor(Math.random() * notes.length)];
        osc.frequency.value = Math.random() > 0.7 ? baseNote * 2 : baseNote;
        
        osc.connect(noteGain);
        noteGain.connect(masterGain);
        
        // Quick attack/decay envelope
        const now = audioContext.currentTime;
        noteGain.gain.setValueAtTime(0.3, now);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);

        // Random tempo between 80-200ms for chaos
        const nextTime = 80 + Math.random() * 120;
        setTimeout(playNote, nextTime);
      };

      // Start the chaos
      playNote();

      // Add a bass drone for extra ridiculousness
      const bassOsc = audioContext.createOscillator();
      const bassGain = audioContext.createGain();
      bassOsc.type = "sawtooth";
      bassOsc.frequency.value = 65.41; // Low C
      bassGain.gain.value = 0.08;
      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start();

      // Wobble the bass
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      lfo.frequency.value = 5;
      lfoGain.gain.value = 10;
      lfo.connect(lfoGain);
      lfoGain.connect(bassOsc.frequency);
      lfo.start();
    };

    startMusic();

    return () => {
      isPlaying = false;
      if (audioContext) {
        audioContext.close();
      }
    };
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
            <nav className="flex items-center justify-end gap-6 text-[16px]">
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
          </div>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-[72px]" />

      <main id="main-content" tabIndex={-1} className="flex-1 w-full px-6 focus:outline-none">
        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </main>

      <footer className="mt-20">
        <div className="w-full px-6">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="font-mono text-[#464646]">Made in Madison WI</span>
            <div className="flex flex-wrap items-center gap-6">
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
              {/* Email - copy on desktop, mailto on mobile */}
              <a
                href={`mailto:${EMAIL}`}
                onClick={(e) => {
                  // Check if device supports hover (desktop)
                  const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
                  if (isDesktop) {
                    e.preventDefault();
                    navigator.clipboard.writeText(EMAIL);
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 2000);
                  }
                  // On mobile, let the default mailto behavior happen
                }}
                className="transition-colors hover:text-foreground"
              >
                {emailCopied ? "Copied" : "Email"}
              </a>
              {/* Command Palette Trigger */}
              {!commandPaletteOpen && !isResumeOpen && (
                <button
                  onClick={() => setCommandPaletteOpen(true)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] font-mono text-[13px] text-white/20 transition-all hover:border-white/10 hover:bg-white/[0.04] hover:text-white/40"
                  aria-label="Open navigator (press /)"
                  title="Open navigator"
                >
                  /
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        currentPath={pathname}
      />

      {/* Rat Mode Dialog */}
      <RatModeDialog
        isOpen={ratModeDialogOpen}
        onClose={() => setRatModeDialogOpen(false)}
        onConfirm={handleRatModeConfirm}
      />

      {/* Rat Mode Exit Hint - rendered via portal to escape transformed parents */}
      {ratModeActive && typeof document !== "undefined" &&
        createPortal(
          <div className="rat-mode-hint">
            🐀 Press ESC to exit rat mode
          </div>,
          document.body
        )
      }

      {/* Resume Takeover */}
      <ResumeTakeover
        isOpen={isResumeOpen}
        onClose={closeResume}
        data={resumeData}
        resumeUrl={resumeUrl}
      />
    </div>
  );
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <ResumeProvider>
      <SiteShellContent>{children}</SiteShellContent>
    </ResumeProvider>
  );
}
