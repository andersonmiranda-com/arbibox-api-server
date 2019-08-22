db.getCollection('opportunities').aggregate([
   { $match: { type: "TR"} } ,
   { $sort : {id: 1}},   
   {
      $project: {
         created_at: 1,
          exchange: 1,
          base: 1,
          ticket1: 1,
          ticket2: 1,
          ticket3: 1,
          profit: 1,
          repeat: { $size: "$lastest" }, 
      }
   },   

] )