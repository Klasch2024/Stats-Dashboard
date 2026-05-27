import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fulcrum — Outreach Analytics",
  description: "AI-powered B2B cold outreach analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0f0f0f] text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
