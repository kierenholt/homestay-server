
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "homestay"
  });


con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    var sql = "INSERT INTO homes (userId, city, hasKids, isMusician, numBeds) VALUES ?";
    let values = [
        [     1, "London",  true,  true,  3 ],
        [     2, "Reading",  false,  true,  1 ],
        [     3, "Birmingham",  false,  true,  1],
        [     4, "London",  true,  true,  4 ],
        [     5, "London",  false,  false,  2 ],
        [     6, "Coventry",  true,  false,  1],
        [     7, "Carlisle",  true,  true,  2],
        [     8, "Dover",  true,  false,  2 ],
      ];
    con.query(sql, [values], function (err, result) {
      if (err) throw err;
      console.log("Number of records inserted: " + result.affectedRows);
    });
  });
  

  
/*
  
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    /*
    var sql = "INSERT INTO users (email, password, firstName, lastName) VALUES ?";
    let values = [
        [     "user1@gmail.com", "password1", "firstName", "lastName" ],
        [     "user2@gmail.com", "password2","firstName", "lastName" ],
        [     "user3@gmail.com", "password3","firstName", "lastName" ],
        [     "user4@gmail.com", "password4","firstName", "lastName" ],
        [     "user5@gmail.com", "password5","firstName", "lastName" ],
        [     "user6@gmail.com", "password6","firstName", "lastName" ],
      ];
      
    var sql = "INSERT INTO users (email, password) VALUES ?";
    let values = [
        [     "user1@gmail.com", "password1" ],
        [     "user2@gmail.com", "password2" ],
        [     "user3@gmail.com", "password3" ],
        [     "user4@gmail.com", "password4" ],
        [     "user5@gmail.com", "password5" ],
        [     "user6@gmail.com", "password6" ],
      ];
    con.query(sql, [values], function (err, result) {
      if (err) throw err;
      console.log("Number of records inserted: " + result.affectedRows);
    });
  });*/