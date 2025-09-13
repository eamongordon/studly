'use client'

import { useRef, useState, DragEvent } from 'react'
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button'
import FloatingIcons from '@/components/ui/floatingIcons'

export default function Home () {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0])
      e.dataTransfer.clearData()
    }
  }

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

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }
  const [active] = useState<number>();
  const [fadeOut, setFadeOut] = useState(false);
  const router = useRouter();

  const handleMethodClick = useCallback((method: number) => {
    setFadeOut(true);
    setTimeout(() => {
      router.push(`/chat?method=${method}`);
    }, 400);
  }, [router]);

  return (
    <div>
  <div className={`min-h-screen bg-gray-50 relative overflow-hidden transition-all duration-400 ${fadeOut ? 'opacity-0 -translate-y-8' : 'opacity-100 translate-y-0'}`}> 
        {/* Background lightbulb icons */}
        <FloatingIcons />

        {/* Header */}
        <header className="relative z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between p-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-gray-800">Stud.ly</span>
              <img src="/lightbulb.svg" alt="Lightbulb" height={20} width={20} />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                Sign up
              </Button>
              <Button className="bg-rose-300 hover:bg-rose-400 text-gray-800 border-0">
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
                <p className='text-sm text-gray-600 font-medium'>Based off cognitive learning psychology</p>
                <h1 className='text-4xl lg:text-5xl font-bold text-gray-900 leading-tight text-balance'>
                  Stop "I don't know how to study"-ing
                </h1>
                <h3 className='text-md text-gray-600 font-medium'>Learn how to study with Stud.ly! </h3>
                <h3 className='text-md text-gray-600 font-medium'>Choose a study method below to begin</h3>
              </div>
            </div>

            {/* Right side - File upload area (Dropzone) */}
            <div
              className={`rounded-xl bg-rose-200/70 border border-rose-300 p-5 transition-shadow ${
                isDragActive ? 'ring-2 ring-rose-400 shadow-lg' : ''
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
                <div className='w-14 h-16 rounded-md bg-white border border-gray-200 shadow-sm mb-4 flex items-center justify-center'>
                  {selectedFile ? (
                    <span className='text-xs text-gray-500'>
                      {selectedFile.name}
                    </span>
                  ) : null}
                </div>
                <p className='text-xs text-gray-700'>
                  Accepted file types: pdf, png, jpeg
                </p>
              </div>
              <div className='mt-4 text-sm text-gray-800'>
                {selectedFile
                  ? 'File ready to upload!'
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
              tabIndex={1}
              onClick={() => handleMethodClick(1)}
              className={`group rounded-2xl p-6 border shadow-sm transition cursor-pointer
      ${
        active === 1
          ? 'bg-rose-200/70 border-rose-300'
          : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'
      }`}
            >
              <div className='font-medium text-gray-900'>Mnemonic Device: </div>
              <span> Memorize through song </span>
              <div
                className={`mt-5 h-10 w-full rounded-lg border transition p-2 text-center text-transparent group-hover:text-black`}
                
              > Let's Go!</div>
            </div>

            {/* Method 2 */}
            <div
              role='button'
              tabIndex={2}
              onClick={() => handleMethodClick(2)}
              className={`group rounded-2xl p-6 border shadow-sm transition cursor-pointer
      ${
        active === 2
          ? 'bg-rose-200/70 border-rose-300'
          : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'
      }`}
            >
              <div className='font-medium text-gray-900'>Feynman Technique: </div>
              <span> Teach your notes </span>
              <div
                className={`mt-5 h-10 w-full rounded-lg border transition p-2 text-center text-transparent group-hover:text-black`}
              > Let's Go!</div>
            </div>

            {/* Method 3 */}
            <div
              role='button'
              tabIndex={3}
              onClick={() => handleMethodClick(3)}
              className={`group rounded-2xl p-6 border shadow-sm transition cursor-pointer
      ${
        active === 3
          ? 'bg-rose-200/70 border-rose-300'
          : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'
      }`}
            >
              <div className='font-medium text-gray-900'>Active Recall: </div>
              <span> Flash cards </span>
              <div
                className={`mt-5 h-10 w-full rounded-lg border transition p-2 text-center text-transparent group-hover:text-black`}
                
              > Let's Go!</div>
            </div>

            {/* Method 4 */}
            <div
              role='button'
              tabIndex={4}
              onClick={() => handleMethodClick(4)}
              className={`group rounded-2xl p-6 border shadow-sm transition cursor-pointer
      ${
        active === 4
          ? 'bg-rose-200/70 border-rose-300'
          : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'
      }`}
            >
              <div className='font-medium text-gray-900'>Maintenance Rehearsal: </div>
              <span> Note iteration </span>
              <div
                className={`mt-5 h-10 w-full rounded-lg border transition p-2 text-center text-transparent group-hover:text-black`}
                
              > Let's Go!</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
