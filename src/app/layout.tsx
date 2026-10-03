// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import LayoutWrapper from "@/components/layout/layout-wrapper";
import GlobalLoader from "@/components/system/GlobalLoader";
import { EditModeProvider } from "@/context/EditModeContext";
import { AuthProvider } from "@/context/AuthContext";
import { BrandingProvider } from "@/context/BrandingContext";
import { CustomizationProvider } from "@/context/CustomizationContext";

import { siteConfig } from "@/lib/site-config";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.metadata.url),
  title: {
    default: siteConfig.metadata.title,
    template: `%s | ${siteConfig.layout.organization.name}`,
  },
  description: siteConfig.metadata.description,
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    shortcut: "/favicon.ico",
  },
  keywords: siteConfig.metadata.keywords,
  alternates: {
    canonical: siteConfig.metadata.url,
  },
  openGraph: {
    title: siteConfig.metadata.title,
    description: siteConfig.metadata.description,
    url: siteConfig.metadata.url,
    siteName: siteConfig.layout.organization.name,
    images: [
      {
        url: siteConfig.metadata.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.layout.organization.name,
      },
    ],
    locale: siteConfig.metadata.locale,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.layout.organization.name,
    alternateName: siteConfig.layout.organization.alternateName,
    url: siteConfig.layout.organization.url,
    logo: siteConfig.layout.organization.logo,
    description: siteConfig.layout.organization.description,
    sameAs: siteConfig.layout.organization.sameAs,
    contactPoint: ((siteConfig.layout.organization as any)?.contactPoint || []).map((cp: any) => ({
      "@type": "ContactPoint",
      ...cp,
    })),
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Hard favicon hints for Google */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="theme-color" content="#ffffff" />
      </head>

      <body className={`bg-background text-dark ${inter.className}`}>
        <Suspense fallback={null}>
          <GlobalLoader />
        </Suspense>

        <Suspense fallback={null}>
          <AuthProvider>
            <BrandingProvider>
              <CustomizationProvider>
                <EditModeProvider>
                  <LayoutWrapper>{children}</LayoutWrapper>
                </EditModeProvider>
              </CustomizationProvider>
            </BrandingProvider>
          </AuthProvider>
        </Suspense>

        {/* Organization / Brand entity schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </body>
    </html>
  );
}
