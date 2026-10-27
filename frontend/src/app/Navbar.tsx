"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User as UserIcon, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "brand_manager":
        return {
          label: "Brand Manager",
          className: "bg-purple-50 text-purple-700 border border-purple-200",
        };
      case "reviewer":
        return {
          label: "Reviewer",
          className: "bg-amber-50 text-amber-700 border border-amber-200",
        };
      case "creator":
        return {
          label: "Creator",
          className: "bg-blue-50 text-blue-700 border border-blue-200",
        };
      default:
        return {
          label: role.replace("_", " "),
          className: "bg-gray-50 text-gray-700 border border-gray-200",
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
    <header className="border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-xs">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-base font-bold tracking-tight text-[#111827] hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded shrink-0"
            aria-label="Canon Home"
          >
            <div className="w-7 h-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              C
            </div>
            <span className="font-extrabold text-base tracking-tight text-[#111827]">CANON</span>
          </Link>

          <nav
            className="hidden md:flex items-center gap-1 text-xs font-medium text-[#4B5563]"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs ${
                    isActive
                      ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-semibold"
                      : link.highlight
                      ? "bg-amber-50 text-amber-800 border border-amber-200 font-semibold hover:bg-amber-100"
                      : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] border border-transparent"
                  }`}
                >
                  {link.highlight && <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 lg:gap-4 text-xs shrink-0">

          {/* User Session Profile & Role Badge */}
          {isLoading ? (
            <div className="flex items-center gap-2 animate-pulse">
              <div className="w-20 h-6 bg-[#F3F4F6] rounded-md" />
              <div className="w-16 h-6 bg-[#F3F4F6] rounded-md" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#E5E7EB]">
              <div className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-2.5 py-1">
                <div className="w-5 h-5 rounded-md bg-white border border-[#E5E7EB] flex items-center justify-center text-[#4B5563]">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-[#111827] font-semibold hidden lg:inline-block max-w-[120px] truncate">
                  {user.full_name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold ${
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
            <div className="flex items-center gap-2 pl-3 border-l border-[#E5E7EB]">
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

      {/* Mobile Scrollable Navigation */}
      <nav className="md:hidden border-t border-[#E5E7EB] mt-2 pt-2 flex items-center gap-1 overflow-x-auto text-xs font-medium text-[#4B5563] pb-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 py-1 rounded-md transition whitespace-nowrap text-xs ${
                isActive
                  ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                  : "text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
