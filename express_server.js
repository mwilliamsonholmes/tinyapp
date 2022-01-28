const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
var cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');

const { userIdByEmail, urlsForUser, emailHasUser, generateRandomString } = require("./helpers");

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");


app.use(cookieSession({
  name: 'session',
  keys: ["WHAT!?"],
  maxAge: 24 * 60 * 60 * 1000
}));

//helper function//

const verifyUserCookie = function (id) {
  if (users[id]) {
    return true;
  }
  return false;
};

const users = {};

const urlDatabase = {};

//ROUTES:
//homepage
app.get("/", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (currentUser) {
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

//lists off the short URLs and their corresponding long URL in the database
app.get("/urls", (req, res) => {
  const currentUser = req.session.user_id;
  const userURLs = urlsForUser(currentUser, urlDatabase);
  if (users[currentUser]) {
    const templateVars = {
      urls: userURLs,
      user: users[currentUser]
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

//form for creating new tiny URL
app.get("/urls/new", (req, res) => {
  const currentUser = req.session.user_id;
  if (verifyUserCookie(currentUser)) {
    const userObj = users[currentUser];
    const templateVars = {
      user: userObj,
    }
    res.render("urls_new", templateVars);
  } else {
    res.status(401).send("Please log in.");
    res.redirect("/login");
  }
});

//show the registration page
app.get("/register", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (currentUser) {
    return res.redirect("/urls");
  }
  const templateVars = { user: currentUser };
  res.render("register", templateVars);
});

//login form
app.get("/login", (req, res) => {
  const currentUser = users[req.session.user_id];
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
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = {
      user: users[req.session.user_id],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      urlUserID: urlDatabase[req.params.shortURL].userID,
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("Hmm looks like this link doesn't exist..")
  }
});

//route to handle shortURL requests
app.get("/u/:shortURL", (req, res) => {
  // if (urlDatabase[req.params.shortURL]) {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.status(404).send("This link does not exist.");
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);

  }
});

//want to save shortURL/long URL pairs to the urlDatabase
app.post("/urls", (req, res) => {
  if (verifyUserCookie(req.session.user_id)) {
    const newShortURL = generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[newShortURL] = {
      longURL,
      userID: req.session.user_id,
    };
    res.redirect(`/urls/${newShortURL}`);
  } else {
    res.status(401).send("Please log in to create URLs.")
  }
});

//handle new registration data
app.post("/register", (req, res) => {
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  if (!newEmail || !newPassword) {
    res.status(400).send("Please include a valid email and password :) ");
  } else if (emailHasUser(newEmail, users)) {
    res.status(400).send("Yikes- An account has already been created with this email!");
  } else {
    const newId = generateRandomString();
    users[newId] = {
      id: newId,
      email: newEmail,
      password: bcrypt.hashSync(newPassword, 10)
    };
    res.redirect("/urls");
    req.session.user_id = newId;
    console.log("users: ", users);
  }
});

//allows users to login
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  if (!emailHasUser(userEmail, users)) {
    res.status(403).send("Sorry- there is no account registered with that email.");
  } else {
    const userId = userIdByEmail(userEmail, users);
    if (!bcrypt.compareSync(userPassword, users[userId].password)) {
      res.status(403).send("This password does not match the password we have on file.")
    } else {
      req.session.user_id = userId;
      res.redirect("/urls");
    };
  }
});

//lets users logout
app.post("/logout", (req, res) => {
  const userEmail = req.body.email;
  const userId = userIdByEmail(userEmail, users);
  req.session = null;
  res.redirect("/urls");
})

//JSON string representing urlDatabase object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//add route that removes a URL resource
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortKey = req.params.shortURL;
  if (req.session.user_id === urlDatabase[shortKey].userID) {
    delete urlDatabase[shortKey];
    res.redirect("/urls");
  } else {
    res.status(401).send("You don't have permission to delete this URL.")
  }
});

//edits a URL
app.post("/urls/:id", (req, res) => {
  const userID = req.params.user_id;
  const userUrls = urlsForUser(userID, urlDatabase);
  if (Object.keys(userUrls).includes(req.params.id)) {
    const shortKey = req.params.id;
    urlDatabase[shortKey].longURL = req.body.newURL;
    res.redirect("/urls");
  } else {
    res.status(401).send("You don't have permission to edit this URL.");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});