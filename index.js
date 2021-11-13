const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config()
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
const admin = require("firebase-admin");
const app = express();
const port = process.env.PORT || 5000;


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// middleware 

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5fxi2.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function varifyToken(req, res, next){
  if(req?.headers?.authorization?.startsWith('Bearer ')){
    const token = req.headers.authorization.split(' ')[1];


    try{
      const docodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = docodedUser.email;
    }


    catch{

    }
  }
  next();
}

async function run(){
    try{
        await client.connect();
        const database = client.db("zaraDrone");

        const usersCollection = database.collection('users');
        const productsCollection = database.collection('products');
        const reviewCollection = database.collection('review');
        const purchaseCollection = database.collection('purchase');

        
        app.get('/my-orders', async (req, res) => {
          const cursor = purchaseCollection.find({});
          const orders = await cursor.toArray();
          res.send(orders)
        });

        app.delete('/my-orders/:id', async(req, res) => {
          const id = req.params.id;
          const query = {_id: ObjectId(id)}
          const result = await purchaseCollection.deleteOne(query);
          res.json(result)
        }); 

        app.get('/my-orders/:email', async (req, res) => {
          const email = req.params.email;
          const orders = await purchaseCollection.find({email: email}).toArray();
          res.json(orders)
      }); 

        app.put('/udpate/:id', async(req, res) => {
          const id = req.params.id;
          const filter = {_id: ObjectId(id)}
          const options = { upsert: true };
          const updatedDoc = {
            $set: {
              status: "Approved"
            },
         };
          const result = await purchaseCollection.updateOne(filter,updatedDoc, options );

          res.json(result);
      })



        app.post('/purchase', async(req, res) => {
          const purchase = req.body;
          const result = await purchaseCollection.insertOne(purchase);
          res.json(result);
        });

        app.post('/review', async(req, res) => {
          const review = req.body;
          const result = await reviewCollection.insertOne(review);
          res.json(result);
        });

        app.get('/review', async (req, res) => {
          const cursor = reviewCollection.find({});
          const reviews = await cursor.toArray();
          res.send(reviews)
        });

        app.post('/products', async(req, res) => {
          const product = req.body;
          const result = await productsCollection.insertOne(product);
          res.json(result);
        });

        app.get('/products', async (req, res) => {
          const cursor = productsCollection.find({});
          const products = await cursor.toArray();
          res.send(products)
        }); 

        app.get('/products/:id', async (req, res) => {
          const id = req.params.id;
          const query = {_id: ObjectId(id)};
          const products = await productsCollection.findOne(query);
          res.json(products)
      });

      app.get('/users/:email', async(req, res) => {
            const email = req.params.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            let isAdmin = false
            if(user?.role === 'admin'){
              isAdmin = true
            }
            res.json({admin: isAdmin});
        });

        app.post('/users', async (req, res) => {
          const user = req.body;
          const result = await usersCollection.insertOne(user);
          res.json(result)
        });

        app.put('/users', async(req, res) => {
          const user = req.body;
          const filter = {email: user.email};
          const options = { upsert: true };
          const updateDoc = { $set: user };
          const result = await usersCollection.updateOne(filter, updateDoc, options);
          res.json(result);
        });

       app.put('/users/admin', varifyToken,  async(req, res) => {
        const user = req.body;
        const requester = req.decodedEmail;
        if(requester){
          const requesterAccount = await usersCollection.findOne({email: requester});
          if(requesterAccount.role === 'admin'){
            const filter = {email: user.email};
            const updateDoc = {$set: {role: 'admin'}};
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
          }
        }
        else{
          res.status(403).json({message: 'You do not have acces to make admin'})
        }
       
        
        });







        // GET Services
      /*   app.get('/services', async (req, res) => {
            const cursor = productsCollection.find({});
            const services = await cursor.toArray();
            res.send(services)
        });

        // post Services
        app.post('/services', async(req, res) => {
            const service = req.body;
            const result = await productsCollection.insertOne(service);
            res.json(result);
        }); */

       /*   // post booking
            app.post('/booking', async(req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.json(result);
        });

          //GET SINGLE service 

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await servicesCollection.findOne(query);
            res.json(service)
        });
        //GET all booking by email 
        app.get('/my-orders/:email', async (req, res) => {
            const email = req.params.email;
            const service = await bookingCollection.find({email: email}).toArray();
            res.json(service)
        }); */

       /*  //GET all booking
        app.get('/ManageAllOrders', async (req, res) => {
            const cursor = bookingCollection.find({});
            const booking = await cursor.toArray();
            res.send(booking)
        });
        // Delete booking
        app.delete('/booking/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await bookingCollection.deleteOne(query);
            console.log('deleting users with id', result);
            res.json(result)
          }); */
        

        // update status
        /* app.put('/udpate/:id', async(req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const options = { upsert: true };
            const updatedDoc = {
              $set: {
                status: "Approved"
              },
           };
            const result = await bookingCollection.updateOne(filter,updatedDoc, options );

            res.json(result);
        })
 */
        



    }
    finally{
       // await client.close();
    }
}

run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Zara Drone Server is Running!')
})

app.listen(port, () => {
  console.log(`Zara Drone Server listening at http://localhost:${port}`)
})