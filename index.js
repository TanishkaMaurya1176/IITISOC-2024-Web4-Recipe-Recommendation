import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from 'express-session';
dotenv.config();

const app= express();
const port=process.env.PORT ||3000;
const saltRounds=5;

//Try Level 2 authentication first 

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false,
      },
  });

  db.connect((err) => {
    if (err) {
      console.error('Connection error', err.stack);
    } else {
      console.log('Connected to the database');
    }
  });

  app.set('view engine', 'ejs');
  app.set('views','./Views');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("Public"));
app.use(bodyParser.json());

app.use(session({
    secret:"TOPSECRET",
    resave:false,
    saveUninitialized:true,
    cookie:{ secure: false }
  }));

  const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
      return next();
    }
    res.redirect('/login');
  };

app.get("/",(req,res)=>{
    res.render('Home');
});
app.get("/logIN",(req,res)=>{
res.render('login');
});

app.post("/register",async(req,res)=>{
const email=req.body.email;
const password=req.body.password;
try {
    const checkResult=await db.query("SELECT * FROM users WHERE email=$1",[email]);
    if(checkResult.rows.length>0){
        res.send("Email already exists try logging in");
    }
    else{
        bcrypt.hash(password,saltRounds,async(err,hash)=>{
            if (err) {
                console.error("Error hashing password:", err);
              } else {
                console.log("Hashed Password:", hash); 
                const result= await db.query("INSERT INTO users (email,password) VALUES ($1,$2)",[email,hash]);
                console.log(result);
                const inserted=await db.query("SELECT * FROM users WHERE email=$1",[email]);
                const user=inserted.rows[0];
                req.session.user=inserted.rows[0];
                res.render('Home');
        }          
    });
} 
}
catch (err) {
    console.log(err);
}
});

app.post("/login",async(req,res)=>{
    const email=req.body.email;
    const password=req.body.password;
try {
    const result=await db.query("SELECT * FROM users WHERE email=$1",[email]);
    if(result.rows.length>0){
        const user=result.rows[0];
        const HashedPassword=user.password;
        bcrypt.compare(password,HashedPassword,(err,Result)=>{
           if(err){
            console.log("Error comparing passwords");
           } else{
            if(Result){
                req.session.user=result.rows[0];
                console.log(result.rows[0]);
                res.render('Home');
            }else{
                res.send("Incorrect Password");
            }
           }
        })
    }
    else{
        res.send("User not found");
    }
} catch (err) {
    console.log(err);
}
})


app.post("/search",async(req,res)=>{
const input=req.body.search;
try{
const result=await db.query(
   " SELECT id,title,ingredients,instructions FROM recipes WHERE LOWER(tags) LIKE '%'|| $1 ||'%';",
   [input.toLowerCase()]
);
const items = result.rows;
res.render('recipes',{
    listitems:items
});
}
catch(err){
    console.log(err);
}
});

app.post("/GetRecipes",async(req,res)=>{
    const name=req.body.getrecipe;
    try{
    const result=await db.query(
       " SELECT id,title,ingredients,instructions FROM recipes WHERE LOWER(tags) LIKE '%'|| $1 ||'%';",
       [name.toLowerCase()]
    );
    const items = result.rows;
    res.render('recipes',{
        listitems:items
    });
}catch(err){
    console.log(err);
}
    });

app.post("/allRecipes",async(req,res)=>{
    try{
    const result=await db.query(
       " SELECT id,title,ingredients,instructions FROM recipes;",
    );
    const items = result.rows;
    res.render('recipes',{
        listitems:items
    });
}catch(err){
    console.log(err);
}
    });

app.post("/view_Recipe", isAuthenticated,async(req,res)=>{
    const id= req.body.viewid;
    try {
        const result=await db.query("SELECT id,title,ingredients,instructions FROM recipes WHERE id=$1;",
            [id]
        );
            const item=result.rows[0];
            console.log(result.rows[0]);
            const wishlistResult = await db.query("SELECT * FROM saved WHERE recipe_id = $1 AND user_id = $2;", [id,req.session.user.id]);
            const cartResult= await db.query("SELECT * FROM cart WHERE recipe_id = $1 AND user_id = $2;", [id,req.session.user.id]);
            const isLiked = wishlistResult.rowCount > 0; 
            const inCart = cartResult.rowCount > 0; 
        
            res.render('SingleRecipe',
                {
                    recipes: { ...item, is_liked: isLiked, in_Cart: inCart}
                }
            );
    } catch (err) {
        console.log(err);
    }
   
});



app.post("/toggle_like", isAuthenticated, async (req, res) => {
    const { recipeId, isLiked } = req.body;
try{
    if (isLiked) {
        await db.query("DELETE FROM saved WHERE recipe_id = $1 AND user_id = $2;", [recipeId,req.session.user.id]);
    } else {
        await db.query("INSERT INTO saved (recipe_id,user_id) VALUES ($1,$2);", [recipeId,req.session.user.id]);
    }
    res.sendStatus(200);
} catch(err){
    console.log(err);
}
});

  
  app.post("/wishlist", isAuthenticated, async (req, res) => {
    try{
    const result = await db.query("SELECT * FROM saved INNER JOIN recipes ON saved.recipe_id = recipes.id WHERE saved.user_id = $1;", [req.session.user.id]);
    const recipes = result.rows;
    res.render('Wishlist', { saved_recipes: recipes });
    }
    catch(err){
        console.log(err);
    }
  });

  app.post("/addToCart", isAuthenticated, async (req, res) => {
    const { recipeId, inCart } = req.body;
try{
    if (inCart) {
        await db.query("DELETE FROM cart WHERE recipe_id = $1 AND user_id=$2;", [recipeId,req.session.user.id]);
    } else {
        await db.query("INSERT INTO cart (recipe_id,user_id) VALUES ($1,$2);", [recipeId,req.session.user.id]);
    }
    res.sendStatus(200);
}catch(err){
    console.log(err);
}
});
  

  app.post("/cart", isAuthenticated, async (req, res) => {
    try{
    const result = await db.query("SELECT * FROM cart INNER JOIN recipes ON cart.recipe_id = recipes.id WHERE cart.user_id=$1;",[req.session.user.id]);
    const recipes = result.rows;
    res.render('Cart', { cart_recipes: recipes });
    }catch(err){
        console.log(err);
    }
  });


app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
});