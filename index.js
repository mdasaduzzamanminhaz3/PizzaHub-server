import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());


const client = new MongoClient(process.env.MONGODB_URI);


export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const connectedClient = await connectToMongoDB();


const database = client.db('pizzahub');
const users = database.collection("user");
const sessions= database.collection("session");
const menuItems = database.collection('menuItems');

app.get('/menuItems',async(req,res)=> {
   const query = {};
   if(req.query){
    if(req.query.name){
        query.name = req.query.name;
    }
    if(req.query.category){
        query.category = req.query.category;
    }


    if(req.query.search){
        query.$or=[
            {vendorName:{$regex:req.query.search, $options:'i'}},
            {vendorId:{$regex:req.query.search, $options:'i'}},
            {description:{$regex:req.query.search, $options:'i'}},
            {location:{$regex:req.query.search, $options:'i'}},
            {name:{$regex:req.query.search,$options:'i'}}
        ]
    }
   }
   const cursor = menuItems.find(query);
   const result = await cursor.toArray();
   res.send(result);
})
app.get('/menuItems/:id',async(req,res)=> {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await menuItems.findOne(query);
    res.send(result);
})

app.delete('menuItems/:id',async(req,res)=> {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await menuItems.deleteOne(query);
    res.send(result);
})

app.post('/menuItem/create',async(req,res)=> {
    const menuItem = req.body;
    const result = await menuItems.insertOne(menuItem);
    res.send(result);
})
app.patch('/menuItems/:id',async(req,res)=> {
    const id = req.params.id;
    const updateItem = req.body;
    const filter = {_id: new ObjectId(id)};
    const updateDoc = {
        $set:{
            ...updateItem
        }
    }
    const result = await menuItems.updateOne(filter,updateDoc);
    res.send(result);
})

app.get('/',(req,res)=> {
    res.send("Hello world!")
})

app.listen(port,()=> {
    console.log(`server is running on port ${port}`);
})
