import { Storage } from '@google-cloud/storage';

// Initialize global variable
// For now the catbase has 1370 cats pictures.
const SECRET_BUCKET_NAME = process.env.SECRET_BUCKET_NAME;


const CATS_IN_CATBASE = 1370;

// Initialize storage client
const storage = new Storage();

/**
 * Get a cat from Google Storage
 * @returns  { Buffer } { Buffer } A cat image
 * @throws { Object } Error
 */
async function getCatFromStorage(){
  // Get a cat
  let bucket = '';
  let fileNameTarget = generateRandomFileName();
  let result;
  let somethingHappened = false;

  if (SECRET_BUCKET_NAME){
    bucket = SECRET_BUCKET_NAME;
  }

  await storage.bucket(bucket).file(fileNameTarget).download()
  .then( fetchCatImage =>{
    [result] = fetchCatImage;
  }).catch( error =>{
    somethingHappened = true;
    result = error;
  });

  if (somethingHappened){
    throw new Error (result);
  }

  return result;
}

function generateRandomFileName() {
  const numberFile = CATS_IN_CATBASE;
  const randomNumber = Math.floor(Math.random() * numberFile);
  const paddedNumber = randomNumber.toString().padStart(5, '0');
  const fileName = `${paddedNumber}.jpg`;
  return fileName;
}

export default getCatFromStorage;
