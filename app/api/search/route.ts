import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-2",
});
const chatModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    // Generate embedding for the query using Gemini
    const embResult = await embeddingModel.embedContent({
      content: {
        role: "user",
        parts: [{ text: query }],
      },
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      outputDimensionality: 768, // <--- Forces 768 dimensions
    } as any);
    const embedding = embResult.embedding.values;

    // Find similar documents using vector similarity search
    const { data: results, error } = await supabase.rpc("match_documents", {
      query_embedding: JSON.stringify(embedding),
      match_threshold: 0.0,
      match_count: 5,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Combine retrieved chunks into context
    const context = results?.map((r: any) => r.content).join("\n---\n") || "";

    // Generate answer using Gemini
    const prompt = `You are a helpful assistant. Use the provided context to answer questions. If the answer is not in the context, say you do not know.

Context: ${context}

Question: ${query}`;

    const chatResult = await chatModel.generateContent(prompt);
    const answer = chatResult.response.text();

    return NextResponse.json({
      answer,
      sources: results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
