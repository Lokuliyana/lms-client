import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { EditModeProvider } from "@/contexts/EditModeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LMS Engine",
  description: "Modern soft-white learning platform",
};

import Providers from "@/providers/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <Providers>
          <EditModeProvider>
            <AppShell>{children}</AppShell>
          </EditModeProvider>
        </Providers>
      </body>
    </html>
  );
}