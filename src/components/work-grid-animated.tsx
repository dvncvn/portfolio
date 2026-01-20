"use client";

import { motion } from "framer-motion";

const ease = [0.25, 0.1, 0.25, 1] as const;

export function WorkGridAnimated({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            delayChildren: 0.12,
            staggerChildren: 0.08,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function WorkGridAnimatedItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

