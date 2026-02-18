import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { ClientConfig } from "@/components/ClientConfig";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://mapparser.travel-tracker.org'), // Replace with actual domain
  title: {
    default: "MapParser | Parse Google Maps Routes",
    template: "%s | MapParser"
  },
  alternates: {
    canonical: 'https://mapparser.travel-tracker.org',
  },
  description: "Easily parse and export Google Maps routes to CSV, or KML. Visualize multiple routes and export for Google My Maps. Free tool to extract waypoints and coordinates.",
  keywords: [
    "MapParser",
    "Google Maps",
    "Route Parser",
    "Export KML",
    "Export CSV",
    "My Maps",
    "Map visualization",
    "Route Planner",
    "Navigation",
    "Google Maps to Excel",
    "Extract Waypoints",
    "Driving Directions Export",
    "Coordinates Extractor",
    "Gmap to CSV",
    "Route Stops Downloader"
  ],
  authors: [{ name: "MapParser Team" }],
  creator: "Changzhi Ai",
  openGraph: {
    title: "MapParser | Parse Google Maps Routes",
    description: "Easily parse and export Google Maps routes to CSV, or KML. Visualize multiple routes and export for Google My Maps.",
    url: "https://mapparser.travel-tracker.org",
    siteName: "MapParser",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MapParser Interface",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MapParser | Parse Google Maps Routes",
    description: "Easily parse and export Google Maps routes to CSV, or KML. Visualize multiple routes and export for Google My Maps.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    title: "MapParser",
    statusBarStyle: "black-translucent",
    startupImage: [
      "/apple-icon.png",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

import { GoogleAuthProvider } from "@/components/GoogleAuthProvider";
import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
      </head>
      <body className={outfit.className}>
        <GoogleAuthProvider>
          <ClientConfig />
          <Header />
          {children}
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
