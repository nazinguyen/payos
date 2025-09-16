const mongoose = require('mongoose');
const { Schema } = mongoose;

const billSchema = new Schema({
    orderCode: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
        default: 'PENDING'
    },
    paymentMethod: {
        type: String,
        enum: ['VNPAY', 'PAYPAL'],
        required: true
    },
    paymentDetails: { type: Schema.Types.Mixed },
    orderInfo: { type: String },
    createDate: { type: Date, default: Date.now },
    items: [{
        productId: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        name: { type: String, required: true }
    }],
    customer: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        address: { type: String }
    }
}, {
    timestamps: true
});

// Create a model using the schema
const Bill = mongoose.model('Bill', billSchema);

module.exports = Bill;
