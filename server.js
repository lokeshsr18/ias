const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());

// Store IP activity and attackers
const ipActivity = {};
const attackers = [];

// Endpoint to receive messages
app.post('/send-message', (req, res) => {
    const ipAddress = req.ip; // Get the IP address of the sender
    const timestamp = Date.now(); // Get the current timestamp
    const message = req.body.message;

    // Check if the IP is in the attackers list
    if (attackers.includes(ipAddress)) {
        return res.status(403).send('Message from attacker blocked');
    }

    // Initialize or update the IP activity
    if (!ipActivity[ipAddress]) {
        ipActivity[ipAddress] = [];
    }

    // Remove entries older than 10 seconds
    ipActivity[ipAddress] = ipActivity[ipAddress].filter(time => timestamp - time <= 10000);

    // Add the current timestamp to the IP's activity log
    ipActivity[ipAddress].push(timestamp);

    // Check if the IP has sent more than 10 messages in the last 10 seconds
    if (ipActivity[ipAddress].length > 10) {
        attackers.push(ipAddress); // Block the IP
        const attackersFilePath = path.join(__dirname, 'attackers.txt');

        // Log the blocked IP
        fs.appendFile(attackersFilePath, `${new Date().toISOString()} - ${ipAddress} blocked for DDoS attempt\n`, (err) => {
            if (err) {
                console.error('Failed to log attacker:', err);
            }
        });
        
        return res.status(403).send('Message from attacker blocked');
    }

    // Log the message if not blocked
    const logEntry = `${new Date().toISOString()} - ${ipAddress} - ${message}\n`;
    const filePath = path.join(__dirname, 'messages.txt');

    // Append the message to the file
    fs.appendFile(filePath, logEntry, (err) => {
        if (err) {
            console.error('Failed to write message to file:', err);
            return res.status(500).send('Internal Server Error');
        }
        console.log('Message stored successfully');
        res.status(200).send('Message received and stored');
    });
});

// Start the server
app.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on http://localhost:3000');
});
