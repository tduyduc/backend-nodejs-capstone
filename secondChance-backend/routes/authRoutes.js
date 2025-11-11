const bcryptjs = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    try {
        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
        const db = await connectToDatabase();

        // Task 2: Access MongoDB `users` collection
        const collection = db.collection('users');

        // Task 3: Check if user credentials already exists in the database and throw an error if they do
        const { email, firstName, lastName, password } = req.body;

        const isExistingEmail = (await collection.countDocuments({ email })) > 0;
        if (isExistingEmail) {
            return res.status(409).json({ error: 'Email already exists!' });
        }

        // Task 4: Create a hash to encrypt the password so that it is not readable in the database
        const salt = await bcryptjs.genSalt();
        const passwordHash = await bcryptjs.hash(password, salt);

        // Task 5: Insert the user into the database
        const newUser = await collection.insertOne({
            email,
            firstName,
            lastName,
            passwordHash,
            createdAt: new Date(),
        });

        // Task 6: Create JWT authentication if passwords match with user._id as payload
        const authtoken = jwt.sign(
            {
                user: {
                    id: newUser.insertedId,
                },
            },
            JWT_SECRET,
        );

        // Task 7: Log the successful registration using the logger
        logger.info(`Registration successful for email: ${email}`);

        // Task 8: Return the user email and the token as a JSON
        res.status(201).json({
          authtoken,
          email,
        });
    } catch (e) {
        return res.status(500).send('Internal server error');
    }
});

module.exports = router;
