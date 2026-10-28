import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export interface WebhookDispatchRequestBody {
  event_type:
    | "submission.approved"
    | "submission.sent_back"
    | "submission.critical_violation"
    | "certificate.issued";
  submission_id: string;
  submission_title: string;
  channel?: string;
  decision?: "APPROVED" | "SENT_BACK" | string;
  reviewer_name?: string;
  reviewer_email?: string;
  notes?: string;
  certificate_id?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body: WebhookDispatchRequestBody = await req.json();

    if (!body.submission_id || !body.submission_title || !body.event_type) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required fields: submission_id, submission_title, event_type.",
          },
        },
        { status: 400 }
      );
    }

    // Secret stored strictly server-side; NEVER sent to client
    const secret =
      process.env.WEBHOOK_SIGNING_SECRET ||
      process.env.JWT_SECRET_KEY ||
      "canon_live_webhook_signing_secret_2026_hs256";

    const timestamp = new Date().toISOString();
    const eventId = `evt_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const deliveryId = `del_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    // Build standard enterprise webhook payload
    const payload = {
      event_id: eventId,
      event_type: body.event_type,
      created_at: timestamp,
      workspace: {
        id: "wks_01j7acme0000000000000001",
        name: "Acme Financial Global",
        domain: "acmefinancial.com",
      },
      data: {
        submission: {
          id: body.submission_id,
          title: body.submission_title,
          channel: body.channel || "web_landing_page",
          status: body.decision || (body.event_type === "submission.approved" ? "APPROVED" : "SENT_BACK"),
        },
        decision: body.decision || (body.event_type === "submission.approved" ? "APPROVED" : "SENT_BACK"),
        reviewer: {
          name: body.reviewer_name || "Rachel Reviewer",
          email: body.reviewer_email || "rachel@acmefinancial.com",
          role: "Certified Brand Compliance Officer",
        },
        justification: body.notes || "Official governance action executed.",
        certificate_reference: body.certificate_id || null,
        verification_url: body.certificate_id
          ? `/transparency?cert=${body.certificate_id}`
          : null,
      },
      simulation_metadata: {
        is_simulated: true,
        dispatched_by: "Canon Enterprise Webhook Dispatcher",
        destination_channel: "#brand-governance",
        target_endpoint: "https://hooks.slack.com/services/T00/B00/canon-brand-governance",
      },
    };

    // Calculate real HMAC-SHA256 signature using server secret
    const rawPayload = JSON.stringify(payload);
    const signature = `sha256=${crypto
      .createHmac("sha256", secret)
      .update(rawPayload)
      .digest("hex")}`;

    const headers: Record<string, string> = {
      "Host": "hooks.slack.com",
      "Content-Type": "application/json",
      "User-Agent": "Canon-Webhook-Engine/2.0",
      "X-Canon-Event": body.event_type,
      "X-Canon-Delivery": deliveryId,
      "X-Canon-Signature": signature,
      "X-Canon-Timestamp": timestamp,
    };

    // Formulate Slack-style message preview
    let headline = "";
    if (body.event_type === "submission.approved") {
      headline = body.certificate_id
        ? `Acme Q1 Campaign "${body.submission_title}" officially approved with Cert #${body.certificate_id}`
        : `Campaign "${body.submission_title}" officially approved by ${body.reviewer_name || "Rachel Reviewer"}`;
    } else if (body.event_type === "submission.sent_back") {
      headline = `Campaign "${body.submission_title}" returned for revision: "${body.notes || "Revisions required"}"`;
    } else if (body.event_type === "certificate.issued") {
      headline = `Compliance Certificate #${body.certificate_id || "CERT-ACME"} generated for "${body.submission_title}"`;
    } else {
      headline = `Critical brand violation detected in "${body.submission_title}"`;
    }

    return NextResponse.json({
      success: true,
      simulated: true,
      channel: "#brand-governance",
      headline,
      delivery_id: deliveryId,
      timestamp,
      headers,
      payload,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook dispatch failed";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
