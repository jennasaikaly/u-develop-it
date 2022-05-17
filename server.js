const express = require('express');
const mysql = require('mysql2');
const inputCheck = require('./utils/inputCheck');
const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const db = mysql.createConnection(
    {
        host: 'localhost',
        // Your MySQL username,
        user: 'root',
        // Your MySQL password
        password: 'Suff3r!t0ut',
        database: 'election'
    },
    console.log('Connected to the election database.')
);

//SQL query to request a list of all potential candidates

//we are wrapping the get() method around the database call
//the route is designated with /api/candidates; this is an API endpoint
//the callback function will handle the client's request and database response (req, res)
app.get('/api/candidates', (req, res) => {
    // the SQL statement `SELECT * FROM candidates`is assigned to the SQL variable
    const sql = `SELECT candidates.*, parties.name 
             AS party_name 
             FROM candidates 
             LEFT JOIN parties 
             ON candidates.party_id = parties.id`;

    db.query(sql, (err, rows) => {
        //error-handling conditional
        if (err) {
            //instead of logging the error, we'll send a status code of 500 and place the
            //error message of 500 and place the error message within a JSON Object.
            //500 is a server error
            res.status(500).json({ error: err.message });
            return; //exit the database once an error is encountered
        }
        //if no error, err is nul and the result(rows) will be sent as a JSON object to the browser 
        //using 'res' in the express.js route callback
        res.json({
            message: 'success',
            data: rows
        });
    });
});

//SQL Query to request a single candidate's information
// GET a single candidate

app.get('/api/candidate/:id', (req, res) => {
    // the SQL statement `SELECT * FROM candidates`is assigned to the sql variable
    const sql = `SELECT candidates.*, parties.name 
             AS party_name 
             FROM candidates 
             LEFT JOIN parties 
             ON candidates.party_id = parties.id 
             WHERE candidates.id = ?`;
    //assign the captured value populated in the req.params object with the key id to the variable 'params'
    //because params can be accepted in the database call as an array, params is assigned as an array with a 
    //single element, 'req.params.id'
    const params = [req.params.id];


    db.query(sql, params, (err, row) => {
        if (err) {
            //instead of logging the error, we'll send a status code of 400 and place the
            //error message in a json object .  request wasn't accepted, try a different request
            res.status(400).json({ error: err.message });
            return;
        }
        //in the route response, send the row back to the client in a JSON object
        res.json({
            message: 'success',
            data: row
        });
    });
});

//SQL Query to delete a candidate
// Delete a candidate
//the endpoint used here also includes a route parameter to uniquely identify the candidate to remove
app.delete('/api/candidate/:id', (req, res) => {
    //using a prepared SQL statement with a placeholder (?)
    const sql = `DELETE FROM candidates WHERE id = ?`;
    //same as last route
    const params = [req.params.id];

    db.query(sql, params, (err, result) => {
        if (err) {
            res.statusMessage(400).json({ error: res.message });
            //this statement handles if the user tries to delete a candidate that doesn't exist
            // i.e. if there are no 'affectedRows'
        } else if (!result.affectedRows) {
            res.json({
                message: 'Candidate not found'
            });
        } else {
            res.json({
                message: 'deleted',
                changes: result.affectedRows, //this will verify id any rows were changed
                id: req.params.id
            });
        }
    });
});

//SQL  Query to create a candidate
//use HTTP request method post() to insert a candidate into the candidates table
//the endpoint is /api/candidate
//In the callback function, we'll use the object req.body to populate the candidate's data. 
//Notice that we're using object destructuring to pull the body property out of the request object. 
//Until now, we've been passing the entire request object to the routes in the req parameter.
app.post('/api/candidate', ({ body }, res) => {
    //In the callback function block, we assign errors to receive the return from the inputCheck function.
    //This inputCheck module was provided by a helpful U Develop It member. We'll use this module to 
    //verify that user info in the request can create a candidate.
    const errors = inputCheck(body, 'first_name', 'last_name', 'industry_connected');
    //validate: if inputCheck() function returns an error, an error message
    //is returned to the client as a 400 status code, to prompt for a different user 
    //request with a JSON object that contains the reasons for the rrors
    if (errors) {
        res.status(400).json({ error: errors });
        return;
    }
//this prepared statement is different from previous statements because there is no column for the id
    const sql = `INSERT INTO candidates (first_name, last_name, industry_connected)
  VALUES (?,?,?)`;
  //params assignment contains 3 elements in its area that contains the user data collected in req.body
    const params = [body.first_name, body.last_name, body.industry_connected];
//database call logic is the same as previous calls
    db.query(sql, params, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: body
        });
    });
});




// // Create a candidate
// const sql = `INSERT INTO candidates (id, first_name, last_name, industry_connected) 
//               VALUES (?,?,?,?)`;
// const params = [1, 'Ronald', 'Firbank', 1];

// db.query(sql, params, (err, result) => {
//   if (err) {
//     console.log(err);
//   }
//   console.log(result);
// });

//API ROUTE FOR ALL PARTIES
app.get('/api/parties', (req, res) => {
    const sql = `SELECT * FROM parties`;
    db.query(sql, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        message: 'success',
        data: rows
      });
    });
  });

//API ROUTE FOR A SINGLE PARTY
  app.get('/api/party/:id', (req, res) => {
    const sql = `SELECT * FROM parties WHERE id = ?`;
    const params = [req.params.id];
    db.query(sql, params, (err, row) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({
        message: 'success',
        data: row
      });
    });
  });


  //DELETE ROUTE FOR SPECIFIC PARTY
  app.delete('/api/party/:id', (req, res) => {
    const sql = `DELETE FROM parties WHERE id = ?`;
    const params = [req.params.id];
    db.query(sql, params, (err, result) => {
      if (err) {
        res.status(400).json({ error: res.message });
        // checks if anything was deleted
      } else if (!result.affectedRows) {
        res.json({
          message: 'Party not found'
        });
      } else {
        res.json({
          message: 'deleted',
          changes: result.affectedRows,
          id: req.params.id
        });
      }
    });
  });

  
//catchall route
// Default response for any other request (Not Found)
app.use((req, res) => {
    res.status(404).end();
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});