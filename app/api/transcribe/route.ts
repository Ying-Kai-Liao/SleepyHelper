import { NextRequest, NextResponse } from 'next/server';
import FormData from 'form-data';
import axios from 'axios';

export async function POST(req: NextRequest) {
  console.log('Transcription request received');

  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) {
    console.log('API key missing');
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const language = formData.get('language') as string || 'zh-TW';

  if (!file) {
    console.log('No audio file provided');
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
  }

  console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

  const buffer = await file.arrayBuffer();
  console.log('File converted to buffer');

  const openAIFormData = new FormData();
  openAIFormData.append('file', Buffer.from(buffer), { filename: 'audio.webm', contentType: file.type });
  openAIFormData.append('model', 'whisper-1');
  openAIFormData.append('language', language);

  console.log('OpenAI FormData prepared');

  try {
    console.log('Sending request to OpenAI API');
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', openAIFormData, {
      headers: {
        ...openAIFormData.getHeaders(),
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    console.log('Response received from OpenAI API');
    const transcription = response.data.text.trim();
    
    if (transcription === '') {
      console.log('Empty transcription received');
      return NextResponse.json({ transcription: '...' });
    } else {
      console.log('Transcription received:', transcription);
      return NextResponse.json({ transcription: transcription });
    }
  } catch (error: any) {
    console.error('Error transcribing audio:', error.response?.data || error.message);
    return NextResponse.json({ 
      error: 'Error transcribing audio', 
      details: error.response?.data?.error?.message || error.message 
    }, { status: 500 });
  }
}