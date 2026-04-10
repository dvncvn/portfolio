import { Suspense } from "react";
import type { Metadata } from "next";
import { IntroBlock } from "@/components/intro-block";
import { HomePageClient } from "@/components/home-page-client";
import {
  HomeWorkSection,
  HomeWorkSectionFallback,
} from "@/components/home-work-section";
import { getVisitor } from "@/content/visitors";

export const metadata: Metadata = {
  title: "Work | Simon Duncan",
};

type HomePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const visitorParam = typeof params.visitor === "string" ? params.visitor : undefined;
  const visitor = getVisitor(visitorParam);

  return (
    <HomePageClient visitor={visitor}>
      <div className="py-20">
        {/* Hero streams immediately — project JSON loads inside Suspense below */}
        <section className="grid gap-16 lg:gap-24">
          <IntroBlock animate={false} />
        </section>

        <Suspense fallback={<HomeWorkSectionFallback />}>
          <HomeWorkSection />
        </Suspense>
      </div>
    </HomePageClient>
  );
}
