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


// Display records from MongoDB
async function displayRecords() {
    try {
        const response = await fetch('http://localhost:6543/display');
        const records = await response.json(); // Parse response as JSON

        if (records.length === 0) {
            document.getElementById('p_displayQuery').innerText = "No records found.";
            return;
        }

        let content = "<h2>All Records:</h2>";

        records.forEach(record => {
            content += "<div style='padding: 2px; margin: 2px;'>";
            Object.entries(record).forEach(([key, value]) => {
                content += `<p><strong>${key}:</strong> ${value}</p>`;
            });
            content += "</div>";
        });

        document.getElementById("p_displayQuery").innerHTML = content;
    } catch (error) {
        console.error("Error fetching records:", error);
        alert("Error fetching records.");
    }
}

// Check Password for right chars
function validatePassword(password, user) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8}$/; 

    if (!passwordRegex.test(password)) {
        alert("Password must be 8 characters long and include at least one uppercase, lowercase, number, and special character.");
        return false;
    }
    if (password == user) {
        alert("Password and Username cannot be the same.")
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
    event.preventDefault(); // Prevent default form submission

    const EnteredUser = document.getElementById("EnteredUser").value;
    const EnteredPassword = document.getElementById("EnteredPassword").value;

    if (!EnteredUser || !EnteredPassword) {
        alert("Please enter both user and password.");
        return;
    }

    if (!validatePassword(EnteredPassword, EnteredUser)) {
        return; 
    }

    if (!validateUsername(EnteredUser)) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('EnteredUser', EnteredUser);
        formData.append('EnteredPassword', EnteredPassword);

        const response = await fetch('http://localhost:6543/submit', {
            method: 'POST',
            body: formData
        });

        const result = await response.text();
        alert(result); // Show success message from the server

        // Clear the input fields
        document.getElementById("EnteredUser").value = '';
        document.getElementById("EnteredPassword").value = '';
    } catch (error) {
        console.error("Error submitting form:", error);
        alert("Error submitting form");
    }
}
