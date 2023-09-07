import {Firestore} from '@google-cloud/firestore';
import functions from '@google-cloud/functions-framework';
import nodemailer from 'nodemailer';


// Initialize firestore client
const firestore = new Firestore({
  projectId: 'xxxxx' //TODO
});

// Initialize http function entry point
functions.http('sendCuteCatViaEmail', sendCuteCatViaEmail);

/**
 * This function sends an email with cute cats pictures
 * @param {object} req
 * @param {object} res
 */
async function sendCuteCatViaEmail(req, res) {
  // Define initial values
  let countOfReads = 0;
  let countOfWrites = 0;

  // Define email format and configuration
  const transporter = nodemailer.createTransport({
    service:'xxxxx', //TODO
    auth:{
      user: 'xxxxxx', //TODO
      pass: 'xxxxxx' //TODO
    }
  })

  const mailOptions = {
    from:     'xxxxx', //TODO
    to:       'xxxxx', //TODO
    subject:  'xxxxx', //TODO
    text:     'xxxxx', //TODO
    html:     'xxxxx' //TODO
  }

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

  // Send mail and process results
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

  // Search for users, register them if necessary and save outcome
  const usersCollectionRef = firestore.collection('users');
  const queryUserCollectionRef = await usersCollectionRef.where('senderEmail', '==', senderEmail).get();
  countOfReads++;

  if (queryUserCollectionRef.empty){
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

    console.log(`User: ${docIdOfNewUser} has been succesfully created`);
    console.log(`Count of reads: ${countOfReads}, count of writes: ${countOfWrites}`);
    res.send();

  } else {
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

    console.log(`User: ${userId} has been succesfully updated`);
    console.log(`Count of reads: ${countOfReads}, count of writes: ${countOfWrites}`);
    res.send();
  }
}
