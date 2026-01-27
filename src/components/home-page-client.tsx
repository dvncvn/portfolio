"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { WelcomeModal } from "@/components/welcome-modal";
import type { VisitorConfig } from "@/content/visitors";

type HomePageClientProps = {
  visitor: VisitorConfig | null;
  children: React.ReactNode;
};

export function HomePageClient({ visitor, children }: HomePageClientProps) {
  const router = useRouter();
  
  // Initialize with consistent state for hydration (no modal on server)
  const [showWelcome, setShowWelcome] = useState(false);
  const [contentReady, setContentReady] = useState(!visitor);

  // Check if we should show welcome modal after hydration
  useEffect(() => {
    if (!visitor) return;
    const urlParams = new URLSearchParams(window.location.search);
    const shouldShowWelcome = urlParams.get("presentation") !== "true";
    if (shouldShowWelcome) {
      setShowWelcome(true);
      setContentReady(false);
    }
  }, [visitor]);

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
