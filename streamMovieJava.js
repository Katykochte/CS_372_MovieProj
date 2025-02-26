// Katy Kochte
// CS 372 Movie Streaming Site (JavaScript)

// Top tab control
function openTab(evt, tabName) {
    let i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Check Password for right chars
function validatePassword(enteredPassword, enteredUser) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8}$/; 

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