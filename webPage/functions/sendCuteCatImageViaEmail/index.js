import {Firestore} from '@google-cloud/firestore';
import functions from '@google-cloud/functions-framework';
import nodemailer from 'nodemailer';


// Initialize firestore client
const firestore = new Firestore({
  projectId: 'xxxxx'
});

// Initialize http function entry point
functions.http('sendCuteCatsViaEmail', sendCuteCatsViaEmail);

/**
 * This function sends an email with cute cats pictures
 * @param {object} req
 * @param {object} res
 */
async function sendCuteCatsViaEmail(req, res) {
  // Define initial values
  let countOfReads = 0;
  let countOfWrites = 0;

  // Define email account
  const transporter = nodemailer.createTransport({
    service:'xxxxx',
    auth:{
      user: 'xxxxxx',
      pass: 'xxxxxx'
    }
  })

  // Check input values
  let senderFirstName = '';
  let senderLastName = '';
  let senderEmail = '';
  let recipientFirstName = '';
  let recipientLastName = '';
  let recipientEmail = '';

  if (req.body.senderFirstName){
    senderFirstName = req.body.senderFirstName
  }

  if (req.body.senderLastName){
    senderLastName = req.body.senderLastName
  }

  if (req.body.senderEmail){
    senderEmail = req.body.senderEmail
  }

  if (req.body.recipientFirstName){
    recipientFirstName = req.body.recipientFirstName
  }

  if (req.body.recipientLastName){
    recipientLastName = req.body.recipientLastName
  }

  if (req.body.recipientEmail){
    recipientEmail = req.body.recipientEmail
  }

  // Define email html body
  let htmlBody =
  `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Simple Email</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f0f0f0; text-align: center; padding: 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
              <td style="background-color: #0073e6; padding: 20px;">
                  <h1 style="color: #fff;">Hello, User!</h1>
              </td>
          </tr>
          <tr>
              <td style="padding: 20px;">
                  <p>This is a simple HTML email. You can add your content here.</p>
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac justo nec leo euismod cursus. Cras non libero non odio condimentum auctor.</p>
              </td>
          </tr>
          <tr>
              <td style="background-color: #0073e6; color: #fff; padding: 10px;">
                  <p>&copy; 2023 Your Company Name</p>
              </td>
          </tr>
      </table>
  </body>
  </html>`;

  // Define email options
  const mailOptions = {
    from:     senderEmail,
    to:       recipientEmail,
    subject:  'Cut cats images for you!',
    text:     'Meow, some test text',
    html:     htmlBody
  }

  // Send mail and save outcome
  let deliveryReport = '';
  let mailSendSuccessfully = false;

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      deliveryReport = error;
      mailSendSuccessfully = false;

      console.error('Error sending email with cats:', error);
    } else {
      mailSendSuccessfully = true;

      if (info.response){
        deliveryReport = info.response;
      }

      console.log('Email with cats sent:', deliveryReport);
    }
  });

  // Generate email record
  const mailRecord = {};
  let dateNow = new Date();

  mailRecord.mailSendSuccessfully = mailSendSuccessfully;
  mailRecord.senderFirstName = senderFirstName;
  mailRecord.senderLastName = senderLastName;
  mailRecord.senderEmail = senderEmail;
  mailRecord.recipientFirstName = recipientFirstName;
  mailRecord.recipientLastName = recipientLastName;
  mailRecord.recipientEmail = recipientEmail;
  mailRecord.timeOfOperation = dateNow;
  mailRecord.deliveryReport = deliveryReport;

  // Find the appropriate user profile to store the record on.
  const usersCollectionRef = firestore.collection('users');
  const queryUserCollectionRef = await usersCollectionRef.where('senderEmail', '==', senderEmail).get();
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

    listOfEmailSents.push(mailRecord);
    newUser.listOfEmailSents = listOfEmailSents;

    await firestore.collection('users').add(newUser).then(docId => {
      docIdOfNewUser = docId.id;
    });
    countOfWrites++;

    // Report function execution result and end it
    console.log(`User: ${docIdOfNewUser} has been succesfully created and mail record has been saved`);
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

      listOfEmailSents.push(mailRecord);

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
    res.send();
  }
}
