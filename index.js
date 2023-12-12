const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const fileUpload = require("express-fileupload");
const cors = require('cors');
const app = express();
const port = process.env.PORT || 7000

//Final_Project_Server bYZWmjmc7D1DMRfh

app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fqvfigl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db('doctorsPortal');
    const appointmentCollection = database.collection('appointmentOptions');
    const bookingCollection = database.collection('bookings');
    const usersCollection = database.collection('users');
    const doctorsCollection = database.collection('doctors');
    const reviewsCollection = database.collection('reviews');

    app.get('/appointmentOptions', async(req, res)=>{
      const date = req.query.date;
      // console.log(date);
      const query = {};
      const options = await appointmentCollection.find(query).toArray();
      const bookingQuery = {appointmentDate:date};
      const alreadyBooked = await bookingCollection.find(bookingQuery).toArray();

      options.forEach(option =>{
        const optionBooked = alreadyBooked.filter(book=>book.treatment == option.name);
        const bookedSlots = optionBooked.map(book=> book.slot);
        console.log(bookedSlots);
        const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));
        option.slots = remainingSlots;
      })

      res.send(options)
    })

    app.get('/appointmentSpeciality', async(req, res)=>{
      const query = {};
      const result = await appointmentCollection.find(query).project({name:1, _id:1}).toArray();
      res.send(result);
    })

    app.get('/bookings', async(req, res) => {
      const email = req.query.email;
      // console.log(email);
      const query = {email:email};
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    })

    //booking post
    app.post('/bookings', async(req, res)=>{
      const booking = req.body;
      // console.log(booking);
      const query = {
        appointmentDate:booking.appointmentDate,
        email:booking.email,
        treatment:booking.treatment
      }

      const alreadyBooked = await bookingCollection.find(query).toArray();
      if(alreadyBooked.length){
        const message = `You have already booking on ${booking.appointmentDate}`;
        return res.send({acknowledged:false, message})
      }

      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })

    //users
    app.get('/users/admin/:email', async(req, res) =>{
      const email = req.params.email;
      console.log(email);
      const query = {email};
      const user = await usersCollection.findOne(query);
      res.send({isAdmin: user?.role === 'admin'});
    })

    app.get('/users', async(req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result)
    })

    app.put('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id)};
      const option = {upsert: true};
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }

      const result = await usersCollection.updateOne(filter, updatedDoc, option);
      res.send(result);
    })

    app.delete('/users/admin/:id', async(req, res)=>{
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id)};
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    })

    app.post('/users', async(req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })

    app.get('/doctors', async(req, res) => {
      const query = {};
      const result = await doctorsCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/doctors', async(req, res)=>{
      const name = req.body.name;
      const email = req.body.email;
      const speciality = req.body.speciality;
      
      const image = req.files.image;
      const imgData = image.data;
      const encodedImg = imgData.toString('base64');
      const imgBuffer = Buffer.from(encodedImg, 'base64');

      const doctor = {
        name,
        email,
        speciality,
        image: imgBuffer
      }

      const result = await doctorsCollection.insertOne(doctor);
      res.send(result);
      // console.log(name, email, speciality, imgData);
    })

    app.delete('/doctors/:id', async(req, res)=>{
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id)};
      const result = await doctorsCollection.deleteOne(filter);
      res.send(result);
    })

    // review
    app.post('/reviews', async(req, res) => {
      const review = req.body;
      console.log(review);
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    })

    app.get('/reviews', async(req, res) => {
      const query = {};
      const result = await reviewsCollection.find(query).toArray();
      res.send(result)
    })

    app.delete('/reviews/:id', async(req, res)=>{
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id)};
      const result = await reviewsCollection.deleteOne(filter);
      res.send(result);
    })


    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Our Doctor is running')
})

app.listen(port, () => {
  console.log(`Our Doctor's website run on ${port}`)
})