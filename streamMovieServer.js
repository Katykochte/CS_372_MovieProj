// Katy Kochte
// CS 372 Movie Streaming Site (Server)

const { MongoClient } = require("mongodb");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve static files from current directory

const port = 6543;
const uri = "mongodb://localhost:27017"; // MongoDB URI
const client = new MongoClient(uri);

// Set up multer to handle form data
const upload = multer(); // Create a multer instance to handle form submissions

// Connect to MongoDB when the server starts
async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB Connection Error:", error);
    }
}
connectDB();

// Serve HTML page on "/"
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "streamMovieWeb.html"));
});

// Handle the form submission using POST
app.post("/submit", upload.none(), async (req, res) => {
    const { EnteredUser, EnteredPassword } = req.body; // Get values from form

    if (!EnteredUser || !EnteredPassword) {
        return res.status(400).send("Both user and password are required.");
    }

    try {
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieCollection");
        const result = await collection.insertOne({ EnteredUser, EnteredPassword }); // Insert both values

        console.log(`Document inserted with _id: ${result.insertedId}`);
        res.send(`Added: ${EnteredUser} with password: ${EnteredPassword}`);
    } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).send("Error saving data.");
    }
});

// New route for fetching and displaying all records from MongoDB
app.get("/display", async (req, res) => {
    try {
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieCollection");
        const records = await collection.find({}).toArray(); // Fetch all records

        res.json(records); // Send JSON response
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Error fetching records." });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
