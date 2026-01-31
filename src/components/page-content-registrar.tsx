"use client";

import { useEffect } from "react";
import { usePageContent } from "@/contexts/page-content-context";

type PageContentRegistrarProps = {
  markdown: string;
  title?: string;
  children: React.ReactNode;
};

/**
 * Client component that registers page content for the "View as Markdown" feature.
 * Wrap your page content with this component and pass the markdown representation.
 */
export function PageContentRegistrar({ markdown, title, children }: PageContentRegistrarProps) {
  const { setPageContent } = usePageContent();

  useEffect(() => {
    setPageContent(markdown, title);
  }, [markdown, title, setPageContent]);

  return <>{children}</>;
}
