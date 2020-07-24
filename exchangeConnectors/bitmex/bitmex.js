const { Order, Position, Wallet, Leverage, BookTicker } = require("../../serializers")
const APIError = require("../../utils/error")
const { BitmexAPI } = require("bitmex-node")
const BitmexWS = require('bitmex-realtime-api');
const wait = n => new Promise(r => setTimeout(r, n));

class Bitmex {
    constructor({ API_KEY, API_SECRET, testnet, symbol }) {
        this.client = new BitmexAPI({
            apiKeyID: API_KEY,
            apiKeySecret: API_SECRET,
            testnet: testnet ? testnet : false
        })
        this.wsClient = new BitmexWS({
            testnet: testnet ? testnet : false
        })
        this.tifTemplate = {
            "FOK": "FillOrKill",
            "GTC": "GoodTillCancel",
            "IOC": "ImmediateOrCancel"
        }
        this.RATE_LIMIT_DELAY = 50
        this.RATE_LIMIT_BLOCKED = false
        this.symbol = symbol
        this.WS_CLOSED = false
        this.name = "BITMEX"
        this.RATE_LIMIT_MSG = "RateLimitExceeded"
        this.errorBanner = "BitmexClientError"

    }

    // resetRateLimit = (delay) => {
    //     // setTimeout(() => {
    //     //     this.RATE_LIMIT_BLOCKED = false
    //     // }, delay);
    // }

