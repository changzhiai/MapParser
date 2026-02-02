import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://mapparser.travel-tracker.org'), // Replace with actual domain
  title: {
    default: "MapParser | Parse Google Maps Routes",
    template: "%s | MapParser"
  },
  description: "Easily parse and export Google Maps routes to CSV, or KML. Visualize multiple routes and export for Google My Maps.",
  keywords: ["Google Maps", "Route Parser", "Export KML", "Export CSV", "My Maps", "Map visualization", "Route Planner", "Navigation"],
  authors: [{ name: "MapParser Team" }],
  creator: "MapParser",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        {children}
      </body>
    </html>
  );
}
