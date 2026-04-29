import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlaceDash",
  description: "AI-powered place predictions for Australian racing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
