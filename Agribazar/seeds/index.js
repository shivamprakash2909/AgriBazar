const mysql = require("mysql2");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
dotenv.config();

const coordinates = require("./location.js");
const crop = require("./crop.js");
const cities2 = require("./indianCities");

const pool = mysql
  .createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
  })
  .promise();

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapboxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapboxToken });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const sql = `
INSERT INTO products (seller_id, product_name, description, quantity, quality, starting_price, reserve_price, status, created_at, image_url, lng, lat)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)
`;

// Function to get a random number between min and max
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

// Function to upload images to Cloudinary and return the URL
const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "AgiBazza/new",
    });
    return result.secure_url;
  } catch (err) {
    console.error("Error uploading to Cloudinary:", err);
    throw err;
  }
};

const seed = async () => {
  const imageDirectory = path.join(__dirname, "Agricultural-crops"); // Main directory containing subfolders with plant images
  const plantFolders = fs.readdirSync(imageDirectory);

  for (let i = 0; i < 450; i++) {
    // const geoData = await geocoder.forwardGeocode({
    //   query: loc,
    //   limit: 1
    // }).send();

    const Coordinates = [coordinates[i].longitude, coordinates[i].latitude];
    const startingPrice = getRandomArbitrary(1500, 6000);
    const reservePrice = getRandomArbitrary(1900, 6000);

    const plantFolder = plantFolders[i % plantFolders.length];
    const plantImages = fs.readdirSync(path.join(imageDirectory, plantFolder));
    const randomImage =
      plantImages[Math.floor(Math.random() * plantImages.length)];
    const imageUrl = await uploadImage(
      path.join(imageDirectory, plantFolder, randomImage)
    );

    const params = [
      73, // seller_id (change as needed)
      plantFolder, // product_name
      "Crops are plants cultivated by humans for various purposes, including food, feed, fiber, fuel, medicinal, and industrial uses. They play a vital role in sustaining human life and supporting global economies.", // description (change as needed)
      100, // quantity (change as needed)
      "medium", // quality (change as needed)
      startingPrice, // starting_price
      reservePrice, // reserve_price
      "active", // status (change as needed)
      imageUrl, // image_url
      Coordinates[0], // lng
      Coordinates[1], // lat
    ];

    console.log(params);
    await pool.query(sql, params);
    console.log("Record inserted successfully");
  }

  pool.end();
};

// Run the seed function
seed().catch((err) => {
  console.error("Error during seeding:", err);
});
const createTables = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
          user_id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          user_type ENUM('farmer', 'merchant' ,'consumer') NOT NULL,
          image_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
    `CREATE TABLE IF NOT EXISTS products (
          product_id INT AUTO_INCREMENT PRIMARY KEY,
          seller_id INT,
          product_name VARCHAR(255) NOT NULL,
          image_url VARCHAR(255),
          description TEXT,
          quantity INT,
          quality ENUM('low', 'medium', 'high'),
          starting_price DECIMAL(10, 2),
          reserve_price DECIMAL(10, 2),
          status ENUM('active', 'completed') DEFAULT 'active',
          lng DECIMAL(9, 6) NOT NULL,
          lat DECIMAL(8, 6) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE
      );`,
    `CREATE TABLE IF NOT EXISTS sold_products (
          sold_id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT,
          seller_id INT,
          buyer_id INT,
          sale_price DECIMAL(10, 2),
          sale_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
          FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
          FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE
      );`,

    `CREATE TABLE IF NOT EXISTS bids (
        bid_id INT AUTO_INCREMENT PRIMARY KEY,
        auction_id INT,
        bidder_id INT,
        bid_amount DECIMAL(10, 2),
        bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (auction_id) REFERENCES products(product_id) ON DELETE CASCADE,
        FOREIGN KEY (bidder_id) REFERENCES users(user_id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS machinery (
        machinery_id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT,
        image_url VARCHAR(255),
        machinery_name VARCHAR(255) NOT NULL,
        description TEXT,
        quantity INT,
        state ENUM('new', 'used'),
        price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS blogs (
        blog_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        image_url varchar(240),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS comments (
        comment_id INT AUTO_INCREMENT PRIMARY KEY,
        blog_id INT,
        user_id INT,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (blog_id) REFERENCES blogs(blog_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS cart (
        cart_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS cart_item (
        cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT,
        mach_id INT,
        quantity INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
        FOREIGN KEY (mach_id) REFERENCES machinery(machinery_id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS machinery_reviews (
        review_id INT AUTO_INCREMENT PRIMARY KEY,
        machinery_id INT,
        user_id INT,
        rating INT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (machinery_id) REFERENCES machinery(machinery_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS crops (
        crop_id INT AUTO_INCREMENT PRIMARY KEY,
        crop_name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
        payment_method VARCHAR(100),
        payment_status ENUM('pending', 'paid', 'failed'),
        shipping_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS sold_machinery (
        sold_machinery_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        machinery_id INT,
        seller_id INT,
        buyer_id INT,
        quantity INT DEFAULT 0,
        sale_price DECIMAL(10, 2),
        sale_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        FOREIGN KEY (machinery_id) REFERENCES machinery(machinery_id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE CASCADE
    );`,
  ];

  for (const query of queries) {
    try {
      await pool.query(query);
      console.log("Table created successfully.");
    } catch (err) {
      console.error("Error creating table:", err);
      throw err;
    }
  }
};

// createTables().catch((err) =>
//   console.error("Error initializing database:", err)
// );
// async function seeding() {
//   await pool.query(`INSERT INTO users (user_id, username, email, password, user_type)
//   VALUES (73, 'Seller73', 'seller73@example.com', 'hashedpassword', 'farmer');`);
// }
// seeding();
