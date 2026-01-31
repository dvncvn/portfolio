"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type PageContentContextValue = {
  /** The current page's content as markdown */
  markdown: string | null;
  /** The current page's title for display */
  pageTitle: string | null;
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
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const prevPathnameRef = useRef<string | null>(null);

  // Clear content only when pathname actually changes (not on initial mount)
  useEffect(() => {
    if (prevPathnameRef.current !== null && prevPathnameRef.current !== pathname) {
      setMarkdown(null);
      setPageTitle(null);
    }
    prevPathnameRef.current = pathname;
  }, [pathname]);

  const setPageContent = useCallback((content: string, title?: string) => {
    setMarkdown(content);
    if (title) setPageTitle(title);
  }, []);

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

  const openViewer = useCallback(() => {
    if (markdown) setIsViewerOpen(true);
  }, [markdown]);

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
  }, []);

  return (
    <PageContentContext.Provider
      value={{
        markdown,
        pageTitle,
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
