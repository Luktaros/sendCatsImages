import { Firestore } from '@google-cloud/firestore';
import functions from '@google-cloud/functions-framework';
import { createTransport } from 'nodemailer';
import handlebars from 'handlebars';
import { readFile } from "fs/promises";
import validateUserInput from './validateUserInput.mjs';

// Initialize http function entry point
functions.http('sendCuteCatsViaEmail', sendCuteCatsViaEmail);

// Initialize firestore client
const firestore = new Firestore();

/**
 * This function sends an email with cute cats pictures
 * @param {import('@google-cloud/functions-framework').Request} req
 * @param {import('@google-cloud/functions-framework').Response} res
*/
async function sendCuteCatsViaEmail(req, res) {
  //Validate input
  let cleanUserInput = {};

  try {
    cleanUserInput = validateUserInput(req.body)
  } catch (error) {
    // TODO: Indicate to user and system what when wrong exactly.
    console.error('Invalid user input data', error);
    res.sendStatus(400);
    throw new Error ('Invalid user input data');
  }

  // Set initial counter values
  let countOfReads = 0;
  let countOfWrites = 0;

  // Get input values
  let senderFirstName = '';
  let senderLastName = '';
  let senderEmail = '';
  let recipientFirstName = '';
  let recipientLastName = '';
  let recipientEmail = '';
  let senderName = '';
  let recipientName = '';

  if (cleanUserInput.senderFirstName){
    senderFirstName = cleanUserInput.senderFirstName
  }

  if (cleanUserInput.senderLastName){
    senderLastName = cleanUserInput.senderLastName
  }

  if (cleanUserInput.senderEmail){
    senderEmail = cleanUserInput.senderEmail
  }

  if (cleanUserInput.recipientFirstName){
    recipientFirstName = cleanUserInput.recipientFirstName
  }

  if (cleanUserInput.recipientLastName){
    recipientLastName = cleanUserInput.recipientLastName
  }

  if (cleanUserInput.recipientEmail){
    recipientEmail = cleanUserInput.recipientEmail
  }

  // Get cat image and fileName
  let catImage = Buffer.alloc(0);
  let catFileName = '';

  try {
    const getCatFromStorage = await import("./getCatFromStorage.mjs");
    const results = await getCatFromStorage.default();
    catImage = results[0];
    catFileName = results[1];
  } catch (error) {
    console.error('Error getting and image of a cat', error);
    res.sendStatus(400);
    throw new Error('Error getting and image of a cat');
  }

  // Get email user and pass to send email
  let secretEmailService = '';
  let secretEmailUser = '';
  let secretEmailPass = '';

  if (process.env.SECRET_EMAIL_SERVICE){
    secretEmailService = process.env.SECRET_EMAIL_SERVICE;
  }

  if (process.env.SECRET_EMAIL_USER){
    secretEmailUser = process.env.SECRET_EMAIL_USER;
  }

  if (process.env.SECRET_EMAIL_PASS){
    secretEmailPass = process.env.SECRET_EMAIL_PASS;
  }

  if (!secretEmailService || !secretEmailUser || !secretEmailPass){
    // TODO: Indicate exactly to the server what is missing;
    console.error('Missing one or more of the required secrets: SECRET_EMAIL_SERVICE, SECRET_EMAIL_USER, SECRET_EMAIL_PASS');
    res.sendStatus(500);
    throw new Error ('Missing one or more of the required secrets: SECRET_EMAIL_SERVICE, SECRET_EMAIL_USER, SECRET_EMAIL_PASS');
  }

  // Define email account
  const transporter = createTransport({
    service: secretEmailService,
    auth:{
      user: secretEmailUser,
      pass: secretEmailPass
    }
  })

  // Define sender name for email template
  if (senderFirstName || senderLastName){
    let senderFirstNameAdded = false;

    if (senderFirstName){
      senderFirstNameAdded = true;
      senderName = senderFirstName;
    }

    if (senderLastName){
      if (senderFirstNameAdded){
        senderName += ' ';
      }

      senderName += senderLastName;
    }
  }

  // Define recipient name for email template
  if (recipientFirstName || recipientLastName){
    let recipientFirstNameAdded = false;

    if (recipientFirstName){
      recipientFirstNameAdded = true;
      recipientName += recipientFirstName;
    }

    if (recipientLastName){
      if (recipientFirstNameAdded){
        recipientName +=' ';
      }

      recipientName += recipientLastName;
    }
  }

  // Get and compile html then add data and render email.
  let emailData = {};
  let compiledEmailTemplate = '';
  let emailContent = '';
  let emailTemplate = '';

  try {
    emailTemplate = await readFile('./emailTemplate.html', 'utf-8');
  } catch (error) {
    console.error('Html template file missing', error);
    res.status(500).send('Html template file missing');
    throw new Error('Html template file missing');
  }

  compiledEmailTemplate = handlebars.compile(emailTemplate);

  emailData.senderName = '';
  emailData.recipientName = '';
  emailData.catImage = '';

  if (senderName){
    emailData.senderName = senderName;
  }

  if (recipientName){
    emailData.recipientName = recipientName;
  }

  if (catImage){
    emailData.catImage = catImage;
  }'Invalid user input data'

  emailContent = compiledEmailTemplate(emailData);

  // Define email options
  const mailOptions = {
    from:     secretEmailUser,
    to:       recipientEmail,
    subject:  'Cut cat image for you!',
    attachments: [{
      filename: catFileName,
      content: catImage,
      cid: 'catImage'
    }],
    text:     'Meow, did you find this by accident?',
    html:     emailContent
  }

  // Set replyTo
  if (senderEmail){
    mailOptions.replyTo = senderEmail;
  }

  // Send email and save outcome
  let deliveryReport = '';
  let mailSendSuccessfully = false;
  let sendMailResult;

  try {
    deliveryReport = await transporter.sendMail(mailOptions);
    mailSendSuccessfully = true;
    console.log('Email with cats sent successfully:', deliveryReport);
  } catch (error) {
    deliveryReport = error;
    mailSendSuccessfully = false;
    console.warn('Error sending email with cats:', error);
  }

  // Generate email record
  const emailRecord = {};
  let dateNow = new Date();

  emailRecord.mailSendSuccessfully = mailSendSuccessfully;
  emailRecord.senderFirstName = senderFirstName;
  emailRecord.senderLastName = senderLastName;
  emailRecord.senderEmail = senderEmail;
  emailRecord.recipientFirstName = recipientFirstName;
  emailRecord.recipientLastName = recipientLastName;
  emailRecord.recipientEmail = recipientEmail;
  emailRecord.timeOfOperation = dateNow;
  emailRecord.deliveryReport = deliveryReport;

  // Find the appropriate user profile to store the record on.
  const usersCollectionRef = firestore.collection('users');
  const queryUserCollectionRef = {};

  try {
    queryUserCollectionRef = await usersCollectionRef.where('email', '==', senderEmail).get();
    countOfReads++;
  } catch (error) {
    console.error('Unable to find appropiate user profile to store the record on', error);
  }

  let writeResult;
  let operationEndStatus = 0;

  if (queryUserCollectionRef.empty){
    // If no user profile is found, create a new one and save the record.
    const newUser = {};
    let docIdOfNewUser = '';

    newUser.deleted = false;
    newUser.email = senderEmail;
    newUser.lastUsedFirstName = '';
    newUser.lastUsedLastName = '';
    newUser.listOfEmailSents = [];

    if (senderFirstName){
      newUser.lastUsedFirstName = senderFirstName;
    }

    if (senderLastName){
      newUser.lastUsedLastName = senderLastName;
    }

    newUser.listOfEmailSents.push(emailRecord);

    try {
      writeResult = await firestore.collection('users').add(newUser);
      countOfWrites++;
      docIdOfNewUser = writeResult.id;
      operationEndStatus = 200;
      console.log(`The user with ID ${docIdOfNewUser} has been successfully created, and the email record has been saved.`);
    } catch (error) {
      operationEndStatus = 500;
      console.warn('Unable to create a new user with corresponding record', error);
    }

  } else {
    // If user profile is found, update it with lastest values and register email record
    const userDoc = queryUserCollectionRef.docs[0];
    const userDocData = userDoc.data();
    const userId = userDoc.id;
    const updateForUser = {};
    let listOfEmailSents = [];

    if (userDocData.listOfEmailSents){
      listOfEmailSents = userDocData.listOfEmailSents;

      listOfEmailSents.push(emailRecord);

      updateForUser.listOfEmailSents = listOfEmailSents;
    }

    if (senderFirstName){
      updateForUser.lastUsedFirstName = senderFirstName;
    }

    if (senderLastName){
      updateForUser.lastUsedLastName = senderLastName;
    }

    try {
      writeResult = await firestore.collection('users').doc(userId).update(updateForUser);
      countOfWrites++;
      operationEndStatus = 200;
      console.log(`User: ${userId} has been succesfully updated`);
    } catch (error) {
      operationEndStatus = 500;
      console.warn(`Unable to update user: ${userId} with email record`);
    }
  }

  // Report function execution result and end it
  console.log(`Count of reads: ${countOfReads}, count of writes: ${countOfWrites}`);
  res.sendStatus(operationEndStatus);
  return;
}
