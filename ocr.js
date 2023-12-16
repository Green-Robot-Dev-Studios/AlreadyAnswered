import { createWorker } from 'tesseract.js';

export const imgToText = async (img) => {
  const worker = await createWorker('eng');
  const ret = await worker.recognize(img);
//   console.log(ret.data.text);
  await worker.terminate();
  console.log("Got image")
  return ret.data.text
};