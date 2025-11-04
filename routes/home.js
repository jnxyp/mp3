const { CustomError } = require('../utils/CustomError');

module.exports = function (router) {

    var homeRoute = router.route('/');

    homeRoute.get(function (req, res) {
        var connectionString = process.env.TOKEN;
        throw new CustomError('This is a custom error message', 500);
        res.json({ message: 'My connection string is ' + connectionString });
    });

    return router;
}
