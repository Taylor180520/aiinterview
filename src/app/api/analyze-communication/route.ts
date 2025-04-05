import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  SYSTEM_PROMPT,
  getCommunicationAnalysisPrompt,
} from "@/lib/prompts/communication-analysis";

export async function POST(req: Request) {
  logger.info("analyze-communication request received");

  try {
    const body = await req.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 },
      );
    }

    // Configure Azure OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY || "",
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini"}`,
      defaultQuery: { "api-version": "2024-08-01-preview" },
      defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
      maxRetries: 5,
      dangerouslyAllowBrowser: true,
    });

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: getCommunicationAnalysisPrompt(transcript),
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = completion.choices[0]?.message?.content;

    logger.info("Communication analysis completed successfully");

    return NextResponse.json(
      { analysis: JSON.parse(analysis || "{}") },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Error analyzing communication skills");

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
