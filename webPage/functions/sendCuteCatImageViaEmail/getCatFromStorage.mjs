import { Storage } from '@google-cloud/storage';

// Initialize global variable
// For now the catbase has 1370 cats pictures.
const CATS_IN_CATBASE = 1370;

// Initialize storage client
const storage = new Storage();

/**
 * Get a cat from Google Storage
 * @returns { Promise } { Array } Where element 0 its an cat image { Buffer }, and element 1 its the file name { String }
 * @throw { Error }
*/
async function getCatFromStorage(){
  // Get a cat image file
  let bucket = '';
  let fileNameTarget = generateRandomFileName();
  let catImage = Buffer.alloc(0);

  if (process.env.SECRET_BUCKET_NAME){
   bucket = process.env.SECRET_BUCKET_NAME
  } else {
    throw new Error ('Missing bucket name/direction secret');
  }

  // TODO: Fix here, fileNameTarget doesn't get pass to the return value
  try {
    return [catImage, fileNameTarget] = await storage.bucket(bucket).file(fileNameTarget).download();
  } catch (error) {
    throw new Error (error);
  }
}

function generateRandomFileName() {
  const numberFile = CATS_IN_CATBASE;
  const randomNumber = Math.floor(Math.random() * numberFile);
  const paddedNumber = randomNumber.toString().padStart(5, '0');
  const fileName = `${paddedNumber}.jpg`;
  return fileName;
}

export default getCatFromStorage;
