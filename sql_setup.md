CREATE DATABASE homestay

CREATE TABLE users (
    id int AUTO_INCREMENT,
    email varchar(255) NOT NULL UNIQUE,
    password varchar(255) NOT NULL,
    PRIMARY KEY (id)
);

DROP table homes;
CREATE TABLE homes (
    id int NOT NULL AUTO_INCREMENT,
    userId int NOT NULL,    
    city varchar(255),
    numBeds int,
    isMusician boolean,
    hasKids boolean,
    PRIMARY KEY (id)
);

