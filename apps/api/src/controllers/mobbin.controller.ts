import { Request, Response } from 'express';
import crypto from 'crypto';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../db/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_to_prevent_crash',
});

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function readStore() {
  try {
    const integration = await prisma.integration.findUnique({ where: { provider: 'MOBBIN' } });
    if (integration && integration.config) {
      return integration.config as any;
    }
  } catch (e) {
    console.error("Failed to read Mobbin store from DB", e);
  }
  return { mobbinClientConfig: {}, mobbinTokens: {} };
}

async function writeStore(data: any) {
  try {
    const store = await readStore();
    const merged = { ...store, ...data };
    await prisma.integration.upsert({
      where: { provider: 'MOBBIN' },
      update: { config: merged },
      create: { provider: 'MOBBIN', config: merged }
    });
  } catch (e) {
    console.error("Failed to write Mobbin store to DB", e);
  }
}

async function refreshMobbinToken(store: any): Promise<any> {
  if (!store.mobbinTokens?.refreshToken) throw new Error("No refresh token available");
  
  const dcrMetaRes = await fetch("https://api.mobbin.com/.well-known/oauth-protected-resource/mcp");
  const dcrMeta = await dcrMetaRes.json();
  const authServerUrl = dcrMeta.authorization_servers?.[0] || "https://api.mobbin.com";
  const authMetaRes = await fetch(`${authServerUrl}/.well-known/oauth-authorization-server`);
  const authMeta = await authMetaRes.json();

  const tokenRes = await fetch(authMeta.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: store.mobbinClientConfig?.clientId!,
      refresh_token: store.mobbinTokens.refreshToken,
    })
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Token refresh failed: ${errText}`);
  }

  const tokenData = await tokenRes.json();
  const newTokens = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || store.mobbinTokens.refreshToken
  };
  
  await writeStore({ mobbinTokens: newTokens });
  return newTokens;
}

let pkceStore: Record<string, string> = {}; // state -> code_verifier

export const initiateMobbinAuth = async (req: Request, res: Response) => {
  try {
    // 1. Fetch DCR Metadata (Discover Auth Server)
    const dcrMetaRes = await fetch("https://api.mobbin.com/.well-known/oauth-protected-resource/mcp");
    const dcrMeta = await dcrMetaRes.json();
    const authServerUrl = dcrMeta.authorization_servers?.[0] || "https://api.mobbin.com";

    // 2. Fetch Auth Server Metadata
    const authMetaRes = await fetch(`${authServerUrl}/.well-known/oauth-authorization-server`);
    const authMeta = await authMetaRes.json();

    // 3. Dynamic Client Registration (if we haven't registered yet)
    let store = await readStore();
    if (!store.mobbinClientConfig?.clientId) {
      const redirectUri = `${process.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/mobbin/callback`;
      
      const dcrRes = await fetch(authMeta.registration_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "Baselyn Admin",
          redirect_uris: [redirectUri],
          token_endpoint_auth_method: "none", // For public clients, or use client_secret_post if supported
        })
      });
      
      if (!dcrRes.ok) throw new Error("Failed to register dynamic client");
      const clientData = await dcrRes.json();
      store.mobbinClientConfig = { clientId: clientData.client_id };
      await writeStore({ mobbinClientConfig: store.mobbinClientConfig });
    }

    // 4. Generate PKCE & State
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    
    pkceStore[state] = codeVerifier;

    // 5. Redirect to Auth Endpoint
    const redirectUri = `${process.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/mobbin/callback`;
    const authUrl = new URL(authMeta.authorization_endpoint);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", store.mobbinClientConfig.clientId!);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("scope", "openid");
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("code_challenge", codeChallenge);
    authUrl.searchParams.append("code_challenge_method", "S256");

    res.redirect(authUrl.toString());
  } catch (error: any) {
    console.error("Mobbin Auth Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const mobbinCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json({ error: "Missing code or state" });
    }

    const codeVerifier = pkceStore[state as string];
    if (!codeVerifier) {
      return res.status(400).json({ error: "Invalid state or expired PKCE" });
    }

    // Discover Token endpoint
    const dcrMetaRes = await fetch("https://api.mobbin.com/.well-known/oauth-protected-resource/mcp");
    const dcrMeta = await dcrMetaRes.json();
    const authServerUrl = dcrMeta.authorization_servers?.[0] || "https://api.mobbin.com";
    const authMetaRes = await fetch(`${authServerUrl}/.well-known/oauth-authorization-server`);
    const authMeta = await authMetaRes.json();

    const redirectUri = `${process.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/mobbin/callback`;
    const store = await readStore();
    
    // Exchange code for token
    const tokenRes = await fetch(authMeta.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: store.mobbinClientConfig?.clientId!,
        code: code as string,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Token exchange failed: ${errText}`);
    }

    const tokenData = await tokenRes.json();
    
    // Save token to DB
    await writeStore({
      mobbinTokens: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token
      }
    });

    // Clean up PKCE store
    delete pkceStore[state as string];

    // Redirect admin back to admin portal UI
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:5174';
    res.redirect(`${adminUrl}/screens`);
  } catch (error: any) {
    console.error("Mobbin Callback Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Example endpoint to use the MCP client
export const searchMobbinScreens = async (req: Request, res: Response) => {
  const store = await readStore();
  
  // Check if we have an access token
  if (!store.mobbinTokens?.accessToken) {
    return res.status(401).json({ error: "Not authenticated with Mobbin. Please connect first." });
  }

  // Implement the @modelcontextprotocol/sdk here using the Bearer token
  const transport = new StreamableHTTPClientTransport(new URL("https://api.mobbin.com/mcp"), {
    requestInit: { headers: { Authorization: `Bearer ${store.mobbinTokens.accessToken}` } }
  });
  
  const client = new Client(
    { name: "admin-backend", version: "1.0.0" },
    { capabilities: {} }
  );
  
  try {
    const { query, platform, limit, appId, flowId, searchType } = req.body;
    
    if (!appId || !flowId) {
      return res.status(400).json({ error: "appId and flowId are required" });
    }
    
    let content: any[] = [];
    
    try {
      await client.connect(transport);
      
      const result = await client.callTool({
        name: searchType === "flow" ? "search_flows" : "search_screens",
        arguments: {
          query: query || "login",
          platform: platform || "web",
          limit: limit || 10
        }
      });
      content = result.content as any[];
      await client.close();
    } catch (mcpError: any) {
      console.error("MCP Connection/Tool Error:", mcpError);
      try { await client.close(); } catch (e) {}

      // If unauthorized, try to refresh the token and retry once
      if (mcpError?.message?.includes("unauthorized") || mcpError?.message?.includes("expired access token") || mcpError?.code === 401) {
        console.log("Token expired. Attempting to refresh...");
        try {
          const newTokens = await refreshMobbinToken(store);
          
          // Retry with new token
          const retryTransport = new StreamableHTTPClientTransport(new URL("https://api.mobbin.com/mcp"), {
            requestInit: { headers: { Authorization: `Bearer ${newTokens.accessToken}` } }
          });
          const retryClient = new Client({ name: "admin-backend", version: "1.0.0" }, { capabilities: {} });
          
          await retryClient.connect(retryTransport);
          const result = await retryClient.callTool({
            name: searchType === "flow" ? "search_flows" : "search_screens",
            arguments: {
              query: query || "login",
              platform: platform || "web",
              limit: limit || 10
            }
          });
          content = result.content as any[];
          await retryClient.close();
        } catch (refreshErr) {
          console.error("Refresh failed:", refreshErr);
          throw new Error("Mobbin session expired. Please disconnect and reconnect your Mobbin account in settings.");
        }
      } else {
        throw mcpError;
      }
    }

    const screensText = content?.[0]?.text;
    if (!screensText) throw new Error("No screens returned from Mobbin");
    
    let mobbinScreens = [];
    try {
      const parsed = JSON.parse(screensText);
      if (searchType === "flow") {
        if (parsed.flows && parsed.flows.length > 0) {
          // Try to find the exact flow the user searched for, otherwise fallback to the first one
          const targetFlow = parsed.flows.find((f: any) => 
            f.name && f.name.toLowerCase().includes(query.toLowerCase())
          ) || parsed.flows[0];
          
          mobbinScreens = targetFlow.screens || [];
          console.log(`Matched flow: "${targetFlow.name}" with ${mobbinScreens.length} screens.`);
        }
      } else {
        if (parsed.screens) mobbinScreens = parsed.screens;
        else if (Array.isArray(parsed)) mobbinScreens = parsed;
        else mobbinScreens = [parsed];
      }
    } catch (e) {
      console.log("Failed to parse screens as JSON, text was:", screensText);
      mobbinScreens = [];
    }

    if (mobbinScreens.length === 0) {
      return res.json({ message: "No screens found", count: 0 });
    }

    // Find the max screenNo for this flow
    const existingScreens = await prisma.screen.findMany({
      where: { flowId },
      orderBy: { screenNo: 'desc' },
      take: 1
    });
    let startingScreenNo = existingScreens.length > 0 && existingScreens[0].screenNo ? existingScreens[0].screenNo : 0;

    // Fetch context data for AI
    const [uiElements, patterns, appContextData, flowContextData] = await Promise.all([
      prisma.uiElement.findMany({ select: { id: true, title: true } }),
      prisma.pattern.findMany({ select: { id: true, title: true } }),
      prisma.app.findUnique({
        where: { id: appId },
        select: {
          name: true,
          description: true,
          targetAudience: true,
          market: true,
          lookAndFeelTags: true,
          easeOfUseTags: true
        }
      }),
      prisma.flow.findUnique({
        where: { id: flowId },
        select: { name: true }
      })
    ]);

    const uiElementsList = uiElements.map(e => `- ${e.title} (ID: ${e.id})`).join('\n');
    const patternsList = patterns.map(p => `- ${p.title} (ID: ${p.id})`).join('\n');
    let appContext = '';
    if (appContextData) {
      appContext = `
APP CONTEXT (Use this to deeply contextualize your analysis):
- App Name: ${appContextData.name}
- Description: ${appContextData.description || 'N/A'}
- Target Audience: ${appContextData.targetAudience || 'N/A'}
- Market: ${appContextData.market?.join(', ') || 'N/A'}
- Look & Feel: ${appContextData.lookAndFeelTags?.join(', ') || 'N/A'}
- Ease of Use: ${appContextData.easeOfUseTags?.join(', ') || 'N/A'}
`;
    }

    
    const backgroundJobs: { screenId: string; base64Image: string; mScreen: any }[] = [];

    // 1. Parallelize Image Download + DB Creation (Fast Phase)
    const screenPromises = mobbinScreens.map(async (mScreen: any, index: number) => {
      if (!mScreen.image_url) return null;

      let finalImageUrl = mScreen.image_url;
      const screenNo = startingScreenNo + index + 1;
      const appNameStr = appContextData?.name || 'App';
      const flowNameStr = flowContextData?.name || 'Flow';
      const screenName = `${appNameStr} - ${flowNameStr} - Screen ${screenNo}`;

      let processedBuffer: Buffer | null = null;

      try {
        const imgRes = await fetch(mScreen.image_url);
        let contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(contentType)) {
          contentType = 'image/jpeg';
        }

        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const metadata = await sharp(buffer).metadata();
        const watermarkHeight = Math.floor((metadata.width || 0) * 0.08);
        const cropHeight = Math.max(1, (metadata.height || 0) - watermarkHeight);
        
        processedBuffer = await sharp(buffer)
          .extract({ left: 0, top: 0, width: metadata.width || 0, height: cropHeight })
          .resize({ width: 600 })
          .webp({ quality: 80 })
          .toBuffer();
        
        const fileName = `screens/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
        const { data, error } = await supabase.storage.from('apps').upload(fileName, processedBuffer, {
          contentType: 'image/webp'
        });
        
        if (!error && data) {
          finalImageUrl = `${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}/storage/v1/object/public/apps/${data.path}`;
        }
      } catch (e) {
        console.error("Failed to download/upload image", e);
      }

      // Save to DB initially (without Claude analysis)
      const baseSlug = screenName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

      const newScreen = await prisma.screen.create({
        data: {
          appId,
          flowId,
          name: screenName,
          slug,
          screenNo,
          imageUrl: finalImageUrl,
          status: 'DRAFT',
          uxAnalysis: mScreen.description || '',
          tonalityAndContent: '',
          keyHighlights: '',
          evidenceWhoWhy: '',
          whereToUse: '',
          whereNotToUse: ''
        }
      });

      if (processedBuffer && process.env.ANTHROPIC_API_KEY) {
        backgroundJobs.push({
          screenId: newScreen.id,
          base64Image: processedBuffer.toString('base64'),
          mScreen
        });
      }

      return newScreen;
    });

    const importedScreens = (await Promise.all(screenPromises)).filter(Boolean);

    // Respond immediately to prevent frontend timeout!
    res.json({ message: "Import successful", count: importedScreens.length, screens: importedScreens });

    // 2. Background Claude processing (Slow Phase)
    if (backgroundJobs.length > 0) {
      setTimeout(async () => {
        console.log(`Starting background AI processing for ${backgroundJobs.length} screens...`);
        for (let i = 0; i < backgroundJobs.length; i++) {
          const job = backgroundJobs[i];
          try {
            console.log(`Analyzing screen ${i + 1}/${backgroundJobs.length} with Claude...`);
            const message = await anthropic.messages.create({
              model: "claude-sonnet-5",
              max_tokens: 4096,
              system: `You are an elite Senior UX Researcher and Product Designer. Your task is to analyze the provided screenshot of a mobile/web application screen and auto-generate comprehensive metadata for a UX library database.
Write high-quality, professional, descriptive, and actionable content. Be very insightful and focus on the deep psychological and usability reasons for the design. Use proper HTML formatting (e.g., <p>, <strong>, <ul>) for all text fields since they will be rendered in a Rich Text Editor.

${appContext}

Additionally, you must accurately categorize the screen by selecting the most relevant UI Elements and UX Patterns from the following available lists. Return an array of the corresponding IDs. Do not make up IDs.

AVAILABLE UI ELEMENTS:
${uiElementsList}

AVAILABLE UX PATTERNS:
${patternsList}

IMPORTANT: You MUST use the submit_screen_data tool properly. Output a real JSON object with the generated data.`,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "image", source: { type: "base64", media_type: "image/webp", data: job.base64Image } },
                    { type: "text", text: "Please analyze this UI screen and generate the structured screen data, including assigning relevant uiElementIds and patternIds." }
                  ]
                }
              ],
              tools: [
                {
                  name: "submit_screen_data",
                  description: "Submit the structured screen metadata and UX analysis",
                  input_schema: {
                    type: "object",
                    properties: {
                      uxAnalysis: { type: "string", description: "Deep analysis of the overall user experience and layout. Format as HTML." },
                      tonalityAndContent: { type: "string", description: "Analysis of the copywriting, tone of voice, and messaging strategy. Format as HTML." },
                      keyHighlights: { type: "string", description: "The most brilliant or noteworthy UX/UI decisions on this screen. Format as HTML." },
                      evidenceWhoWhy: { type: "string", description: "Analysis of the target demographic this screen serves and the psychological triggers it relies on. Format as HTML." },
                      whereToUse: { type: "string", description: "Recommendations on when a designer should steal or adapt this pattern. Format as HTML." },
                      whereNotToUse: { type: "string", description: "Warnings on when this pattern would fail or be inappropriate. Format as HTML." },
                      uiElementIds: { type: "array", items: { type: "string" } },
                      patternIds: { type: "array", items: { type: "string" } }
                    },
                    required: ["uxAnalysis", "tonalityAndContent", "keyHighlights", "evidenceWhoWhy", "whereToUse", "whereNotToUse", "uiElementIds", "patternIds"]
                  }
                }
              ],
              tool_choice: { type: "tool", name: "submit_screen_data" }
            });

            const toolCall = message.content.find((block: any) => block.type === 'tool_use');
            if (toolCall && toolCall.type === 'tool_use') {
              const parsed = toolCall.input as any;
              
              await prisma.screen.update({
                where: { id: job.screenId },
                data: {
                  uxAnalysis: parsed.uxAnalysis || job.mScreen.description || '',
                  tonalityAndContent: parsed.tonalityAndContent || '',
                  keyHighlights: parsed.keyHighlights || '',
                  evidenceWhoWhy: parsed.evidenceWhoWhy || '',
                  whereToUse: parsed.whereToUse || '',
                  whereNotToUse: parsed.whereNotToUse || '',
                  uiElements: Array.isArray(parsed.uiElementIds) ? { connect: parsed.uiElementIds.map((id: string) => ({ id })) } : undefined,
                  patterns: Array.isArray(parsed.patternIds) ? { connect: parsed.patternIds.map((id: string) => ({ id })) } : undefined
                }
              });
              console.log(`Successfully updated screen ${job.screenId} with AI analysis.`);
            }
          } catch (e) {
            console.error(`Claude analysis failed for screen ${job.screenId}:`, e);
          }
        }
      }, 0);
    }

  } catch (error: any) {
    console.error("MCP Tool Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getMobbinStatus = async (req: Request, res: Response) => {
  const store = await readStore();
  res.json({ isConnected: !!store.mobbinTokens?.accessToken });
};
