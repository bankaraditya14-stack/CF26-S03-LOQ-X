import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];

// In-memory sliding-window rate limiter per client IP (10 requests / 60 seconds)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return { allowed: true };
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".supabase.co") || !origin;
  const allowOrigin = isAllowed ? (origin || "*") : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "X-Content-Type-Options": "nosniff",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  // Rate Limiting Check
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-client";
  const rateResult = checkRateLimit(clientIp);
  if (!rateResult.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        fallback: true,
        error: "HTTP 429: Rate limit exceeded for AI recovery requests (10 req/min).",
        retryAfter: rateResult.retryAfter,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rateResult.retryAfter || 60),
        },
        status: 429,
      }
    );
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          message: "GEMINI_API_KEY is not configured on Edge Function environment. Using deterministic fallback.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const context = await req.json();

    // Input bounds validation
    if (!context || typeof context !== "object") {
      return new Response(
        JSON.stringify({ success: false, fallback: true, error: "Invalid simulation context payload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const systemInstruction = `You are the Urban Infrastructure Adaptive Recovery Intelligence Engine for Cascade City.
Analyze the cascading failure simulation context provided and generate 1 optimal primary recovery strategy and 2-3 distinct alternative recovery strategies.
Never output arbitrary text. Output STRICT valid JSON matching the following schema only:
{
  "incident_summary": "1-2 sentence high-density technical summary of the failure and cascade.",
  "priority_targets": ["Name of Critical Node 1", "Name of Critical Node 2"],
  "recommended_strategy": {
    "name": "Short uppercase title",
    "priority": "CRITICAL|HIGH|MEDIUM|LOW",
    "reason": "Specific technical causal rationale.",
    "target_nodes": ["valid-node-id-1", "valid-node-id-2"],
    "actions": ["Action 1", "Action 2"]
  },
  "alternative_strategies": [
    {
      "name": "Alternative strategy name",
      "priority": "HIGH|MEDIUM|LOW",
      "reason": "Technical rationale",
      "target_nodes": ["valid-node-id"],
      "actions": ["Action 1"]
    }
  ],
  "explanation": "Root cause -> Critical dependency -> Most vulnerable service -> Recommended intervention",
  "confidence": "HIGH|MEDIUM|LOW"
}`;

    const promptText = `CASCADING FAILURE SIMULATION CONTEXT:
Root Failure: ${String(context.rootFailureNodeName || "").slice(0, 80)} (${String(context.rootFailureNodeId || "").slice(0, 50)})
Sector: ${String(context.rootSector || "").slice(0, 30)}
Failure Type: ${String(context.failureType || "").slice(0, 50)}
Active Failed Nodes: ${(Array.isArray(context.failedNodeIds) ? context.failedNodeIds.slice(0, 20) : []).join(", ")}
Active Degraded Nodes: ${(Array.isArray(context.degradedNodeIds) ? context.degradedNodeIds.slice(0, 20) : []).join(", ")}
Affected Services: ${Number(context.affectedServicesCount) || 0} of ${Number(context.totalServicesCount) || 13} (${Number(context.cascadeDepth) || 0} hops)
Population At Risk: ${Number(context.populationAffected) || 0}
Critical Services Affected: ${(Array.isArray(context.criticalServicesAffected) ? context.criticalServicesAffected.slice(0, 10) : []).join(", ")}
Available City Nodes: ${(Array.isArray(context.availableNodes) ? context.availableNodes.slice(0, 20) : []).map((n: any) => `${n.id} (${n.name})`).join("; ")}

Generate failure-specific strategies tailored precisely to this failure topology.`;

    const geminiPayload = JSON.stringify({
      contents: [
        {
          parts: [
            { text: systemInstruction },
            { text: promptText },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: geminiPayload,
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          error: `Gemini API responded with status ${response.status}: ${errText.slice(0, 200)}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const data = await response.json();
    const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawJsonText || "{}");

    return new Response(
      JSON.stringify({
        success: true,
        data: parsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        fallback: true,
        error: error.message || "Failed to process AI recovery analysis",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
