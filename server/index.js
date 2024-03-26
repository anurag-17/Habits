const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const app = express();

require("dotenv").config();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "500kb", extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
const corsOptions = {
  origin: ["http://localhost:3000", "*"],
  credentials: true,
};

// app.use(cors());
app.use(cors(corsOptions));

app.use('/api/adminauth', require('./Route/AdminRoute'));
app.use('/api/userauth', require('./Route/UserRoute'))
app.use('/api/chat', require('./Route/ChatRouter'))

const connectDB = require("./Utils/db");

// if (process.env.NODE_ENV === "dev") {
//   //replaced "production" with "dev"
//   app.use(express.static("../client/build"));

//   app.get("*", (req, res) => {
//     res.sendFile(
//       path.resolve(__dirname, "..", "client", "build", "index.html")
//     );
//   });
// } else {
//   app.get("/", (req, res) => {
//     res.send("API is running..");
//   });
// }
// // set-up-passport
// app.use(passport.initialize());
// app.use(passport.session());

// // Google OAuth
// passport.use(
//   new OAuth2Strategy({
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL:"/auth/google/callback",
//       scope:["profile","email"]
//   },
//   async(accessToken,refreshToken,profile,done)=>{

//       try {
//           let user = await User.findOne({email: profile.emails[0].value});

//           if (!user) {
//             user = new User({
//               provider_ID: profile.id,
//               firstname: profile.name.givenName,
//               lastname: profile.name.familyName,
//               //   image: profile.photos[0].value,
//               email: profile.emails[0].value,
//               provider: profile.provider,
//             });

//             await user.save();
//           }

//           return done(null,user)
//       } catch (error) {
//           return done(error,null)
//       }
//   }
//   )
// );
// // Facebook OAuth
// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_CLIENT_ID,
//       clientSecret: process.env.FACEBOOK_SECRET_KEY,
//       callbackURL: "/auth/facebook/callback",
//     },
//     async function (accessToken, refreshToken, profile, cb) {
//       const user = await User.findOne({
//         provider_ID: profile.id,
//       });
//       if (!user) {
//         console.log('Adding new facebook user to DB..');
//         const user = new User({
//           // accountId: profile.id,
//           provider_ID: profile.id,
//           firstname: profile.displayName,
//           provider: profile.provider,
//         });
//         await user.save();
//         // console.log(user);
//         return cb(null, profile);
//       } else {
//         console.log('Facebook User already exist in DB..');
//         // console.log(profile);
//         return cb(null, profile);
//       }
//     }
//   )
// );

// passport.serializeUser((user,done)=>{
//   done(null,user);
// })

// passport.deserializeUser((user,done)=>{
//   done(null,user);
// });

// // Initial Google oauth Login
// app.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}));

// // Initial Facebook oauth Login
// app.get('/auth/facebook', passport.authenticate('facebook',{scope:['public_profile', 'email']}));

// // Google Authenticate Callback
// app.get("/auth/google/callback", passport.authenticate("google",{
//   successRedirect:"http://localhost:3000/admin/admin-dashboard",
//   failureRedirect:"http://localhost:3000/login"
// }));

// // Facebook Authenticate Callback
// app.get("/auth/facebook/callback", passport.authenticate("facebook",{
//     successRedirect: 'http://localhost:3000/admin/admin-dashboard',
//     failureRedirect: 'http://localhost:3000/login'
// }));

// app.get("/login/sucess", async (req, res) => {
//   if (req.user) {
//     res.status(200).json({ message: "user Login", user: req.user });
//   } else {
//     res.status(400).json({ message: "Not Authorized" });
//   }
// });

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
