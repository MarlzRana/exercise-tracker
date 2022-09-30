const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require('dotenv').config();

//Mongoose setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//Defining our document schemas
const userSchema = new mongoose.Schema({
  username: String
});
const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
});

//Connecting our document schema's to their corresponding collections
const User = mongoose.model("users", userSchema);
const Exercise = mongoose.model("exercises", exerciseSchema);

async function clearDB() {
  await User.deleteMany();
  await Exercise.deleteMany();
}

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', async (req, res) => {
  // await clearDB();
  res.sendFile(__dirname + '/views/index.html');
});


app.route("/api/users")
.post(async (req, res) => {
  const username = req.body.username;
  const newUser = new User({ username: username });
  await newUser.save();
  res.json(newUser);
})
.get(async (req, res) => {
  return res.json(await User.find());
})



app.post("/api/users/:_id/exercises", async (req, res) => {
  const userID = req.params._id;
  try {
    const username = (await User.findById(userID)).username;
    if (req.body.date) {
      const newExercise = new Exercise({ username: username, description: req.body.description, duration: req.body.duration, date: (new Date(req.body.date)).toDateString() });
    await newExercise.save();
    return res.json({
      _id: userID,
      username: username,
      duration: Number(req.body.duration),
      date: (new Date(req.body.date)).toDateString(),
      description: req.body.description
    });
    } else {
      const newExercise = new Exercise({ username: username, description: req.body.description, duration: req.body.duration, date: (new Date()).toDateString()});
    await newExercise.save();
    return res.json({
      _id: userID,
      username: username,
      duration: Number(req.body.duration),
      date: (new Date()).toDateString(),
      description: req.body.description
    });
    }  
  } catch (e) {
    console.log(e.message);
    return res.json({ error: "There was an error in making that exercise" });
  }
})

app.get("/api/users/:_id/logs", async (req, res) => {
  //Get the all the inputs
  const userID = req.params._id;
  try {
    //Get the username
    const username = (await User.findById(userID)).username;
    //Deals with the case where you have date constraints and limits
    if (req.query.from && req.query.to && req.query.limit) {
      const userExercises = (await Exercise.find({username: username})).map((obj) =>({description: obj.description, duration: obj.duration, date: obj.date}));
      const fromDate = new Date(req.query.from);
      const toDate = new Date(req.query.to);
      userExercises.filter((obj) => {
        const exerciseDate = new Date(obj.date);
        return exerciseDate >= fromDate & exerciseDate <= toDate;
      })
    const count = userExercises.length;
    return res.json({
      _id: userID,
      username: username,
      count: count,
      log: userExercises.slice(0, req.query.limit)
    })
    }
    
    //Deals with the case where you only have date constraints
    if (req.query.from && req.query.to) {
      const userExercises = (await Exercise.find({username: username})).map((obj) =>({description: obj.description, duration: obj.duration, date: obj.date}));
      const fromDate = new Date(req.query.from);
      const toDate = new Date(req.query.to);
      userExercises.filter((obj) => {
        const exerciseDate = new Date(obj.date);
        return exerciseDate >= fromDate & exerciseDate <= toDate;
      })
    const count = userExercises.length;
    return res.json({
      _id: userID,
      username: username,
      count: count,
      log: userExercises
    })
    }

    //Deals with the case where you only have a limit
    if (req.query.limit) {
      const userExercises = (await Exercise.find({username: username})).map((obj) =>({description: obj.description, duration: obj.duration, date: obj.date}));
      
    const count = req.query.limit;
    return res.json({
      _id: userID,
      username: username,
      count: count,
      log: userExercises.slice(0, req.query.limit)
    })
    }
    
    //Deals with the standard approach where no limits or date constraints are involved
    const userExercises = (await Exercise.find({username: username})).map((obj) =>({description: obj.description, duration: obj.duration, date: obj.date}));
    const count = userExercises.length;
    return res.json({
      _id: userID,
      username: username,
      count: count,
      log: userExercises
    });
    
  } catch (e) {
    console.log(e.message);
    res.json({ error: "There was an error in making that exercise" });
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
