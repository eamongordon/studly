'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuizProps {
  question: string;
  options: string[];
  answer: string;
}

export default function Quiz({ question, options, answer }: QuizProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
  };

  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      return 'justify-start text-left h-auto';
    }
    if (option === answer) {
      return 'bg-green-500 hover:bg-green-600 justify-start text-left h-auto';
    }
    if (option === selectedOption && option !== answer) {
      return 'bg-red-500 hover:bg-red-600 justify-start text-left h-auto';
    }
    return 'justify-start text-left h-auto';
  };

  return (
    <div className="prose dark:prose-invert bg-gray-100 dark:bg-gray-800 p-4 rounded-lg w-full max-w-md my-4">
      <h3 className="text-lg font-semibold mb-4">{question}</h3>
      <div className="flex flex-col space-y-2">
        {options.map((option, index) => (
          <Button
            key={index}
            variant="outline"
            className={cn('w-full whitespace-normal', getButtonClass(option))}
            onClick={() => handleOptionClick(option)}
          >
            {option}
          </Button>
        ))}
      </div>
      {isAnswered && (
        <div className="mt-4 text-center font-semibold">
          {selectedOption === answer ? (
            <p className="text-green-600 dark:text-green-400">Correct!</p>
          ) : (
            <p className="text-red-600 dark:text-red-400">
              Incorrect. The correct answer is: {answer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
