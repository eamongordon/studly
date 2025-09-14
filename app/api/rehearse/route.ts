import { NextRequest, NextResponse } from 'next/server';
import { compareUserInputWithSource } from '@/lib/rehearse-compare';

export async function POST(req: NextRequest) {
  try {
    const { source, userInput } = await req.json();
    
    if (!source || !userInput) {
      return NextResponse.json(
        { error: 'Source and userInput are required' },
        { status: 400 }
      );
    }

    const feedback = await compareUserInputWithSource(source, userInput);
    
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error in rehearse API:', error);
    return NextResponse.json(
      { error: 'Failed to compare input' },
      { status: 500 }
    );
  }
}
