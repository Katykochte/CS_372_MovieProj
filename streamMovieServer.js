// Katy Kochte, Cleary Bettisworth, Sabian Cavazos
// CS 372 Movie Streaming Site (Server)

const { MongoClient } = require("mongodb");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

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

app.use(express.json());

// Handle failed login attempts by keeping track of consecutive
// login attempts, if number of attempts at 3, delete account
async function handleFailedLogin(collection, enteredUser) {
    // Find the user in the database
    const existingUser = await collection.findOne({ enteredUser });

    // Increment failedAttempts on failed login
    const updatedAttempts = (existingUser.failedAttempts || 0) + 1;

    if (updatedAttempts >= 3) {
        // Delete the user after 3 consecutive failed attempts
        await collection.deleteOne({ enteredUser });
        return { 
            status: "userDeleted", 
            message: `User ${existingUser.enteredUser} deleted due to 3 consecutive failed login attempts.` };
    } else {
        // Update failedAttempts in the database
        await collection.updateOne(
            { enteredUser },
            { $set: { failedAttempts: updatedAttempts } }
        );
        return { 
            status: "badLogin", 
            message: `${existingUser.enteredUser} failed login. Consecutive attempts: ${updatedAttempts}` };
    }
}

// Check if current login information matches any on record
// If found a match, compare passwords for successful or unsuccessful login
// If not found match create a new database entry with the information
app.post("/checkLogin", upload.none(), async (req, res) => {
    const { enteredUser, enteredPassword } = req.body; // Get values from form

    try {
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieCollection");

        // Check if the user already exists
        const existingUser = await collection.findOne({ enteredUser });

        if (!existingUser) {
            // User does not exist, add new user

            //Generate salt to hash their password with
            const salt = generateSalt();
            // Hash the password
            const hashedPassword = hashPassword(enteredPassword, salt);
            //Store the salt alongside the password so that it can be rehashed at login time
            const result = await collection.insertOne({ enteredUser, enteredPassword: hashedPassword, salt, failedAttempts: 0 });

            console.log(`New user added with _id: ${result.insertedId}`);
            return res.json({ status: "newUser", message: `Added new user: ${enteredUser}` });
        } else {
            //Hash their entered password with the salt associated with their account to confirm its correct
            const hashedPassword = hashPassword(enteredPassword, existingUser.salt);
            // User exists, check password
            if (hashedPassword === existingUser.enteredPassword) {
                // Reset failedAttempts to 0 on successful login
                await collection.updateOne(
                    { enteredUser },
                    { $set: { failedAttempts: 0 } }
                );
                return res.json({ status: "goodLogin", message: `Welcome back ${enteredUser}!` });
            } else {
                // Handle failed login
                const result = await handleFailedLogin(collection, enteredUser);
                return res.json(result);
            }
        }
    } catch (error) {
        console.error("Error checking login:", error);
        res.status(500).json({ error: "Error checking login." });
    }
});

//Password hashing function
function hashPassword(password, salt) {
    const hash = crypto.createHash("sha256");
    hash.update(password + salt);
    return hash.digest("hex");
}

//Function to generate random salt for hashing
function generateSalt () {
    return crypto.randomBytes(16).toString("hex");
}

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
app.post("/requestPasswordReset", async (req, res) => {
    const {email} = req.body;

    try {
        const database = client.db("streamMovieDb");
        const collection = database.collection("streamMovieCollection");
        //Check if they have an account
        const user = await collection.findOne({ enteredUser: email});
        if (!user) {
            return res.json({ status: "error", message: "User not found"});
        }
        //Send email
        await transporter.sendMail({
            from: "CinemaStreamingCorner@gmail.com",
            to: email,
            subject: "Password Reset Request",
            text: "Click this link to reset your password : LINK"
        });

        res.json({status: "success", message: "Password reset email will be sent"});

    } catch (error) {
        console.error("Error sending email", error);
        res.status(500).json({error: "Error processing request."});
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});