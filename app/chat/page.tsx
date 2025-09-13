'use client';

import { MemoizedMarkdown } from '@/components/chat/memoized-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Cat, CircleAlert, CircleStop, Send, Shrimp, Snail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function Page() {
    const { messages, sendMessage, stop, status } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
        }),
    });
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [input, setInput] = useState('');

    const prompts = [
        { icon: <Shrimp />, text: "Why are elephants so big?" },
        { icon: <Snail />, text: "Why do zebras have stripes?" },
        { icon: <Cat />, text: "Why do houses have roofs?" }
    ];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: 'nearest' });
    }, [messages]);

    return (
        <main className="h-[calc(100dvh-64px)] px-4 flex flex-col items-center justify-center">
            {messages.length > 0 ? (
                <div className="flex-1 w-full overflow-y-auto pt-8">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex max-w-screen-md mx-auto",
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            {message.parts.length > 0 ? (
                                <div
                                    className={cn(
                                        "mb-8",
                                        message.role === 'user'
                                            ? 'rounded-xl py-3 px-5 bg-primary text-primary-foreground font-semibold'
                                            : 'bg-muted rounded-2xl p-5'
                                    )}
                                >
                                    {message.parts.map((part, index) => (
                                        <div key={index} className={cn('prose dark:prose-invert', message.role === 'user' && 'text-primary-foreground')}>
                                            {part.type === 'text' && <MemoizedMarkdown id={message.id} content={part.text} />}
                                            {part.type.startsWith("tool-") && <div>Calling {part.type}</div>}
                                        </div>
                                    ))}
                                </div>
                            ) : status === "submitted" || status === "streaming" ? (
                                <div className='bg-muted rounded-2xl p-5 my-8 mb-4'>
                                    <BouncingDots />
                                </div>
                            ) : null}
                        </div>
                    ))}
                    {status === "error" && (
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
                <div className="mx-auto max-w-screen-md flex flex-col items-center justify-center gap-4 text-center mb-6">
                    <h2 className='text-2xl md:text-3xl font-semibold'>Welcome!</h2>
                    <p className='text-muted-foreground'>
                        I&apos;m Studly, the all-knowing Wizard.
                        Ask me anything about your study plans, and I&apos;ll do my best to respond.
                        <br />
                        <i>Remember, I&apos;m an AI, and still make mistakes!</i>
                    </p>
                    {/* Prompt containers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4 w-full">
                        {prompts.map((prompt, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                className="gap-4 md:gap-2 justify-start md:flex md:flex-col md:h-auto md:whitespace-normal md:[&_svg]:size-5 md:py-4"
                                onClick={() => sendMessage({ text: prompt.text })}
                            >
                                {prompt.icon}
                                {prompt.text}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
            {/* Centered input container initially, sticky when content grows */}
            <div className={cn(
                "mx-auto bg-background max-w-screen-md flex flex-row gap-2 transition-all w-full",
                messages.length > 0 && "pb-8 z-10"
            )}>
                <Input
                    value={input}
                    onChange={event => {
                        setInput(event.target.value);
                    }}
                    onKeyDown={async event => {
                        if (event.key === 'Enter') {
                            sendMessage({ text: input });
                            setInput('');
                        }
                    }}
                    placeholder="Type your message..."
                    className="w-full h-12"
                />
                <Button
                    onClick={async () => {
                        if (status === 'submitted' || status === 'streaming') stop();
                        else {
                            sendMessage({ text: input });
                            setInput('');
                        }
                    }}
                    className='h-12 [&_svg]:h-5 [&_svg]:w-5'
                    disabled={input.length === 0}
                >
                    {status === 'submitted' || status === 'streaming' ? <CircleStop /> : <Send />}
                </Button>
            </div>
        </main >
    );
}

function BouncingDots() {
    return (
        <>
            <style jsx>{`
      @keyframes bounceDot {
        0%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-10px);
        }
      }
    `}</style>
            <div className="flex space-x-1">
                <span
                    className="size-1.5 bg-muted-foreground rounded-full"
                    style={{
                        animation: 'bounceDot 1.4s infinite ease-in-out',
                        animationDelay: '0s',
                    }}
                ></span>
                <span
                    className="size-1.5 bg-muted-foreground rounded-full"
                    style={{
                        animation: 'bounceDot 1.4s infinite ease-in-out',
                        animationDelay: '0.2s',
                    }}
                ></span>
                <span
                    className="size-1.5 bg-muted-foreground rounded-full"
                    style={{
                        animation: 'bounceDot 1.4s infinite ease-in-out',
                        animationDelay: '0.4s',
                    }}
                ></span>
            </div>
        </>
    )
}