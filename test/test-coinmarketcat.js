const axios = require("axios");
const configs = require("../config/settings-arbitrage");

axios
    .get("https://api.coinmarketcap.com/v1/ticker/?limit=0")
    .then(response => {
        console.log(response.data);

        response.data.map(currency => {
            console.log(currency.rank, currency.symbol);
        });
    })
    .catch(error => {
        console.log(error);
    });
