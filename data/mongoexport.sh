#!/bin/bash

lastday=$(expr $1 - 1)
nextday=$(expr $1 + 1)

query1="2019-${2}-${1}T00:00:00Z"
query2="2019-${2}-${nextday}T00:00:00Z"

fields="opp_created_at,symbol,base,quote,buy_at,sell_at,invest.min.base,invest.min.quote,invest.min.profit,invest.min.profit_percent,invest.max.base,invest.max.quote,invest.max.profit,invest.max.profit_percent,profit_loop_percent"

query="{type:'PA', \$and: [ {opp_created_at :{ \$gt: new Date('${query1}')}}, {opp_created_at :{ \$lt: new Date('${query2}')}}]}"

echo $query

mongoexport -h 94.237.66.87 --db arbibox --collection opportunities --type=csv --fields $fields --out orders-singapore-2019-$2-$1.csv --query "${query}"

