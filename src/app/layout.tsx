import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import { PwaRegister } from "@/components/PwaRegister";
import { getTenantContext } from "@/lib/tenant/context";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F5F7" },
    { media: "(prefers-color-scheme: dark)", color: "#111214" },
  ],
};

export const metadata: Metadata = {
  title: "Fitness Planet Unisex Gym - GymOS Cloud Edition",
  description: "Modern multi-tenant Gym Management SaaS for Fitness Planet Unisex Gym, Sikandrabad (Owner: Kapil Rajput).",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fitness Planet",
  },
  icons: {
    icon: "/fitness-planet-logo.png",
    shortcut: "/fitness-planet-logo.png",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { gym, isDemo, user } = await getTenantContext();

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags & Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Fitness Planet" />
        <meta name="application-name" content="Fitness Planet" />

        {/* Anti-FOUC Theme Script (Default Light with High Contrast) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('gymos_theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <PwaRegister />
        <ThemeProvider>
          <AppShell
            gymName={gym?.name || "Fitness Planet Unisex Gym"}
            gymSlug={gym?.slug || "fitness-planet-sikandrabad"}
            logoUrl={gym?.logo_url || "/fitness-planet-logo.png"}
            isDemo={isDemo}
            userEmail={user?.email || (isDemo ? "demo@fitnessplanet.in" : null)}
          >
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
