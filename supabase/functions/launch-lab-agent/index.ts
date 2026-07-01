/**
 * Launch Lab Agent — Pitch Coach + Idea Canvas (Hackathon 2026)
 * Uses Google Gemini via GOOGLE_AI_API_KEY.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const GEMINI_MODEL = "gemini-2.5-flash"

const PITCH_SYSTEM = `You are Pitch Coach, an elite startup pitch analyst and storytelling coach.
Analyze the pitch using the provided context (pitch type, audience, industry, product name).
Respond with ONLY valid JSON matching this schema:
{
  "scores": { "clarity": 0-100, "structure": 0-100, "value": 0-100, "cta": 0-100 },
  "overall": 0-100,
  "ready_for_planning": boolean,
  "headline": "punchy 8-12 word headline",
  "tagline": "memorable tagline under 12 words",
  "one_liner": "single sentence value prop",
  "improved_pitch": "3-5 sentence polished pitch tailored to audience",
  "target_audience_fit": "1-2 sentences on audience alignment",
  "strengths": ["2-4 things already working well"],
  "fixes": ["up to 5 specific improvements"],
  "objections": [{ "question": "...", "suggested_answer": "..." }],
  "weak_moments": [{ "excerpt": "quote from pitch", "issue": "..." }],
  "practice_questions": ["3-5 questions the audience will likely ask"]
}
Set ready_for_planning true if overall >= 55 or pitch is coherent enough to plan from.
Be specific, actionable, and encouraging.`

const CANVAS_SYSTEM = `You are Idea Canvas, a launch strategist and startup operator.
Given a polished pitch and context, build a comprehensive launch board.
Respond with ONLY valid JSON:
{
  "clusters": {
    "problems": [{ "id": "p1", "title": "...", "detail": "..." }],
    "ideas": [{ "id": "i1", "title": "...", "detail": "..." }],
    "risks": [{ "id": "r1", "title": "...", "detail": "..." }],
    "next_steps": [{ "id": "n1", "title": "...", "detail": "..." }]
  },
  "kpis": [{ "label": "Metric name", "target": "30-day target" }],
  "milestones": [{ "week": 1, "title": "Week theme", "goals": ["goal1", "goal2"] }],
  "elevator_hooks": ["3 catchy opening lines for different situations"],
  "synthesis": "Markdown launch plan with ## Week 1-4, bullets, metrics, and priorities"
}
Provide 4-6 items per cluster. Include 3-4 KPIs and 4 weekly milestones.`

function parseJsonFromModel(text: string): unknown {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenceMatch ? fenceMatch[1].trim() : trimmed
  return JSON.parse(raw)
}

async function callGemini(
  apiKey: string,
  systemInstruction: string,
  userContent: string,
  maxTokens: number,
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        generationConfig: {
          temperature: 0.45,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      }),
    },
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Google AI API error: ${errText}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Empty response from Gemini")
  return text
}

function buildContextBlock(body: Record<string, unknown>): string {
  const parts: string[] = []
  if (body.product_name) parts.push(`Product: ${body.product_name}`)
  if (body.pitch_type) parts.push(`Pitch type: ${body.pitch_type}`)
  if (body.audience) parts.push(`Audience: ${body.audience}`)
  if (body.industry) parts.push(`Industry: ${body.industry}`)
  return parts.length ? `\n\nContext:\n${parts.join("\n")}` : ""
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_AI_API_KEY")

    if (req.method === "GET") {
      return new Response(
        JSON.stringify({
          ok: true,
          provider: "google",
          model: GEMINI_MODEL,
          configured: !!apiKey,
          modes: ["pitch", "canvas"],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      )
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_AI_API_KEY is not configured in Supabase secrets" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 },
      )
    }

    let body: Record<string, unknown> = {}
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      )
    }

    const mode = body.mode as string | undefined
    const contextBlock = buildContextBlock(body)

    if (mode === "pitch") {
      const pitch = (body.pitch as string | undefined)?.trim()
      if (!pitch || pitch.length < 20) {
        return new Response(
          JSON.stringify({ error: "pitch is required (at least 20 characters)" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        )
      }

      const raw = await callGemini(
        apiKey,
        PITCH_SYSTEM,
        `Analyze this pitch:${contextBlock}\n\n---\n${pitch}`,
        2500,
      )
      const parsed = parseJsonFromModel(raw) as Record<string, unknown>

      return new Response(
        JSON.stringify({ mode: "pitch", ...parsed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      )
    }

    if (mode === "canvas") {
      const improvedPitch = (body.improved_pitch as string | undefined)?.trim()
      if (!improvedPitch || improvedPitch.length < 10) {
        return new Response(
          JSON.stringify({ error: "improved_pitch is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        )
      }

      const raw = await callGemini(
        apiKey,
        CANVAS_SYSTEM,
        `Build launch canvas from this pitch:${contextBlock}\n\n---\n${improvedPitch}`,
        4000,
      )
      const parsed = parseJsonFromModel(raw) as Record<string, unknown>

      return new Response(
        JSON.stringify({ mode: "canvas", ...parsed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      )
    }

    return new Response(
      JSON.stringify({ error: 'mode must be "pitch" or "canvas"' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[launch-lab-agent]", message)
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    )
  }
})
