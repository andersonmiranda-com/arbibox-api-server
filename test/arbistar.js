const http = require("http");
var request = require("request");
const { Parser } = require("json2csv");
const colors = require("colors");
const fs = require("fs");
var mongo = require("mongodb");

var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";

const token =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE1NjUwNzcxNjcsImV4cCI6MTU2NTA4MDc2Nywicm9sZXMiOlsiUk9MRV9VU0VSIl0sInVzZXJuYW1lIjoiYW5kZXJzb25taXJhbmRhIiwidXNlcl9pZCI6MjU3ODF9.iPO5hGP_Hd7X8L8Y6489aSdvOIKX6AJ8ypp0Rah7g-uuxa6oFBi42lDQnnXHI-EhecvYdFbUzCG-KaqU_LcoC7HNqt-oMbZpRP9nq_F8Dz_cJWGmdqATCMyUrjc9QqcjciGrRNrAC57-ZpiuNFqgWUY4l4Lz8dQA0wKnVaxdaQ-Ag7q9bNCnXR0dSZ9ZDTSgafToDxcaD4aDpGTOeiwqIID7rBSXhmimmC6swJ4rLGF7NRnVCj7QQN2bonr9zsLdEUHEOs0TuK9NbRn02Q0DaJF7UJJsMEydNfHTe-zx3EGcFJSZoFxmXSCDWNbyFV6Fsc_9BsWI1n2DiOqtJ1co6SD8k6FJfIAZyblrJhJhaQLXiaySuEpPwCF9WYpWY9aRC6M2ic0zmNp_HojIvKAr4E1Qb2YXlmmPObiJuELnDLmExLdV1dP--2VsOY4sU-T--y_w6DaVB2hPNqQ34ZIaXDTbvXkvEu7qugUC6M9w_7242a4JPldSW_wWmNjzC-aSh4zER1LUm1qC5-zWzuSwpvwkj6DW4alBXL9M-KJlKM43uWvl4BMbT217TI4sUb7J7zsFByvtRJVKwMag_hsyFqcHwH-2GLU9H4YC9qkkGVlpRbg1Jpp2degL7QDUNxIGfaqmMdAMCD0H8TTvsP82hfXDBeR80Z59GIcJeAoXTfI";

const options2 = {
    uri: "http://community.arbistar.com:3000/community-bot",
    method: "GET",
    headers: {
        Origin: "https://app.arbistar.com",
        "access-control-allow-origin": "*",
        "x-request-url": "http://community.arbistar.com:3000/community-bot",
        "x-final-url": "http://community.arbistar.com:3000/community-bot",
        Authorization: `Bearer ${token}`
    }
};

function toCsv(data) {
    const fields = [
        "id",
        "price",
        "date",
        "dateJS",
        "quantity",
        "total",
        "type",
        "exchange",
        "currency"
    ];
    const opts = { fields, header: false };
    const json2csvParser = new Parser(opts);

    let jsonData = JSON.stringify(data);

    try {
        let csv = json2csvParser.parse(data) + "\r\n";
        fs.appendFile("data/arbistar.csv", csv, function(err) {
            if (err) throw err;
        });
        fs.appendFile("data/arbistar.json", jsonData + ",\r\n", function(err) {
            if (err) throw err;
        });
    } catch (error) {
        console.error(colors.red("Error:"), error.message);
    }
}

function saveLine(data) {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("arbibox");
        dbo.collection("arbistar").update(
            { id: data.id, price: data.price },
            data,
            { upsert: true },
            function(err, res) {
                if (err) throw err;
                console.log(res.result);
                db.close();
            }
        );
    });
}

function doRequest() {
    try {
        request(options2, function(err, res, body) {
            console.log(body);

            if (typeof body !== "undefined" && body) {
                var bodyValues = JSON.parse(body);
                bodyValues.map(line => {
                    line.dateJS = new Date(line.date);
                    //toCsv(line);
                    saveLine(line);
                });
            }
        });
    } catch (error) {
        console.error(colors.red("Error:"), name);
    }
}

setInterval(function() {
    doRequest();
}, 1000 * 3);
