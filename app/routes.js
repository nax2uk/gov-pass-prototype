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
const identityPoolId = config.cognito.identityPoolId;
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

  let cognitoUser = new AmazonCognitoIdentity.CognitoUser(userDetails);


  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: data => {
      console.log(data);
      createCredentials(data.getIdToken().getJwtToken());
      res.redirect('/dashboard');
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

module.exports = router