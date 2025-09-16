const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting middleware
const rateLimiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000, // Default: 15 minutes
    max: process.env.RATE_LIMIT_MAX, // Default: 100 requests per windowMs
    message: 'Too many requests, please try again later'
});

// Security middleware setup
const securityMiddleware = [
    helmet(), // Adds various HTTP headers for security
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://www.paypal.com', 'https://www.sandbox.paypal.com'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://api.sandbox.paypal.com', 'https://api.paypal.com'],
            frameSrc: ["'self'", 'https://www.sandbox.paypal.com', 'https://www.paypal.com']
        }
    })
];

module.exports = {
    rateLimiter,
    securityMiddleware
};