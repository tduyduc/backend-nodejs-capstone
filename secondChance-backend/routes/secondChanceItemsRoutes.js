const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

const dbCollection = String(process.env.MONGO_COLLECTION);

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection(dbCollection);
        const secondChanceItems = await collection.find({}).toArray();
        res.json(secondChanceItems);
    } catch (e) {
        logger.error('oops something went wrong', e)
        next(e);
    }
});

// Add a new item
router.post('/', multer({ storage: storage }).single('file'), async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection(dbCollection);

        const newItem = req.body;
        const insertResult = await collection.insertOne(newItem);

        if (insertResult.acknowledged) {
            const newItemId = insertResult.insertedId;
            logger.info(`New item added with ID: ${newItemId}`);
            
            const secondChanceItem = await collection.findOne({ _id: newItemId });
            res.status(201).json(secondChanceItem);
        } else {
            res.status(500).json({ error: 'Failed to add new item' });
        }
    } catch (e) {
        logger.error('oops something went wrong', e)
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection(dbCollection);

        const { id } = req.params;
        const item = await collection.findOne({ id });

        if (item) {
            res.json(item);
        } else {
            res.status(404).json({
                "error": `No items with ID "${id}"`,
            });
        }
    } catch (e) {
        logger.error('oops something went wrong', e)
        next(e);
    }
});

// Update and existing item
router.put('/:id', async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection(dbCollection);

        const { id } = req.params;
        const updateData = req.body;

        const updatedItem = await collection.findOneAndUpdate({ id }, { $set: updateData });

        if (updatedItem) {
            res.json(updatedItem);
        } else {
            res.status(404).json({
                "error": `No items with ID "${id}"`,
            });
        }
    } catch (e) {
        logger.error('oops something went wrong', e)
        next(e);
    }
});

// Delete an existing item
router.delete('/:id', async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection(dbCollection);

        const { id } = req.params;

        const deleteResult = await collection.deleteOne({ id });
        if (deleteResult.deletedCount > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({
                "error": `No items with ID "${id}"`,
            });
        }
    } catch (e) {
        logger.error('oops something went wrong', e)
        next(e);
    }
});

module.exports = router;
