const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

// Middleware
app.use(cors())
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kqqlx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
      await client.connect();
      const serviceCollection = client.db("doctors_portal").collection("services");
      const bookingCollection = client.db("doctors_portal").collection("booking");
      const userCollection = client.db("doctors_portal").collection("user");
     

      
      
      app.get('/service',async(req,res) =>{
          const query= {};
          const cursor  = serviceCollection.find(query);
          const services= await cursor.toArray();
          res.send(services);

      })


      app.put('/user/:email', async(req,res)=>{
        const email = req.params.email;
    
        const user = req.body;
        const filter ={email:email};
        const options =  { upsert: true };
        const updateDoc={
         $set : user,
        }  
        const result = await userCollection.updateOne(filter,updateDoc,options);
        res.send(result);

      })




      app.get('/available',async(req,res) =>{
        const date = req.query.date ;


        //step 1: get all services
        const services = await serviceCollection.find().toArray();

        //step 2: get the booking of that of that day
        const query = {date:date};
        const bookings = await bookingCollection.find(query).toArray();

        // step 3: for each service , find booking for the service
        services.forEach(service =>{
          const serviceBookings = bookings.filter(b =>b.treatment === service.name);
          const booked = serviceBookings.map(s=> s.slot);
          const available = service.slots.filter(slot=>!booked.includes(slot))

          service.slots=available
        
        })
        res.send(services)
      })
      

      /**
       * API naming Convention 
       * app.get('/booking') //get all bookings in theis collectaion . or get more than on by filter
       * app.get('/booking/:id') // get a specific booking
       * app.post ('/booking')// add a new booking 
       * app.patch('/booking/:id)//
       * app.delete('/booking/: id)//
       */
     

            app.get('/booking',async(req,res)=>{
        const patient =req.query.patient;
        console.log(patient)
        const query = {patient: patient};
        const bookings =await bookingCollection.find(query).toArray();
      
        res.send(bookings)
      })


      app.post('/booking', async(req,res) =>{
        const booking = req.body;
        const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
        const exists =await bookingCollection.findOne(query)
        if(exists){

          return res.send({success:false,booking:exists})
        }
        
        const result = await bookingCollection.insertOne(booking);

        res.send({success:true,result} )

      });

      // app.get('/booking/:id',async(req,res)=>{
      //   const id =req.params.id;
      //   console.log(id)
      //   const query = {_id: ObjectId(id)};
      //   const booked =await bookingCollection.findOne(query);
      
      //   res.send(booked)
      // })




      // app.get('/booking',async(req,res)=>{
      //   const query = {};
      //   const cursor = bookingCollection.find(query);
      //   const booked = await cursor.toArray();
      //   res.send(booked)
      // })







    } finally {
    
    }
  }
  run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Doctors app listening on port ${port}`)
})