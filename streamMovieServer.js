// Katy Kochte, Cleary Bettisworth, Sabian Cavazos
// CS 372 Movie Streaming Site (Server)
// Holds all ther server side functions

const { MongoClient } = require("mongodb");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); 

const port = 6543;
const uri = "mongodb://localhost:27017"; // MongoDB URI
const client = new MongoClient(uri);

// Set up multer to handle form data
const upload = multer(); 

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

app.use(express.json());

///////////////////////////////////
// Login Functions
///////////////////////////////////

// Handle failed login attempts by keeping track of consecutive
// login attempts, if number of attempts at 3, delete account
async function handleFailedLogin(collection, user) {
    // Find the user in the database
    const existUser = await collection.findOne({ user });

    // Increment failedAttempts on failed login
    const newTrys = (existUser.failedAttempts || 0) + 1;

    if (newTrys >= 3) {
        // Delete the user after 3 consecutive failed attempts
        await collection.deleteOne({ user });
        return { 
            status: "userDeleted", 
            message: `User ${existUser.user} deleted due to 3 failed logins.` };
    } else {
        // Update failedAttempts in the database
        await collection.updateOne(
            { user },
            { $set: { failedAttempts: newTrys } }
        );
        return { 
            status: "badLogin", 
            message: `${existUser.user} failed login. Attempts: ${newTrys}` };
    }
}

// Check if current login information matches any on record
// If found a match, compare passwords for successful or 
// unsuccessful login, if not found match create 
// a new database entry with the information
app.post("/checkLogin", upload.none(), async (req, res) => {
    const { user, password } = req.body; // Get values from form

    try {
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieCollection");

        // Check if the user already exists
        const existUser = await collection.findOne({ user });

        // User does not exist, add new user
        if (!existUser) {
            // User does not exist, add new user

            // Generate salt to hash their password with
            const salt = generateSalt();
            // Hash the password
            const hashedPassword = hashPassword(password, salt);
            // Store the salt w/ the password so that it can be rehashed at login
            const result = await collection.insertOne({ user, 
                password: hashedPassword, salt, failedAttempts: 0 });

            console.log(`New user added with _id: ${result.insertedId}`);
            return res.json({ status: "newUser", message: `Added: ${user}` });
        } else {
            // Hash password w/ the salt associated w/ account to confirm right
            const hashedPassword = hashPassword(password, existUser.salt);
            // User exists, check password
            if (hashedPassword === existUser.password) {
                // Reset failedAttempts to 0 on successful login
                await collection.updateOne(
                    { user }, { $set: { failedAttempts: 0 } }
                );
                return res.json({ status: "goodLogin", message: `Hi ${user}!` });
            } else {
                // Handle failed login
                const result = await handleFailedLogin(collection, user);
                return res.json(result);
            }
        }
    } catch (error) {
        console.error("Error checking login:", error);
    }
});

// Password hashing function
function hashPassword(password, salt) {
    const hash = crypto.createHash("sha256");
    hash.update(password + salt);
    return hash.digest("hex");
}

// Function to generate random salt for hashing
function generateSalt () {
    return crypto.randomBytes(16).toString("hex");
}

///////////////////////////////////
// Password Reset Functions
///////////////////////////////////

// Nodemailer and Password Reset functions
// This just sets up the email system defaults
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "CinemaStreamingCorner@gmail.com",
        pass: "tjtv ipxx hwgh faae"
    }
});

// Actual email sending function
app.post("/requestPwReset", async (req, res) => {
    const {email} = req.body;

    try {
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieCollection");
        //Check if they have an account
        const user = await collection.findOne({ user: email});
        if (!user) {
            return res.json({ status: "error", message: "User not found"});
        }
        // Send email
        await transporter.sendMail({
            from: "CinemaStreamingCorner@gmail.com",
            to: email,
            subject: "Password Reset Request",
            text: "Click this link to reset your password : LINK"
        });

        res.json({status: "good", message: "Password reset email sent"});

    } catch (error) {
        console.error("Error sending email", error);
        res.status(500).json({error: "Error processing request."});
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});