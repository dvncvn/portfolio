"use client";

import { useLayoutEffect } from "react";
import { usePageContent } from "@/contexts/page-content-context";

type PageContentRegistrarProps = {
  markdown: string;
  children: React.ReactNode;
};

/**
 * Client component that registers page content for the "View as Markdown" feature.
 * Wrap your page content with this component and pass the markdown representation.
 */
export function PageContentRegistrar({ markdown, children }: PageContentRegistrarProps) {
  const { setPageContent } = usePageContent();

  // Use layoutEffect for synchronous registration before paint
  useLayoutEffect(() => {
    setPageContent(markdown);
  }, [markdown, setPageContent]);

  return <>{children}</>;
}
