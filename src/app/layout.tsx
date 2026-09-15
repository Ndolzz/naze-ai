import type { Metadata, Viewport } from "next";
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import ThemeSync from "@/components/ThemeSync";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

// Display family — used for the wordmark, section headlines and empty states.
const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
});

// Reading family — chat messages, UI labels, everything else.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jakarta",
});

// Functional monospace — code blocks and technical labels only.
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Naze",
  description: "Naze — asisten AI pribadi yang mengenal konteks percakapanmu.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-theme="dark">
      <body
        className={`${sora.variable} ${jakarta.variable} ${jetbrains.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <ThemeSync />
          <ServiceWorkerRegister />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
