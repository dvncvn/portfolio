"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { HyperText } from "@/components/ui/hyper-text";
import { ThemeToggle } from "@/components/theme-toggle";

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
  { label: "Email", href: "mailto:hello@simonduncan.com" },
];

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

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hidden = useHideOnScroll();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname.startsWith("/work");
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
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
          <div className="mx-auto grid h-[72px] w-full max-w-[1400px] grid-cols-3 items-center">
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
            <div className="flex items-center justify-center">
              <ThemeToggle />
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

      <main id="main-content" tabIndex={-1} className="w-full px-6">
        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </main>

      <footer className="mt-20">
        <div className="w-full px-6">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Made in Madison WI</span>
            <div className="flex flex-wrap gap-6">
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    link.href.startsWith("http") ? "noopener noreferrer" : undefined
                  }
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
