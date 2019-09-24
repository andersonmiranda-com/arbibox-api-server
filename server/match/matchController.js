// Import contact model
const Match = require("./matchModel");
const mongoose = require("mongoose");

exports.save = function(req, res) {
    let { userId, itemId } = req.body;
    userId = mongoose.Types.ObjectId(userId);
    itemId = mongoose.Types.ObjectId(itemId);

    console.log("match", userId, itemId);

    Match.create({ match: [userId, itemId], createdAt: new Date(), lastMessage: { text: "" } })
        .then(res => res.json({ status: "ok" }))
        .catch(err => res.json({ status: "error", message: err }));
};

exports.getMatches = function(req, res) {
    let userId = req.body.userId;
    userId = mongoose.Types.ObjectId(userId);
    const pipeline = [
        { $match: { match: userId } },
        { $unwind: "$match" },
        { $match: { match: { $ne: userId } } },

        //procura dados do usuário
        {
            $lookup: {
                from: "users",
                localField: "match",
                foreignField: "_id",
                as: "userDetails"
            }
        },

        // poe likes como campo do objeto
        {
            $addFields: { userData: { $arrayElemAt: ["$userDetails", 0] } }
        },

        // define que campos devolver
        {
            $project: {
                lastMessage: 1,
                LastMessageDate: 1,
                "userData._id": 1,
                "userData.first_name": 1,
                "userData.last_name": 1,
                "userData.image": 1
            }
        }
    ];

    Match.aggregate(pipeline)
        .then(results => {
            console.log("matches", results.length);
            res.json(results);
        })
        .catch(e => {
            console.log(e);
            res.json(e);
        });
};
