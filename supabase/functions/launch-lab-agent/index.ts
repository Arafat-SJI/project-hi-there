/**
 * Launch Lab Agent — Pitch Coach + Idea Canvas (Hackathon 2026)
 * Uses Google Gemini via GOOGLE_AI_API_KEY.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { jsonrepair } from "https://esm.sh/jsonrepair@3.12.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const DEFAULT_MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"]

function getModelChain(): string[] {
  const fromEnv = Deno.env.get("LAUNCH_LAB_GEMINI_MODELS") ?? Deno.env.get("LAUNCH_LAB_GEMINI_MODEL")
  if (!fromEnv) return DEFAULT_MODEL_CHAIN

  const models = fromEnv.split(",").map((m) => m.trim()).filter(Boolean)
  return models.length > 0 ? models : DEFAULT_MODEL_CHAIN
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isQuotaOrRateLimit(status: number, errText: string): boolean {
  return (
    status === 429 ||
    errText.includes("RESOURCE_EXHAUSTED") ||
    errText.includes("quota") ||
    errText.includes("rate limit")
  )
}

function parseGeminiError(errText: string): string {
  try {
    const parsed = JSON.parse(errText) as {
      error?: { message?: string; code?: number; status?: string }
    }
    const message = parsed?.error?.message
    if (message) {
      if (isQuotaOrRateLimit(parsed.error?.code ?? 0, message)) {
        return "Gemini API free-tier quota reached for this model. The agent will try fallback models automatically; if all fail, wait until tomorrow or enable billing at ai.google.dev."
      }
      return message
    }
  } catch {
    // not JSON
  }
  return errText.slice(0, 280)
}

function allModelsQuotaMessage(): string {
  return "Gemini API quota exhausted on all configured models. Free tier is ~20 requests/day per model. Wait until tomorrow (UTC reset), enable billing at ai.google.dev, or set LAUNCH_LAB_GEMINI_MODELS to another model via Supabase secrets."
}

const PITCH_SYSTEM = `You are Launch Lab Coach, an elite startup strategist and storytelling coach.
Analyze the user's input — it may be a pitch, project idea, business plan, product plan, or launch narrative.
Use the provided context (content type, audience, industry, product name).
Respond with ONLY valid JSON matching this schema (no markdown, no code fences, no commentary):
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
  "weak_moments": [{ "excerpt": "short quote", "issue": "..." }],
  "practice_questions": ["3-5 questions the audience will likely ask"]
}
Rules:
- Escape double quotes inside strings (use \\" or rephrase).
- Keep excerpts under 90 characters; paraphrase if needed.
- No trailing commas. No text outside the JSON object.
Set ready_for_planning true if overall >= 55 or the input is coherent enough to plan from.
Be specific, actionable, and encouraging.`

const PITCH_MAX_TOKENS = 4096

const CANVAS_SYSTEM = `You are Idea Canvas, a launch strategist and startup operator.
Given a polished pitch and context, build a launch board.
Respond with ONLY valid JSON (no markdown fences, no commentary outside JSON).
Keep copy concise so the full JSON fits in one response.
Schema:
{
  "clusters": {
    "problems": [{ "id": "p1", "title": "short title", "detail": "one sentence" }],
    "ideas": [{ "id": "i1", "title": "short title", "detail": "one sentence" }],
    "risks": [{ "id": "r1", "title": "short title", "detail": "one sentence" }],
    "next_steps": [{ "id": "n1", "title": "short title", "detail": "one sentence" }]
  },
  "kpis": [{ "label": "Metric", "target": "30-day target" }],
  "milestones": [{ "week": 1, "title": "Theme", "goals": ["goal1", "goal2"] }],
  "elevator_hooks": ["hook 1", "hook 2", "hook 3"],
  "synthesis": "Plain-text launch plan under 120 words. Use \\n between weeks. No markdown headers."
}
Rules:
- Exactly 4 items per cluster (ids p1-p4, i1-i4, r1-r4, n1-n4).
- 3 KPIs, 4 milestones (weeks 1-4), 3 elevator_hooks.
- Escape double quotes inside strings. No trailing commas.`

const CANVAS_MAX_TOKENS = 8192

const SOCIAL_POST_SYSTEM = `You write ready-to-publish social media posts for product launches.
Respond with ONLY valid JSON: { "post_copy": "..." }

Rules:
- Plain text only. No markdown, no bullet characters, no JSON in the post body.
- linkedin: professional B2B tone, 2-4 short paragraphs, max 3 relevant hashtags at the end, thought leadership angle.
- facebook: warm conversational tone, 1-2 paragraphs, light emoji ok (max 2), clear call to action at the end.
- Reference the product and value prop naturally. Do not use placeholder brackets.`

const SOCIAL_POST_MAX_TOKENS = 1024

function stripJsonNoise(text: string): string {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
}

function repairJsonCandidate(text: string): string {
  let candidate = stripJsonNoise(text)
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  candidate = candidate.replace(/,\s*([}\]])/g, "$1")
  return candidate
}

function repairTruncatedJson(text: string): string {
  let candidate = repairJsonCandidate(text)
  const lastBrace = candidate.lastIndexOf("}")
  if (lastBrace > 0) {
    candidate = candidate.slice(0, lastBrace + 1)
  }
  return candidate
}

function tryParseJsonCandidate(candidate: string): unknown {
  const trimmed = candidate.trim()
  if (!trimmed) throw new Error("Empty JSON payload")

  const attempts = [
    trimmed,
    repairJsonCandidate(trimmed),
    repairTruncatedJson(trimmed),
  ]

  let lastError: Error | null = null
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      try {
        return JSON.parse(jsonrepair(attempt))
      } catch (repairError) {
        lastError = repairError instanceof Error ? repairError : lastError
      }
    }
  }

  throw lastError ?? new Error("JSON parse failed")
}

function extractGeminiText(candidate: Record<string, unknown> | undefined): string {
  const parts = ((candidate?.content as { parts?: Array<{ text?: string; thought?: boolean }> })?.parts) ?? []

  for (let i = parts.length - 1; i >= 0; i--) {
    const text = parts[i]?.text?.trim() ?? ""
    if (text.startsWith("{") || text.startsWith("[")) return text
  }

  const nonThought = parts
    .filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .trim()
  if (nonThought) return nonThought

  return parts.map((part) => part.text ?? "").join("").trim()
}

function parseJsonFromModel(text: string): unknown {
  const trimmed = stripJsonNoise(text)

  const candidates = [
    trimmed,
    repairJsonCandidate(trimmed),
  ]

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i)
  if (fenceMatch?.[1]) {
    candidates.push(repairJsonCandidate(fenceMatch[1]))
  }

  const objectMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    candidates.push(repairJsonCandidate(objectMatch[0]))
  }

  const seen = new Set<string>()
  for (const candidate of candidates) {
    const key = candidate.slice(0, 200)
    if (!candidate || seen.has(key)) continue
    seen.add(key)
    try {
      return tryParseJsonCandidate(candidate)
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `Model returned invalid JSON. Preview: ${trimmed.slice(0, 160)}${trimmed.length > 160 ? "…" : ""}`,
  )
}

type CanvasNote = { id: string; title: string; detail: string }

function clampScore(value: unknown, fallback = 0): number {
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(100, Math.max(0, Math.round(numeric)))
}

function asStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, maxItems)
}

function asObjections(value: unknown): Array<{ question: string; suggested_answer: string }> {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const row = item as Record<string, unknown>
      const question = typeof row.question === "string" ? row.question.trim() : ""
      const suggested_answer =
        typeof row.suggested_answer === "string" ? row.suggested_answer.trim() : ""
      if (!question) return null
      return {
        question,
        suggested_answer: suggested_answer || "Prepare a concise, evidence-backed answer.",
      }
    })
    .filter((item): item is { question: string; suggested_answer: string } => item !== null)
    .slice(0, 5)
}

function asWeakMoments(value: unknown): Array<{ excerpt: string; issue: string }> {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const row = item as Record<string, unknown>
      const excerpt = typeof row.excerpt === "string" ? row.excerpt.trim() : ""
      const issue = typeof row.issue === "string" ? row.issue.trim() : ""
      if (!excerpt && !issue) return null
      return {
        excerpt: excerpt || "Unclear section",
        issue: issue || "Needs clarification",
      }
    })
    .filter((item): item is { excerpt: string; issue: string } => item !== null)
    .slice(0, 5)
}

function normalizePitchPayload(
  parsed: Record<string, unknown>,
  fallbackPitch: string,
): Record<string, unknown> {
  const rawScores =
    parsed.scores && typeof parsed.scores === "object"
      ? (parsed.scores as Record<string, unknown>)
      : {}

  const scores = {
    clarity: clampScore(rawScores.clarity),
    structure: clampScore(rawScores.structure),
    value: clampScore(rawScores.value),
    cta: clampScore(rawScores.cta),
  }

  const scoreValues = Object.values(scores)
  const averageScore = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
  const overall = clampScore(parsed.overall, Math.round(averageScore))

  const improved_pitch =
    typeof parsed.improved_pitch === "string" && parsed.improved_pitch.trim()
      ? parsed.improved_pitch.trim()
      : fallbackPitch.trim()

  if (!improved_pitch) {
    throw new Error("Pitch response missing improved_pitch")
  }

  const fixes = asStringArray(parsed.fixes, 5)
  const strengths = asStringArray(parsed.strengths, 4)
  const practice_questions = asStringArray(parsed.practice_questions, 5)
  const objections = asObjections(parsed.objections)
  const weak_moments = asWeakMoments(parsed.weak_moments)

  const ready_for_planning =
    typeof parsed.ready_for_planning === "boolean"
      ? parsed.ready_for_planning
      : overall >= 55

  return {
    scores,
    overall,
    ready_for_planning,
    improved_pitch,
    fixes: fixes.length > 0 ? fixes : ["Tighten the opening hook and end with a clear call to action."],
    objections,
    weak_moments,
    headline:
      typeof parsed.headline === "string" && parsed.headline.trim()
        ? parsed.headline.trim()
        : "Your pitch, refined",
    tagline: typeof parsed.tagline === "string" ? parsed.tagline.trim() : "",
    one_liner: typeof parsed.one_liner === "string" ? parsed.one_liner.trim() : "",
    strengths,
    practice_questions,
    target_audience_fit:
      typeof parsed.target_audience_fit === "string" ? parsed.target_audience_fit.trim() : "",
  }
}

function asNotes(value: unknown, prefix: string): CanvasNote[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null
      const row = item as Record<string, unknown>
      const title = typeof row.title === "string" ? row.title.trim() : ""
      const detail = typeof row.detail === "string" ? row.detail.trim() : ""
      if (!title && !detail) return null
      return {
        id: typeof row.id === "string" ? row.id : `${prefix}${index + 1}`,
        title: title || "Untitled",
        detail,
      }
    })
    .filter((item): item is CanvasNote => item !== null)
}

function normalizeCanvasPayload(parsed: Record<string, unknown>): Record<string, unknown> {
  const rawClusters = parsed.clusters
  if (!rawClusters || typeof rawClusters !== "object") {
    throw new Error("Canvas response missing clusters")
  }

  const clusters = rawClusters as Record<string, unknown>
  const problems = asNotes(clusters.problems, "p")
  const ideas = asNotes(clusters.ideas, "i")
  const risks = asNotes(clusters.risks, "r")
  const next_steps = asNotes(clusters.next_steps, "n")

  if (problems.length + ideas.length + risks.length + next_steps.length === 0) {
    throw new Error("Canvas response had no cluster items")
  }

  const synthesis =
    typeof parsed.synthesis === "string" && parsed.synthesis.trim()
      ? parsed.synthesis.trim()
      : "Launch plan will be refined on regenerate."

  const kpis = Array.isArray(parsed.kpis)
    ? parsed.kpis
        .map((kpi) => {
          if (!kpi || typeof kpi !== "object") return null
          const row = kpi as Record<string, unknown>
          const label = typeof row.label === "string" ? row.label.trim() : ""
          const target = typeof row.target === "string" ? row.target.trim() : ""
          if (!label) return null
          return { label, target: target || "TBD" }
        })
        .filter(Boolean)
    : []

  const milestones = Array.isArray(parsed.milestones)
    ? parsed.milestones
        .map((m, index) => {
          if (!m || typeof m !== "object") return null
          const row = m as Record<string, unknown>
          const title = typeof row.title === "string" ? row.title.trim() : ""
          const goals = Array.isArray(row.goals)
            ? row.goals.filter((g): g is string => typeof g === "string" && g.trim().length > 0)
            : []
          if (!title) return null
          return {
            week: typeof row.week === "number" ? row.week : index + 1,
            title,
            goals,
          }
        })
        .filter(Boolean)
    : []

  const elevator_hooks = Array.isArray(parsed.elevator_hooks)
    ? parsed.elevator_hooks.filter((h): h is string => typeof h === "string" && h.trim().length > 0)
    : []

  return {
    clusters: { problems, ideas, risks, next_steps },
    synthesis,
    kpis,
    milestones,
    elevator_hooks,
  }
}
async function callGemini(
  apiKey: string,
  systemInstruction: string,
  userContent: string,
  maxTokens: number,
): Promise<{ text: string; model: string }> {
  const models = getModelChain()
  let lastError = ""

  for (const model of models) {
    const maxAttempts = models.length === 1 ? 2 : 1

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const generationConfig: Record<string, unknown> = {
        temperature: 0.45,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
      }
      if (model.includes("2.5")) {
        generationConfig.thinkingConfig = { thinkingBudget: 0 }
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: `System Instructions:\n${systemInstruction}` }] },
              { role: "user", parts: [{ text: userContent }] },
            ],
            generationConfig,
          }),
        },
      )

      if (res.ok) {
        const data = await res.json()
        const blockReason = data.promptFeedback?.blockReason as string | undefined
        if (blockReason) {
          throw new Error(
            `Content blocked by safety filters (${blockReason}). Shorten or rephrase your pitch and try again.`,
          )
        }

        const candidate = data.candidates?.[0] as Record<string, unknown> | undefined
        const text = extractGeminiText(candidate)
        const finishReason = candidate?.finishReason as string | undefined
        if (!text) {
          const safety = (candidate?.finishReason as string | undefined) ?? "unknown"
          throw new Error(`Empty response from Gemini (finishReason: ${safety})`)
        }
        if (finishReason === "MAX_TOKENS") {
          console.warn(`[launch-lab-agent] ${model} hit MAX_TOKENS — response may be truncated`)
        }
        return { text, model }
      }

      const errText = await res.text()
      lastError = errText
      console.warn(`[launch-lab-agent] ${model} failed (${res.status}):`, errText.slice(0, 240))

      if (isQuotaOrRateLimit(res.status, errText)) {
        const retryMatch = errText.match(/retry in ([\d.]+)s/i)
        if (attempt === 0 && retryMatch) {
          const waitMs = Math.min(Math.ceil(parseFloat(retryMatch[1]) * 1000) + 500, 15000)
          console.warn(`[launch-lab-agent] rate limited, retrying ${model} in ${waitMs}ms`)
          await sleep(waitMs)
          continue
        }
        console.warn(`[launch-lab-agent] ${model} quota/rate limited, trying next model...`)
        break
      }

      throw new Error(`Google AI API error: ${parseGeminiError(errText)}`)
    }
  }

  throw new Error(allModelsQuotaMessage() + (lastError ? ` Last response: ${parseGeminiError(lastError)}` : ""))
}

function buildContextBlock(body: Record<string, unknown>): string {
  const parts: string[] = []
  if (body.product_name) parts.push(`Product: ${body.product_name}`)
  if (body.pitch_type) parts.push(`Content type: ${body.pitch_type}`)
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
      const models = getModelChain()
      return new Response(
        JSON.stringify({
          ok: true,
          provider: "google",
          model: models[0],
          models,
          configured: !!apiKey,
          modes: ["pitch", "canvas", "social-post"],
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

      const pitchPrompt = `Analyze this pitch:${contextBlock}\n\n---\n${pitch}`
      const pitchRetryPrompt = `${pitchPrompt}\n\nReturn compact valid JSON only. Escape quotes in strings.`

      let parsed: Record<string, unknown> | null = null
      let lastRaw = ""
      let lastModel = ""

      for (let attempt = 0; attempt < 2; attempt++) {
        const { text: raw, model } = await callGemini(
          apiKey,
          PITCH_SYSTEM,
          attempt === 0 ? pitchPrompt : pitchRetryPrompt,
          PITCH_MAX_TOKENS,
        )
        lastRaw = raw
        lastModel = model
        try {
          parsed = normalizePitchPayload(parseJsonFromModel(raw) as Record<string, unknown>, pitch)
          break
        } catch (parseError) {
          console.error(`[launch-lab-agent] pitch parse failed (attempt ${attempt + 1}):`, parseError)
          if (attempt === 1) {
            console.error("[launch-lab-agent] model:", lastModel)
            console.error("[launch-lab-agent] raw length:", lastRaw.length)
            console.error("[launch-lab-agent] raw preview:", lastRaw.slice(0, 1200))
            throw new Error("Could not parse pitch analysis from AI. Try Analyze again.")
          }
        }
      }

      if (!parsed) {
        throw new Error("Could not parse pitch analysis from AI. Try Analyze again.")
      }

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

      const { text: raw, model: canvasModel } = await callGemini(
        apiKey,
        CANVAS_SYSTEM,
        `Build launch canvas from this pitch:${contextBlock}\n\n---\n${improvedPitch}`,
        CANVAS_MAX_TOKENS,
      )
      let parsed: Record<string, unknown>
      try {
        parsed = normalizeCanvasPayload(parseJsonFromModel(raw) as Record<string, unknown>)
      } catch (parseError) {
        console.error("[launch-lab-agent] canvas parse failed:", parseError)
        console.error("[launch-lab-agent] model:", canvasModel)
        console.error("[launch-lab-agent] raw length:", raw.length)
        console.error("[launch-lab-agent] raw preview:", raw.slice(0, 1200))
        const hint =
          parseError instanceof Error && parseError.message.includes("clusters")
            ? "AI returned an incomplete canvas. Try Regenerate board."
            : "Could not parse canvas from AI. Try Regenerate board."
        throw new Error(hint)
      }

      return new Response(
        JSON.stringify({ mode: "canvas", ...parsed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      )
    }

    if (mode === "social-post") {
      const platform = body.platform as string | undefined
      if (platform !== "linkedin" && platform !== "facebook") {
        return new Response(
          JSON.stringify({ error: 'platform must be "linkedin" or "facebook"' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        )
      }

      const productName = (body.product_name as string | undefined)?.trim() || "the product"
      const headline = (body.headline as string | undefined)?.trim() || ""
      const tagline = (body.tagline as string | undefined)?.trim() || ""
      const oneLiner = (body.one_liner as string | undefined)?.trim() || ""

      const userPrompt = `Platform: ${platform}
Product: ${productName}
Headline: ${headline || "product launch"}
Tagline: ${tagline || oneLiner || "innovation"}${contextBlock}

Write a ${platform} launch post announcing this product.`

      const { text: raw } = await callGemini(apiKey, SOCIAL_POST_SYSTEM, userPrompt, SOCIAL_POST_MAX_TOKENS)
      const parsed = parseJsonFromModel(raw) as { post_copy?: string }
      const postCopy = parsed.post_copy?.trim()
      if (!postCopy || postCopy.length < 20) {
        throw new Error("Could not generate post copy. Try again.")
      }

      return new Response(
        JSON.stringify({ mode: "social-post", platform, post_copy: postCopy }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      )
    }

    return new Response(
      JSON.stringify({ error: 'mode must be "pitch", "canvas", or "social-post"' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const quotaExceeded =
      message.includes("quota") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.includes("all configured models")
    console.error("[launch-lab-agent]", message)
    return new Response(
      JSON.stringify({
        error: message,
        code: quotaExceeded ? "GEMINI_QUOTA_EXCEEDED" : "INTERNAL_ERROR",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: quotaExceeded ? 429 : 500,
      },
    )
  }
})
