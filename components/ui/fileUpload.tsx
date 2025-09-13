'use client'

import { useState } from 'react'

export default function FileUpload () {
  const [fileName, setFileName] = useState<string | null>(null)

  return (
    <div className='rounded-xl bg-rose-200/70 border border-rose-300 p-5'>
      <label
        htmlFor='file-upload'
        className='cursor-pointer rounded-2xl border-2 border-dashed border-rose-300 bg-rose-100/30 p-10 flex flex-col items-center justify-center text-center'
      >
        <div className="w-14 h-16 rounded-md bg-white border border-gray-200 shadow-sm mb-4 flex items-center justify-center">
          <img
            src="/lightbulb.svg"
            alt="Lightbulb icon"
            className="w-8 h-8 text-gray-500"
          />
        </div>
        <p className='text-xs text-gray-700'>
          Accepted file types: pdf, png, jpeg
        </p>
        <p className='mt-2 text-sm text-gray-800'>
          {fileName ? `Uploaded: ${fileName}` : 'Drop your notes here'}
        </p>
        <input
          id='file-upload'
          type='file'
          accept='.pdf,.png,.jpeg,.jpg'
          className='hidden'
          onChange={e => {
            if (e.target.files?.[0]) {
              setFileName(e.target.files[0].name)
            }
          }}
        />
      </label>
    </div>
  )
}
