const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const users = {
  "b8gk01": {
    id: "b8gk01",
    email: "melissa@example.com",
    password: "hello"
  }
}

const emailHasUser = function (email, userDatabase) {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return true;
    }
  }
  return false;
};

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

const userIdByEmail = function (email, userDatabase) {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return userDatabase[user].id;
    }
  }
};


app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//homepage
app.get("/", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (currentUser) {
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

//lists off the short URLs and their corresponding long URL in the database
app.get("/urls", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    urls: urlDatabase,
    user: currentUser
  };
  res.render("urls_index", templateVars);
});

//form for creating  new tiny URL
app.get("/urls/new", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    res.redirect("/login");
  }
  const templateVars = {
    user: currentUser
  };
  res.render("urls_new", templateVars);
});

//show the registration page
app.get("/register", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (currentUser) {
    return res.redirect("/urls");
  }
  const templateVars = { user: currentUser };
  res.render("register", templateVars);
});

//handle registration data
app.post("/register", (req, res) => {
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  const newId = generateRandomString();
  if (!newEmail || !newPassword) {
    res.status(400).send("Please include a valid email and password :) ");
  } else if (emailHasUser(newEmail, users)) {
    res.status(400).send("Yikes- An account has already been created with this email!");
  } else {
    users[newId] = {
      id: newId,
      email: newEmail,
      password: newPassword
    };
    res.cookie("user_id", newId);
    res.redirect("/urls");
    console.log("users: ", users);
  }
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

//login form
app.get("/login", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (currentUser) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: currentUser,
  };
  res.render("login", templateVars);
})

//shows the long URL that corresponds to the short URL inputted 
app.get("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser,
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
  // console.log(shortURL);
  urlDatabase[shortURL].longURL = req.body.newURL;
  res.redirect(`/urls/${shortURL}`);
});

//allows users to login
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  if (!emailHasUser(userEmail, users)) {
    res.status(403).send("Sorry- there is no account registered with that email.");
  } else {
    const userId = userIdByEmail(userEmail, users);
    if (userPassword !== users[userId].password) {
      res.status(403).send("This password does not match the password we have on file.")
    } else {
      res.cookie("user_id", userId);
      res.redirect("/urls");
    };
  }
});

//lets users logout
app.post("/logout", (req, res) => {
  const userEmail = req.body.email;
  const userId = userIdByEmail(userEmail, users);
  res.clearCookie("user_id", userId);
  res.redirect("/urls");
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});