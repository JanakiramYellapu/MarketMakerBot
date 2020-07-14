class Order {
    constructor(options = {}) {
        this.orderId = options.orderId || 0
        this.quantity = options.quantity || 0
        this.price = options.price || 0
        this.symbol = options.symbol || null
        this.side = options.side || null
        this.type = options.type || null
        this.status = options.status || null
        this.timeInForce = options.timeInForce || null
        this.timestamp = options.time || null
        this.exchange = null
        this.baseQuantity = 0
        this.et = null
    }

    transformBinance = (order) => {
        this.orderId = order.orderId
        this.symbol = order.symbol
        this.price = parseFloat(order.avgPrice)
        this.quantity = parseFloat(order.origQty)
        this.baseQuantity = this.quantity
        this.side = order.side
        this.status = order.status == "EXPIRED" ? "CANCELED" : order.status
        this.type = order.type
        this.timeInForce = order.timeInForce
        this.timestamp = new Date(order.updateTime)
        this.exchange = "BINANCE"
        return this
    }

    transformBinanceWS = (order, eventTime) => {
        if (this.id && this.id > eventTime) {
            return this
        }
        this.orderId = order.i
        this.symbol = order.s
        this.price = parseFloat(order.ap)
        this.quantity = parseFloat(order.q)
        this.baseQuantity = this.quantity
        this.side = order.S
        this.status = order.X == "EXPIRED" ? "CANCELED" : order.X
        this.type = order.o
        this.timeInForce = order.f
        this.timestamp = new Date(order.T)
        this.exchange = "BINANCE"
        this.et = eventTime
        return this
    }

    transformFTX = (order) => { 
        if(!order.success)
            throw new Error(`Failed while placing order ${JSON.stringify(order)}`)
        this.orderId = order.result.id
        this.symbol = order.result.future || order.result.market
        this.price = order.result.avgFillPrice
        this.quantity = order.result.size
        this.baseQuantity = this.quantity
        this.side = order.result.side.toUpperCase()
        if (order.result.filledSize === this.quantity)
            this.status = "FILLED"
        else if (order.result.status === "closed")
            this.status = "CANCELED"
        else
            this.status = order.result.status.toUpperCase()
        this.type = order.result.type.toUpperCase()
        this.timeInForce = order.result.ioc ? "FOK" : "GTC"
        this.timestamp = new Date(order.result.createdAt)
        this.exchange = "FTX"
        return this
    }

    transformBitmex = (order) => {
        const tifTemplate = {
            "FillOrKill": "FOK",
            "GoodTillCancel": "GTC",
            "ImmediateOrCancel": "IOC"
        }
        this.orderId = order.orderID
        this.symbol = order.symbol
        this.price = order.avgPx || order.price
        this.quantity = parseFloat(order.orderQty)
        this.baseQuantity = this.price ? parseFloat((this.quantity / this.price).toFixed(3)) : 0
        this.side = order.side.toUpperCase()
        this.status = order.ordStatus.toUpperCase()
        this.type = order.ordType.toUpperCase()
        this.timeInForce = tifTemplate[order.timeInForce]
        this.timestamp = new Date(order.timestamp)
        this.exchange = "BITMEX"
        return this
    }

    transformQume = () => { }

    transformBitfinex = (order)=>{
        this.orderId = order.id
        this.symbol = order.symbol
        this.price = parseFloat(order.price)
        // this.quantity = parseFloat(order.q)
        // this.baseQuantity = this.quantity
        this.side = order.side
        if(order.is_live)
            this.status = "LIVE"
        else if(order.is_cancelled)
            this.status = "CANCELLED"
        else if(order.is_hidden)
            this.status = "HIDDEN"
        this.type = order.type
        this.timeInForce = order.f
        this.timestamp = new Date(order.timestamp)
        this.exchange = "BITFINEX"
        // this.et = eventTime
        return this
    }

    toJSON = () => ({
        orderId: this.orderId,
        quantity: this.quantity,
        price: this.price,
        symbol: this.symbol,
        side: this.side,
        type: this.type,
        status: this.status,
        timeInForce: this.timeInForce,
        timestamp: this.timestamp,
        exchange: this.exchange,
        baseQuantity: this.baseQuantity,
        et: this.et
    })


}


module.exports = Order