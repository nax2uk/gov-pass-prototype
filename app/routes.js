const express = require('express')
const router = express.Router()
const pg = require('pg')
const db = new pg.Client({ connectionString:process.env.DATABASE_URL, ssl: true });

db
.connect()
.then(() => console.log('connected'))
.catch(err => console.error('connection error', err.stack))

router.get('/', function(req, res) {
    db
    .query('SELECT * FROM public.register')
    .then(result => res.render('index', { 'registers': result.rows }))
    .catch(error => console.error(error.stack));
});

router.post("/", function(req, res){
  const { first_name, last_name, email } = req.body;
  db
  .query(`INSERT INTO public.register (first_name, last_name, email) VALUES ($1, $2, $3)`, [first_name, last_name, email])
  .then(() => res.redirect("/"))
  .catch(err => console.error(err.stack));
})

module.exports = router