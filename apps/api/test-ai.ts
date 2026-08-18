import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function test() {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      system: `You are an elite Senior UX Researcher. You are conducting a blind comparison between two UI screens: Screen A (Original) and Screen B (User Redesign).
CRITICAL: Do not assume either screen is better. Be ruthless, objective, and highly critical of both designs equally based strictly on UX heuristics.

Judge each category holistically across the entire screen — don't just point to one or two UI elements as your evidence. Your originalText/userText should describe the overall page-level accessibility/usability/etc., using specific elements only as supporting examples, not as the entire basis for the verdict.

Do NOT just describe the UI line-by-line. You must evaluate the *holistic UX impact* of the designs according to these exact parameters:
1. Accessibility: Is contrast sufficient across the entire screen? Are all interactive elements distinguishable without relying on color alone? Is text legible at a glance? Is the reading order logical top to bottom?
2. Usability: Does the whole flow make sense? Can a first-time user tell what to do next? Is the primary action obvious? Is there wasted or confusing structure anywhere?
3. Content Language: Evaluate page-level microcopy, scannability, tone, and clarity of information architecture.
4. Visual Language: Evaluate aesthetic consistency, overall visual hierarchy, spacing, and modern UI patterns across the entire screen.
5. Dependability: Evaluate predictable interaction patterns, layout stability, and how the entire design builds user trust.`,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Image 1: Screen A',
            },
            {
              type: 'text',
              text: 'Image 2: Screen B',
            },
            {
              type: 'text',
              text: 'Please compare the two UI screens and provide the structured analysis. Imagine you are comparing a generic dark mode learning app list.',
            }
          ],
        },
      ],
      tools: [
        {
          name: "submit_comparison",
          description: "Submit the structured UI comparison result",
          input_schema: {
            type: "object",
            properties: {
              metrics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string", enum: ["Measured", "Subjective"] },
                    originalText: { type: "string" },
                    userText: { type: "string" }
                  },
                  required: ["name", "type", "originalText", "userText"]
                }
              },
              originalScore: { type: "integer", description: "Score out of 10" },
              userScore: { type: "integer", description: "Score out of 10" },
              verdict: { type: "string" }
            },
            required: ["metrics", "originalScore", "userScore", "verdict"]
          }
        }
      ],
      tool_choice: { type: "tool", name: "submit_comparison" }
    });

    const toolCall = message.content.find((block) => block.type === 'tool_use');
    if (toolCall && toolCall.type === 'tool_use') {
      console.log(JSON.stringify(toolCall.input, null, 2));
    } else {
      console.log("No tool call returned!");
      console.log(JSON.stringify(message.content, null, 2));
    }
  } catch (error) {
    console.error(error);
  }
}

test();
