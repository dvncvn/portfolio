/** Home page work grid: static card config + presentation order (server + client safe). */

export type HomeProjectCard = {
  slug: string;
  title: string;
  date?: string;
  tall: boolean;
  imageSrc: string;
  hoverImageSrc?: string;
  mobileImageSrc?: string;
  mobileHoverImageSrc?: string;
  svgPadding?: string;
  vignette?: boolean;
  dotGrid?: boolean;
  svgAccent?: {
    matchStrokeHex?: string | string[];
    matchFillHex?: string | string[];
    matchStopColorHex?: string | string[];
    baseColorHex?: string;
    hoverColorHex: string;
    transitionMs?: number;
  };
};

export const HOME_PRESENTATION_ORDER = [
  "langflow-platform-redesign",
  "langflow-agent-experience",
  "context-forge",
  "astra-db",
] as const;

export const HOME_WORK_CARDS: HomeProjectCard[] = [
  {
    slug: "langflow-platform-redesign",
    title: "Langflow: Platform Redesign",
    tall: true,
    imageSrc: "/assets/work/langflow-platform-redesign/lf-art_ neutral.svg",
    hoverImageSrc: "/assets/work/langflow-platform-redesign/lf-art_hover.svg",
    svgPadding: "p-4 sm:p-6 md:p-10",
  },
  {
    slug: "astra-db",
    title: "Astra: AI-First Database Design",
    date: "Aug 23 – Jan 24",
    tall: false,
    imageSrc: "/assets/work/astra-db/astra-art_neutral.svg",
    hoverImageSrc: "/assets/work/astra-db/astra-art_hover.svg",
    svgPadding: "p-4 sm:p-6 md:p-10",
  },
  {
    slug: "context-forge",
    title: "Context Forge: Reimagined",
    tall: false,
    imageSrc: "/assets/work/context-forge/cf-art_neutral.svg",
    hoverImageSrc: "/assets/work/context-forge/cf-art_hover.svg",
    mobileImageSrc: "/assets/work/context-forge/mobile-cf-art_neutral.svg",
    mobileHoverImageSrc: "/assets/work/context-forge/mobile-cf-art_hover.svg",
    svgPadding: "p-4 sm:p-6 md:p-10",
    vignette: true,
  },
  {
    slug: "langflow-agent-experience",
    title: "Langflow: Agent Experience",
    tall: true,
    imageSrc: "/assets/work/langflow-agent-experience/agent-art-neutral.svg",
    hoverImageSrc: "/assets/work/langflow-agent-experience/agent-art-hover.svg",
    svgPadding: "p-6 sm:p-10 md:p-14",
  },
];

export const HOME_CARD_BLUR_DELAY: Record<string, number> = {
  "langflow-platform-redesign": 0.12,
  "astra-db": 0.18,
  "context-forge": 0.24,
  "langflow-agent-experience": 0.3,
};
