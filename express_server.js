const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

//helper functions//

//returns the URLs for a specific user
const urlsForUser = function (id, urlDatabase) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

const emailHasUser = function (email, userDatabase) {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return true;
    }
  }
  return false;
};

function generateRandomString() {
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomCharCode = Math.floor(Math.random() * 26 + 97);
    const randomChar = String.fromCharCode(randomCharCode);
    randomString += randomChar;
  }
  return randomString;
};

const userIdByEmail = function (email, userDatabase) {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return userDatabase[user].id;
    }
  }
};

const verifyUserCookie = function (id) {
  if (users[id]) {
    return true;
  }
  return false;
};


//user and urlDatabase objects//
const users = {
  "b8gk01": {
    id: "b8gk01",
    email: "melissa@example.com",
    password: "hello"
  }
}


const urlDatabase = {
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "b8gk01"
  },
  "bszawz": {
    longURL: "https://www.lighthouselabs.ca",
    userID: "7hnkdo"
  }
};

//routes

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
  const currentUser = req.cookies["user_id"];
  const userURLs = urlsForUser(currentUser, urlDatabase);
  // console.log(urlsForUser(currentUser, urlDatabase));
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

//form for creating  new tiny URL
app.get("/urls/new", (req, res) => {
  const currentUser = req.cookies["user_id"];
  if (verifyUserCookie(currentUser)) {
    const userObj = users[currentUser];
    const templateVars = {
      user: userObj,
    }
    res.render("urls_new", templateVars);
  } else {
    res.status("401").send("Please log in.");
    res.redirect("/login");
  }
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
  if (!newEmail || !newPassword) {
    res.status(400).send("Please include a valid email and password :) ");
  } else if (emailHasUser(newEmail, users)) {
    res.status(400).send("Yikes- An account has already been created with this email!");
  } else {
    const newId = generateRandomString();
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
  if (verifyUserCookie(req.cookies.user_id)) {
    const newShortURL = generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[newShortURL] = {
      longURL,
      userID: req.cookies.user_id,
    };
    res.redirect(`/urls/${newShortURL}`);
  } else {
    res.status("401").send("Please log in to create URLs.")
  }
});


//route to handle shortURL requests
app.get("/u/:shortURL", (req, res) => {
  // if (urlDatabase[req.params.shortURL]) {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.status("404").send("This link does not exist.");
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);

  }
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
    longURL: urlDatabase[req.params.shortURL].longURL,
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
  const newURL = req.body.newURL;
  urlDatabase[shortURL]["longURL"] = newURL;
  res.redirect("/urls");
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