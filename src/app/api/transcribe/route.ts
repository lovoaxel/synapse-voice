import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get('audio') as Blob;
    if (!audio) return NextResponse.json({ error: 'No audio' }, { status: 400 });

    const groqForm = new FormData();
    groqForm.append('file', audio, 'audio.webm');
    groqForm.append('model', 'whisper-large-v3-turbo');
    groqForm.append('language', 'es');
    groqForm.append('response_format', 'text');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: groqForm,
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const text = await res.text();
    return NextResponse.json({ text: text.trim() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
