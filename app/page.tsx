'use client'

import { useRef, useState, useEffect, DragEvent } from 'react'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import FloatingIcons from '@/components/ui/floatingIcons'
import { createLesson } from '@/lib/actions'
import { LessonMode } from '@/lib/types'
import CreatingOverlay from '@/components/ui/CreatingOverlay'
import Image from 'next/image'

export default function Home () {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const showClickHint = !!selectedFile && !isCreating

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0])
      e.dataTransfer.clearData()
    }
  }
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  useEffect(() => {
    if (selectedFile) setActiveIndex(1)
    else setActiveIndex(null)
  }, [selectedFile])

  const currentActive = selectedFile ? hoverIndex ?? activeIndex : null

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const [hintIndex, setHintIndex] = useState<number | null>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }
  const [active] = useState<number>()
  const [fadeOut, setFadeOut] = useState(false)
  const router = useRouter()

  const handleMethodClick = useCallback(
    async (method: LessonMode) => {
      // show overlay immediately
      setIsCreating(true)
      // optional: you can drop the fade if you don’t want the quick white flash
      // setFadeOut(true);

      // no file? -> go to oops and hide overlay
      if (!selectedFile) {
        setIsCreating(false)
        router.push('/oops?reason=no-file')
        return
      }

      const formData = new FormData()
      formData.append('file', selectedFile)

      try {
        const chatId = await createLesson(formData, method)

        if (typeof chatId !== 'string' || !chatId.length) {
          setIsCreating(false)
          router.push('/oops?reason=server')
          return
        }

        // keep overlay showing while we navigate; Next unmounts it on route change
        router.push(`/chat/${chatId}`)
      } catch {
        setIsCreating(false)
        router.push('/oops?reason=server')
      }
    },
    [router, selectedFile]
  )

  return (
    <div>
      {' '}
      <style jsx>{`
        @keyframes clicky {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(0.88);
            opacity: 0.75;
          }
        }
        .cursor-anim {
          animation: clicky 1.1s ease-in-out infinite;
        }
        @keyframes softGlow {
          0% {
            box-shadow: 0 0 6px rgba(244, 114, 182, 0.4);
          }
          50% {
            box-shadow: 0 0 14px rgba(244, 114, 182, 0.7);
          }
          100% {
            box-shadow: 0 0 6px rgba(244, 114, 182, 0.4);
          }
        }
        .soft-glow {
          animation: softGlow 2.2s ease-in-out infinite;
        }
      `}</style>
      <div
        className={`min-h-screen bg-gray-50 relative overflow-hidden transition-all duration-400 ${
          fadeOut ? 'opacity-0 -translate-y-8' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Background lightbulb icons */}
        <FloatingIcons />

        {/* Header */}
        <header className='relative z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm'>
          <div className='mx-auto flex max-w-6xl items-center justify-between p-4'>
            <div className='flex items-center gap-2'>
              <Image
                src='/studly_logo.svg'
                alt='Studly Logo'
                width={130}
                height={32}
              />
            </div>
            <div className='flex items-center gap-3'>
              <Button
                variant='outline'
                className='text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent'
              >
                Sign up
              </Button>
              <Button className='bg-rose-300 hover:bg-rose-400 text-gray-800 border-0'>
                Log in
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className='relative z-10 max-w-6xl mx-auto px-6 py-12'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            {/* Left side - Text content */}
            <div className='space-y-6'>
              <div className='space-y-2'>
                <p className='text-sm text-gray-600 font-medium'>
                  Based off cognitive learning psychology
                </p>
                <h1 className='text-4xl lg:text-5xl font-bold text-gray-900 leading-tight text-balance'>
                  Be a Stud.
                </h1>
                <h3 className='text-xl text-rose-300 font-semibold'>
                  Let our Agent help you <b><i>remember</i></b>, <b><i>learn</i></b>, and <b><i>teach</i></b>!{' '}
                </h3>
                <h3 className='text-md text-gray-600 font-medium'>
                  Choose a study method below to begin
                </h3>
              </div>
            </div>

            {/* Right side - File upload area (Dropzone) */}
            <div
              className={`rounded-xl bg-rose-200/70 border border-rose-300 p-5 transition-shadow ${
                isDragActive
                  ? 'ring-2 ring-rose-400 shadow-lg'
                  : !selectedFile
                  ? 'soft-glow'
                  : ''
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClick}
              style={{ cursor: 'pointer' }}
            >
              <input
                type='file'
                accept='.pdf,.png,.jpeg'
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div
                className={`rounded-2xl border-2 border-dashed border-rose-300 bg-rose-100/30 p-10 flex flex-col items-center justify-center text-center transition-colors ${
                  isDragActive ? 'bg-rose-100/60 border-rose-400' : ''
                }`}
              >
                <div className='w-14 h-16 rounded-md bg-white border border-gray-200 shadow-sm mb-4 flex items-center justify-center'></div>
                <p className='text-xs text-gray-700'>
                  {selectedFile ? (
                    <span className='text-xs text-gray-500'>
                      {selectedFile.name}
                    </span>
                  ) : (
                    'Accepted file types: pdf, png, jpeg'
                  )}
                </p>
              </div>
              <div className='mt-4 text-sm text-gray-800'>
                {selectedFile
                  ? 'Click on a method to begin!'
                  : 'Drop your notes here'}
              </div>
            </div>
          </div>

          <div className='mt-14 border-t border-gray-200' />

          {/* Bottom section - Methods */}
          <div className='mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {/* Method 1 */}
            <div
              role='button'
              tabIndex={0}
              onClick={() => handleMethodClick('song')}
              onMouseEnter={() => setHoverIndex(1)}
              onMouseLeave={() => setHoverIndex(null)}
              className={`group relative rounded-2xl p-6 border shadow-sm transition cursor-pointer
    ${
      currentActive === 1
        ? 'bg-rose-200/70 border-rose-300 -translate-y-0.5 shadow-md'
        : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'
    }
  `}
            >
              <div className='font-semibold text-lg text-gray-900'>Musical Mnemonics</div>
              <span>Memorize through songs.</span>

              <div
                className={`mt-5 h-10 w-full rounded-lg border transition p-2 text-center
      ${
        currentActive === 1
          ? 'border-rose-300 bg-rose-100 text-black'
          : 'border-gray-200 bg-gray-50 text-gray-600 group-hover:border-rose-300 group-hover:bg-rose-100 group-hover:text-black'
      }
    `}
              >
                Let's Jam!
              </div>
            </div>

            {/* Method 2 */}
            <div
              role='button'
              tabIndex={0}
              onClick={() => handleMethodClick('teach')}
              onMouseEnter={() => setHoverIndex(2)}
              onMouseLeave={() => setHoverIndex(null)}
              className={`group relative rounded-2xl p-6 border shadow-sm transition cursor-pointer
    ${
      currentActive === 2
        ? 'bg-rose-200/70 border-rose-300 -translate-y-0.5 shadow-md'
        : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'
    }
  `}
            >
              <div className='font-semibold text-lg text-gray-900'>
               Lesson Plan
              </div>
              <span>Let Studly teach you!</span>
              <div
                className={`mt-5 h-10 w-full rounded-lg border transition p-2 text-center
      ${
        currentActive === 2
          ? 'border-rose-300 bg-rose-100 text-black'
          : 'border-gray-200 bg-gray-50 text-gray-600 group-hover:border-rose-300 group-hover:bg-rose-100 group-hover:text-black'
      }
    `}
              >
                Start Learning!
              </div>
            </div>

            {/* Method 3 */}
            <div
              role='button'
              tabIndex={0}
              onClick={() => handleMethodClick('flashcard')}
              onMouseEnter={() => setHoverIndex(3)}
              onMouseLeave={() => setHoverIndex(null)}
              className={`group relative rounded-2xl p-6 border shadow-sm transition cursor-pointer
    ${
      currentActive === 3
        ? 'bg-rose-200/70 border-rose-300 -translate-y-0.5 shadow-md'
        : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'
    }
  `}
            >
              <div className='font-semibold text-lg text-gray-900'>Active Recall</div>
              <span>Review with flash cards.</span>
              <div
                className={`mt-5 h-10 w-full rounded-lg border transition p-2 text-center
      ${
        currentActive === 3
          ? 'border-rose-300 bg-rose-100 text-black'
          : 'border-gray-200 bg-gray-50 text-gray-600 group-hover:border-rose-300 group-hover:bg-rose-100 group-hover:text-black'
      }
    `}
              >
                Quiz Me!
              </div>
            </div>

            {/* Method 4 */}
            <div
              role='button'
              tabIndex={0}
              onClick={() => handleMethodClick('rehearse')}
              onMouseEnter={() => setHoverIndex(4)}
              onMouseLeave={() => setHoverIndex(null)}
              className={`group relative rounded-2xl p-6 border shadow-sm transition cursor-pointer
    ${
      currentActive === 4
        ? 'bg-rose-200/70 border-rose-300 -translate-y-0.5 shadow-md'
        : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'
    }
  `}
            >
              <div className='font-semibold text-lg text-gray-900'>
                Rehearsal
              </div>
              <span>Rehearse your notes.</span>
              <div
                className={`mt-5 h-10 w-full rounded-lg border transition p-2 text-center
      ${
        currentActive === 4
          ? 'border-rose-300 bg-rose-100 text-black'
          : 'border-gray-200 bg-gray-50 text-gray-600 group-hover:border-rose-300 group-hover:bg-rose-100 group-hover:text-black'
      }
    `}
              >
                Let's Practice!
              </div>
            </div>
          </div>

          <CreatingOverlay show={isCreating} />
        </main>
      </div>
    </div>
  )
}
