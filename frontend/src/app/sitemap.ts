import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://canon-governance.vercel.app";
  const now = new Date();

  const routes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/submissions", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/review", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/policy", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/governance", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/evaluation", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/transparency", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/demo", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/cookies", priority: 0.5, changeFrequency: "monthly" as const },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
