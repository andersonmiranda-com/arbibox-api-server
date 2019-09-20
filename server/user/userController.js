const mongoose = require("mongoose");
const moment = require("moment");

const User = require("./userModel");
const Relation = require("../relation/relationModel");

// Handle index actions
exports.index = function(req, res) {
    User.find()
        .limit(2)
        .then(users => {
            res.json(users); // eslint-disable-line no-param-reassign
        })
        .catch(e => res.json(e));
};

// Handle create contact actions
exports.new = function(req, res) {
    const user = new User();
    user.first_name = req.body.first_name ? req.body.first_name : contact.first_name;
    user.last_name = req.body.gender;
    user.gender = req.body.gender;
    user.birthday = req.body.birthday;

    // save the contact and check for errors
    user.save(err => {
        // if (err)
        //     res.json(err);

        res.json({
            message: "New user created!",
            data: contact
        });
    });
};

// Handle view contact info
exports.view = function(req, res) {
    User.findById(req.params._id)
        .then(result => {
            res.json(result);
        })
        .catch(err => res.json({ status: "error", message: err }));
};

// Handle update contact info
exports.update = function(req, res) {
    User.findById(req.params.contact_id, (err, user) => {
        if (err) res.send(err);
        user.first_name = req.body.first_name ? req.body.first_name : user.first_name;
        user.last_name = req.body.gender;
        user.gender = req.body.gender;
        user.birthday = req.body.birthday;
        // save the contact and check for errors
        user.save(err => {
            if (err) res.json(err);
            res.json({
                message: "Contact Info updated",
                data: user
            });
        });
    });
};

// Handle delete contact
exports.delete = function(req, res) {
    User.remove(
        {
            _id: req.params._id
        },
        (err, contact) => {
            if (err) res.send(err);

            res.json({
                status: "success",
                message: "Contact deleted"
            });
        }
    );
};

exports.save = function(req, res) {
    const _id = req.body._id;
    const userData = req.body.userData;
    const upsert = req.body.upsert || false;

    // console.log(_id, userData, upsert);

    // mongoose.connection.db.collection("relations"). acessa o comando nativo do MOngoDB
    User.updateOne({ _id: _id.toString() }, { $set: userData }, { upsert })
        .then(result => res.json({ status: "ok" }))
        .catch(err => res.json({ status: "error", message: err }));
};

exports.getCards = function(req, res) {
    const user = req.body.user;
    const userId = mongoose.Types.ObjectId(user._id);

    // / query 1 - swipes dados pelo user - para nao aparecer novamente
    const query1 = { _id: user._id };

    Relation.findOne(query1)
        .then(results => {
            let swipes = [];
            if (results !== null) {
                results = results.toObject();
                swipes = results.swipes.map(swipe => swipe.uid);
            }
            swipes = swipes.concat(userId);

            // / query2 - cards que correspondem aos filtros
            const ageRange0 = user.ageRange[0] || 18;
            const ageRange1 = user.ageRange[1] || 100;

            const dateRange0 = moment()
                .subtract(ageRange0, "years")
                .toDate();
            const dateRange1 = moment()
                .subtract(ageRange1, "years")
                .toDate();

            const query2 = {
                showMe: true,
                birthday: {
                    $gt: dateRange1,
                    $lte: dateRange0
                },
                _id: { $nin: swipes }
            };

            if (user.gender === "Male") {
                query2.showMen = true;
            }
            if (user.gender === "Female") {
                query2.showWomen = true;
            }

            if (user.showMen && !user.showWomen) {
                query2.gender = "Male";
            } else if (user.showWomen && !user.showMen) {
                query2.gender = "Female";
            }

            const pipeline = [
                // geo query
                {
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: [
                                user.location.coordinates[0],
                                user.location.coordinates[1]
                            ]
                        },
                        distanceField: "distance_in_meters",
                        maxDistance: user.distance * 1000,
                        query: query2
                    }
                },

                // busca na tabela de swipes por likes/superlikes
                {
                    $lookup: {
                        from: "relations", // other table name
                        let: { uid: "$_id" },
                        pipeline: [
                            { $unwind: "$swipes" },
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$_id", "$$uid"] },
                                            {
                                                $eq: [userId, "$swipes.uid"]
                                            }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "likes" // alias
                    }
                },

                // poe likes como campo do objeto
                {
                    $addFields: { likeBack: { $arrayElemAt: ["$likes.swipes.type", 0] } }
                },

                // exclui dislikes back
                {
                    $match: { likeBack: { $ne: "dislike" } }
                },

                // define que campos devolver
                {
                    $project: {
                        birthday: 1,
                        first_name: 1,
                        bio: 1,
                        _id: 1,
                        image: 1,
                        likeBack: 1,
                        gender: 1,
                        distance_in_meters: 1
                    }
                }
            ];

            // console.time("getCards");
            return User.aggregate(pipeline)
                .then(results2 => {
                    console.log(results2.length);
                    // console.timeEnd("getCards");
                    res.json({
                        status: "success",
                        data: results2,
                        count: results2.length
                    });
                })
                .catch(e => {
                    console.log(e); 
                    res.json(e)}
                    );
        })
        .catch(e => res.json(e));
};
