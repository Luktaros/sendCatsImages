import express from 'express';

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));

app.post('/submit', (req, res) =>{
  // Execute GCloud Function with request data
  res.send('Email with cat images send!');
})

app.listen(port, () =>{
  console.log('Webpage server is running.');
});

