const express = require('express');
const router = express.Router();
const config = require('./config');
const db = require("../db/connection");

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const poolData = {
  UserPoolId: config.cognito.userPoolId,
  ClientId: config.cognito.clientId
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
const identityPoolId = config.cognito.identityPoolId;
const AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});
let cognitoUser, username;

const createCredentials = (idToken) => {
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
    Logins: {
      'cognito-idp.eu-west-2.amazonaws.com/eu-west-2_8HdZ7t0lh': idToken
    }
  });
  AWS.config.credentials.refresh((error) => {
    if (error) {
      console.error(error)
    }
    else {
      console.log('successfully logged in');
    }
  })
}
/* home endpoint */
router.get('/', function(req, res) {
    db('users')
    .select('*')
    .then((usersArray)=>res.render('index', { 'users': usersArray}))
    .catch(error => console.error(error.stack));
});

router.post("/", function(req, res){
  const { first_name, last_name, email } = req.body;
  db('users')
  .insert({ first_name, last_name, email })
  .then(() => res.redirect("/"))
  .catch(err => console.error(err.stack));
})

/* sign-up endpoint */
router.post("/sign-up", function (req, res) {
  const { email, password, confirm_password } = req.body;
  
  if (password !== confirm_password) {
    return res.redirect('/sign-up?error=passwords');
  }
  const emailData = {
    Name: 'email',
    Value: email
  };

  let params = {
    ClientId: poolData.ClientId,
    Password: password,
    Username: email,
    UserAttributes: [emailData]
  };

  let CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
  CognitoIdentityServiceProvider.signUp(params, (err, data) => {
    if (err) {
        console.log(err, err.stack);
    }
    else {
      console.log(JSON.stringify(data));

      params = {
        GroupName: 'Member',
        UserPoolId: config.cognito.userPoolId,
        Username: email,
      }
      CognitoIdentityServiceProvider.adminAddUserToGroup(params, (err, data) => {
        if (err) console.log(err, err.stack);
        else res.send(JSON.stringify(data));
      })
    }
  })
})

/* sign out endpoint */
router.post("/sign-out", function(req, res){
  if (cognitoUser != null) {
    username = null;
    cognitoUser.signOut();
    res.redirect('/login')
  }
  console.log("You are not logged in")
});

/* login endpoint */
router.post("/login", function(req, res){
  //console.log(req)
  if (cognitoUser) {
    res.redirect(`/dashboard?username=${username}`)
  }
  const loginDetails = {
    Username: req.body.email,
    Password: req.body.password
  }
  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(loginDetails)

  const userDetails = {
    Username: req.body.email,
    Pool: userPool
  }

  cognitoUser = new AmazonCognitoIdentity.CognitoUser(userDetails);


  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: data => {
      console.log(data.getIdToken().payload);
      createCredentials(data.getIdToken().getJwtToken());
      username = data.getIdToken().payload.email;
      res.redirect(`/dashboard?username=${data.getIdToken().payload.email}`);
    },
    onFailure: err => {
      if (err.message == '200') {
        cognitoUser = userPool.getCurrentUser();
        if (cognitoUser != null) {
          cognitoUser.getSession((err, data) => {
            if(err) {
              console.error(err);
            }
            if (data) {
              createCredentials(result.getIdToken().getJwtToken());
              console.log("Signed to CognitoID in successfully");
            }
          })
        }
        else {
          console.error(err);
        }
      }
      else {
        console.error(err)
      }
      res.redirect('/sign-up');
    }
  })
 
})

/* dashboard endpoint */
router.get('/dashboard', function(req, res) {
  console.log(userPool.getCurrentUser())
  res.render('dashboard', {'username': req.query.username})
});
module.exports = router