import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import { LoadingProvider } from "@/components/providers/LoadingProvider";
import { RouteLoadingProvider } from "@/components/providers/RouteLoadingProvider";
import PageTransition from "@/components/ui/PageTransition";
import NotificationToast from "@/components/ui/NotificationToast";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import AuthPersistence from "@/components/AuthPersistence";
import { Suspense } from "react";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Brutal Team - Consultoria Fitness",
  description: "Plataforma de consultoria fitness online - Transforme seu corpo com acompanhamento profissional",
  manifest: "/manifest.json",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" }
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Brutal Team",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${montserrat.className} ${montserrat.variable} bg-white`}>
        <ServiceWorkerRegistration />
        <AuthPersistence />
        <ThemeProvider>
          <LoadingProvider>
            <Suspense fallback={null}>
              <RouteLoadingProvider>
                <PageTransition>
                  {children}
                </PageTransition>
              </RouteLoadingProvider>
            </Suspense>
            <PWAInstallPrompt />
            <NotificationToast />
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
