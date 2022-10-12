const express = require("express");
var cors = require('cors');
const queryString = require('query-string');
const { query } = require("express");
const app = express();
var helpers = require('./helpers');
const mysql = require('promise-mysql');

///https://cloud.google.com/sql/docs/mysql/connect-run

const config = process.env["DEV"] == "1" ? 
{
    user: 'user',
    password: 'password',
    database: 'homestay'
} : 
//google
{
    user: 'user', // e.g. 'my-db-user'
    password: 'heartKilo845', // e.g. 'my-db-password'
    database: 'homestay', // e.g. 'my-database'
    socketPath: '/cloudsql/xenon-monitor-193415:us-central1:homestay-demo', // e.g. '/cloudsql/project:region:instance'
};

//const con = await mysql.createPool(config);

//necessary to parse posts requests from angular
app.use(cors());
app.use(express.urlencoded({extended:false}));
app.use(express.json());

  //get pool
let con
try {
(async () => {
    con = await mysql.createPool(config)
})()
} catch(err) {
    console.log(err)
}

app.get('/', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});

const port = parseInt(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

//deletes user
app.delete('/user/:id',(req,res) => {
    console.log(req.body);

    if (req.params.id) {
        
        con.query(`DELETE FROM users WHERE id=?`,
            [req.params.id])
        .then(
            con.query(`DELETE FROM homes WHERE userId=?`,
            [req.params.id])
        )
        .then(data => {
            console.log(data);
            res.status(200).json("OK")}
            );

    }
})

//changes password
app.post('/user/:id/changePassword',(req,res) => {
    console.log(req.body);
    if (req.body.email && req.body.password && req.body.newPassword) {
        
        con.query(`SELECT * FROM users WHERE email=? AND password=?`,
            [req.body.email, req.body.password])
        .then(result => {
            con.query(`UPDATE users SET password=? WHERE id=? AND email=? AND password=?`,
            [req.body.newPassword, req.params.id, req.body.email, req.body.password])
        }
        )
        .then(data => {
            console.log(data);
            req.body.password = req.body.newPassword;
            delete req.body.newPassword;
            res.status(200).json(req.body)}
            )
        .catch(error => {
            res.status(400).json("user or password not found")
        })
    }
    else {
        res.status(400).json("incomplete query");
    }
})


//adds new user
app.post('/register',(req,res) => {
    console.log(req.body);

    if (req.body.email && req.body.password) {
        
        con.query(`INSERT INTO users (email,password) VALUES(?,?)`,
            [req.body.email, req.body.password])
        .then(data => { 
            if (data && (data["warningStatus"] === 0 || data["warningCount"] === 0)) {
                let user = {...req.body};
                user["id"] = data["insertId"];
                res.status(200).json(user);
            } 
            else {
                res.status(401).json(null);
            }
        } )
        .catch(error => res.status(401).json(error));
    }
})

//checks email/password and returns user 
app.post('/authenticate',(req,res) => {
    console.log(req.body);

    if (req.body.email && req.body.password) {
        
        con.query(`SELECT * FROM users WHERE email=? AND password=?`,
            [req.body.email, req.body.password])
        .then(rows => { 
            if (rows.length > 0) res.status(200).json(rows[0]); 
            else {
                res.status(401).send();
            }
        } );
    }
})


//returns homes of user with given id 
app.get('/user/:id/homes',(req,res) => {

    if (req.params.id) {
        con.query(`SELECT * FROM homes WHERE userId=?`,[req.params.id])
        .then(data => res.status(200).json(data));
    }
})

//inserts new home, to update home, see url /home/id
app.post('/home',(req,res) => {
    console.log(req.body);

    if (req.body.numBeds && req.body.city && req.body.hasKids && req.body.isMusician) {
        
        con.query(`INSERT INTO homes (userId,city,numBeds,isMusician,hasKids) 
            VALUES (?,?,?,?,?)`,[req.body.userId, req.body.city, req.body.numBeds, req.body.isMusician, req.body.hasKids])
        .then(data => res.status(200).json("OK"));
    }
})


//deletes existing home
app.delete('/home/:id',(req,res) => {
    console.log(req.body);

    if (req.params.id) {
        
        con.query(`DELETE FROM homes WHERE id=?`,
            [req.params.id])
        .then(data => res.status(200).json("OK"));
    }
})

//updates existing home, (to create home, see url /home)
app.patch('/home/:id',(req,res) => {
    console.log(req.body);

    if (req.params.id && req.body.userId && req.body.numBeds && req.body.city && req.body.hasKids != undefined && req.body.isMusician != undefined) {
        
        con.query(`UPDATE homes SET city=?, numBeds=?,isMusician=?, hasKids=? WHERE id=? AND userId=?`,
            [req.body.city,req.body.numBeds,req.body.isMusician,req.body.hasKids,req.params.id, req.body.userId])
        .then(data => res.status(200).json(req.body));
    }
})


//returns list of homes given query object numbeds, ismusician etc.
app.get('/homes',(req,res) => {
    //always return 10 results
    let queryObj = queryString.parseUrl(req.url).query;
    let otherQuery = [];
    if (queryObj.isMusician) otherQuery.push("isMusician = 1");
    if (queryObj.hasKids) otherQuery.push("hasKids = 1");
    
    let bedsQuery = [];
    if (queryObj.oneBed) bedsQuery.push("numBeds = 1");
    if (queryObj.twoBeds) bedsQuery.push("numBeds = 2");
    if (queryObj.threeBeds) bedsQuery.push("numBeds > 2");
    if (bedsQuery.length > 0) otherQuery.push("(" + bedsQuery.join(" OR ") + ")");

    let offset = 0;
    if (helpers.isNumeric(queryObj.page)) { offset = queryObj.page * 10 }; 

    if (otherQuery.length == 0) { 
        res.status(200).json([]);
        return;
    }

    //console.log("offset: "+ offset);
    con.query("SELECT * FROM homes WHERE " + otherQuery.join(" AND ") + " LIMIT 10 OFFSET ?",[offset])
    .then(data => res.status(200).json(data));
});
