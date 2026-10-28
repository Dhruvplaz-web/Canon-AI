"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Sparkles,
  User as UserIcon,
  LogOut,
  LogIn,
  ShieldCheck,
  CheckCircle2,
  Database,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getNavItemsForRole } from "@/lib/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/CommandPalette";
import {
  Button,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui";

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);

  // Safe SSR platform detection via standard React external store
  const isMac = React.useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent),
    () => false
  );

  // Global Ctrl+K / Cmd+K shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Derive filtered nav items from canonical role map
  const navLinks = React.useMemo(() => {
    return getNavItemsForRole(user?.role);
  }, [user?.role]);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "brand_manager":
        return {
          label: "Brand Manager",
          className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
        };
      case "reviewer":
        return {
          label: "Reviewer",
          className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
        };
      case "creator":
        return {
          label: "Creator",
          className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
        };
      default:
        return {
          label: role.replace("_", " "),
          className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
        };
    }
  };

  return (
    <>
      {/* Skip to Content Link (WCAG 2.4.1 Bypass Blocks) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-primary)] focus:text-white focus:rounded-[var(--radius-button)] focus:shadow-lg focus:font-semibold focus:text-xs"
      >
        Skip to main content
      </a>

      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] sticky top-0 z-40 px-4 sm:px-6 py-2.5 transition-colors shadow-xs">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Desktop Navigation */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-base font-bold tracking-tight text-[var(--color-text-primary)] hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] rounded shrink-0"
            >
              <div
                aria-hidden="true"
                className="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xs shadow-xs"
              >
                C
              </div>
              <span className="font-extrabold text-base tracking-tight text-[var(--color-text-primary)]">
                CANON
              </span>
            </Link>

            <nav
              className="hidden md:flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)]"
              aria-label="Main Navigation"
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`px-3 py-1.5 rounded-[var(--radius-button)] transition flex items-center gap-1.5 text-xs ${
                      isActive
                        ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-primary-muted)] font-semibold"
                        : link.highlight
                        ? "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800 font-semibold hover:opacity-90"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-transparent"
                    }`}
                  >
                    {link.highlight && <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls: Demo Workspace Pill, Theme Toggle, User Menu, Mobile Drawer */}
          <div className="flex items-center gap-2.5 sm:gap-3 text-xs shrink-0">
            {/* Demo Workspace Active Indicator (Item C16) */}
            <div
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] font-mono text-[11px]"
              title="Operating in demonstration workspace mode"
            >
              <Database className="w-3 h-3 text-blue-500" aria-hidden="true" />
              <span>Demo Workspace</span>
            </div>

            {/* Quick Command Palette Search Button */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-default)] transition text-xs cursor-pointer"
              title="Open quick command palette (Ctrl+K / Cmd+K)"
              aria-label="Open command palette"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="text-xs font-medium">Quick search...</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
                {isMac ? "⌘K" : "Ctrl K"}
              </kbd>
            </button>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* User Session Profile & Role Dropdown (Items 31, 46) */}
            {isLoading ? (
              <div className="flex items-center gap-2 animate-pulse">
                <div className="w-20 h-7 bg-[var(--color-surface-muted)] rounded-md" />
              </div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-[var(--radius-button)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] cursor-pointer"
                    aria-label={`User menu for ${user.full_name}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold text-[11px] flex items-center justify-center border border-[var(--color-primary-muted)]">
                      {getInitials(user.full_name)}
                    </div>
                    <span className="text-xs font-semibold max-w-[100px] truncate hidden sm:inline-block">
                      {user.full_name}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                        getRoleBadge(user.role).className
                      }`}
                    >
                      {getRoleBadge(user.role).label}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-semibold text-xs text-[var(--color-text-primary)]">{user.full_name}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)] font-normal">{user.email}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-1">Acme Corp (Primary Workspace)</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/policy" className="flex items-center gap-2 w-full">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Brand Policy Authority</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onClick={() => logout()}>
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition text-xs font-semibold shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in</span>
              </Link>
            )}

            {/* Mobile Menu Drawer Button (Item 8) */}
            <div className="md:hidden">
              <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open mobile navigation drawer"
                    className="w-8 h-8"
                  >
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xs">
                        C
                      </div>
                      <span>CANON</span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
                    <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-2.5 mb-1">
                      Navigation ({user ? getRoleBadge(user.role).label : "Guest"})
                    </span>
                    {navLinks.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsMobileOpen(false)}
                          aria-current={isActive ? "page" : undefined}
                          className={`px-3 py-2 rounded-[var(--radius-button)] text-xs font-medium transition flex items-center justify-between ${
                            isActive
                              ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-semibold"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {link.highlight && <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                            <span>{link.label}</span>
                          </div>
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />}
                        </Link>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
                    <div className="flex items-center justify-between px-2 text-xs text-[var(--color-text-secondary)]">
                      <span>Appearance</span>
                      <ThemeToggle />
                    </div>
                    {user ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsMobileOpen(false);
                          logout();
                        }}
                        className="w-full justify-center"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-1.5" />
                        <span>Sign out ({user.full_name})</span>
                      </Button>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setIsMobileOpen(false)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white text-xs font-semibold"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign in</span>
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Global Quick Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
}
