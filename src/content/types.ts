export type AssetType = "image" | "video";

export type SectionLayout = "single" | "split" | "stacked" | "compare" | "carousel" | "bento";

export type BentoLayoutItem = {
  colSpan?: number;
  rowSpan?: number;
};

export type WorkProjectAsset = {
  type: AssetType;
  src: string;
  alt?: string;
  fullSrc?: string;
  poster?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
};

export type WorkProjectSection = {
  heading: string;
  caption?: string;
  assets: WorkProjectAsset[];
  layout: SectionLayout;
  bento?: {
    items?: BentoLayoutItem[];
  };
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
};

export type PlayItem = {
  title: string;
  description: string;
  thumbnail: string;
  href: string;
  tags?: string[];
};
