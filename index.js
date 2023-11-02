const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
require('dotenv').config();
const mongoose = require('mongoose');
const {Schema} = mongoose;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true});

const UserSchema = new Schema({
  username: String
});

const User = mongoose.model("User", UserSchema);

const ExerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date
  });

const Exercise = mongoose.model("Exercise", ExerciseSchema);

app.use(cors())
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res)=>{
  const username = req.body.username;
  const userObj = new User({username:username })

  try{
    const user = await userObj.save();
    res.json({username: user.username, _id: user._id});
  }catch(err){
    console.log(err);
  }
})

app.post('/api/users/:_id/exercises', async (req, res)=>{
  const id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;

  try{
   const user = await User.findById(id);
    if(!user){
      res.json({error: "User not found"});
    }else{
      const exerciseObj = new Exercise({
        user_id: user._id,
        description:description,
        duration: duration,
        date: date?new Date(date): new Date()
      });

      const exercise = await exerciseObj.save();
      res.json({
        _id: user._id,
        username: user.username,
        description:exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      })
    }
  }catch(err){
  console.log(err);
  }
})

app.get("/api/users", (req, res)=>{
  User.find({}).then(function (users) {
   res.send(users);
   });
})

app.get('/api/users/:_id/logs', async (req, res)=>{
  const {from, to, limit} = req.query;
  const id = req.params._id;
  try{
    const user = await User.findById(id);
    if(!user){
      res.send("No user found!");
    }else{
      let dateObj = {};
      
      if(from){
        dateObj["$gte"] = new Date(from);
      }

      if(to){
        dateObj["$lte"] = new Date(to);
      }

      let filter = {user_id: id};

      if(from || to){
        filter.date = dateObj;
      }
      
      const exercises = await Exercise.find(filter).limit(+limit??500);
      
      const log = exercises.map((exercise)=>{
        return {
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString()
        }
      });
      res.json({
        _id: user._id,
        username: user.username,
        count: exercises.length,
        log: log
      })
    }
  }catch(err){
    console.log(err);
  }
  //FA request to a user's log GET /api/users/:_id/logs returns a user object with a count property representing the number of exercises that belong to that user.
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
