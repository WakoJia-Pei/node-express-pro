const express = require('express');
const router = express.Router();

const userRouter = require('./users');
const taskRouter = require('./tasks');

router.use('/api', userRouter);
router.use('/api', taskRouter);
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

module.exports = router;
