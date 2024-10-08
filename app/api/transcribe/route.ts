export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  console.log("Transcription request received");

  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    console.log("API key missing");
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  console.log("API key:", apiKey);

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  let language = (formData.get("language") as string) || "zh";

  if (!file) {
    console.log("No audio file provided");
    return NextResponse.json(
      { error: "No audio file provided" },
      { status: 400 }
    );
  }

  console.log(
    "File received:",
    file.name,
    "Size:",
    file.size,
    "Type:",
    file.type
  );

  // Validate file type and size
  const allowedTypes = ["audio/mpeg", "audio/wav", "audio/webm"];
  const maxSizeInBytes = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    console.error('Unsupported file type:', file.type);
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  if (file.size > maxSizeInBytes) {
    console.error('File size exceeds limit:', file.size);
    return NextResponse.json({ error: 'File size exceeds the limit of 10MB' }, { status: 400 });
  }

  // Ensure the language code is ISO-639-1
  if (language.includes("-")) {
    language = language.split("-")[0];
    console.log(
      `Language parameter adjusted to '${language}' to comply with ISO-639-1`
    );
  }

  console.log(`Using language code: ${language}`);

  const buffer = Buffer.from(await file.arrayBuffer());
  console.log("File converted to buffer");

  const openAIFormData = new FormData();
  const blob = new Blob([buffer], { type: file.type });
  openAIFormData.append("file", blob, file.name);
  openAIFormData.append("model", "whisper-1");
  openAIFormData.append("language", language);

  console.log("OpenAI FormData prepared");

  try {
    console.log("Sending request to OpenAI API");
    const response = await openai.audio.transcriptions.create({
      file: openAIFormData.get("file") as File,
      model: openAIFormData.get("model") as string,
      language: openAIFormData.get("language") as string,
      temperature: 0,
      prompt: "如果聽不清楚，請回覆...",
    });

    console.log("Response received from OpenAI API");
    const transcription = response.text.trim();

    if (transcription === "") {
      console.log("Empty transcription received");
      return NextResponse.json({ transcription: "..." });
    } else {
      console.log("Transcription received:", transcription);
      return NextResponse.json({ transcription: transcription });
    }
  } catch (error: any) {
    console.error(
      "Error transcribing audio:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      {
        error: "Error transcribing audio",
        details: error.response?.data?.error?.message || error.message,
      },
      { status: 500 }
    );
  }
}
