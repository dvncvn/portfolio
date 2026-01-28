"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { NumberTicker } from "@/components/ui/number-ticker";

type GithubStarsChartProps = {
  startStars?: number;
  midStars?: number;
  currentStars?: number;
  startLabel?: string;
  midLabel?: string;
  endLabel?: string;
};

export function GithubStarsChart({
  startStars = 0,
  midStars = 14000,
  currentStars = 144000,
  startLabel = "Mar '23",
  midLabel = "Apr '24",
  endLabel = "Today",
}: GithubStarsChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [isHovered, setIsHovered] = useState(false);

  // Chart dimensions - simplified, labels outside SVG
  const width = 768;
  const height = 400;
  const paddingTop = 20;
  const paddingBottom = 20;
  const chartHeight = height - paddingTop - paddingBottom;

  // Scale y values - bottom is high y, top is low y in SVG
  const maxY = currentStars * 1.05;
  const scaleY = (y: number) => paddingTop + chartHeight - (y / maxY) * chartHeight;

  // Point coordinates - full width 0 to 768
  const startX = 0;
  const startY = scaleY(startStars);
  const midX = width / 2;
  const midY = scaleY(midStars);
  const endX = width;
  const endY = scaleY(currentStars);

  // X-axis y position
  const axisY = paddingTop + chartHeight;

  // Generate paths - split into before/after Apr '24
  const pathBefore = `M ${startX} ${startY} L ${midX} ${midY}`;
  const pathAfter = `M ${midX} ${midY} L ${endX} ${endY}`;

  // Format stars count
  const formatStars = (n: number) => {
    if (n >= 1000) return `${Math.round(n / 1000)}k+`;
    return n.toString();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="mx-auto max-w-[768px]">
        {/* "Design work begins" label - outside SVG, fixed size */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: 1.8 }}
        >
          <span className="text-[14px] text-[#464646]">Design work begins</span>
          <div className="mx-auto w-px h-4 bg-[#464646] opacity-50 mt-1" style={{ backgroundImage: 'linear-gradient(to bottom, #464646 50%, transparent 50%)', backgroundSize: '1px 6px' }} />
        </motion.div>

        {/* SVG Chart - just the lines and dots */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full"
          style={{ overflow: "visible", maxWidth: "768px" }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* X-axis line - subtle, full width */}
          <line
            x1={0}
            y1={axisY}
            x2={width}
            y2={axisY}
            stroke="#333333"
            strokeWidth="1"
          />

          {/* Dotted vertical annotation line at mid point */}
          <motion.line
            x1={midX}
            y1={0}
            x2={midX}
            y2={axisY}
            stroke="#464646"
            strokeWidth="1"
            strokeDasharray="1 6"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
          />

          {/* Before line - thinner, grey */}
          <motion.path
            d={pathBefore}
            fill="none"
            stroke="#464646"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* After line - bolder, light */}
          <motion.path
            d={pathAfter}
            fill="none"
            stroke="#E9E9E2"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 1.4, delay: 1.2, ease: "easeOut" }}
          />

          {/* Start point */}
          <motion.circle
            cx={startX}
            cy={startY}
            r="6"
            fill="#0B0A09"
            stroke="#737373"
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
          />

          {/* Mid point */}
          <motion.circle
            cx={midX}
            cy={midY}
            r="6"
            fill="#0B0A09"
            stroke="#E9E9E2"
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.3, delay: 1.2, ease: "easeOut" }}
          />

          {/* End point circle */}
          <motion.circle
            cx={endX}
            cy={endY}
            r="6"
            fill="#0B0A09"
            stroke="#E9E9E2"
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.3, delay: 2.4, ease: "easeOut" }}
          />
        </svg>

        {/* X-axis labels - outside SVG, fixed size */}
        <div className="flex justify-between items-start mt-3">
          {/* Start label */}
          <motion.span
            className="text-[14px] text-[#464646]"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            {startLabel}
          </motion.span>

          {/* Mid label */}
          <motion.span
            className="text-[14px] text-[#464646]"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 1.0 }}
          >
            {midLabel}
          </motion.span>

          {/* Today label with star count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 1.0 }}
          >
            <a
              href="https://github.com/langflow-ai/langflow"
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex flex-col items-end cursor-pointer"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <span className="text-[14px] font-medium text-[#E9E9E2]">
                {endLabel}:{" "}
                <NumberTicker
                  value={currentStars}
                  startValue={midStars}
                  delay={0}
                  duration={1.6}
                  formatFn={formatStars}
                />
                {" "}stars
              </span>
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    className="absolute top-full right-0 mt-1 text-[12px] text-muted-foreground flex items-center gap-1"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    View repo
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </motion.span>
                )}
              </AnimatePresence>
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
