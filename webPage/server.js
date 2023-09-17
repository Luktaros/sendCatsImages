import express from 'express';
// import axios from 'axios';

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));

app.post('/submit', async (req, res) =>{
  // Execute GCloud Function with request data
  console.log(req.body);
  // const gcfUrl = 'https://us-central1-luk-firebase-testing.cloudfunctions.net/sendCuteCatsViaEmail';
  // await axios.post(gcfUrl, req.body);

  res.send('Email with cat images send!');
})



app.listen(port, () =>{
  console.log('Webpage server is running.');
});
