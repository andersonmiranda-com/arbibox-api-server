db.getCollection("orders")
    .find({}, { _id: 0, created_at: 1, buy_at: 1, sell_at: 1, symbol: 1, profit1: 1 })
    .sort({ created_at: -1 });
