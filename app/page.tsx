'use client'

import { useRef, useState, DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Lightbulb } from 'lucide-react'
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
  const [active, setActive] = useState<number>(1); // default active = Method 2

  return (
    <div>
      <div className='min-h-screen bg-gray-50 relative overflow-hidden'>
        {/* Background lightbulb icons */}
        <FloatingIcons />

        {/* Header */}
        <header className='relative z-10 flex items-center justify-between p-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm'>
          <div className='flex items-center gap-2'>
            <span className='text-xl font-semibold text-gray-800'>Stud.ly</span>
            <img src='/lightbulb.svg' alt='Lightbulb' height={20} width={20} />
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
        </header>

        {/* Main content */}
        <main className='relative z-10 max-w-6xl mx-auto px-6 py-12'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            {/* Left side - Text content */}
            <div className='space-y-6'>
              <div className='space-y-4'>
                <p className='text-sm text-gray-600 font-medium'>Lorem ipsum</p>
                <h1 className='text-4xl lg:text-5xl font-bold text-gray-900 leading-tight text-balance'>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit
                </h1>
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
                accept='.pdf,.png,.jpeg,.jpg'
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
              tabIndex={0}
              onClick={() => setActive(0)}
              onKeyDown={e =>
                (e.key === 'Enter' || e.key === ' ') && setActive(0)
              }
              className={`rounded-2xl p-6 border shadow-sm transition cursor-pointer
      ${
        active === 0
          ? 'bg-rose-200/70 border-rose-300'
          : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'
      }`}
            >
              <div className='font-medium text-gray-900'>Method 1:</div>
              <div
                className={`mt-5 h-10 w-full rounded-lg border transition
        ${
          active === 0
            ? 'border-rose-300 bg-white/60'
            : 'border-gray-200 bg-gray-50'
        }`}
              />
            </div>

            {/* Method 2 */}
            <div
              role='button'
              tabIndex={0}
              onClick={() => setActive(1)}
              onKeyDown={e =>
                (e.key === 'Enter' || e.key === ' ') && setActive(1)
              }
              className={`rounded-2xl p-6 border shadow-sm transition cursor-pointer
      ${
        active === 1
          ? 'bg-rose-200/70 border-rose-300'
          : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'
      }`}
            >
              <div className='font-medium text-gray-900'>Method 2:</div>
              <div
                className={`mt-5 h-10 w-full rounded-lg border transition
        ${
          active === 1
            ? 'border-rose-300 bg-white/60'
            : 'border-gray-200 bg-gray-50'
        }`}
              />
            </div>

            {/* Method 3 */}
            <div
              role='button'
              tabIndex={0}
              onClick={() => setActive(2)}
              onKeyDown={e =>
                (e.key === 'Enter' || e.key === ' ') && setActive(2)
              }
              className={`rounded-2xl p-6 border shadow-sm transition cursor-pointer
      ${
        active === 2
          ? 'bg-rose-200/70 border-rose-300'
          : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'
      }`}
            >
              <div className='font-medium text-gray-900'>Method 3:</div>
              <div
                className={`mt-5 h-10 w-full rounded-lg border transition
        ${
          active === 2
            ? 'border-rose-300 bg-white/60'
            : 'border-gray-200 bg-gray-50'
        }`}
              />
            </div>

            {/* Method 4 */}
            <div
              role='button'
              tabIndex={0}
              onClick={() => setActive(3)}
              onKeyDown={e =>
                (e.key === 'Enter' || e.key === ' ') && setActive(3)
              }
              className={`rounded-2xl p-6 border shadow-sm transition cursor-pointer
      ${
        active === 3
          ? 'bg-rose-200/70 border-rose-300'
          : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/40 hover:-translate-y-0.5 hover:shadow-md'
      }`}
            >
              <div className='font-medium text-gray-900'>Method 4:</div>
              <div
                className={`mt-5 h-10 w-full rounded-lg border transition
        ${
          active === 3
            ? 'border-rose-300 bg-white/60'
            : 'border-gray-200 bg-gray-50'
        }`}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