    async futuresBuy(symbol, quantity, price, params = {}, callback = false){
        try {
            if (this.RATE_LIMIT_BLOCKED) {
                throw new Error(this.RATE_LIMIT_MSG)
            }
            const response = await this.client.Order.new({
                symbol,
                orderQty: quantity,
                price,
                ordType: "Limit",
                side: "Buy",
                timeInForce: params.timeInForce ? this.tifTemplate[params.timeInForce] : this.tifTemplate["GTC"]
            })
            let order = new Order().transformBitmex(response)
            if (callback)
                callback(order)
            return order
        } catch (error) {
            if (error.message != this.RATE_LIMIT_MSG) {
                this.RATE_LIMIT_BLOCKED = false
                this.resetRateLimit(this.RATE_LIMIT_DELAY)
                this.RATE_LIMIT_DELAY =
                    this.RATE_LIMIT_DELAY >= 4000
                        ? 4000
                        : this.RATE_LIMIT_DELAY + 10;
            }
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresBuy",
                    data: { symbol, quantity, price, params }
                }
            })
        }
    }

    async futuresSell(symbol, quantity, price, params = {}, callback = false){
        try {
            if (this.RATE_LIMIT_BLOCKED) {
                throw new Error(this.RATE_LIMIT_MSG)
            }
            const response = await this.client.Order.new({
                symbol,
                orderQty: quantity,
                price,
                ordType: "Limit",
                side: "Sell",
                timeInForce: params.timeInForce ? this.tifTemplate[params.timeInForce] : this.tifTemplate["GTC"]
            })
            let order = new Order().transformBitmex(response)
            if (callback)
                callback(order)
            return order
        } catch (error) {
            if (error.message != this.RATE_LIMIT_MSG) {
                this.RATE_LIMIT_BLOCKED = false
                this.resetRateLimit(this.RATE_LIMIT_DELAY)
                this.RATE_LIMIT_DELAY =
                    this.RATE_LIMIT_DELAY >= 4000
                        ? 4000
                        : this.RATE_LIMIT_DELAY + 10;
            }
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresSell",
                    data: { symbol, quantity, price, params }
                }
            })
        }
    }

    async futuresMarketBuy(symbol, quantity, params = {}, callback = false){
        try {
            if (this.RATE_LIMIT_BLOCKED) {
                throw new Error(this.RATE_LIMIT_MSG)
            }
            const response = await this.client.Order.new({
                symbol,
                orderQty: quantity,
                ordType: "Market",
                side: "Buy",
                timeInForce: params.timeInForce ? this.tifTemplate[params.timeInForce] : this.tifTemplate["GTC"]
            })
            let order = new Order().transformBitmex(response)
            if (callback)
                callback(order)
            return order
        } catch (error) {
            if (error.message != this.RATE_LIMIT_MSG) {
                this.RATE_LIMIT_BLOCKED = false
                this.resetRateLimit(this.RATE_LIMIT_DELAY)
                this.RATE_LIMIT_DELAY =
                    this.RATE_LIMIT_DELAY >= 4000
                        ? 4000
                        : this.RATE_LIMIT_DELAY + 10;
            }
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresMarketBuy",
                    data: { symbol, quantity, params }
                }
            })
        }
    }


    async futuresMarketSell(symbol, quantity, params = {}, callback = false){
        try {
            if (this.RATE_LIMIT_BLOCKED) {
                throw new Error(this.RATE_LIMIT_MSG)
            }
            const response = await this.client.Order.new({
                symbol,
                orderQty: quantity,
                ordType: "Market",
                side: "Sell",
                timeInForce: params.timeInForce ? this.tifTemplate[params.timeInForce] : this.tifTemplate["GTC"]
            })
            let order = new Order().transformBitmex(response)
            if (callback)
                callback(order)
            return order
        } catch (error) {
            if (error.message != this.RATE_LIMIT_MSG) {
                this.RATE_LIMIT_BLOCKED = false
                this.resetRateLimit(this.RATE_LIMIT_DELAY)
                this.RATE_LIMIT_DELAY =
                    this.RATE_LIMIT_DELAY >= 4000
                        ? 4000
                        : this.RATE_LIMIT_DELAY + 10;
            }
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresBuy",
                    data: { symbol, quantity, params }
                }
            })
        }
    }
    async futuresMarketBuyAsync({symbol, quantity, params}){
        return new Promise((resolve, reject) => {
            this.futuresMarketBuy(symbol, quantity, params || {}, (order) => { })
                .then((order => resolve(order.toJSON())))
                .catch(e => reject(e))
        })
    }

    async futuresMarketSellAsync({symbol, quantity, params }){
        return new Promise((resolve, reject) => {
            this.futuresMarketSell(symbol, quantity, params || {}, (order) => { })
                .then((order => resolve(order.toJSON())))
                .catch(e => reject(e))

        })
    }

    async futuresBuyAsync({symbol, quantity, price, params}){
        return new Promise((resolve, reject) => {
            this.futuresBuy(symbol, quantity, price, params || {}, (order) => { })
                .then((order => resolve(order.toJSON())))
                .catch(e => reject(e))
        })
    }

    async futuresSellAsync({symbol, quantity, price, params}){
        return new Promise((resolve, reject) => {
            this.futuresSell(symbol, quantity, price, params || {}, (order) => { })
                .then((order => resolve(order.toJSON())))
                .catch(e => reject(e))
        })
    }

    async futuresUpdateLeverage(symbol, leverage, params = {}){
        try {
            const position = await this.futuresPosition(symbol)
            if (position.leverage === leverage)
                return new Leverage().transformBitmex({ leverage, symbol })
            const response = await this.client.Position.updateLeverage({ symbol, leverage })
            return new Leverage().transformBitmex(response)
        } catch (error) {
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresUpdateLeverage",
                    data: { symbol, leverage, params }
                }
            })
        }
    }

    async futuresPosition(symbol, params = {}){
        try {
            // console.log("inside futures-position")
            const positions = await this.client.Position.get({ filter: JSON.stringify({ symbol }) })
            // console.log("pos", positions)
            // console.log("inside futures position")
            // positions.then(function(result) {
            //     console.log(result); 
            //   })
            // console.log(positions)
            return positions
            // return new Position().transformBitmex(positions, symbol)
        } catch (error) {
            console.log("inside error")
            console.log(error)
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresPosition",
                    data: { symbol, params }
                }
            })
        }
    }

    async futuresInstrument(symbol){
        try {
            // console.log("inside futures instrument")
            let matchingInstrument = []
            const response = await this.client.Instrument.getActive()
            // console.log(response[0])
            for(let i = 0; i<response.length;i++){
                if(response[i].symbol == symbol){
                    matchingInstrument.push(response[i])
                }
            }
            if(matchingInstrument.length == 0){
                    throw("Unable to find instrument or index with symbol: " + symbol)}
            let instrument = matchingInstrument[0]
            // console.log("instrument---",instrument)
            instrument.tickLog = 1
            // console.log(instrument)
            return instrument
            // # Turn the 'tickSize' into 'tickLog' for use in rounding
            // # http://stackoverflow.com/a/6190291/832202
            // instrument['tickLog'] = decimal.Decimal(str(instrument['tickSize'])).as_tuple().exponent * -1
            // return new Wallet().transformBitmex(instrument)
        } catch (error) {
                console.log(error)
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresWallet",
                }
            })
        }
    }

    async futuresWallet(){
        try {
            const response = await this.client.User.getWallet()
            // await wait(2*1000)
            return response.data
            // return new Wallet().transformBitmex(response)
        } catch (error) {
                console.log(error)
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresWallet",
                }
            })
        }
    }

    async futuresOrderStatus(symbol, orderID){
        try {
            let response = await this.client.Order.getOrders({ filter: JSON.stringify({ symbol, orderID }) })
            if (!response.length) throw new Error("No order with order ID " + orderID)
            response = response.pop()
            return new Order().transformBitmex(response)
        } catch (error) {
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresOrderStatus",
                }
            })
        }
    }

    async futuresCancelOrder(symbol, orderID){
        try {
            let response = await this.client.Order.cancel({ orderID, symbol })
            if (!response.length) throw new Error("No order with order ID " + orderID)
            response = response.pop()
            return new Order().transformBitmex(response)
        } catch (error) {
            console.log("inside cancel function")
            console.log(error)
            // throw new APIError({
            //     message: error.message,
            //     name: this.errorBanner,
            //     meta: {
            //         origin: "futuresCancelOrder",
            //     }
            // })
        }
    }

    async futuresCancelAll(symbol){
        try {
            let response = await this.client.Order.cancelAll({ symbol })
            return response.map(o => new Order().transformBitmex(o))
        } catch (error) {
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresCancelOrder",
                }
            })
        }
    }

    async futuresOpenOrders(){
        try {
            console.log("inside openorders")
            let response = await this.client.Order.getOrders({ filter: JSON.stringify({ ordStatus: "New" }) })
            // console.log(response)
            let open =  response.map(o => new Order().transformBitmex(o))
            console.log("**************************")
            // console.log(open[0].side)
            return open
        } catch (error) {
            console.log("inside futuresOpenOrders", error)
            // throw new APIError({
            //     message: error.message,
            //     name: this.errorBanner,
            //     meta: {
            //         origin: "futuresOpenOrders",
            //     }
            // })
        }
    }
    async futuresAllOrders(symbol){
        try {
            let response = await this.client.Order.getOrders({ symbol })
            return response.map(o => new Order().transformBitmex(o))
        } catch (error) {
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresAllOrders",
                }
            })
        }
    }

    async futuresOrder(orderBody, callback = false){
        try {
            if (this.RATE_LIMIT_BLOCKED) {
                throw new Error(this.RATE_LIMIT_MSG)
            }
            if (orderBody.timeInForce)
                orderBody.timeInForce = orderBody.timeInForce ? this.tifTemplate[orderBody.timeInForce] : this.tifTemplate["GTC"]
            const response = await this.client.Order.new(orderBody)
            let order = new Order().transformBitmex(response)
            if (callback)
                callback(order)
            return order
        } catch (error) {
            if (error.message != this.RATE_LIMIT_MSG) {
                this.RATE_LIMIT_BLOCKED = false
                this.resetRateLimit(this.RATE_LIMIT_DELAY)
                this.RATE_LIMIT_DELAY =
                    this.RATE_LIMIT_DELAY >= 4000
                        ? 4000
                        : this.RATE_LIMIT_DELAY + 10;
            }
            throw new APIError({
                message: error.message,
                stack: error.stack,
                name: this.errorBanner,
                meta: {
                    origin: "futuresOrder",
                    data: orderBody
                }
            })
        }
    }

    async futuresClosePosition(symbol, options = false, callback = false){
        try {
            if (this.RATE_LIMIT_BLOCKED) {
                throw new Error(this.RATE_LIMIT_MSG)
            }
            const position = await this.futuresPosition(symbol)
            if (!position.isOpen)
                throw new Error("NO_POSITION")
            if (!options || (options.type == "MARKET" && !options.partial)) {
                let response = await this.client.Order.closePosition({ symbol })
                let order = new Order().transformBitmex(response)
                if (callback) callback(order)
                return order
            }
            const counterOrder = position.prepareCounterOrderBitmex(options)
            return await this.futuresOrder({ symbol, ...counterOrder }, callback)
        } catch (error) {
            if (error.message != this.RATE_LIMIT_MSG) {
                this.RATE_LIMIT_BLOCKED = false
                this.resetRateLimit(this.RATE_LIMIT_DELAY)
                this.RATE_LIMIT_DELAY =
                    this.RATE_LIMIT_DELAY >= 4000
                        ? 4000
                        : this.RATE_LIMIT_DELAY + 10;
            }
            throw new APIError({
                message: error.message,
                stack: error.stack,
                name: this.errorBanner,
                meta: {
                    origin: "futuresClosePosition",
                    data: options
                }
            })
        }
    }

    async futuresClosePositionAsync({symbol, options}){
        return new Promise((resolve, reject) => {
            this.futuresClosePosition(symbol, options || {}, (order) => { })
                .then((order => resolve(order.toJSON())))
                .catch(e => reject(e))
        })
    }

    async getTicker(symbol){
        // '''Return a ticker object. Generated from instrument.'''

        let instrument = await this.futuresInstrument(symbol)
        // console.log(instrument)
        let ticker = {}
        // # If this is an index, we have to get the data from the last trade.
        if(instrument['symbol'][0] == '.'){
            ticker = {}
            ticker['mid'] = ticker['buy'] = ticker['sell'] = ticker['last'] = instrument['markPrice']
        }
        // # Normal instrument
        else {
            let bid = instrument['bidPrice'] || instrument['lastPrice']
            let ask = instrument['askPrice'] || instrument['lastPrice']
            ticker = {
                "last": instrument['lastPrice'],
                "buy": bid,
                "sell": ask,
                "mid": (bid + ask) / 2
            }
        }
        // console.log("ticker",ticker)
        return ticker
    }

    async futuresBookTickerStream(Symbol, callback){
        try {
            if (this.WS_CLOSED)
                this.wsClient.socket.reconnect()
            this.WS_CLOSED = false
            this.wsClient.addStream(Symbol, 'orderBook10', (data, symbol) => {
                console.log(data)
                callback(new BookTicker().transformBitmex(data, symbol).toJSON())
            });
        } catch (error) {
            throw new APIError(error)
        }
    }

    async futuresTerminateBookTickerStream(symbol){
        try {
            this.wsClient.socket.instance.removeAllListeners()
            delete this.wsClient.listenerTree.open
            delete this.wsClient.listenerTree.orderBook10
            delete this.wsClient._listenerTree.orderBook10
            delete this.wsClient._data.orderBook10
            delete this.wsClient._keys.orderBook10
            this.wsClient.event = "newListener"
            this.WS_CLOSED = true
            return true
        } catch (error) {
            throw new APIError(error)
        }
    }

    async futuresUserDataStream(callback){
        try {
            return true
        } catch (error) {
            throw new APIError(error)
        }
    }

    async futuresUserStream(){
        try {
            return true
        } catch (error) {
            throw new APIError(error)
        }
    }

    async futuresTerminateUserStream(){
        try {
            return true
        } catch (error) {
            throw new APIError(error)
        }
    }

    watchOrder(orderId, callback){
        try {
            return true
        } catch (error) {
            throw new APIError(error)
        }
    }

}

