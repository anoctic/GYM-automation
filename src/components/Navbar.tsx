import Link from "next/link";
import { getTenantContext } from "@/lib/tenant/context";
import { toggleDemoMode, signOut } from "@/actions/auth";
import { 
  Dumbbell, 
  ExternalLink,
  LogOut,
  Sparkles,
  ShieldCheck,
  QrCode
} from "lucide-react";

export async function Navbar() {
  const { gymId, isDemo, user, gym } = await getTenantContext();
  const kioskSlug = gym?.slug || "fitness-planet-sikandrabad";

  async function handleExitDemo() {
    "use server";
    await toggleDemoMode(false);
  }

  async function handleEnterDemo() {
    "use server";
    await toggleDemoMode(true);
  }

  async function handleSignOut() {
    "use server";
    await signOut();
  }

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tenant badge */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/30">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-lg tracking-tight leading-none">
                  GymOS <span className="text-emerald-400 font-semibold text-xs uppercase px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 ml-1">Cloud</span>
                </span>
                <span className="text-xs text-gray-400 truncate max-w-[180px] sm:max-w-xs font-medium">
                  {gym?.name || "Fitness Hub"}
                </span>
              </div>
            </Link>

            {isDemo ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-800">
                <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
                Live Demo Mode
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                Owner: {user?.email}
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/plans"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 transition"
            >
              Plans
            </Link>
            <Link
              href="/members"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 transition"
            >
              Members
            </Link>
            <Link
              href="/floor"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 transition flex items-center"
            >
              Floor
              <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </Link>
            <Link
              href={`/checkin/${kioskSlug}`}
              target="_blank"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-gray-800/60 transition flex items-center"
              title="Launch Public Kiosk Self Check-In"
            >
              <QrCode className="w-3.5 h-3.5 mr-1" />
              Kiosk
            </Link>
            <Link
              href="/admissions"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 transition"
            >
              Admissions
            </Link>
            <Link
              href="/leads"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 transition"
            >
              Leads
            </Link>
            <Link
              href="/settings"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 transition"
            >
              Settings
            </Link>
          </nav>

          {/* Right Actions: Public Join link & Demo Toggle */}
          <div className="flex items-center space-x-2">
            <Link
              href={`/join/${gymId}`}
              target="_blank"
              className="hidden sm:inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
              title="Open public self-admission page for walk-ins"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Public Join
            </Link>

            {isDemo ? (
              <form action={handleExitDemo}>
                <button
                  type="submit"
                  className="px-2.5 py-1.5 text-xs font-semibold rounded bg-emerald-700 hover:bg-emerald-600 text-white transition shadow"
                  title="Switch to actual login"
                >
                  Exit Demo
                </button>
              </form>
            ) : (
              <form action={handleEnterDemo}>
                <button
                  type="submit"
                  className="px-2.5 py-1.5 text-xs font-semibold rounded bg-amber-700 hover:bg-amber-600 text-white transition"
                  title="Switch to isolated Demo Tenant"
                >
                  Test Demo Mode
                </button>
              </form>
            )}

            {user ? (
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                Owner Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
