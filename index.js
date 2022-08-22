const express = require("express");
const queryString = require('query-string');
var mysql = require('mysql2');
const { query } = require("express");
const app = express();
var helpers = require('./helpers');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "homestay"
  });

  //necessary to parse posts requests from angular
  app.use(express.urlencoded());
  app.use(express.json());  

app.listen(3000,() => console.log("listening on port 3000"));

//deletes user
app.delete('/user/:id',(req,res) => {
    console.log(req.body);

    if (req.params.id) {
        
        con.promise().query(`DELETE FROM users WHERE id=?`,
            [req.params.id])
        .then(
            con.promise().query(`DELETE FROM homes WHERE userId=?`,
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
        
        con.promise().query(`SELECT * FROM users WHERE email=? AND password=?`,
            [req.body.email, req.body.password])
        .then(
            con.promise().query(`UPDATE users SET password=? WHERE id=? AND email=? AND password=?`,
            [req.body.newPassword, req.params.id, req.body.email, req.body.password])
        )
        .then(data => {
            console.log(data);
            req.body.password = req.body.newPassword;
            delete req.body.newPassword;
            res.status(200).json(req.body)}
            );

    }
})


//adds new user
app.post('/register',(req,res) => {
    console.log(req.body);

    if (req.body.email && req.body.password) {
        
        con.promise().query(`INSERT INTO users (email,password) VALUES(?,?)`,
            [req.body.email, req.body.password])
        .then(data => { 
            if (data && data[0] && (data[0]["warningStatus"] === 0 || data[0]["warningCount"] === 0)) {
                let user = {...req.body};
                user["id"] = data[0]["insertId"];
                res.status(200).json(user);
            } 
            else {
                res.status(401).json(null);
            }
        } );
    }
})

//checks email/password and returns user 
app.post('/authenticate',(req,res) => {
    console.log(req.body);

    if (req.body.email && req.body.password) {
        
        con.promise().query(`SELECT * FROM users WHERE email=? AND password=?`,
            [req.body.email, req.body.password])
        .then(([rows,fields]) => rows)
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
        con.promise().query(`SELECT * FROM homes WHERE userId=?`,[req.params.id])
        .then(([rows,fields]) => rows)
        .then(data => res.status(200).json(data));
    }
})

//inserts new home, to update home, see url /home/id
app.post('/home',(req,res) => {
    console.log(req.body);

    if (req.body.numBeds && req.body.city && req.body.hasKids && req.body.isMusician) {
        
        con.promise().query(`INSERT INTO homes (userId,city,numBeds,isMusician,hasKids,imageUrl) 
            VALUES (?,?,?,?,?,?)`,[req.body.userId, req.body.city, req.body.numBeds, req.body.isMusician, req.body.hasKids, req.body.imageUrl])
        .then(data => res.status(200).json("OK"));
    }
})


//deletes existing home
app.delete('/home/:id',(req,res) => {
    console.log(req.body);

    if (req.params.id) {
        
        con.promise().query(`DELETE FROM homes WHERE id=?`,
            [req.params.id])
        .then(data => res.status(200).json("OK"));
    }
})

//updates existing home, (to create home, see url /home)
app.patch('/home/:id',(req,res) => {
    console.log(req.body);

    if (req.params.id && req.body.userId && req.body.numBeds && req.body.city && req.body.hasKids != undefined && req.body.isMusician != undefined) {
        
        con.promise().query(`UPDATE homes SET city=?, numBeds=?,isMusician=?, hasKids=?, imageUrl=? WHERE id=? AND userId=?`,
            [req.body.city,req.body.numBeds,req.body.isMusician,req.body.hasKids,req.body.imageUrl,req.params.id, req.body.userId])
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

    console.log("offset: "+ offset);
    con.promise().query("SELECT * FROM homes WHERE " + otherQuery.join(" AND ") + " LIMIT 10 OFFSET ?",[offset])
    .then(([rows,fields]) => rows)
    .then(data => res.status(200).json(data));
});
