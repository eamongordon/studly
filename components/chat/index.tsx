'use client'

import { MemoizedMarkdown } from '@/components/chat/memoized-markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SunoClip, SunoService } from '@/lib/suno-service'
import { cn } from '@/lib/utils'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { CircleAlert, CircleStop, Send } from 'lucide-react'
import { useEffect, useRef, useState, ComponentType } from 'react'
import { useSearchParams } from 'next/navigation'
import QuizGenerator from '@/components/quiz/quizGenerator'
import Link from 'next/link'
import Quiz from '../quiz/quiz';
import { LessonMode, Lesson } from '@/lib/types'

function SongGeneration({ part }: { part: { output: { clips: SunoClip[] } } }) {
  const output = part.output;
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const songLoaded = useRef(false);

  useEffect(() => {
    if (output?.clips && !songLoaded.current) {
      songLoaded.current = true;
      setAudioUrl(output.clips[0].audio_url);
      const pollForCompletion = async () => {
        // Poll for "complete" status
        const newClips = await SunoService.pollForStatus(
          output.clips.map(clip => clip.id),
          'complete'
        );
        setAudioUrl(newClips[0].audio_url);
      }
      pollForCompletion();
    }
  }, [output]);

  return (
    <div className='prose dark:prose-invert'>
      {Boolean(output) ? (
        <>
          <img
            src={output.clips[0].image_url || undefined}
            alt='Song cover'
            className='w-full h-auto'
          />
          <audio src={audioUrl || undefined} controls />
        </>
      ) : (
        <div className='prose dark:prose-invert'>Generating song...</div>
      )}
    </div>
  )
}

function ToolInfo({ part }: { part: { result: { info: string } } }) {
  return (
    <div className='prose dark:prose-invert'>
      <MemoizedMarkdown
        id={part.result.info}
        content={part.result.info}
      />
    </div>
  );
}

function QuizDisplay({
  part,
  lessonId,
  onComplete,
  onRetry,
}: {
  part: {
    result: {
      question: string;
      options: string[];
      answer: string;
      checkpointId: string;
    };
  };
  lessonId: string;
  onComplete: () => void;
  onRetry: () => void;
}) {
  const { result } = part;
  const [completed, setCompleted] = useState(false);

  if (completed) {
    return null;
  }

  return (
    <Quiz
      {...result}
      lessonId={lessonId}
      onComplete={() => {
        setCompleted(true);
        onComplete();
      }}
      onRetry={() => {
        setCompleted(true);
        onRetry();
      }}
    />
  );
}

function LoadingComponent({ toolName }: { toolName: string }) {
  let message = 'Thinking...';
  if (toolName === 'giveInfo') {
    message = 'Getting information...';
  } else if (toolName === 'generateQuiz') {
    message = 'Generating a quiz...';
  } else if (toolName === 'freeResponse') {
    message = 'Evaluating your response...';
  }
  return (
    <div className='flex items-center gap-2 text-muted-foreground'>
      <BouncingDots />
      <span>{message}</span>
    </div>
  );
}

