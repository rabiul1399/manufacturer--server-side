const express = require("express");
const jwt = require('jsonwebtoken');
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIP_SECRET_KEY);

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lxf7z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
  try {
    await client.connect();
    const PartsCollection = client.db("parts_gear").collection("product");
    const OrderCollection = client.db("parts_gear").collection("Order");
    const userCollection = client.db("parts_gear").collection("users");
    const paymentCollection = client.db("parts_gear").collection("payment");


    /// all email user 


    app.post('/create-payment-intent', async (req, res) => {
      const product = req.body;
      console.log('this is product ', product)
      const price = product.price;
      const amount = price * 85;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',

        payment_method_types: ['card'],
      });
      res.send({ clientSecret: paymentIntent.client_secret })
    })

    // all user  & admin user 


    app.get('/user', async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users)
    })

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      }
      const result = await userCollection.updateOne(filter, updateDoc, options);

      const token = jwt.sign({ email: email }, process.env.SECRET_TOKEN_KEY, { expiresIn: '1h' });
      res.send({ result, token });


    })

    app.put('/user/admin/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: 'admin' },
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send({ result });

    })
    app.delete('/user/:role', async (req, res) => {
      const role = req.params.role;
      console.log(role)
      const query = { role: role };

      const result = await userCollection.deleteOne(query);
      res.send({ result });

    })

    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin });
    })

    // Product API
    app.get('/product', async (req, res) => {
      const query = {};
      const cursor = PartsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });
    app.get('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await PartsCollection.findOne(query);
      res.send(product);


    })
    app.post('/product', async (req, res) => {
      const add = req.body;
      const product = await PartsCollection.insertOne(add)
      res.send(product);
    })

    app.delete('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await PartsCollection.deleteOne(query);
    })


    // Order Product 

    app.post('/order', async (req, res) => {
      const order = req.body;
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const exists = await OrderCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists })
      }
      const result = await OrderCollection.insertOne(order);
      res.send({ success: true, result })
    })


    app.get('/order', async (req, res) => {
      const user = req.query.user;
      const query = { user: user };
      const Orders = await OrderCollection.find(query).toArray();
      res.send(Orders)
    })

    app.delete('/order/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await OrderCollection.deleteOne(query);
      res.send(result);

    })

    app.get('/allorder', async (req, res) => {
      const query = {};
      const cursor = OrderCollection.find(query);
      const allOrder = await cursor.toArray();
      res.send(allOrder);
    })
    app.get('/allorder/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await OrderCollection.findOne(query);
      res.send(order)
    })

    app.patch('/allorder/:id', async (req, res) => {
      const id = req.params.id;
      console.log('allorder id', id)
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId
        }
      }
      const result = await paymentCollection.insertOne(payment);
      const updatedBooking = await OrderCollection.updateOne(filter, updatedDoc);
      res.send(updatedBooking);
    })

  }
  finally {

  }
}
run().catch(console.dir);

app.get('', (req, res) => {
  res.send('Hello World!.My services is the very good.')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})