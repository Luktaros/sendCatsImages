import express from 'express';
import axios from 'axios';

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));

// TODO: Analyze the need for an Global error handler
app.use((error, req, res, next)=>{
  console.error('An error ocurred', error);
  res.status(500).send('Something when wrong')
})

app.post('/submit', async (req, res) =>{
  // Execute GCloud Function with request data
  try {
    const gcfUrl = 'https://us-central1-luk-firebase-testing.cloudfunctions.net/sendCuteCatsViaEmail';
    await axios.post(gcfUrl, req.body);
    return res.redirect('/');
  } catch (error) {
    // Check for debug data
    if (error.response){
      if (error.response.data){
        error = error.response.data;
      }
    }

    console.error('Something went wrong: ', error);
    return res.status(400).send('Something went wrong');
  }
})



app.listen(port, () =>{
  console.log('Webpage server is running.');
});
