import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

export async function POST(request) {
  const { message } = await request.json();

  if (!message) {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
    const stream = await openai.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: [{ role: 'user', content: message }],
      stream: true,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }
        controller.close();
      },
      cancel() {
        console.log('Stream cancelled');
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream', // Still use text/event-stream for compatibility
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream Error:', error);
    return Response.json(
      { error: 'Error on stream backend logics', details: error.message },
      { status: 400 }
    );
  }
}