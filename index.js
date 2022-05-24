const express = require("express");
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



async function run(){
    try{
        await client.connect();
    const PartsCollection = client.db("parts_gear").collection("product");
    const OrderCollection = client.db("parts_gear").collection("Order");
   

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

    // Order Product 

    app.post('/order', async(req,res) =>{
      const order = req.body;
      const query = {order:order }
      const exists = await OrderCollection.findOne(query);
      if (exists) {

        return res.send({ success: false, booking: exists })
      }

      const result = await OrderCollection.insertOne(order);

      res.send({ success: true, result })
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