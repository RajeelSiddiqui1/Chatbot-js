import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

export async function POST(request) {
  const { message } = await request.json();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: [{ role: 'user', content: message }],
    });

    return Response.json({
      content: completion.choices[0].message.content, // Use "content" to match frontend
    }, {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return Response.json({
      error: 'Error on backend logics',
    }, {
      status: 400,
    });
  }
}