import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          message: "GEMINI_API_KEY is not configured on Edge Function environment.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const context = await req.json();

    const systemInstruction = `You are the Urban Infrastructure Adaptive Recovery Intelligence Engine for Cascade City.
Analyze the cascading failure simulation context provided and generate 1 optimal primary recovery strategy and 2-3 distinct alternative recovery strategies.
Output STRICT valid JSON matching the following schema only:
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
Root Failure: ${context.rootFailureNodeName} (${context.rootFailureNodeId})
Sector: ${context.rootSector}
Failure Type: ${context.failureType}
Active Failed Nodes: ${(context.failedNodeIds || []).join(", ")}
Active Degraded Nodes: ${(context.degradedNodeIds || []).join(", ")}
Affected Services: ${context.affectedServicesCount} of ${context.totalServicesCount} (${context.cascadeDepth} hops)
Population At Risk: ${context.populationAffected || 0}
Critical Services Affected: ${(context.criticalServicesAffected || []).join(", ")}
Available City Nodes: ${(context.availableNodes || []).map((n: any) => `${n.id} (${n.name})`).join("; ")}

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
          error: `Gemini API responded with status ${response.status}: ${errText}`,
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
