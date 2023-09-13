import { Storage } from '@google-cloud/storage';

// Initialize global variable
// For now the catbase has 1370 cats pictures.
const SECRET_BUCKET_NAME = process.env.SECRET_BUCKET_NAME;
const CATS_IN_CATBASE = 1370;

// Initialize storage client
const storage = new Storage();

/**
 * Get a cat from Google Storage
 */
async function getCatFromStorage(){
  // Get a cat
  let bucket = '';
  let fileNameTarget = generateRandomFileName();
  let catImage = Buffer.alloc(0);

  if (SECRET_BUCKET_NAME){
    bucket = SECRET_BUCKET_NAME;
  }

  await storage.bucket(bucket).file(fileNameTarget).download()
  .then( fetchCatImage =>{
    [catImage] = fetchCatImage;
  }).catch(()=>{
    console.warn("Error while getting cat image.");
  });

  return catImage;
}

function generateRandomFileName() {
  const numberFile = CATS_IN_CATBASE;
  const randomNumber = Math.floor(Math.random() * numberFile);
  const paddedNumber = randomNumber.toString().padStart(5, '0');
  const fileName = `${paddedNumber}.jpg`;
  return fileName;
}


export default getCatFromStorage;
