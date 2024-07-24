import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

dotenv.config();

const app= express();
const port=process.env.PORT ||3000;
const saltRounds=5;

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
    cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({ usernameField: 'email' },
    async (email, password, done) => {
        try {
            const result = await db.query("SELECT * FROM users WHERE email=$1", [email]);
            if (result.rows.length > 0) {
                const user = result.rows[0];
                const hashedPassword = user.password;
                bcrypt.compare(password, hashedPassword, (err, isMatch) => {
                    if (err) {
                        return done(err);
                    }
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Incorrect password.' });
                    }
                });
            } else {
                return done(null, false, { message: 'User not found.' });
            }
        } catch (err) {
            return done(err);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await db.query("SELECT * FROM users WHERE id=$1", [id]);
        if (result.rows.length > 0) {
            done(null, result.rows[0]);
        } else {
            done(null, false);
        }
    } catch (err) {
        done(err);
    }
});

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
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
                res.redirect('/login');
        }          
    });
} 
}
catch (err) {
    console.log(err);
}
});

app.post("/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('login', { message: info.message }); // Display error message on login page
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/');
        });
    })(req, res, next);
});



app.post("/search",async(req,res)=>{
const input=req.body.search;
try{
const result=await db.query(
   " SELECT * FROM recipes WHERE LOWER(tags) LIKE '%'|| $1 ||'%';",
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
       " SELECT * FROM recipes WHERE LOWER(tags) LIKE '%'|| $1 ||'%';",
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
       " SELECT * FROM recipes;",
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
    const isShared = req.query.shared === 'false';
    try {
        const result=await db.query("SELECT * FROM recipes WHERE id=$1;",
            [id]
        );
            const item=result.rows[0];
            console.log(result.rows[0]);
            const wishlistResult = await db.query("SELECT * FROM saved WHERE recipe_id = $1 AND user_id = $2;", [id,req.user.id]);
            const cartResult= await db.query("SELECT * FROM cart WHERE recipe_id = $1 AND user_id = $2;", [id,req.user.id]);
            const isLiked = wishlistResult.rowCount > 0; 
            const inCart = cartResult.rowCount > 0; 
        
            res.render('SingleRecipe',
                {
                    recipes: { ...item, is_liked: isLiked, in_Cart: inCart},isShared
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
        await db.query("DELETE FROM saved WHERE recipe_id = $1 AND user_id = $2;", [recipeId,req.user.id]);
    } else {
        await db.query("INSERT INTO saved (recipe_id,user_id) VALUES ($1,$2);", [recipeId,req.user.id]);
    }
    res.sendStatus(200);
} catch(err){
    console.log(err);
}
});

  
  app.post("/wishlist", isAuthenticated, async (req, res) => {
    try{
    const result = await db.query("SELECT * FROM saved INNER JOIN recipes ON saved.recipe_id = recipes.id WHERE saved.user_id = $1;", [req.user.id]);
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
        await db.query("DELETE FROM cart WHERE recipe_id = $1 AND user_id=$2;", [recipeId,req.user.id]);
    } else {
        await db.query("INSERT INTO cart (recipe_id,user_id) VALUES ($1,$2);", [recipeId,req.user.id]);
    }
    res.sendStatus(200);
}catch(err){
    console.log(err);
}
});
  

  app.post("/cart", isAuthenticated, async (req, res) => {
    try{
    const result = await db.query("SELECT * FROM cart INNER JOIN recipes ON cart.recipe_id = recipes.id WHERE cart.user_id=$1;",[req.user.id]);
    const recipes = result.rows;
    res.render('Cart', { cart_recipes: recipes });
    }catch(err){
        console.log(err);
    }
  });

  app.get('/view_Recipe', async function(req, res) {
    const recipeId = req.query.id;
    const isShared = req.query.shared === 'true';
    if (!recipeId) {
        return res.redirect('/');
    }
    try {
        const result = await db.query("SELECT * FROM recipes WHERE id=$1;", [recipeId]);
        const item = result.rows[0];
        if (!item) {
            return res.status(404).send("Recipe not found");
        }
        res.render('SingleRecipe', {
            recipes: { ...item, is_liked: false, in_Cart: false },
            isShared
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }   
});

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
});