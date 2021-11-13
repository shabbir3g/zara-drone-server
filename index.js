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

// Verify Jwt token function

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
        // database name
        const database = client.db("zaraDrone");
        // database collection
        const usersCollection = database.collection('users');
        const productsCollection = database.collection('products');
        const reviewCollection = database.collection('review');
        const purchaseCollection = database.collection('purchase');

        // Get purchase data
        
        app.get('/my-orders', async (req, res) => {
          const cursor = purchaseCollection.find({});
          const orders = await cursor.toArray();
          res.send(orders)
        });

        // Delete purchase data

        app.delete('/my-orders/:id', async(req, res) => {
          const id = req.params.id;
          const query = {_id: ObjectId(id)}
          const result = await purchaseCollection.deleteOne(query);
          res.json(result)
        }); 

         // Get purchase data by email

        app.get('/my-orders/:email', async (req, res) => {
          const email = req.params.email;
          const orders = await purchaseCollection.find({email: email}).toArray();
          res.json(orders)
      }); 

         // Update status to Shipped

        app.put('/udpate/:id', async(req, res) => {
          const id = req.params.id;
          const filter = {_id: ObjectId(id)}
          const options = { upsert: true };
          const updatedDoc = {
            $set: {
              status: "Shipped"
            },
         };
          const result = await purchaseCollection.updateOne(filter,updatedDoc, options );

          res.json(result);
      })

        // post purchase data

        app.post('/purchase', async(req, res) => {
          const purchase = req.body;
          const result = await purchaseCollection.insertOne(purchase);
          res.json(result);
        });

        // post review data

        app.post('/review', async(req, res) => {
          const review = req.body;
          const result = await reviewCollection.insertOne(review);
          res.json(result);
        });

        // get review data

        app.get('/review', async (req, res) => {
          const cursor = reviewCollection.find({});
          const reviews = await cursor.toArray();
          res.send(reviews)
        });


        // post product data

        app.post('/products', async(req, res) => {
          const product = req.body;
          const result = await productsCollection.insertOne(product);
          res.json(result);
        });

         // get products data

        app.get('/products', async (req, res) => {
          const cursor = productsCollection.find({});
          const products = await cursor.toArray();
          res.send(products)
        }); 

        // delete single product

        app.delete('/products/:id', async(req, res) => {
          const id = req.params.id;
          const query = {_id: ObjectId(id)}
          const result = await productsCollection.deleteOne(query);
          res.json(result)
        }); 

        // get single product

        app.get('/products/:id', async (req, res) => {
          const id = req.params.id;
          const query = {_id: ObjectId(id)};
          const products = await productsCollection.findOne(query);
          res.json(products)
      });

      // get user data

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

        // post user 

        app.post('/users', async (req, res) => {
          const user = req.body;
          const result = await usersCollection.insertOne(user);
          res.json(result)
        });

         // get user

         app.get('/users', async (req, res) => {
          const cursor = usersCollection.find({});
          const users = await cursor.toArray();
          res.send(users)
        }); 

         

         // upsert user 

        app.put('/users', async(req, res) => {
          const user = req.body;
          const filter = {email: user.email};
          const options = { upsert: true };
          const updateDoc = { $set: user };
          const result = await usersCollection.updateOne(filter, updateDoc, options);
          res.json(result);
        });

      // put role user to admin

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