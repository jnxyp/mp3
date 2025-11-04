const mongoose = require('mongoose');
const { CustomError } = require('../utils/CustomError');

module.exports = function (router) {
    const userRoute = router.route('/');
    userRoute.get(async function (req, res, next) {
        let where = {};
        let sort = {};
        let select = {};
        let skip = 0;
        let limit = 0;
        let count = false;

        try {
            where = req.query.where ? JSON.parse(req.query.where) : {};
            sort = req.query.sort ? JSON.parse(req.query.sort) : {};
            select = req.query.select ? JSON.parse(req.query.select) : {};
            skip = parseInt(req.query.skip) || 0;
            limit = parseInt(req.query.limit) || 0;
            count = req.query.count === 'true';
        } catch (err) {
            return next(new CustomError('Invalid query parameters', 400));
        }

        try {
            const User = mongoose.model('User');

            if (count) {
                const resultCount = await User.countDocuments(where);
                return res.json({
                    message: 'OK',
                    data: resultCount,
                });
            }

            const users = await User.find(where)
                .sort(sort)
                .limit(limit)
                .skip(skip)
                .select(select);

            res.json({
                message: 'OK',
                data: users,
            });
        } catch (err) {
            next(new CustomError('Error fetching users', 500, null, err));
        }
    });

    userRoute.post(async function (req, res, next) {
        try {
            const User = mongoose.model('User');
            const newUser = new User(req.body);
            const savedUser = await newUser.save();

            res.status(201).json({
                message: 'User created',
                data: savedUser,
            });
        } catch (err) {
            next(new CustomError('Error creating user', 500, null, err));
        }
    });

    const userIdRoute = router.route('/:userId');

    userIdRoute.get(async function (req, res, next) {
        try {
            const User = mongoose.model('User');
            let select = {};
            if (req.query.select) {
                try {
                    select = JSON.parse(req.query.select);
                } catch (err) {
                    return next(new CustomError('Invalid select parameter', 400));
                }
            }


            const user = await User.findById(req.params.userId).select(select);

            if (!user) {
                return next(new CustomError('User not found', 404));
            }

            res.json({
                message: 'OK',
                data: user,
            });
        } catch (err) {
            next(new CustomError('Error fetching user', 500, null, err));
        }
    });

    userIdRoute.put(async function (req, res, next) {
        try {
            const User = mongoose.model('User');
            const Task = mongoose.model('Task');

            const oldUser = await User.findById(req.params.userId);
            if (!oldUser) {
                return next(new CustomError('User not found', 404));
            }

            if (req.body.pendingTasks) {
                req.body.pendingTasks = [...new Set(req.body.pendingTasks)];
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.params.userId,
                req.body,
                { new: true, runValidators: true }
            );

            if (req.body.pendingTasks) {
                const oldPendingTasks = oldUser.pendingTasks || [];
                const newPendingTasks = req.body.pendingTasks || [];

                const removedTasks = oldPendingTasks.filter(taskId => !newPendingTasks.includes(taskId));
                const addedTasks = newPendingTasks.filter(taskId => !oldPendingTasks.includes(taskId));

                if (removedTasks.length > 0) {
                    await Task.updateMany(
                        { _id: { $in: removedTasks } },
                        { assignedUser: '', assignedUserName: 'unassigned' }
                    );
                }

                if (addedTasks.length > 0) {
                    await Task.updateMany(
                        { _id: { $in: addedTasks } },
                        { assignedUser: updatedUser._id.toString(), assignedUserName: updatedUser.name }
                    );
                }
            }

            res.json({
                message: 'User updated',
                data: updatedUser,
            });
        } catch (err) {
            next(new CustomError('Error updating user', 500, null, err));
        }
    });

    userIdRoute.delete(async function (req, res, next) {
        try {
            const User = mongoose.model('User');
            const Task = mongoose.model('Task');

            const deletedUser = await User.findByIdAndDelete(req.params.userId);

            if (!deletedUser) {
                return next(new CustomError('User not found', 404));
            }

            await Task.updateMany(
                { assignedUser: req.params.userId },
                { assignedUser: '', assignedUserName: 'unassigned' }
            );

            res.status(204).send();
        } catch (err) {
            next(new CustomError('Error deleting user', 500, null, err));
        }
    });

    return router;
}