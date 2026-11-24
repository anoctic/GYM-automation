import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import { getTenantContext } from "@/lib/tenant/context";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F2F7" },
    { media: "(prefers-color-scheme: dark)", color: "#070A0F" },
  ],
};

export const metadata: Metadata = {
  title: "Fitness Planet Unisex Gym - GymOS Cloud Edition",
  description: "Modern multi-tenant Gym Management SaaS for Fitness Planet Unisex Gym, Sikandrabad (Owner: Kapil Rajput).",
  icons: {
    icon: "/favicon.ico",
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
        {/* Anti-FOUC Theme Script (Default Light with iOS Glass Feel) */}
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
