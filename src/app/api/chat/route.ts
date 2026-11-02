import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";

async function getMyTasks(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { message?: string; history?: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const tasks = await getMyTasks(supabase, user.id).catch(() => []);

  const systemPrompt =
    "You are a helpful AI assistant for the AMAZINS app. " +
    "Answer questions about the user's schedule and tasks based only on the provided data. " +
    "You can create new tasks using the create_task tool when the user asks. " +
    "Be concise and friendly. " +
    "User's tasks (JSON): " +
    JSON.stringify(tasks);

  const openai = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b",
      max_tokens: 256,
      tools: [
        {
          type: "function",
          function: {
            name: "create_task",
            description: "Create a new task for the user.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Task title" },
                date: { type: "string", description: "Task date (YYYY-MM-DD)" },
                start_time: { type: "string", description: "Start time (HH:MM)" },
              },
              required: ["title", "date", "start_time"],
            },
          },
        },
      ],
      tool_choice: "auto",
      messages: [
        { role: "system", content: systemPrompt },
        ...(body.history ?? []).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: message },
      ],
    });

    const choice = completion.choices[0]?.message;
    if (choice?.tool_calls && choice.tool_calls.length > 0) {
      return NextResponse.json({
        tool_calls: choice.tool_calls.map((tc) => {
          const fn = (tc as { function?: { name: string; arguments: string } }).function;
          return {
            id: tc.id,
            type: tc.type,
            function: {
              name: fn?.name ?? "",
              arguments: fn?.arguments ?? "{}",
            },
          };
        }),
      });
    }

    const reply = choice?.content ?? "No response from model.";

    return NextResponse.json({ response: reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Groq API error: ${msg}` },
      { status: 502 }
    );
  }
}