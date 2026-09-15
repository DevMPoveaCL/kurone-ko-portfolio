import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Bangers } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { withPublicPath } from "@/shared/routing/public-path";
import { Observability } from "./Observability";
import "./globals.css";

const bangers = Bangers({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display-cartoon",
});

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-readable",
});

const publicAssetStyle = {
  "--asset-card-frame": `url("${withPublicPath("/assets/projects/card-frame.webp")}")`,
  "--asset-locked-card": `url("${withPublicPath("/assets/projects/joker.webp")}")`,
  "--asset-media-card": `url("${withPublicPath("/assets/projects/card.webp")}")`,
  "--asset-project-room-background": `url("${withPublicPath("/assets/projects/ProjectsBG.webp")}")`,
} as CSSProperties;

export const metadata: Metadata = {
  title: "Kurone Ko Portfolio",
  description: "An accessible cyberpunk portfolio foundation with an immersive vault direction.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body className={`${bangers.variable} ${atkinson.variable}`} style={publicAssetStyle}>
        <a className="skip-link" href="#main-content">
          Saltar al contenido del portfolio
        </a>
        <Observability />
        {children}
      </body>
    </html>
  );
}
