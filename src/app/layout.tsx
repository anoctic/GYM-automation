import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppShell } from "@/components/AppShell";
import { PwaRegister } from "@/components/PwaRegister";
import { getDefaultGymShell } from "@/lib/tenant/context";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F3F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0B0D" },
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
  const { gym, authEmail } = await getDefaultGymShell();
  const displayEmail = authEmail || gym?.email || "fitnessplanet.sikandrabad@gmail.com";

  return (
    <html
      lang="en"
      data-theme="light"
      className={`${outfit.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
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
      <body className={`${plusJakartaSans.className} antialiased`}>
        <PwaRegister />
        <ThemeProvider>
          <AppShell
            gymId={gym?.id}
            gymName={gym?.name || "Fitness Planet Unisex Gym"}
            gymSlug={gym?.slug || "fitness-planet-sikandrabad"}
            logoUrl={gym?.logo_url || "/fitness-planet-logo.png"}
            userEmail={displayEmail}
          >
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