// let client = new Bitmex({
//     API_KEY: "2k7Xq-H13ljGKBicX__G7KQN",
//     API_SECRET: "LjfN2f8Dx69S3_uF1csXyZHih0mNMe3gSWKggpocL1_o9chr",
//     testnet: true
// })

// let client2 = new Bitmex({
//     API_KEY: "2auyiqeBsg0mjsFvz6btoOV5",
//     API_SECRET: "bbVRdh_L_5pZ1tE7iXo7AyJxURmwFmx0Mp6GADcjG48w4APt",
//     testnet: true
// })



let client = new Bitmex({
    API_KEY: "ZLxQoSxYmpMOXT_M_STHudMV",
    API_SECRET: "PWeh1XiJ8kg_139lNq6LvJB6AB3vR1pHbF3Dqj07x2IuqXtZ",
    testnet: true,
    symbol:"XBTUSD"
})
function  run(){
    //  client.futuresBuy(symbol="XBTUSD", quantity=100,price=8900).then(function(result) {
    //     console.log(result); // "normalReturn"
    //   })
     client.futuresSell(symbol="XBTUSD", quantity=50,price=9050).then(function(result) {
        console.log(result); // "normalReturn"
      })
    // client.futuresMarketBuyAsync(symbol="XBTUSD", quantity=100).then(function(result) {
    //     console.log(result); // "normalReturn"
    //   })
    // client.futuresUpdateLeverage("BTCUSDT",1,1)
    // client.futuresPosition("XBTUSD")
    // client.futuresInstrument("XBTUSD").then(function(result) {
            // console.log(result); 
        //   })
    // client.futuresOrderStatus("BTCUSDT",117993)
    // client.futuresCancelOrder("BTCUSDT",117993)
    // client.futuresCancelAll("BTCUSDT")
    // client.futuresOpenOrders("BTCUSDT")
    // client.futuresAllOrders("BTCUSDT")
    // client.futuresBookTickerStream("XBTUSD")
    // client.futuresTerminateBookTickerStream("BTCUSDT")
    // client.futuresClosePosition("BTCUSDT")
    // client.futuresWallet(coin="BTC")


}
// run()




module.exports = {
    Bitmex
    // , client, client2
}