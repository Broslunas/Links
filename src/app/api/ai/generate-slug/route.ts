import { NextRequest, NextResponse } from 'next/server';

interface DeepSeekResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      );
    }

    // Extraer dominio y path de la URL para el contexto
    let domain = '';
    let path = '';
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
      path = urlObj.pathname;
    } catch (e) {
      // Si no es una URL válida, usar la cadena completa
    }

    const prompt = `Genera un slug corto, descriptivo y amigable para la siguiente URL: ${url}

El slug debe:
- Ser corto (máximo 15 caracteres)
- Usar solo letras minúsculas, números y guiones
- Ser descriptivo del contenido
- Ser fácil de recordar
- No incluir caracteres especiales

Solo responde con el slug, sin explicaciones adicionales.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate slug with AI' },
        { status: 500 }
      );
    }

    const data: DeepSeekResponse = await response.json();
    const generatedSlug = data.choices[0]?.message?.content?.trim();

    if (!generatedSlug) {
      return NextResponse.json(
        { error: 'No slug generated' },
        { status: 500 }
      );
    }

    // Limpiar el slug para asegurar que cumple con los requisitos
    const cleanSlug = generatedSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 15);

    return NextResponse.json({ slug: cleanSlug });
  } catch (error) {
    console.error('Error generating slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}