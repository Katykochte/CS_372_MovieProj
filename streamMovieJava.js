// Katy Kochte, Cleary Bettisworth, Sabian Cavazos
// CS 372 Movie Streaming Site (JavaScript)

// Top tab control
function openTab() {
    document.getElementById("loginPage").style.display = "block";
    document.getElementById("galleryPage").style.display = "none"
}

///////////////////////////////////
// Login Functions
///////////////////////////////////

// Check Password for right chars
function validatePassword(enteredPassword, enteredUser) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/; 

    if (!passwordRegex.test(enteredPassword)) {
        alert("Password must be 8 characters long and include at least one uppercase, lowercase, number, and special character.");
        return false;
    }
    if (enteredPassword == enteredUser) {
        alert("Password and Username cannot be the same.")
        return false;
    }
    if (!enteredPassword || !enteredUser) {
        alert("Please enter both user and password.");
        return false;
    }
    return true;
}

// Check Username for right requirements
function validateUsername(user) {
    const passwordRegex = /^[a-zA-Z]+@[a-zA-Z]+\.com$/; // chars + @ + chars + .com
    
    if (!passwordRegex.test(user)) {
        alert("User must be a valid email with @ and .com");
        return false;
    }
    return true;
}

// Submit User and Password
async function submitForm(event) {
    event.preventDefault(); 

    const enteredUser = document.getElementById("enteredUser").value;
    const enteredPassword = document.getElementById("enteredPassword").value;

    if (!validatePassword(enteredPassword, enteredUser) || !validateUsername(enteredUser)) {
        return; 
    }

    try {
        const response = await fetch("http://localhost:6543/checkLogin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enteredUser, enteredPassword })
        });

        const result = await response.json();

        if (result.status === "newUser" || result.status === "goodLogin") {
            alert(result.message);
            document.getElementById("loginPage").style.display = "none";
            document.getElementById("galleryPage").style.display = "block";
        } else if (result.status === "badLogin" || result.status == "userDeleted") {
            alert(result.message);
        } else {
            console.error("Unknown status:", result.status);
        }

        // Clear the input fields
        document.getElementById("enteredUser").value = "";
        document.getElementById("enteredPassword").value = "";
    } catch (error) {
        alert("Error submitting form");
    }
}

///////////////////////////////////
// Password Reset Functions
///////////////////////////////////

// Shows the password reset form when pressed
document.getElementById("forgotPasswordButton").addEventListener("click", function(){
    document.getElementById("resetPasswordForm").style.display = "block";
});

// Text entry box for email
document.getElementById("resetPasswordForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;

    const response = await fetch("/requestPasswordReset", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email})
    });

    const data = await response.json();
    alert(data.message);
    
});