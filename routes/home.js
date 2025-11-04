module.exports = function (router) {

    var homeRoute = router.route('/');

    homeRoute.get(function (req, res) {
        res.json({ message: 'Task Management API for CS 409 MP3 by Yipeng is up and running', data: null });
    });

    return router;
}
