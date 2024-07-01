import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const app= express();
const port=process.env.PORT ||3000;

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


app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("Public"));
app.use(bodyParser.json());

app.get("/",(req,res)=>{
    res.render("Home.ejs");
});

app.post("/search",async(req,res)=>{
const input=req.body.search;
try{
const result=await db.query(
   " SELECT id,title,ingredients,instructions FROM recipes WHERE LOWER(tags) LIKE '%'|| $1 ||'%';",
   [input.toLowerCase()]
);
const items = result.rows;
res.render("recipes.ejs",{
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
    res.render("recipes.ejs",{
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
    res.render("recipes.ejs",{
        listitems:items
    });
}catch(err){
    console.log(err);
}
    });

app.post("/view_Recipe",async(req,res)=>{
    const id= req.body.viewid;
    try {
        const result=await db.query("SELECT id,title,ingredients,instructions FROM recipes WHERE id=$1;",
            [id]
        );
            const item=result.rows[0];
            console.log(result.rows[0]);
        
            const wishlistResult = await db.query("SELECT * FROM saved WHERE recipe_id = $1;", [id]);
            const cartResult= await db.query("SELECT * FROM cart WHERE recipe_id = $1;", [id]);
            const isLiked = wishlistResult.rowCount > 0; 
            const inCart = cartResult.rowCount > 0; 
        
            res.render("SingleRecipe.ejs",
                {
                    recipes: { ...item, is_liked: isLiked, in_Cart: inCart}
                }
            );
    } catch (err) {
        console.log(err);
    }
   
});


app.post("/toggle_like", async (req, res) => {
    const { recipeId, isLiked } = req.body;
try{
    if (isLiked) {
        await db.query("DELETE FROM saved WHERE recipe_id = $1;", [recipeId]);
    } else {
        await db.query("INSERT INTO saved (recipe_id) VALUES ($1);", [recipeId]);
    }
    res.sendStatus(200);
} catch(err){
    console.log(err);
}
});

  
  app.post("/wishlist", async (req, res) => {
    try{
    const result = await db.query("SELECT * FROM saved INNER JOIN recipes ON saved.recipe_id = recipes.id;");
    const recipes = result.rows;
    res.render("Wishlist.ejs", { saved_recipes: recipes });
    }
    catch(err){
        console.log(err);
    }
  });

  app.post("/addToCart", async (req, res) => {
    const { recipeId, inCart } = req.body;
try{
    if (inCart) {
        await db.query("DELETE FROM cart WHERE recipe_id = $1;", [recipeId]);
    } else {
        await db.query("INSERT INTO cart (recipe_id) VALUES ($1);", [recipeId]);
    }
    res.sendStatus(200);
}catch(err){
    console.log(err);
}
});
  

  app.post("/cart", async (req, res) => {
    try{
    const result = await db.query("SELECT * FROM cart INNER JOIN recipes ON cart.recipe_id = recipes.id;");
    const recipes = result.rows;
    res.render("Cart.ejs", { cart_recipes: recipes });
    }catch(err){
        console.log(err);
    }
  });
  

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
});