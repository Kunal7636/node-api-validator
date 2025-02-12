var express = require('express');
const cluster = require('cluster');
const os = require('os');
var app = express();
app.use(express.json());
const logger = require('./logger'); 
const Joi = require('joi');

let processedRequests = [];

// Define the schema for card validation
const cardSchema = Joi.object({
    letter: Joi.string().length(1).pattern(/^[A-Z]$/).required(), 
    number: Joi.number().integer().min(0).max(9).required()
});

function normalizeCard(card) {
    if (!card) { 
        return null;
    }
    if (Array.isArray(card)) {
        return { letter: card[0], number: parseInt(card[1]) };
    } else if (typeof card === "string") {
        let parts = card.split(",").map(part => part.trim());
        return { letter: parts[0], number: parseInt(parts[1]) };
    } else if (typeof card == "object" && card.letter && card.number !== undefined) {
        return { letter: card.letter, number: parseInt(card.number) };
    }
    return null;
}

let requestLock = false;

app.post('/validate-cards', async (req, res) => {
    try {
        while (requestLock) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        requestLock = true;

        let rawData = req.body;
        logger.info(`Received API request for /validate-cards. Payload: ${JSON.stringify(rawData)}`);
        if (!rawData || !Array.isArray(rawData)) {
            logger.warn("Invalid input received.");
            return res.status(400).json({ error: "Invalid input. Expected an array of cards." });
        }

        let validationErrors = [];
        let invalidCards = [];
        let normalizeDeck = [];

        rawData.forEach(card => {
            let normalizedCard = normalizeCard(card);

            if (!normalizedCard) {
                validationErrors.push("Invalid card format.")
                logger.warn(`Invalid card format: ${JSON.stringify(card)}`);
                invalidCards.push(card); // Track invalid format
                return;
            }

            const { error } = cardSchema.validate(normalizedCard);
            if (error) {
                validationErrors.push(error.details[0].message);
                logger.warn(`Validation failed: ${error.details[0].message} for card ${JSON.stringify(normalizedCard)}`);
                invalidCards.push(normalizedCard); // Track validation failures
                return;
            }

            if (normalizedCard.letter === "D" && normalizedCard.number !== 3) {
                validationErrors.push(`Card with letter "D" must have number 3, but found ${normalizedCard.number}.`);
                logger.warn(`Validation rule failed: D must be paired with 3. Found: ${JSON.stringify(normalizedCard)}`);
                invalidCards.push(normalizedCard);
                return;
            }

            normalizeDeck.push(normalizedCard); // Only add fully valid cards
        });

        // Store scan history (valid + invalid cards)
        processedRequests.push({
            timestamp: new Date().toISOString(),
            raw_data: rawData,         // Original input
            valid_cards: normalizeDeck, // Cards that passed validation
            invalid_cards: invalidCards, // Invalid cards with errors
            validation_errors: validationErrors // List of error messages
        });
        const statusCode = invalidCards.length > 0 ? 207 : 200; // 207 Multi-Status for partial errors
        logger.info(`Sending response with status ${statusCode}. Valid: ${normalizeDeck.length}, Invalid: ${invalidCards.length}`);

        // Final API Response (Returning all results together)
        return res.status(statusCode).json({
            valid: invalidCards.length === 0, // If there are valid cards, true; otherwise, false
            discard_count: invalidCards.length,
            invalid_cards: invalidCards
        });

    } catch (error) {
        logger.error(`Error processing request: ${error.message}`);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        requestLock = false;
    }
});

// GET API to fetch processed request history
app.get('/history', (req, res) => {
    res.json({ history: processedRequests });
});

var server = app.listen(3000, () => {
    logger.info('server listening on port', server.address().port);
});
