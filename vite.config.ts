import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'http';
import https from 'https';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const geminiApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';

  return {
    plugins: [
      react(),
      {
        name: 'gemini-api-server-proxy',
        configureServer(server) {
          server.middlewares.use('/api/gemini/recovery-analysis', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              res.setHeader('Content-Type', 'application/json');

              if (!geminiApiKey) {
                res.statusCode = 200;
                res.end(
                  JSON.stringify({
                    success: false,
                    fallback: true,
                    message: 'GEMINI_API_KEY is not configured on the server environment. Using verified deterministic engine fallback.',
                  })
                );
                return;
              }

              try {
                const context = JSON.parse(body || '{}');

                const systemInstruction = `You are the Urban Infrastructure Adaptive Recovery Intelligence Engine for Cascade City.
Analyze the actual cascading failure simulation context provided and generate 1 optimal primary recovery strategy and 2-3 distinct alternative recovery strategies.
Never output arbitrary text. Output STRICT valid JSON matching the following schema only:
{
  "incident_summary": "1-2 sentence high-density technical summary of the failure and cascade.",
  "priority_targets": ["Name of Critical Node 1", "Name of Critical Node 2"],
  "recommended_strategy": {
    "name": "Short uppercase title (e.g., DEPLOY AUXILIARY GENERATOR FLEET)",
    "priority": "CRITICAL|HIGH|MEDIUM|LOW",
    "reason": "Specific technical causal rationale explaining why this intervention breaks the cascade.",
    "target_nodes": ["valid-node-id-1", "valid-node-id-2"],
    "actions": ["Concrete action 1", "Concrete action 2"]
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
  "explanation": "Brief explainability chain: Root cause -> Critical dependency -> Most vulnerable service -> Recommended intervention -> Expected benefit",
  "confidence": "HIGH|MEDIUM|LOW"
}`;

                const promptText = `CASCADING FAILURE SIMULATION CONTEXT:
Root Failure Node: ${context.rootFailureNodeName} (${context.rootFailureNodeId})
Sector: ${context.rootSector}
Failure Type: ${context.failureType}
Active Failed Nodes (${context.failedNodeIds?.length || 1}): ${(context.failedNodeIds || []).join(', ')}
Active Degraded Nodes (${context.degradedNodeIds?.length || 0}): ${(context.degradedNodeIds || []).join(', ')}
Total Affected Services: ${context.affectedServicesCount} of ${context.totalServicesCount} (${context.cascadeDepth} cascade hops)
Population At Risk: ${context.populationAffected?.toLocaleString() || 0}
Critical Services Affected: ${(context.criticalServicesAffected || []).join(', ') || 'None'}
Estimated Baseline Recovery Time: ${context.timeToRecovery || 45} minutes
Dependency Chain: ${(context.dependencyChain || []).map((d: any) => `${d.from} -> ${d.to}`).join('; ')}
Available City Nodes: ${(context.availableNodes || []).map((n: any) => `${n.id} (${n.name}, ${n.sector}, ${n.criticality})`).join('; ')}

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
                    responseMimeType: 'application/json',
                  },
                });

                // Call Google Gemini API
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
                
                const response = await fetch(url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: geminiPayload,
                });

                if (!response.ok) {
                  const errText = await response.text();
                  console.warn('[Gemini Server Proxy] Gemini API Error:', response.status, errText);
                  res.statusCode = 200;
                  res.end(
                    JSON.stringify({
                      success: false,
                      fallback: true,
                      error: `Gemini API responded with status ${response.status}`,
                    })
                  );
                  return;
                }

                const data = await response.json();
                const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!rawJsonText) {
                  res.statusCode = 200;
                  res.end(
                    JSON.stringify({
                      success: false,
                      fallback: true,
                      error: 'Empty response from Gemini model',
                    })
                  );
                  return;
                }

                const parsedAiData = JSON.parse(rawJsonText);
                res.statusCode = 200;
                res.end(
                  JSON.stringify({
                    success: true,
                    data: parsedAiData,
                  })
                );
              } catch (err: any) {
                console.error('[Gemini Server Proxy] Exception during analysis:', err);
                res.statusCode = 200;
                res.end(
                  JSON.stringify({
                    success: false,
                    fallback: true,
                    error: err.message || 'Internal error during AI analysis',
                  })
                );
              }
            });
          });
        },
      },
    ],
    server: {
      port: 3000,
      open: false,
    },
  };
});
