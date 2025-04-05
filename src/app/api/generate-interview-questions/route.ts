import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import {
  SYSTEM_PROMPT,
  generateQuestionsPrompt,
} from "@/lib/prompts/generate-questions";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

export async function POST(req: Request, res: Response) {
  logger.info("generate-interview-questions request received");
  const body = await req.json();

  // Configure Azure OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY || "",
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini"}`,
    defaultQuery: { "api-version": "2024-08-01-preview" },
    defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
    maxRetries: 5,
    dangerouslyAllowBrowser: true,
  });

  try {
    const baseCompletion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: generateQuestionsPrompt(body),
        },
      ],
      response_format: { type: "json_object" },
    });

    const basePromptOutput = baseCompletion.choices[0] || {};
    const content = basePromptOutput.message?.content;

    logger.info("Interview questions generated successfully");

    return NextResponse.json(
      {
        response: content,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error generating interview questions");

    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 },
    );
  }
}
