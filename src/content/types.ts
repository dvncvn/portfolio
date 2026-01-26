export type AssetType = "image" | "video" | "parallax";

export type SectionLayout =
  | "single"
  | "split"
  | "stacked"
  | "compare"
  | "carousel"
  | "bento"
  | "github-stars"
  | "single-caption"
  | "marquee";

export type BentoLayoutItem = {
  colSpan?: number;
  rowSpan?: number;
  height?: number;
};

export type ParallaxLayer = {
  src: string;
  /** Parallax intensity multiplier (default 1). Higher = more movement */
  depth?: number;
  /** Initial X offset in pixels to create visual separation */
  offsetX?: number;
  /** Initial Y offset in pixels to create visual separation */
  offsetY?: number;
};

export type WorkProjectAsset = {
  type: AssetType;
  src: string;
  mobileSrc?: string;
  alt?: string;
  fullSrc?: string;
  poster?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  row?: number;
  position?: string;
  effect?: "vignette";
  background?: {
    src: string;
    inset?: number;
    filter?: "grayscale";
  };
  /** Layers for parallax type assets (back to front) */
  layers?: ParallaxLayer[];
};

export type GithubStarsConfig = {
  repo?: string;
  startStars?: number;
  midStars?: number;
  currentStars?: number;
  startLabel?: string;
  midLabel?: string;
  endLabel?: string;
};

export type WorkProjectSection = {
  heading: string;
  caption?: string;
  assets: WorkProjectAsset[];
  layout: SectionLayout;
  bento?: {
    items?: BentoLayoutItem[];
  };
  marquee?: {
    items?: Array<{
      name: string;
      title?: string;
      body: string;
    }>;
  };
  githubStars?: GithubStarsConfig;
};

export type WorkProjectMeta = {
  company?: string;
  dates?: string;
  role?: string;
  team?: string[];
};

export type WorkProject = {
  slug: string;
  title: string;
  shortScope: string;
  timeframe?: string;
  heroAsset: WorkProjectAsset;
  summary: string;
  meta?: WorkProjectMeta;
  responsibilities?: string[];
  sections: WorkProjectSection[];
  nextProject?: {
    slug: string;
    title: string;
  };
};

export type PlayItemAsset = {
  type: "image" | "video";
  src: string;
  alt?: string;
};

export type PlayItem = {
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  /** Full summary shown in lightbox */
  summary?: string;
  /** Images/videos shown in lightbox carousel */
  assets?: PlayItemAsset[];
  /** External link to view the project (optional) */
  href?: string;
  /** Custom CTA button label (defaults to "View project") */
  ctaLabel?: string;
  /** Tool used (e.g., "Figma", "Three.js") */
  tool?: string;
  /** Year of project */
  year?: string;
  tags?: string[];
};
