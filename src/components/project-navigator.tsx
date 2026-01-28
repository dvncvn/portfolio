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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:-translate-x-0.5"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          <span className="sm:hidden">All</span>
          <span className="hidden sm:inline">All Projects</span>
        </Link>

        {nextProject ? (
          <Link
            href={`/work/${nextProject.slug}`}
            className="group flex items-center gap-2 text-[16px] text-foreground transition-opacity hover:opacity-70"
          >
            <span className="sm:hidden">Next</span>
            <span className="hidden sm:inline">{nextProject.title}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        ) : null}
      </div>
    </motion.nav>
  );
}
