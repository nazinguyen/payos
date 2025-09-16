const mongoose = require('mongoose');
const { Schema } = mongoose;

const billSchema = new Schema({
    orderCode: { type: Number, required: true },
    link: {type: String, required: true}
});

// Create a model using the schema
const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill;
