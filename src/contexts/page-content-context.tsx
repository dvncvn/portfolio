"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

type PageContentContextValue = {
  /** The current page's content as markdown */
  markdown: string | null;
  /** The pathname this content belongs to */
  contentPathname: string | null;
  /** Current pathname for comparison */
  currentPathname: string;
  /** Whether content is ready (matches current path) */
  isContentReady: boolean;
  /** Set the page content (call this from page components) */
  setPageContent: (markdown: string, title?: string) => void;
  /** Copy the current page content to clipboard */
  copyToClipboard: () => Promise<boolean>;
  /** Whether content was recently copied */
  copied: boolean;
  /** Whether the markdown viewer is open */
  isViewerOpen: boolean;
  /** Open the markdown viewer */
  openViewer: () => void;
  /** Close the markdown viewer */
  closeViewer: () => void;
};

const PageContentContext = createContext<PageContentContextValue | null>(null);

export function PageContentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [contentPathname, setContentPathname] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Content is ready if we have markdown and it's for the current path
  const isContentReady = markdown !== null && contentPathname === pathname;

  const setPageContent = useCallback((content: string) => {
    setMarkdown(content);
    setContentPathname(pathname);
  }, [pathname]);

  const copyToClipboard = useCallback(async () => {
    if (!markdown) return false;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  }, [markdown]);

  // Always allow opening - viewer will show loading if content not ready
  const openViewer = useCallback(() => {
    setIsViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
  }, []);

  return (
    <PageContentContext.Provider
      value={{
        markdown: isContentReady ? markdown : null,
        contentPathname,
        currentPathname: pathname,
        isContentReady,
        setPageContent,
        copyToClipboard,
        copied,
        isViewerOpen,
        openViewer,
        closeViewer,
      }}
    >
      {children}
    </PageContentContext.Provider>
  );
}

export function usePageContent() {
  const context = useContext(PageContentContext);
  if (!context) {
    throw new Error("usePageContent must be used within a PageContentProvider");
  }
  return context;
}
