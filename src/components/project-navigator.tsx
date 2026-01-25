"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type ProjectNavigatorProps = {
  nextProject?: {
    slug: string;
    title: string;
  };
};

export function ProjectNavigator({ nextProject }: ProjectNavigatorProps) {
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="py-24"
    >
      <div className="mx-auto flex max-w-[768px] items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2 text-[16px] text-[#737373] transition-colors hover:text-foreground"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">←</span>
          <span>All Projects</span>
        </Link>

        {nextProject ? (
          <Link
            href={`/work/${nextProject.slug}`}
            className="group flex items-center gap-2 text-[16px] text-foreground transition-opacity hover:opacity-70"
          >
            <span>{nextProject.title}</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        ) : null}
      </div>
    </motion.nav>
  );
}
