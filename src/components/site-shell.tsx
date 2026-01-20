"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";

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
  const hidden = useHideOnScroll();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname.startsWith("/work");
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
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
        <div className="mx-auto flex h-[72px] w-full max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="font-mono text-[16px] font-medium uppercase text-foreground"
            >
              SIMON DVNCVN
            </Link>
          </div>
          <nav className="flex items-center gap-6 text-[16px]">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={
                  isActive(link.href)
                    ? "text-accent"
                    : "text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-[72px]" />

      <main className="mx-auto w-full max-w-[1400px] px-6">{children}</main>

      <footer className="mt-32">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
      </footer>
    </div>
  );
}
