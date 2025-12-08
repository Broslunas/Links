import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const webhookUrl = 'https://hook.eu2.make.com/cihkqitnkkwd3lv6md151glodc2ahhdr';

    const payload = {
      action: 'contact',
      ...body,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-make-apikey': process.env.WEBHOOK_API_KEY || '',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Error sending contact webhook:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in contact API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
