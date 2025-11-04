const mongoose = require('mongoose');
const { CustomError } = require('../utils/CustomError');

module.exports = function (router) {
    const taskRoute = router.route('/');

    taskRoute.get(async function (req, res, next) {
        let where = {};
        let sort = {};
        let select = {};
        let skip = 0;
        let limit = 100;
        let count = false;

        try {
            where = req.query.where ? JSON.parse(req.query.where) : {};
            sort = req.query.sort ? JSON.parse(req.query.sort) : {};
            select = req.query.select ? JSON.parse(req.query.select) : {};
            skip = parseInt(req.query.skip) || 0;
            limit = req.query.limit ? parseInt(req.query.limit) : 100;
            count = req.query.count === 'true';
        } catch (err) {
            return next(new CustomError('Invalid query parameters', 400));
        }

        try {
            const Task = mongoose.model('Task');

            if (count) {
                const resultCount = await Task.countDocuments(where);
                return res.json({
                    message: 'OK',
                    data: resultCount,
                });
            }

            const tasks = await Task.find(where)
                .sort(sort)
                .limit(limit)
                .skip(skip)
                .select(select);

            res.json({
                message: 'OK',
                data: tasks,
            });
        } catch (err) {
            next(new CustomError('Error fetching tasks', 500, null, err));
        }
    });

    taskRoute.post(async function (req, res, next) {
        try {
            const Task = mongoose.model('Task');
            const User = mongoose.model('User');

            const newTask = new Task(req.body);
            const savedTask = await newTask.save();

            if (savedTask.assignedUser && !savedTask.completed) {
                await User.findByIdAndUpdate(
                    savedTask.assignedUser,
                    { $addToSet: { pendingTasks: savedTask._id.toString() } }
                );
            }

            res.status(201).json({
                message: 'Task created',
                data: savedTask,
            });
        } catch (err) {
            next(new CustomError('Error creating task', 500, null, err));
        }
    });

    const taskIdRoute = router.route('/:taskId');

    taskIdRoute.get(async function (req, res, next) {
        try {
            const Task = mongoose.model('Task');
            let select = {};
            if (req.query.select) {
                try {
                    select = JSON.parse(req.query.select);
                } catch (err) {
                    return next(new CustomError('Invalid select parameter', 400));
                }
            }

            const task = await Task.findById(req.params.taskId).select(select);

            if (!task) {
                return next(new CustomError('Task not found', 404));
            }

            res.json({
                message: 'OK',
                data: task,
            });
        } catch (err) {
            next(new CustomError('Error fetching task', 500, null, err));
        }
    });

    taskIdRoute.put(async function (req, res, next) {
        try {
            const Task = mongoose.model('Task');
            const User = mongoose.model('User');

            const oldTask = await Task.findById(req.params.taskId);
            if (!oldTask) {
                return next(new CustomError('Task not found', 404));
            }

            const updatedTask = await Task.findByIdAndUpdate(
                req.params.taskId,
                req.body,
                { new: true, runValidators: true }
            );

            const oldAssignedUser = oldTask.assignedUser ? oldTask.assignedUser.toString() : '';
            const newAssignedUser = updatedTask.assignedUser ? updatedTask.assignedUser.toString() : '';
            const oldCompleted = oldTask.completed;
            const newCompleted = updatedTask.completed;

            if (oldAssignedUser && (oldAssignedUser !== newAssignedUser || (!oldCompleted && newCompleted))) {
                await User.findByIdAndUpdate(
                    oldAssignedUser,
                    { $pull: { pendingTasks: req.params.taskId } }
                );
            }

            if (newAssignedUser && newAssignedUser !== oldAssignedUser && !newCompleted) {
                await User.findByIdAndUpdate(
                    newAssignedUser,
                    { $addToSet: { pendingTasks: req.params.taskId } }
                );
            }

            res.json({
                message: 'Task updated',
                data: updatedTask,
            });
        } catch (err) {
            next(new CustomError('Error updating task', 500, null, err));
        }
    });

    taskIdRoute.delete(async function (req, res, next) {
        try {
            const Task = mongoose.model('Task');
            const User = mongoose.model('User');

            const deletedTask = await Task.findByIdAndDelete(req.params.taskId);

            if (!deletedTask) {
                return next(new CustomError('Task not found', 404));
            }

            if (deletedTask.assignedUser) {
                await User.findByIdAndUpdate(
                    deletedTask.assignedUser,
                    { $pull: { pendingTasks: req.params.taskId } }
                );
            }

            res.status(204).send();
        } catch (err) {
            next(new CustomError('Error deleting task', 500, null, err));
        }
    });

    return router;
}
