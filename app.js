const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const axios = require('axios');
const flash = require('connect-flash');

const app = express();
const port = 3000;
const supportedLocation = ["Auto", "Hong Kong", "London", "Sydney", "Toronto"];

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: "This is not really a secret.",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: (30 * 24 * 60 * 60 * 1000)
  }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/homeDB");

const taskSchema = new mongoose.Schema({
  taskTitle: String,
  dateCreated: Date,
  dateFinished: Date,
  done: Boolean,
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  nickname: String,
  email: String,
  location: String,
  darkmode: Boolean,
  todolist: [taskSchema],
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  let currentUser = undefined;
  let userLocation = undefined;
  let weatherData = undefined;
  let quoteData = undefined;
  if (req.isAuthenticated()) {
    currentUser = req.user;
    if (currentUser.location == ("Auto")) {
      userLocation = req.ip;
    } else {
      userLocation = currentUser.location;
    }
  } else {
    userLocation = req.ip;
  } if (userLocation == "::1") {     // Prevent error when testing on my laptop
    userLocation = "Toronto";
  }

  // Get weather data
  const weatherAPIKey = process.env.WEATHERAPI_KEY;
  const weatherAPI = "https://api.weatherapi.com/v1/current.json";
  const weatherURL = `${weatherAPI}?key=${weatherAPIKey}&q=${userLocation}`;
  axios.get(weatherURL)
    .then(resWeather => {
      weatherData = {
        locationName: resWeather.data.location.name,
        localTime: resWeather.data.location.localtime,
        temperatureC: resWeather.data.current.temp_c,
        temperatureF: resWeather.data.current.temp_f,
        humidity: resWeather.data.current.humidity,
        condition: resWeather.data.current.condition.text,
        icon: resWeather.data.current.condition.icon,
      };
    })
    .catch(errWeather => {
      console.log(errWeather);
    })
    .finally(() => {

      // Get daily quote
      const quoteURL = "https://zenquotes.io/api/today";
      axios.get(quoteURL)
        .then(resQuote => {
          quoteData = resQuote.data[0];
        })
        .catch(errQuote => {
          console.log(errQuote);
        })
        .finally(() => {
          res.render("home", {user: currentUser, weather: weatherData, quote: quoteData});
        });
    });
});

app.get("/profile", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("profile", {user: req.user, locationOptions: supportedLocation});
  } else {
    res.redirect("/home/");
  }
});

app.get("/sign-up", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/home/");
  } else {
    res.render("sign-up", {message: req.flash("error")});
  }
});

app.post("/sign-up", (req, res) => {
  User.register({username: req.body.username}, req.body.password, (errRegister, user) => {
    if (errRegister) {
      console.log(errRegister);
      req.flash("error", "Username is used");
      res.redirect("/home/sign-up");
    } else {
      passport.authenticate("local")(req, res, () => {
        User.updateOne({username: req.user.username}, {nickname: req.body.nickname, location: "Auto", darkmode: false})
          .then((errUpdate, docs) => {
            if (errUpdate) {
              console.log(errUpdate);
            } else {
              console.log(`Updated Docs: ${docs}`);
            }
          });
        res.redirect("/home/");
      });
    }
  });
});

app.get("/sign-in", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/home/");
  } else {
    res.render("sign-in", {message: req.flash("error")});
  }
});

app.post("/sign-in", passport.authenticate("local", {
  failureRedirect: "/home/sign-in", 
  failureFlash: true
}), (req, res) => {
  res.redirect("/home/");
});

app.get("/sign-out", (req, res) => {
  if (req.isAuthenticated()) {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
    });
    res.redirect("/home/sign-in");
  } else {
    res.redirect("/home/");
  }
});

app.post("/create-task", (req, res) => {
  const newTask = {
    taskTitle: req.body.newTaskTitle,
    dateCreated: new Date(),
    done: false,
  };
  User.updateOne({username: req.user.username}, {$push: {todolist: newTask}})
    .then((err, docs) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Updated Docs: ${docs}`);
      }
    });
  res.redirect("/home/");
});

app.post("/finish-task", (req, res) => {
  const todolist = req.user.todolist;
  const taskFinishedID = req.body.checkbox;
  const index = todolist.findIndex((task) => task._id.equals(taskFinishedID));
  todolist[index].done = true;
  todolist[index].dateFinished = new Date();

  User.updateOne({username: req.user.username}, {todolist: todolist})
    .then((err, docs) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Updated Docs: ${docs}`);
      }
    });
  res.redirect("/home/");
});

app.post("/update-information", (req, res) => {
  User.updateOne({username: req.user.username}, {nickname: req.body.nickname, email: req.body.email})
    .then((err, docs) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Updated Docs: ${docs}`);
      }
    });
  res.redirect("/home/profile");
});

app.post("/update-preferences", (req, res) => {
  User.updateOne({username: req.user.username}, {darkmode: req.body.darkmode, location: req.body.location})
    .then((err, docs) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Updated Docs: ${docs}`);
      }
    });
  res.redirect("/home/profile");
});

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
