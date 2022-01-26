const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

let possibilities = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const numCharacters = 6;
let uniqueURL = "";

function generateRandomString() {
  for (let i = 0; i < numCharacters; i++) {
    let randomItem = Math.floor(Math.random() * possibilities.length);
    uniqueURL += possibilities[randomItem];
  }
  return uniqueURL;
}

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

//lists off the short URLs and their corresponding long URL in the database
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  res.render("urls_index", templateVars);
});

//form for creating  new tiny URL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies['username'],
    urls: urlDatabase,
  };
  res.render("urls_new", templateVars);
});


//JSON string representing urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


//want to save shortURL/long URL pairs to the urlDatabase
app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});


//route to handle shortURL requests
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


//shows the long URL that corresponds to the short URL inputted 
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    username: req.cookies['username'],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_show", templateVars);
});

//add route that removes a URL resource
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//add route that edits a URL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  console.log(shortURL);
  urlDatabase[shortURL].longURL = req.body.newURL;
  res.redirect(`/urls/${shortURL}`);
});

//allows users to login
app.post("/login", (req, res) => {
  const username = req.body.username
  res.cookie("username", username);
  res.redirect("/urls");
  // console.log(req.body.username);
});

app.post("/logout", (req, res) => {
  res.clearCookie("username", username);
  res.redirect("/urls");
})


// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// app.get("/set", (req, res) => {
//   const a = 1;
//   res.send(`a = ${a}`);
// });

// app.get("/fetch", (req, res) => {
//   res.send(`a = ${a}`);
// })

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});