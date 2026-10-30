import { NextRequest, NextResponse } from "next/server";
import { reviewQueueStore } from "./store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const severity = searchParams.get("severity");
  const channel = searchParams.get("channel");
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.toLowerCase();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") || "10", 10);

  let filtered = [...reviewQueueStore];

  if (severity && severity !== "ALL") {
    filtered = filtered.filter((i) => i.severity === severity);
  }
  if (channel && channel !== "ALL") {
    filtered = filtered.filter((i) => i.submission_channel === channel);
  }
  if (status && status !== "ALL") {
    filtered = filtered.filter((i) => i.status === status);
  }
  if (search) {
    filtered = filtered.filter(
      (i) =>
        i.title.toLowerCase().includes(search) ||
        i.matched_text.toLowerCase().includes(search) ||
        i.rule_code.toLowerCase().includes(search) ||
        i.submission_title.toLowerCase().includes(search)
    );
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = (page - 1) * pageSize;
  const items = filtered.slice(startIdx, startIdx + pageSize);

  return NextResponse.json({
    items,
    total,
    page,
    page_size: pageSize,
    total_pages: totalPages,
  });
}
