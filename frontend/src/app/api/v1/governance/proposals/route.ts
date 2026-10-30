import { NextResponse } from "next/server";
import { proposalsStore } from "./store";

export async function GET() {
  return NextResponse.json(proposalsStore);
}
