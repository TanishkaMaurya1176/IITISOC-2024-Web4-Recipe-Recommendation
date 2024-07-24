
# Recipe Recommendation Engine

This project is a recipe recommendation program built with a combination of HTML, CSS, JavaScript, and EJS templates for the frontend. The backend is powered by Node.js and Express, along with several other essential packages.



## Features

- User authentication (login and registration)
- Browse and search for recipes
- View detailed recipe information
- Add recipes to a wishlist
- Manage items in a shopping cart
- Share to your friends the amazing recipes



## Project Structure
```
IITISOC-2024-Web4-Recipe-Recommendation
├── node_modules/
├── public/
│   ├── Images/
│   └── Styles/
│       └── home.css
├── views/
│   ├── Cart.ejs
│   ├── Home.ejs
│   ├── login.ejs
│   ├── recipe.ejs
│   ├── SingleRecipe.ejs
│   └── Wishlist.ejs
├── .env
├── .gitignore
├── index.js
├── recipes.csv
├── Queries.sql
├── package.json
└── package-lock.json


```
#### Images

- This folder contains all the images and logo used in the project.
#### Styles

- Home.css: It is responsible for styling the home page of the recipe recommendation application. This file includes styles that enhance the visual presentation and mobile responsiveness of the home page.
#### Views

- Cart.ejs: Template for displaying the shopping cart.
- Home.ejs: Template for the home page, displaying a list of recipes like dietary, instant, healthy, meals.
- login.ejs: Template for user login.
- recipe.ejs: Template for getting browsed recipes.
- singlerecipe.ejs: Template for viewing a single recipe in detail with liking, sharing, adding to cart options.
- wishlist.ejs: Template for displaying the user's wishlist.




#### index.js

- Main file for backend-to-frontend connection. It handles server setup, routing, and database interactions.
#### Queries.sql

- It contains the queries of creating Tables of recipes, saved, cart, users.
## Technologies Used

**Frontend:** 

- **HTML:** Structure of the web pages.

- **CSS:** Styling of the web pages.

- **JavaScript:** Interactivity and dynamic content.

- **EJS:** Templating engine to generate HTML with embedded JavaScript.

**Backend:** 

- **Node.js:** JavaScript runtime for server-side scripting.

- **Express:** Web framework for Node.js to handle routing and server logic.

- **body-parser:** Middleware to parse incoming request bodies.

- **pg:** PostgreSQL client for Node.js to interact with the database.

- **dotenv:** Module to load environment variables from a .env file.

- **bcrypt:** Library for hashing passwords.

- **express-session:** Middleware to manage user sessions.


## Installation

1. Clone the Repository:

```bash
git clone https://github.com/your-username/recipe-recommendation.git
cd recipe-recommendation

```
2. Install dependencies:

```bash
npm install

```
3. Create database using pgAdmin. Add server then create database ,then create tables like cart, recipes, saved, users using query tool.Use the given Queries.sql file to create tables. Import recipes data from recipes.csv file in database.

4. Create a .env file in the root directory and add the following:

```bash
DB_USER=postgres
DB_HOST=localhost
DB_NAME=Add your database name
DB_PASSWORD=Add your database passsword.
DB_PORT=5432
PORT=3000

```

5. Start the server 

```bash
npm start

```
6. Open your browser and navigate to http://localhost:3000 to view the application.
    
## Deployment

To deploy this project run

```bash
  https://iitisoc-2024-web4-recipe-recommendation.onrender.com
```

## API Reference

#### Save an item

```http
  POST /toggle_like
```

| Parameter | Description |
| :-------- | :------------------------- |
| `recipeId` | **Required**. Id of item to fetch |
| `isLiked`  | **Required**. Whether item is already liked or not |

#### POST recipe

```http
  POST /view_Recipe
```

| Parameter | Description                       |
| :-------- | :-------------------------------- |
| `id`      | **Required**. Id of item to fetch |
| `isShared`      | **Required**. By default its false, on sharing it becomes true |

#### POST Login details 

```http
  POST /login
```

| Parameter | Description                       |
| :-------- | :-------------------------------- |
| `email`      | **Required**. Fetches the email of the user.|
| `password`      | **Required**. Fetches the password of the user. |



