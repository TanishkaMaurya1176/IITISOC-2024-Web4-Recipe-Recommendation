CREATE TABLE recipes (
  id NOT NULL PRIMARY KEY INTEGER,
  title TEXT,
  cuisine VARCHAR(100),
  tags TEXT,
  ingredients TEXT[],
  instructions TEXT[]
);

CREATE TABLE saved (
    id SERIAL NOT NULL PRIMARY KEY,
    recipe_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE cart (
    id SERIAL NOT NULL PRIMARY KEY,
    recipe_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE users (
    id SERIAL NOT NULL PRIMARY KEY,
    email NOT NUll VARCHAR(100),
    password VARCHAR(100),
);


