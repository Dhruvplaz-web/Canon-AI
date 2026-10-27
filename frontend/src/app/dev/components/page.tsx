"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import {
  ShieldAlert,
  Sparkles,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Settings,
  LogOut,
} from "lucide-react";

import {
  Button,
  Input,
  Select,
  Badge,
  StatusBadge,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  SimpleTooltip,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  Skeleton,
  Breadcrumb,
  EmptyState,
  ErrorState,
  useToast,
} from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatDate, formatPercent } from "@/lib/formatters";

export default function ComponentShowcasePage() {
  // Disabled in production unless explicitly enabled for automated verification
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_SHOWCASE !== "true"
  ) {
    notFound();
  }

  const { addToast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border-subtle)]">
        <div>
          <Breadcrumb
            items={[
              { label: "Developer", href: "/dev/components" },
              { label: "Design System Showcase", isCurrent: true },
            ]}
            className="mb-2"
          />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Canon Enterprise Design System (v2.0)
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Standardized tokens, accessible primitives, and 8pt rhythm components. Disabled in production.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-muted)]">Theme Mode:</span>
          <ThemeToggle />
        </div>
      </div>

      {/* 1. BUTTONS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            1. Buttons &amp; Interactive States (Item 27)
          </h2>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">Button.tsx</span>
        </div>
        <div className="p-6 rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-6">
          {/* Variants */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">
              Variants (Primary, Secondary, Outline, Ghost, Destructive)
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary Action</Button>
              <Button variant="outline">Outline Action</Button>
              <Button variant="ghost">Ghost Action</Button>
              <Button variant="destructive">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Destructive</span>
              </Button>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">
              Sizes (sm, md, lg, icon)
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small (32px)</Button>
              <Button size="md">Medium (36px)</Button>
              <Button size="lg">Large (44px)</Button>
              <Button size="icon" aria-label="Quick search">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* States */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wider">
              States (Hover, Focus, Loading, Disabled)
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" isLoading>
                Saving Draft...
              </Button>
              <Button variant="secondary" disabled>
                Disabled Action
              </Button>
              <Button variant="outline">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>With Icon</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FORM CONTROLS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            2. Form Controls &amp; Validation States (Item 46)
          </h2>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">Input.tsx · Select.tsx</span>
        </div>
        <div className="p-6 rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label htmlFor="input-default" className="text-xs font-medium text-[var(--color-text-primary)]">
              Standard Input
            </label>
            <Input
              id="input-default"
              placeholder="e.g. Acme Marketing Blast Q4"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <p className="text-[11px] text-[var(--color-text-muted)]">Helper text for input context.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="input-error" className="text-xs font-medium text-[var(--status-critical)]">
              Validation Error Input
            </label>
            <Input
              id="input-error"
              defaultValue="Invalid Rule Syntax @"
              isError
              aria-describedby="error-hint"
            />
            <p id="error-hint" className="text-[11px] text-[var(--status-critical)] font-medium">
              Rule code must match statutory pattern TERM-[0-9]{3}.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="select-channel" className="text-xs font-medium text-[var(--color-text-primary)]">
              Accessible Select Box
            </label>
            <Select id="select-channel" defaultValue="email">
              <option value="email">Email Blast Marketing</option>
              <option value="social">Social Media Post</option>
              <option value="pr">Press Release</option>
              <option value="landing">Landing Page Copy</option>
            </Select>
            <p className="text-[11px] text-[var(--color-text-muted)]">Styled select with custom chevron.</p>
          </div>
        </div>
      </section>

      {/* 3. SEMANTIC STATUS & SEVERITY BADGES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            3. Semantic Status &amp; Severity Badges (Item 24)
          </h2>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">StatusBadge.tsx · Badge.tsx</span>
        </div>
        <div className="p-6 rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-4">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Every severity is paired with an explicit icon and text label (never color alone), adhering to WCAG 1.4.1.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge severity="CRITICAL" />
            <StatusBadge severity="WARNING" />
            <StatusBadge severity="INFO" />
            <StatusBadge severity="PASSED" />
          </div>
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <Badge variant="default">Default Token</Badge>
            <Badge variant="secondary">Secondary Token</Badge>
            <Badge variant="outline">Outline Token</Badge>
            <Badge variant="critical">Critical Bordered</Badge>
            <Badge variant="warning">Warning Bordered</Badge>
            <Badge variant="info">Info Bordered</Badge>
            <Badge variant="success">Success Bordered</Badge>
          </div>
        </div>
      </section>

      {/* 4. MODALS & SHEETS (RADIX PRIMITIVES) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            4. Focus-Trapped Modals &amp; Slide-Out Sheets (Items 45, 47)
          </h2>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">Dialog.tsx · Sheet.tsx</span>
        </div>
        <div className="p-6 rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex flex-wrap items-center gap-4">
          {/* Dialog Demo */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="primary">Open Radix Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Statutory Release Sign-Off</DialogTitle>
                <DialogDescription>
                  This dialog has a native focus trap. Try pressing Tab to cycle focus or Escape to dismiss.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2 space-y-3">
                <label className="text-xs font-medium text-[var(--color-text-primary)]">
                  Approver Justification Note
                </label>
                <Input placeholder="Enter statutory notes..." />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="primary" onClick={() => setIsDialogOpen(false)}>
                  Confirm Sign-Off
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Sheet Demo */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="secondary">Open Slide-Out Sheet</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Policy Excerpt Grounding</SheetTitle>
                <SheetDescription>
                  Slide-out panel for mobile navigation or side-by-side rule examination.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 py-4 text-xs text-[var(--color-text-secondary)] space-y-3">
                <div className="p-3 rounded-lg border border-[var(--status-warn-border)] bg-[var(--status-warn-bg)]">
                  <h4 className="font-semibold text-[var(--status-warn)] mb-1">
                    Statutory Rule Quote
                  </h4>
                  <p className="font-mono text-[11px] text-[var(--status-warn)]">
                    &ldquo;Copywriters must never use the phrase &lsquo;guaranteed returns&rsquo;.&rdquo;
                  </p>
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline" className="w-full">
                    Close Panel
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Tooltip Demo */}
          <SimpleTooltip content="SHA-256 HMAC cryptographic certificate is valid and immutable.">
            <Button variant="outline">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
              <span>Hover for Tooltip</span>
            </Button>
          </SimpleTooltip>

          {/* Dropdown Menu Demo */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                <User className="w-3.5 h-3.5" />
                <span>User Profile Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Rachel Reviewer</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="w-3.5 h-3.5 mr-2" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-3.5 h-3.5 mr-2" />
                <span>Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>
                <LogOut className="w-3.5 h-3.5 mr-2" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      {/* 5. TABS & DATA TABLE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            5. Accessible Tabs &amp; Semantic Table (Items 18, 25, 46)
          </h2>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">Tabs.tsx · Table.tsx</span>
        </div>
        <div className="p-6 rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-6">
          <Tabs defaultValue="triage">
            <TabsList>
              <TabsTrigger value="triage">Active Triage (3)</TabsTrigger>
              <TabsTrigger value="history">History Log</TabsTrigger>
              <TabsTrigger value="metrics">Telemetry Metrics</TabsTrigger>
            </TabsList>
            <TabsContent value="triage" className="pt-4">
              <Table>
                <TableCaption>Active Review Queue Submissions with Tabular Numerals</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Code</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Draft Title</TableHead>
                    <TableHead>Evaluated Date</TableHead>
                    <TableHead className="text-right">Pass Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono font-semibold">TERM-007</TableCell>
                    <TableCell>
                      <StatusBadge severity="CRITICAL" />
                    </TableCell>
                    <TableCell>Q4 Wealth Advisory Campaign</TableCell>
                    <TableCell>{formatDate("2026-10-28T00:30:00Z")}</TableCell>
                    <TableCell isNumeric>{formatPercent(89.2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono font-semibold">CLAIM-002</TableCell>
                    <TableCell>
                      <StatusBadge severity="WARNING" />
                    </TableCell>
                    <TableCell>Instant Pre-Qualified Credit Blast</TableCell>
                    <TableCell>{formatDate("2026-10-27T18:45:00Z")}</TableCell>
                    <TableCell isNumeric>{formatPercent(0.945)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono font-semibold">STYLE-001</TableCell>
                    <TableCell>
                      <StatusBadge severity="INFO" />
                    </TableCell>
                    <TableCell>Brand Voice &amp; Tone Adherence</TableCell>
                    <TableCell>{formatDate("2026-10-27T12:00:00Z")}</TableCell>
                    <TableCell isNumeric>{formatPercent(100)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="history" className="pt-4 text-xs text-[var(--color-text-secondary)]">
              History log entries will appear here.
            </TabsContent>
            <TabsContent value="metrics" className="pt-4 text-xs text-[var(--color-text-secondary)]">
              Telemetry metrics will appear here.
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* 6. SKELETONS, EMPTY STATES & TOASTS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            6. State Spectrum: Skeletons, Empty &amp; Error Views, Toasts (Def. 4, Item 43)
          </h2>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">Skeleton.tsx · EmptyState.tsx · ErrorState.tsx · Toast.tsx</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Skeleton Card */}
          <div className="p-6 rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-3">
            <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
              Loading Skeleton
            </h3>
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-16 w-full mt-3" />
            <Skeleton className="h-8 w-24 ml-auto" />
          </div>

          {/* Empty State */}
          <EmptyState
            title="No Pending Findings"
            description="All marketing draft text satisfies governing brand policy rules."
            actionLabel="Create New Draft"
            onAction={() => addToast({ type: "info", message: "Draft creation initiated." })}
          />

          {/* Error State */}
          <ErrorState
            title="Service Temporarily Busy"
            message="The inference gate is throttling automated requests. Please retry in 5s."
            onRetry={() => addToast({ type: "success", message: "Retry succeeded. Connected." })}
          />
        </div>

        {/* Toast Triggers */}
        <div className="p-6 rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] mr-2">
            Trigger Live Toasts:
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addToast({
                type: "success",
                title: "Finding Overridden",
                message: "Override reason SCOPE_MISMATCH recorded in immutable ledger.",
              })
            }
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span>Success Toast</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addToast({
                type: "error",
                title: "Sign-Off Blocked",
                message: "Critical severity findings must be resolved before approval.",
              })
            }
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>Error Toast</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addToast({
                type: "info",
                title: "Backtest Running",
                message: "Evaluating 24 historical drafts against candidate v1.1.",
              })
            }
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Info Toast</span>
          </Button>
        </div>
      </section>
    </div>
  );
}
