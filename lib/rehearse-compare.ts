import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function compareUserInputWithSource(source: string, userInput: string): Promise<string> {
  console.log('RehearseCompare: Starting comparison');
  
  const prompt = `Here is the source material:\n${source}\n\nHere is what the student wrote:\n${userInput}\n\nPlease compare the two and list the key points or information from the source that the student missed or did not mention. Be specific and concise.`;

  try {
    const result = await generateObject({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'system',
          content: `You are comparing two test papers. The first one is your copy, which contains all the information you need. 
The second one is the student's copy, which may have some information missing or incorrect.
Your task is to identify the missing or incorrect information in the student's copy and fill in the gaps using the information from your copy. 
If the student's copy is complete, simply confirm that all information is present. 
Unless asked for, do not provide any additional information that is not found on your copy.`
        },
        { role: 'user', content: prompt }
      ],
      schema: z.object({
        aiFeedback: z.string(),
      }),
    });

    const feedback = result.object?.aiFeedback || '';  
    return feedback;
  } catch (error) {
    console.error('RehearseCompare: Error during comparison:', error);
    return 'Sorry, there was an error comparing your input. Please try again.';
  }
}

