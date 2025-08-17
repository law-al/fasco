require('dotenv').config({
  path: require('path').join(__dirname, '../config.env'),
});
const mongoose = require('mongoose');
const fs = require('fs');
const productData = JSON.parse(
  fs.readFileSync('./data/products.json', 'utf-8')
);
const Product = require('../models/productModel');

const deleteCollectionData = async function () {
  try {
    await Product.deleteMany();
    console.log(`Data deleted successfully`);
  } catch (error) {
    console.log(error.message);
  }
};

const addCollectionData = async function () {
  try {
    console.log('add');
    await Product.insertMany(productData);
    console.log(`Data added successfully`);
  } catch (error) {
    console.log(error.message);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('DB connected');
  } catch (error) {
    console.log(error.message);
  }
};

const main = async () => {
  try {
    await connectDB();

    if (process.argv[2] === 'delete') {
      await deleteCollectionData();
    } else if (process.argv[2] === 'add') {
      await addCollectionData();
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

main();
