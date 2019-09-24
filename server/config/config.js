const config = {
    //env: process.env.NODE_ENV || "production",
    env: process.env.NODE_ENV || "develop",
    port: process.env.PORT || 3000,
    mongo: {
        host: "mongodb://localhost/arbibox",
        port: 27017
    }
};

if (config.env === "production") {
    config.mongo.host =
        "mongodb+srv://andersonmiranda:6jxHNO7KHO3FeRXE@cluster0-dx3cd.mongodb.net/bless";
}

module.exports = config;
