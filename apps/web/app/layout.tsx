import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DJ Ramu Kaka",
  description: "Discord music bot dashboard (Phase 4+)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
