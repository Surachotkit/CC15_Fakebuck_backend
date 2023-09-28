const { rateLimit } = require('express-rate-limit')

module.exports = rateLimit({
    windowMs: 1 * 60 * 1000, //min sec millisecond 
    limit: 100,
    message: { message: 'Too many requests from this IP'}
})


