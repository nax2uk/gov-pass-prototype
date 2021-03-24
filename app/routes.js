const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line
router.get('/examples/template-data', function(req, res) {
    res.render('examples/template-data', { 'name' : 'Foo' });
});

router.get('/hello-world', function(req, res) {
  res.render("hello-world", { 'name': 'Azlina'});
})
module.exports = router
