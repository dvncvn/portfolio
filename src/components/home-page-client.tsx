"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { WelcomeModal } from "@/components/welcome-modal";
import type { VisitorConfig } from "@/content/visitors";

// Check if we should show welcome (client-side only)
function getInitialWelcomeState(visitor: VisitorConfig | null): boolean {
  if (!visitor) return false;
  if (typeof window === "undefined") return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("presentation") !== "true";
}

type HomePageClientProps = {
  visitor: VisitorConfig | null;
  children: React.ReactNode;
};

export function HomePageClient({ visitor, children }: HomePageClientProps) {
  const router = useRouter();
  
  // Lazy initialization - only runs once on client
  const [showWelcome, setShowWelcome] = useState(() => getInitialWelcomeState(visitor));
  const [contentReady, setContentReady] = useState(() => !visitor || !getInitialWelcomeState(visitor));

  const handleCloseWelcome = useCallback(() => {
    setShowWelcome(false);
    // Delay content reveal slightly for smooth transition
    setTimeout(() => setContentReady(true), 100);
  }, []);

  const handleStartPresentation = useCallback(() => {
    setShowWelcome(false);
    // Navigate to presentation mode - WorkSectionHeader will pick this up
    // Preserve visitor param if present
    const visitorParam = visitor ? `&visitor=${visitor.id}` : "";
    router.push(`/?presentation=true${visitorParam}`, { scroll: false });
  }, [router, visitor]);

  return (
    <>
      <motion.div
        initial={{ opacity: visitor ? 0 : 1 }}
        animate={{ opacity: contentReady ? 1 : 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.div>
      {showWelcome && visitor && (
        <WelcomeModal
          visitor={visitor}
          onClose={handleCloseWelcome}
          onStartPresentation={handleStartPresentation}
        />
      )}
    </>
  );
}
