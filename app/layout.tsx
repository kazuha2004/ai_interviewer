import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Tutor Screener",
  description: "Evaluate your teaching ability through an adaptive AI interview",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}