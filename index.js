import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


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
const payments = database.collection("payments");
const orders = database.collection("oreders");

// middleware
const verifyToken =async(req,res,next)=> {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        res.status(401).send({message:'Unauthorized'});
        return;
    }
    const token = authHeader.split(' ')[1];
    if(!token){
        res.status(401).send({message:'Unauthorized'});
        return;
    }
    const query = {token};
    const session = await sessions.findOne(query);
    if(!session){
        res.status(401).send({message:'Unauthorized'});
        return;
    }
    const userId = session.userId;
    const userQuery = ObjectId.isValid(userId)
        ? { $or: [{ _id: new ObjectId(userId) }, { id: String(userId) }] }
        : { id: String(userId) };
    const user = await users.findOne(userQuery);
    if(!user){
        res.status(401).send({message:'Unauthorized'});
        return;
    }
    req.user = user;
    next()
}


// must call this middleware after verifyToken
const verifyCustomer = async(req,res,next)=> {
    if(req.user.role !== 'customer'){
        res.status(403).send({message:'Forbidden'});
        return;
    }
    next();
}
const verifyVendor = async(req,res,next)=> {
    if(req.user.role !== 'vendor'){
        res.status(403).send({message:'Forbidden'});
        return;
    }
    next();
}
const verifyAdmin = async(req,res,next)=> {
    if(req.user.role !== 'admin'){
        res.status(403).send({message:'Forbidden'});
        return;
    }
    next();
}



app.get('/menuItems',async(req,res)=> {
   const query = {};
   if(req.query){
    if (req.query.vendorId) {
        query.vendorId = req.query.vendorId;
     }else if(req.query.admin ==="true" || req.query.status){
        if(req.query.status && req.query.status !=="All"){
            query.status = req.query.status
        }
     }
     
     else{
        query.status = "Approved";
        query.isActive = true;
     }
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

app.get('/menuItems/count',async(req,res)=> {
    const query = {};
    if(req.query.vendorId){
        query.vendorId = req.query.vendorId;
    }
    const result = await menuItems.countDocuments(query);
    res.send({count:result})
})


app.get('/menuItems/:id',async(req,res)=> {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await menuItems.findOne(query);
    res.send(result);
})

app.delete('/menuItems/:id',verifyToken,async(req,res)=> {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await menuItems.deleteOne(query);
    res.send(result);
})

app.post('/menuItem/create',verifyToken,verifyVendor,async(req,res)=> {
    const menuItem = req.body;
    const result = await menuItems.insertOne(menuItem);
    res.send(result);
})
app.patch("/menuItems/:id", verifyToken,async (req, res) => {
  const id = req.params.id;
  const { _id, ...updateItem } = req.body;
  const allowedStatuses = ["Pending", "Approved", "Rejected"];
    if (updateItem.status && !allowedStatuses.includes(updateItem.status)) {
      return res.status(400).send({ message: "Invalid status value" });
    }
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: updateItem,
  };
  const result = await menuItems.updateOne(filter, updateDoc);
  res.send(result);
});


// payment related apis
app.post('/payments/checkout-verify',verifyToken,async(req,res)=> {
    const {sessionId} = req.body;
    if(!sessionId){
        return res.status(400).send({success:false, message:'Session Id is required'})
    }

    const {status,payment_status,vendor_email,metadata,payment_intent} = await stripe.checkout.sessions.retrieve(sessionId);
    if(status === 'complete' && payment_status==='paid'){
        const sessionQuery = {sessionId};
        const existingPayment = await payments.findOne(sessionQuery);
        if(existingPayment){
            return res.send({success:false, message:'Payment already verified'})
        }
        const payment = {
            status,
            payment_status,
            vendor_email,
            userId:metadata.userId,
            payment_date: new Date(),
            payment_intent,
        }
        const result = await payments.insertOne(payment);

        // update user table
        const query = {_id: new ObjectId(metadata.userId)}
        const updateDoc = {
            $set:{
                premium:true,
            }
        }
        const updateResult = await users.updateOne(
            query,
            updateDoc
        )
        res.send({success:true,result,updateResult});
        return
    }
    res.send({success:false, message:'Payment verification failed'})

})

app.get("/payments", verifyToken,async (req, res) => {
  try {
    const query = {};
    if (req.query.userId) {
      query.userId = req.query.userId;
    }

    const result = await payments
      .find(query)
      .sort({ payment_date: -1 })
      .toArray();

    // console.log("GET /payments query:", query, "found:", result.length);
    res.send(result);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).send([]);
  }
});

// user related apis
app.get('/users/:id/premium',verifyToken,async(req,res)=>{
  const id = req.params.id;
  const query =  {_id: new ObjectId(id)};
  const result = await users.findOne(query,{projection:{premium:1}});
  res.send(result)
})


app.get('/users/:id',verifyToken,async(req,res)=> {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    const result = await users.findOne(query);
    res.send(result);
})

app.patch("/users/:id", verifyToken,async (req, res) => {
  const id = req.params.id;
  const { name, restaurantName, address, phone, image, role, blocked } =
    req.body;

  const updateFields = {
    updatedAt: new Date(),
  };

  if (name) updateFields.name = name;
  if (restaurantName) updateFields.restaurantName = restaurantName;
  if (address) updateFields.address = address;
  if (phone) updateFields.phone = phone;
  if (image) updateFields.image = image;
  if (role) updateFields.role = role;
  if (typeof blocked === "boolean") updateFields.blocked = blocked;

  const result = await users.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateFields }
  );
  res.send(result);
});

