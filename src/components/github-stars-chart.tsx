"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

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

  // Chart dimensions - 768px max width, annotation outside
  const width = 768;
  const height = 420;
  const paddingTop = 80;
  const paddingBottom = 50;
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
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto"
          style={{ overflow: "visible", width: "100%", maxWidth: "768px" }}
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

          {/* Dotted vertical annotation line at mid point - from axis to top */}
          <motion.line
            x1={midX}
            y1={axisY}
            x2={midX}
            y2={paddingTop - 30}
            stroke="#464646"
            strokeWidth="1"
            strokeDasharray="1 6"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
          />

          {/* Design work begins label at top of chart */}
          <motion.text
            x={midX}
            y={paddingTop - 40}
            textAnchor="middle"
            className="text-[14px]"
            fill="#464646"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 1.8 }}
          >
            Design work begins
          </motion.text>

          {/* Before line - thinner, grey */}
          <motion.path
            d={pathBefore}
            fill="none"
            stroke="#464646"
            strokeWidth="1"
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
            strokeWidth="1.5"
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
            r="5"
            fill="#0B0A09"
            stroke="#737373"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
          />

          {/* Mid point */}
          <motion.circle
            cx={midX}
            cy={midY}
            r="5"
            fill="#0B0A09"
            stroke="#E9E9E2"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.3, delay: 1.2, ease: "easeOut" }}
          />


          {/* X-axis labels */}
          <motion.text
            x={0}
            y={axisY + 28}
            textAnchor="start"
            className="text-[14px]"
            fill="#464646"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            {startLabel}
          </motion.text>

          {/* Apr '24 x-axis label */}
          <motion.text
            x={midX}
            y={axisY + 28}
            textAnchor="middle"
            className="text-[14px]"
            fill="#464646"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 1.0 }}
          >
            {midLabel}
          </motion.text>

          {/* End point circle */}
          <motion.circle
            cx={endX}
            cy={endY}
            r="5"
            fill="#0B0A09"
            stroke="#E9E9E2"
            strokeWidth="1.5"
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.3, delay: 2.4, ease: "easeOut" }}
          />

          {/* Today label with star count - high contrast, clickable */}
          <motion.foreignObject
            x={width - 180}
            y={axisY + 10}
            width="180"
            height="50"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: 2.4 }}
          >
            <a
              href="https://github.com/langflow-ai/langflow"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-end cursor-pointer"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <span className="text-[14px] font-medium text-[#E9E9E2]">
                {endLabel}: {formatStars(currentStars)} stars
              </span>
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    className="text-[12px] text-[#737373] flex items-center gap-1"
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
          </motion.foreignObject>
        </svg>

      </div>
    </div>
  );
}