export default function Chat({
  slug,
  lessonData
}: {
  slug: string
  lessonData: Lesson
}) {
  const searchParams = useSearchParams()
  const QuizAny = QuizGenerator as unknown as ComponentType<any>;

  const method = (
    (lessonData.mode ?? searchParams.get('method') ?? '') as LessonMode
  ).toLowerCase()
  const { messages, sendMessage, stop, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        lessonId: slug,
        mode: lessonData.mode,
      },
    }),
  })
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [input, setInput] = useState('')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    })
  }, [messages])

  return (
    <main className='h-[calc(100dvh-64px)] px-4 flex flex-col items-center justify-center'>
      <div className='fixed top-[30px] left-[10px] md:top-[30px] md:left-[100px] z-50'>
        <Button
          asChild
          size='sm'
          variant='outline'
          className=' border-rose-300 text-gray-700 hover:bg-rose-400 backdrop-blur bg-rose-300 py-5'
        >
          <Link href='/'>← Return home</Link>
        </Button>
      </div>
      {messages.length > 0 ? (
        <div className='flex-1 w-full overflow-y-auto pt-8'>
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex max-w-screen-md mx-auto',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.parts.length > 0 ? (
                <div
                  className={cn(
                    'mb-8',
                    message.role === 'user'
                      ? 'rounded-xl py-3 px-5 bg-rose-300 text-gray-900 font-semibold shadow'
                      : 'bg-white border border-rose-200 rounded-2xl p-5 shadow-sm'
                  )}
                >
                  {message.parts.map((part, index) => {
                    if (part.type === 'text') {
                      return (
                        <div
                          key={index}
                          className={cn(
                            'prose dark:prose-invert',
                            message.role === 'user' && 'text-primary-foreground'
                          )}
                        >
                          <MemoizedMarkdown
                            id={message.id}
                            content={part.text}
                          />
                        </div>
                      )
                    }
                    if (part.type === 'tool-generateSong') {
                      return (
                        <SongGeneration
                          key={index}
                          part={part as { output: { clips: SunoClip[] } }}
                        />
                      )
                    }
                    if (part.type === 'tool-giveInfo') {
                      if (part.output && (part as { output: { info: string } }).output.info) {
                        console.log("part", part)
                        return (
                          <div
                            key={index}
                            className={cn(
                              'prose dark:prose-invert',
                              message.role === 'user' && 'text-primary-foreground'
                            )}
                          >
                            <MemoizedMarkdown
                              id={message.id}
                              content={(part as { output: { info: string } }).output.info}
                            />
                          </div>
                        )
                      } else {
                        return <LoadingComponent key={`${message.id}-${index}-loading`} toolName='giveInfo' />;
                      }
                    }
                    
                    if (part.type === 'tool-getNotes' && part.output && (part as { output: { notes: string } }).output.notes) {
                      return (
                        <div
                          key={index}
                          className={cn(
                            'prose dark:prose-invert',
                            message.role === 'user' && 'text-primary-foreground'
                          )}
                        >
                          <h3>Your Notes:</h3>
                          <MemoizedMarkdown
                            id={message.id}
                            content={(part as { output: { notes: string } }).output.notes}
                          />
                        </div>
                      )
                    }
                    if (
                      part.type === 'tool-generateQuiz' &&
                      part.output &&
                      (
                        part as {
                          output: {
                            question: string;
                            options: string[];
                            answer: string;
                            checkpointId: string;
                          };
                        }
                      ).output.question
                    ) {
                      console.log('PART QUIZ', part);
                      return (
                        <QuizDisplay
                          part={{
                            result: (
                              part as {
                                output: {
                                  question: string;
                                  options: string[];
                                  answer: string;
                                  checkpointId: string;
                                };
                              }
                            ).output,
                          }}
                          lessonId={slug}
                          key={`${message.id}-${index}`}
                          onComplete={() => {
                            sendMessage({
                              text: 'Great, what is the next objective?',
                            });
                          }}
                          onRetry={() => {
                            sendMessage({
                              text: 'I would like to try another question for the last objective.',
                            });
                          }}
                        />
                      );
                    }
                    if (part.type === 'tool-generateFlashcards') {
                      const result = (part as { output: { cards?: any[]; error?: string } }).output;
                      return (
                        <div key={index} className="prose dark:prose-invert">
                          <h3>Generated Flashcards</h3>
                          {result.error ? (
                            <div className="bg-red-50 p-4 rounded-lg">
                              <p className="text-red-800">{result.error}</p>
                            </div>
                          ) : (
                            <div>
                              {result.cards?.map((card, idx) => (
                                <div key={idx} className="border rounded p-3 mb-2">
                                  <p><strong>Q:</strong> {card.question}</p>
                                  <p><strong>A:</strong> {card.answer}</p>
                                </div>
                              )) || <p>No flashcards generated.</p>}
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    if (part.type === 'tool-compareRehearsal') {
                      const result = (part as { output: { feedback?: string; error?: string } }).output;
                      return (
                        <div key={index} className="prose dark:prose-invert">
                          <h3>Recall Comparison Feedback</h3>
                          <div className={result.error ? "bg-red-50 p-4 rounded-lg" : "bg-blue-50 p-4 rounded-lg"}>
                            <p>{result.feedback || result.error || 'No feedback available'}</p>
                          </div>
                        </div>
                      );
                    }
                    
                    return null
                  })}
                </div>
              ) : status === 'submitted' || status === 'streaming' ? (
                <div className='bg-muted rounded-2xl p-5 my-8 mb-4'>
                  <BouncingDots />
                </div>
              ) : null}
            </div>
          ))}
          {status === 'error' && (
            <div className='flex max-w-screen-md mb-4 mx-auto justify-start'>
              <div className='bg-muted rounded-2xl p-5 my-8'>
                <div className='flex flex-row items-center gap-3 text-red-500 mx-auto max-w-screen-md'>
                  <CircleAlert />
                  Something went wrong. Please try again.
                </div>
              </div>
            </div>
          )}
          {/* Scroll to the bottom of the messages */}
          <div ref={messagesEndRef} />
        </div>
      ) : (
  <div className='mx-auto max-w-screen-md flex flex-col items-center justify-center gap-4 text-center mb-6'>  
            <>
              {method === 'song' && (
                <div >
                  <h2 className='text-2xl md:text-3xl font-bold text-rose-900'>Mnemonic Device</h2>
                  <p className='text-rose-800'>Learn your notes from catchy tunes</p>
                </div>
              )}
              {method === 'teach' && (
                <div >
                  <h2 className='text-2xl md:text-3xl font-bold text-rose-900'>Feynman Technique</h2>
                  <p className='text-rose-800'>Teach your notes to check your own comprehension</p>
                  
                </div>
              )}
              {['flashcard', 'recall', '3'].includes(method) && (
                <div className='space-y-3'>
                  <div >
                    <h2 className='text-2xl md:text-3xl font-bold text-rose-900'>Active Recall</h2>
                  <p className='text-rose-800'>Use flash cards for quick memory practice</p>
                  </div>
                  {/* Pass notes to QuizGenerator for flashcard mode */}
                  <QuizGenerator notes={lessonData?.source ?? ''} />
                </div>
              )}

              {method === 'rehearse' && (
                <div >
                  <h2 className='text-2xl md:text-3xl font-bold text-rose-900'>Maintenance Rehearsal</h2>
                  <p className='text-rose-800'>See how much information you can dump out of your brain</p>
                </div>
              )}
            </>
          
          <p className='text-muted-foreground'>
            <i>Remember, I&apos;m an AI, and still make mistakes!</i>
          </p>
          
        </div>
      )}
      {/* Centered input container initially, sticky when content grows */}
      <div
        className={cn(
          'mx-auto bg-background max-w-screen-md flex flex-row gap-2 transition-all w-full',
          messages.length > 0 && 'pb-8 z-10'
        )}
      >
        <Input
          value={input}
          onChange={event => {
            setInput(event.target.value)
          }}
          onKeyDown={async event => {
            if (event.key === 'Enter') {
              sendMessage({ text: input })
              setInput('')
            }
          }}
          placeholder='Type your message...'
          className='w-full h-12'
        />
        <Button
          onClick={async () => {
            if (status === 'submitted' || status === 'streaming') stop()
            else {
              sendMessage({ text: input })
              setInput('')
            }
          }}
          className='h-12 [&_svg]:h-5 [&_svg]:w-5'
          disabled={input.length === 0}
        >
          {status === 'submitted' || status === 'streaming' ? (
            <CircleStop />
          ) : (
            <Send />
          )}
        </Button>
      </div>
    </main>
  )
}

function BouncingDots() {
  return (
    <>
      <style jsx>{`
        @keyframes bounceDot {
          0%,
          80%,
          100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
        }
      `}</style>
      <div className='flex space-x-1'>
        <span
          className='size-1.5 bg-muted-foreground rounded-full'
          style={{
            animation: 'bounceDot 1.4s infinite ease-in-out',
            animationDelay: '0s'
          }}
        ></span>
        <span
          className='size-1.5 bg-muted-foreground rounded-full'
          style={{
            animation: 'bounceDot 1.4s infinite ease-in-out',
            animationDelay: '0.2s'
          }}
        ></span>
        <span
          className='size-1.5 bg-muted-foreground rounded-full'
          style={{
            animation: 'bounceDot 1.4s infinite ease-in-out',
            animationDelay: '0.4s'
          }}
        ></span>
      </div>
    </>
  )
}
