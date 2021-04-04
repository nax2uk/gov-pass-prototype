const express = require('express');
const router = express.Router();
const config = require('./config');

const pg = require('pg');
// const db = new pg.Client({ connectionString:process.env.DATABASE_URL, ssl: true });

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const poolData = {
  UserPoolId: config.cognito.userPoolId,
  ClientId: config.cognito.clientId
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

const AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

// db
// .connect()
// .then(() => console.log('connected'))
// .catch(err => console.error('connection error', err.stack));

/* home endpoint */
router.get('/', function(req, res) {
    // db
    // .query('SELECT * FROM public.register')
    // .then(result => res.render('index', { 'registers': result.rows }))
    // .catch(error => console.error(error.stack));
});

router.post("/", function(req, res){
  const { first_name, last_name, email } = req.body;
  // db
  // .query(`INSERT INTO public.register (first_name, last_name, email) VALUES ($1, $2, $3)`, [first_name, last_name, email])
  // .then(() => res.redirect("/"))
  // .catch(err => console.error(err.stack));
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

/* login endpoint */
router.post("/login", function(req, res){
  const loginDetails = {
    Username: req.body.email,
    Password: req.body.password
  }
  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(loginDetails)

  const userDetails = {
    Username: req.body.email,
    Pool: userPool
  }

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userDetails);

  req.session['login-errors'] = [];
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: data => {
      console.log(data);
      res.redirect('/dashboard');
    },
    onFailure: err => {
      console.error(err)
      req.session['login-errors'].push(err.message);
      res.redirect('/sign-up');
    }
  })
})

/* dashboard endpoint */

module.exports = router