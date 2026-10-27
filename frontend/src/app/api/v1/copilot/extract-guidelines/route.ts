import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const docTitle = body.document_title || "Enterprise Brand Guidelines";
    const rawContent = body.content || "";

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let extractedRules = null;

    const extractionPrompt = `You are a Principal Brand Governance Architect.
Analyze the following policy/guidelines text and extract structured brand compliance rules.
Return ONLY valid JSON with a single key "rules", where each item has:
- "rule_code": string (e.g. "EXT-001", "EXT-002")
- "title": string (concise rule title)
- "category": string ("TERMINOLOGY", "CLAIM", "TONE", or "REGULATORY")
- "severity": string ("CRITICAL", "WARNING", or "INFO")
- "exact_terms": array of prohibited or monitored string keywords
- "guideline_quote": exact quote from the document
- "suggested_replacement": compliant approved phrasing
- "rationale": explanation of brand risk

Input Guidelines Document:
"""
${rawContent}
"""`;

    // 1. Groq
    if (groqKey) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: extractionPrompt }],
            temperature: 0.1,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.choices[0].message.content);
          if (Array.isArray(parsed.rules) && parsed.rules.length > 0) {
            extractedRules = parsed.rules;
          }
        }
      } catch {
        // Fall through
      }
    }

    // 2. Gemini
    if (!extractedRules && geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: extractionPrompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
          if (Array.isArray(parsed.rules) && parsed.rules.length > 0) {
            extractedRules = parsed.rules;
          }
        }
      } catch {
        // Fall through
      }
    }

    // 3. OpenAI
    if (!extractedRules && openaiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: extractionPrompt }],
            temperature: 0.1,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.choices[0].message.content);
          if (Array.isArray(parsed.rules) && parsed.rules.length > 0) {
            extractedRules = parsed.rules;
          }
        }
      } catch {
        // Fall through
      }
    }

    // 4. Algorithmic Parser Fallback
    if (!extractedRules) {
      const lines = rawContent.split("\n").filter((l: string) => l.trim().length > 0);
      extractedRules = lines.map((line: string, idx: number) => {
        const clean = line.replace(/^\d+[\.\)]\s*/, "").trim();
        const code = `RULE-${String(idx + 1).padStart(3, "0")}`;
        const termsMatch = clean.match(/['"](.*?)['"]/g);
        const exactTerms = termsMatch
          ? termsMatch.map((t: string) => t.replace(/['"]/g, ""))
          : [clean.split(" ").slice(0, 3).join(" ")];

        return {
          rule_code: code,
          title: clean.slice(0, 50) + (clean.length > 50 ? "..." : ""),
          category: clean.toLowerCase().includes("claim") ? "CLAIM" : "TERMINOLOGY",
          severity: clean.toLowerCase().includes("never") || clean.toLowerCase().includes("forbidden") ? "CRITICAL" : "WARNING",
          exact_terms: exactTerms,
          guideline_quote: clean,
          suggested_replacement: "Use compliant statutory terminology.",
          rationale: `Derived from policy section: "${docTitle}".`,
        };
      });
    }

    return NextResponse.json({
      document_title: docTitle,
      rules: extractedRules,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to extract guidelines";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
