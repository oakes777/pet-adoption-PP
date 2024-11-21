// Get the express package (this allows us to use Express framework)
const express = require('express');

// Get the mariadb package (this allows us to interact with MariaDB database)
const mariadb = require('mariadb');

// Instantiate an express (web) app (this creates an instance of the Express app that will handle HTTP requests)
const app = express();

// Create a connection pool to the MariaDB database
// The pool allows us to connect to the database efficiently (with multiple connections handled automatically)
const pool = mariadb.createPool({
    host: 'localhost',  // The database is hosted locally on your machine
    user: 'root',       // Your database username (change if necessary)
    password: 'sule',   // Your database password (change if necessary)
    database: 'pets'    // The name of the database we are connecting to
});

// Define a function to connect to the database
async function connect() {
    try {
        // Try to get a connection from the pool
        const conn = await pool.getConnection();
        console.log('Connected to the database'); // Log to the console that the connection was successful
        return conn; // Return the connection object to be used later
    } catch (err) {
        console.log('Error connecting to the database: ' + err); // If there is an error, log it to the console
    }
}

// Call the connect function to establish the initial database connection
connect();

// Define a constant for the port number the app will listen on (3000 is a common default port)
const PORT = 3000;

// Middleware that tells Express to parse incoming data (form submissions) into a usable format
// It tells the app how to interpret form data sent through POST requests
app.use(express.urlencoded({ extended: false }));

// Set the view engine to EJS (Embedded JavaScript) for templating
// This allows us to render dynamic HTML pages from templates (like 'home.ejs' or 'adoptions.ejs')
app.set('view engine', 'ejs');

// Define a "default" route for the home page (when users visit the root URL, like http://localhost:3000)
app.get('/', (req, res) => {
    console.log("Hello, world - server!"); // This logs a message to the console
    res.render('home'); // This renders the 'home.ejs' template (showing the home page)
});

// Define a route for "/adoptions" (this is where the user will go after confirming an adoption)
app.get('/adoptions', async (req, res) => {
    try {
        // Try to get a connection from the database
        const conn = await connect();
        
        // Query the database for all rows in the 'adoptions' table, ordering them by submission date (newest first)
        const results = await conn.query('SELECT * FROM adoptions ORDER BY data_submitted DESC');
        
        // Render the 'adoptions.ejs' template, passing in the results of the query as an 'adoptions' variable
        res.render('adoptions', { adoptions: results });
    } catch (err) {
        // If there's an error retrieving the data, log it and return a 500 error (internal server error)
        console.error("Error retrieving adoptions:", err);
        res.status(500).send("An error occurred while retrieving adoptions.");
    }
});

// Define a route for "/confirm" (this is where the user submits their adoption request)
app.post('/confirm', async (req, res) => {
    const data = req.body; // Get the form data submitted (like pet type, quantity, color)

    try {
        // Try to get a connection from the database
        const conn = await connect();

        // Insert the form data into the 'adoptions' table in the database
        await conn.query(
            `INSERT INTO adoptions (pet_type, quantity, color) 
            VALUES ('${data.pet_type}', '${data.quantity}', '${data.color}')`
        );

        console.log("Data inserted: ", data); // Log the data that was inserted

        // Redirect the user to the "/adoptions" route to show the updated adoptions list
        res.redirect('/adoptions');
    } catch (err) {
        // If there's an error inserting data into the database, log the error and return a 500 error
        console.error("Error inserting data:", err);
        res.status(500).send("An error occurred while processing your request.");
    }
});

// Define a route for "/submit" (this is for testing or to render adoptions with form data)
app.post('/submit', (req, res) => {
    const data = req.body; // Get the submitted form data
    res.render('adoptions', {data : data}); // Render the 'adoptions.ejs' template, passing the data as an object
});

// Start the app and listen for incoming requests on the specified port (3000 in this case)
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`); // Log a message when the server starts
});