app.get('/users',async(req,res)=>{
    const result = await users.find({}).sort({_id:-1}).toArray();
    res.send(result);
})


// oreder related apis
app.post('/orders/create',verifyToken,verifyCustomer,async(req,res)=> {
    const order = req.body;
    const result = await orders.insertOne(order);
    res.send(result);
});

app.get("/orders",verifyToken,async(req,res)=> {
    // console.log("headers on the server: ", req.headers);
    const query = {};
    if (req.query.vendorId) {
        query.vendorId = req.query.vendorId;
    } else if (req.query.customerId || req.query.CustomerId) {
        const custId = req.query.customerId || req.query.CustomerId;
        query.$or = [{ customerId: custId }, { CustomerId: custId }];
    } else if (req.query.customerEmail) {
        query.customerEmail = req.query.customerEmail;
    }
    if(req.query.menuItemId){
        const menuItemId = req.query.menuItemId;
        if(!ObjectId.isValid(menuItemId)){
            res.status(400).send({message:'Invalid menuItemId'});
            return;
        }
        const menuItemQuery = {_id: new ObjectId(menuItemId)};
        const menuItem = await menuItems.findOne(menuItemQuery);
        if(!menuItem){
            res.status(404).send({message:'Menu item not found'});
            return;
        }
        if(String(menuItem.vendorId) !== String(req.user._id) && req.user.role !=="admin"){
            res.status(403).send({message: `Forbidden`});
            return;
        }
        query.menuItemId = menuItemId;
    }
    const cursor = orders.find(query);
    const result = await cursor.toArray();
    res.send(result);
})

app.patch('/orders/:id/cancel',verifyToken,verifyCustomer,async(req,res)=> {
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)};
    const updateDoc = {
        $set:{
            status:"Cancelled",
        },
    };
    const result = await orders.updateOne(filter,updateDoc);
    res.send(result);
})


app.patch('/orders/:id/status', verifyToken, verifyVendor,async(req,res)=> {
    const id = req.params.id;
    const {status} = req.body;
    const allowedStatuses = ["Accepted","Rejected"];
    if(!allowedStatuses.includes(status)){
        return res.status(400).send({message:"Invalid order status"});
    }
    const filter = {_id: new ObjectId(id)};
    const updateDoc = {
        $set:{status},
    };
    const result = await orders.updateOne(filter,updateDoc);
    res.send(result);
})


app.get('/',(req,res)=> {
    res.send("Hello world!")
})

app.listen(port,()=> {
    console.log(`server is running on port ${port}`);
})

export default app;