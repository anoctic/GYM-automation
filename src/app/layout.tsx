import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import { getTenantContext } from "@/lib/tenant/context";

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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC Theme Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('gymos_theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'light') {
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
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
