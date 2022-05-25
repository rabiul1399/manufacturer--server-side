const express = require("express");
const jwt = require('jsonwebtoken');
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lxf7z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// function verifyJWT(req,res,next){
//   const authHeader = req.headers.authorization;
//   if(!authHeader){
//     return res.status(401).send({message: 'UnAuthorized access'})
//   }
//   const token  = authHeader.split('')[1];
//   jwt.verify(token,process.env.SECRET_TOKEN_KEY, function(err,decoded){
//     if(err){
//       return res.status(403).send({message: "Forbidden access"})
//     }
//     req.decoded = decoded;
//     next();
//   })
// }

async function run(){
    try{
        await client.connect();
    const PartsCollection = client.db("parts_gear").collection("product");
    const OrderCollection = client.db("parts_gear").collection("Order");
    const userCollection = client.db("parts_gear").collection("users");
    

    app.put('/user/:email',async(req,res) =>{
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      }
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({email:email},process.env.SECRET_TOKEN_KEY, { expiresIn: '1h' });
      res.send({ result , token});


    })

 // Product API
    app.get('/product',async(req,res)=>{
        const query = {};
        const cursor = PartsCollection.find(query);
        const products= await cursor.toArray();
        res.send(products);
    });
    app.get('/product/:id',async (req,res) =>{
        const id =req.params.id;
        const query = {_id: ObjectId(id) };
        const product = await PartsCollection.findOne(query);
        res.send(product);
        
       
    })


    // available product
  

    // Order Product 

    app.post('/order', async(req,res) =>{
      const order = req.body;
      const id =req.params.id;
      const query = {_id: ObjectId(id) };
      const exists = await OrderCollection.findOne(query);
      if (exists) {

        return res.send({ success: false, booking: exists })
      }

      const result = await OrderCollection.insertOne(order);

      res.send({ success: true, result })
    })


    app.get('/order', async (req,res) =>{
      const user = req.query.user;
      const query = {user: user};
      console.log(query)
      const Orders = await OrderCollection.find(query).toArray();
      res.send(Orders);
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