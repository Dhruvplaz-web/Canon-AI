"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User as UserIcon, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "brand_manager":
        return {
          label: "Brand Manager",
          className: "bg-[#FF00FF] text-white border-2 border-black shadow-[2px_2px_0px_#000]",
        };
      case "reviewer":
        return {
          label: "Reviewer",
          className: "bg-[#FFD700] text-black border-2 border-black shadow-[2px_2px_0px_#000]",
        };
      case "creator":
        return {
          label: "Creator",
          className: "bg-[#00C2CB] text-black border-2 border-black shadow-[2px_2px_0px_#000]",
        };
      default:
        return {
          label: role.replace("_", " "),
          className: "bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000]",
        };
    }
  };

  const navLinks = [
    { href: "/submissions", label: "Submissions" },
    { href: "/review", label: "Review Queue" },
    { href: "/policy", label: "Brand Policy" },
    { href: "/governance", label: "Rule Health & Backtest" },
    { href: "/evaluation", label: "AI Evaluation" },
    { href: "/transparency", label: "AI Transparency" },
    { href: "/demo", label: "Demo Tour", highlight: true },
  ];

  return (
    <header className="border-b-[3px] border-black bg-white sticky top-0 z-40 px-6 py-3 shadow-[0_2px_0px_#000]">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-black tracking-tight text-black hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded shrink-0"
          >
            <div className="w-7 h-7 rounded-lg bg-[#00C2CB] border-2 border-black flex items-center justify-center font-black text-sm text-black shadow-[2px_2px_0px_#000]">
              C
            </div>
            <span className="font-black text-lg">CANON</span>
            <span className="text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded-md border-2 border-black bg-[#FFD700] text-black font-extrabold shadow-[2px_2px_0px_#000]">
              v1.0 M1
            </span>
          </Link>
          <nav
            className="hidden md:flex items-center gap-1.5 lg:gap-2 text-xs font-bold text-black flex-wrap"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 border-2 ${
                    isActive
                      ? "bg-[#00C2CB] text-black border-black shadow-[2px_2px_0px_#000] font-black"
                      : link.highlight
                      ? "bg-[#FF00FF] text-white border-black shadow-[2px_2px_0px_#000] font-black hover:bg-[#ff33ff]"
                      : "border-transparent hover:border-black hover:bg-[#F4F0EA] text-black"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.highlight && (
                    <span className="text-[9px] font-mono uppercase bg-[#FFD700] text-black border border-black px-1 py-0.5 rounded font-black leading-none shadow-[1px_1px_0px_#000]">
                      WOW-10
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 lg:gap-4 text-xs font-bold shrink-0">
          {/* API Status Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border-2 border-black bg-[#00C2CB] text-black font-mono text-xs font-black shadow-[2px_2px_0px_#000]">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            API: ONLINE
          </span>

          {/* User Session Profile & Role Badge */}
          {isLoading ? (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-20 h-6 bg-[#E2DDD5] border-2 border-black rounded-lg" />
              <div className="w-16 h-6 bg-[#E2DDD5] border-2 border-black rounded-lg" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2.5 pl-3 border-l-2 border-black">
              <div className="flex items-center gap-2 bg-[#F4F0EA] border-2 border-black rounded-lg px-2.5 py-1 shadow-[2px_2px_0px_#000]">
                <div className="w-5 h-5 rounded-md bg-white border border-black flex items-center justify-center text-black">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-black font-black hidden lg:inline-block max-w-[120px] truncate">
                  {user.full_name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-extrabold ${
                    getRoleBadge(user.role).className
                  }`}
                >
                  {getRoleBadge(user.role).label}
                </span>
              </div>
              <button
                onClick={() => logout()}
                type="button"
                className="neo-btn neo-btn-white py-1 px-2.5 text-xs"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-3 border-l-2 border-black">
              <Link
                href="/login"
                className="neo-btn neo-btn-teal py-1 px-3 text-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
