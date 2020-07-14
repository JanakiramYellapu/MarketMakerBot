const { Order, Position, Wallet, Leverage, BookTicker } = require("../../serializers")
// const APIError = require("../../utils/error")
const { BitmexAPI } = require("bitmex-node")
const BitmexWS = require('bitmex-realtime-api');

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

    resetRateLimit = (delay) => {
        // setTimeout(() => {
        //     this.RATE_LIMIT_BLOCKED = false
        // }, delay);
    }

    futuresBuy = async (symbol, quantity, price, params = {}, callback = false) => {
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

    futuresSell = async (symbol, quantity, price, params = {}, callback = false) => {
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

    futuresMarketBuy = async (symbol, quantity, params = {}, callback = false) => {
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


    futuresMarketSell = async (symbol, quantity, params = {}, callback = false) => {
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
    futuresMarketBuyAsync = async ({symbol, quantity, params}) => {
        return new Promise((resolve, reject) => {
            this.futuresMarketBuy(symbol, quantity, params || {}, (order) => { })
                .then((order => resolve(order.toJSON())))
                .catch(e => reject(e))
        })
    }

    futuresMarketSellAsync = async ({symbol, quantity, params }) => {
        return new Promise((resolve, reject) => {
            this.futuresMarketSell(symbol, quantity, params || {}, (order) => { })
                .then((order => resolve(order.toJSON())))
                .catch(e => reject(e))

        })
    }

    futuresBuyAsync = async ({symbol, quantity, price, params}) => {
        return new Promise((resolve, reject) => {
            this.futuresBuy(symbol, quantity, price, params || {}, (order) => { })
                .then((order => resolve(order.toJSON())))
                .catch(e => reject(e))
        })
    }

    futuresSellAsync = async ({symbol, quantity, price, params}) => {
        return new Promise((resolve, reject) => {
            this.futuresSell(symbol, quantity, price, params || {}, (order) => { })
                .then((order => resolve(order.toJSON())))
                .catch(e => reject(e))
        })
    }

    futuresUpdateLeverage = async (symbol, leverage, params = {}) => {
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

    futuresPosition = async (symbol, params = {}) => {
        try {
            const positions = await this.client.Position.get({ filter: JSON.stringify({ symbol }) })
            return new Position().transformBitmex(positions, symbol)
        } catch (error) {
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

    futuresWallet = async () => {
        try {
            const response = await this.client.User.getWallet()
            return new Wallet().transformBitmex(response)
        } catch (error) {
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresWallet",
                }
            })
        }
    }

    futuresOrderStatus = async (symbol, orderID) => {
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

    futuresCancelOrder = async (symbol, orderID) => {
        try {
            let response = await this.client.Order.cancel({ orderID, symbol })
            if (!response.length) throw new Error("No order with order ID " + orderID)
            response = response.pop()
            return new Order().transformBitmex(response)
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

    futuresCancelAll = async (symbol) => {
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

    futuresOpenOrders = async () => {
        try {
            let response = await this.client.Order.getOrders({ filter: JSON.stringify({ ordStatus: "New" }) })
            return response.map(o => new Order().transformBitmex(o))
        } catch (error) {
            throw new APIError({
                message: error.message,
                name: this.errorBanner,
                meta: {
                    origin: "futuresOpenOrders",
                }
            })
        }
    }
    futuresAllOrders = async (symbol) => {
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

    futuresOrder = async (orderBody, callback = false) => {
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

    futuresClosePosition = async (symbol, options = false, callback = false) => {
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

    futuresClosePositionAsync = async ({symbol, options}) => {
        return new Promise((resolve, reject) => {
            this.futuresClosePosition(symbol, options || {}, (order) => { })
                .then((order => resolve(order.toJSON())))
                .catch(e => reject(e))
        })
    }

    futuresBookTickerStream = async (Symbol, callback) => {
        try {
            if (this.WS_CLOSED)
                this.wsClient.socket.reconnect()
            this.WS_CLOSED = false
            this.wsClient.addStream(Symbol, 'orderBook10', (data, symbol) => {
                callback(new BookTicker().transformBitmex(data, symbol).toJSON())
            });
        } catch (error) {
            throw new APIError(error)
        }
    }

    futuresTerminateBookTickerStream = async (symbol) => {
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

    futuresUserDataStream = async (callback) => {
        try {
            return true
        } catch (error) {
            throw new APIError(error)
        }
    }

    futuresUserStream = async () => {
        try {
            return true
        } catch (error) {
            throw new APIError(error)
        }
    }

    futuresTerminateUserStream = async () => {
        try {
            return true
        } catch (error) {
            throw new APIError(error)
        }
    }

    watchOrder = (orderId, callback) => {
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
module.exports = {
    Bitmex
    // , client, client2
}