const mongoose = require('mongoose');

// Define a schema for the product data
const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
    // You can add more properties here as needed
});

// Create a model based on the schema
const Product = mongoose.model('Product', productSchema);
const newData = {
    productId: '123',
    productName: 'Bí mật của may mắn',
    amount: 10000,
};

// Options for findOneAndUpdate method
const options = { upsert: true, new: true };

// Find and update the document, or insert a new document if not found
Product.findOneAndUpdate({ productId: '123' }, newData, options)
    .then(product => {
        console.log('Product created or updated:', product);
    })
    .catch(error => {
        console.error('Error creating or updating product:', error);
    });

module.exports = Product;
