import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Info | Simon Duncan",
};

export default function InfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
