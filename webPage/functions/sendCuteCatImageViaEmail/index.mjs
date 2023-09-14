import { Firestore } from '@google-cloud/firestore';
import functions from '@google-cloud/functions-framework';
import { createTransport } from 'nodemailer';
import { compile } from 'handlebars';
import { readFile } from "fs/promises";
import validateUserInput from './validateUserInput.mjs';

// Initialize http function entry point
functions.http('sendCuteCatsViaEmail', sendCuteCatsViaEmail);

// Initialize firestore client
const firestore = new Firestore();

// Initialize global variables
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
  throw new Error ('Missing one or more of the required secrets: SECRET_EMAIL_SERVICE, SECRET_EMAIL_USER, SECRET_EMAIL_PASS');
}

/**
 * This function sends an email with cute cats pictures
 * @param {import('@google-cloud/functions-framework').Request} req
 * @param {import('@google-cloud/functions-framework').Response} res
 */
async function sendCuteCatsViaEmail(req, res) {
  //Validate input
  let cleanUserInput = {};

  try {
    cleanUserInput = validateUserInput(cleanUserInput)
  } catch (error) {
    res.status(400).send(error);
  }

  // Define initial counter values
  let countOfReads = 0;
  let countOfWrites = 0;

  // Check input values
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

  // Get cat image
  let catImage = Buffer.alloc(0);

  await import("./getCatFromStorage.mjs")
    .then( module =>{
    catImage = module.default();
  }).catch( error =>{
    console.error('Error getting and image of a cat', error);
    res.status(500).send();
  });

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
  let compiledEmailTemplate;
  let emailContent;

  let emailTemplate = await readFile('./emailTemplate.html', 'utf-8').catch(()=>{
    res.status(500).send('Html template file missing');
  });

  // TODO: Delete this
  console.log('typeof emailTemplate:');
  console.log(typeof emailTemplate);

  compiledEmailTemplate = compile(emailTemplate);

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
  }

  emailContent = compiledEmailTemplate(emailData);

  // TODO: Delete this
  console.log('typeof emailContent:');
  console.log(typeof emailContent);

  // Define email options
  const mailOptions = {
    from:     secretEmailUser,
    to:       recipientEmail,
    subject:  'Cut cat image for you!',
    attachments: [{
      filename: fileNameTarget,
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

  await transporter.sendMail(mailOptions).then(result =>{
    deliveryReport = result;
    mailSendSuccessfully = true;
    console.log('Email with cats sent successfully:', deliveryReport);
  }).catch(error => {
    deliveryReport = error;
    mailSendSuccessfully = false;
    console.error('Error sending email with cats:', error);
  });


  // TODO: Generate email record
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
  const queryUserCollectionRef = await usersCollectionRef.where('email', '==', senderEmail).get();
  countOfReads++;

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

    await firestore.collection('users').add(newUser).then(docId => {
      docIdOfNewUser = docId.id;
    });
    countOfWrites++;

    // Report function execution result and end it
    console.log(`The user with ID ${docIdOfNewUser} has been successfully created, and the email record has been saved.`);
    console.log(`Count of reads: ${countOfReads}, count of writes: ${countOfWrites}`);
    res.send();

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

    await firestore.collection('users').doc(userId).update(updateForUser);
    countOfWrites++;

    // Report function execution result and end it
    console.log(`User: ${userId} has been succesfully updated`);
    console.log(`Count of reads: ${countOfReads}, count of writes: ${countOfWrites}`);
    res.send(200);
  }
}