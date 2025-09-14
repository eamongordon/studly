import pdf from 'pdf-parse';
import { createWorker } from 'tesseract.js';

export const processFile = async (formData: FormData) => {
  try {
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return { error: 'No file provided or file is empty.' };
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (file.type === 'application/pdf') {
      const data = await pdf(fileBuffer);
      text = data.text;
    } else if (file.type.startsWith('image/')) {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(fileBuffer);
      text = ret.data.text;
      await worker.terminate();
    } else {
      return { error: 'Unsupported file type' };
    }

    // Sanitize text to remove null characters
    const sanitizedText = text.replace(/\x00/g, '');

    return { text: sanitizedText };
  } catch (error) {
    console.error(error);
    return { error: 'Error processing file' };
  }
};
