//define port where the backend code will be running
const port = 4000;
//import dependencies
const express = require('express');
//create app instance
const app = express();
//initialize mongoose package
const mongoose = require('mongoose');
//initialize json web token
const jwt = require('jsonwebtoken');
const multer = require('multer');
//incluse the path from the express server
const path = require('path'); //using this path we access the backend tree in the express app
const cors = require('cors');

app.use(express.json()); //request we get through response that will be passed through json
app.use(cors());

//initialize our database- Database connection with MongoDB
mongoose.connect('mongodb+srv://greatstackdev:Maximus94!@cluster0.mnmogsi.mongodb.net/e-commerce');

//API creation
app.get('/', (req,res)=>{
    res.send('Express app is running')
})

//Image storage engine and configure disktorage
const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req, file,cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
//pass the configuration
const upload = multer({storage:storage})

//creating upload endpoint for images
app.use('/images', express.static('upload/images'))
app.post('/upload', upload.single('product'), (req, res) => {
    res.json({
        success:1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })

})

//Schema for creating products

const Product = mongoose.model('Product', {
    id:{
        type: Number,
        required: true,
    },
    name:{
        type:String,
        required: true,
    },
    image:{
        type: String,
        required: true,
    },
    category:{
        type: String,
        required: true,
    },
    new_price:{
        type: Number,
        required: true,
    },
    old_price:{
        type: Number,
        required: true,
    },
    date:{
        type:Date,
        default: Date.now
    },
    available:{
        type:Boolean,
        default:true
    },
})

app.post('/addproduct', async(req, res) => {
    let products = await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    }
    else{
        id=1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category: req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    //save the product in db
    await product.save();
    console.log('Saved');
    res.json({
        success:true,
        name:req.body.name,
    })
})

//creating API for deleting products
app.post('/removeproduct', async (req, res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log('Removed!');
    res.json({
        succes:true,
        name:req.body.name
    })
})

//creating API for getting all products
app.get('/allproducts', async (req, res)=>{
    let products = await Product.find({});
    console.log('App products fetched')
    res.send(products)
})

//Schema creating for User model
const Users = mongoose.model('Users', {
    name:{
        type: String,
    },
    email:{
        type: String,
        unique: true,
    }, 
    password:{
        type: String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type: Date,
        default: Date.now,
    }
})

//Creating Endpoint for registering the user
app.post('/signup', async (req, res)=>{
    let check = await Users.findOne({email:req.body.email});
    if (check) {
        return res.status(400).json({success:false, errors:'existing user found with the same email'})
    }
//if there's no user, we create an empty cart
    let cart = {};
    for (let i = 0; i<300; i++){
        cart[i] = 0;
    }
//create a user
    const user = new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })
//save the user in the db
    await user.save();

//create a token (in the user key we have an object with id and user id
    const data = {
        user:{
            id:user.id
        }
    }
//generate a token with sign method
    const token = jwt.sign(data, 'secret_ecom');
    res.json({success:true, token})
})

//Creating endpoint for user login
app.post('/login', async (req, res)=>{
    let user = await Users.findOne({email:req.body.email});
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true, token});
        }
        else{
            res.json({success:false, errors:'wrong password'});
        }
    }
    else {
        res.json({success:false, errors:'wrong email id'})
    }
})

app.listen(port, (error)=>{
    if(!error) {
        console.log('Server running on port' + port)
    }
    else{
        console.log('Error: '+ error)
    }
});