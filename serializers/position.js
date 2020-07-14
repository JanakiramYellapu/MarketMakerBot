class Position {
    constructor() {
        this.markPrice = 0
        this.isOpen = false
        this.size = 0
        this.entryPrice = 0
        this.symbol = null
        this.side = null
        this.uPNL = null
        this.liquidationPrice = null
        this.leverage = null
    }

    transformBinance = (positions, symbol) => {
        positions = positions.reduce((out, i) => ((out[i.symbol] = i), out), {})
        if (!positions[symbol]) {
            return this
        }
        let position = positions[symbol]
        let pAmount = parseFloat(position.positionAmt)
        if (pAmount === 0) {
            this.isOpen = false
            return this
        }
        this.isOpen = true
        this.side = pAmount > 0 ? 'BUY' : 'SELL'
        this.size = Math.abs(pAmount)
        this.entryPrice = parseFloat(position.entryPrice)
        this.leverage = parseFloat(position.leverage)
        this.liquidationPrice = parseFloat(position.liquidationPrice)
        this.liquidationPrice = this.side === "BUY" ? 
            this.entryPrice * (1 - (1/this.leverage - 0.02)):
            this.entryPrice * (1 + (1/this.leverage - 0.02))
        this.markPrice = parseFloat(position.markPrice)
        this.uPNL = parseFloat(position.unRealizedProfit)
        this.liquidationPrice = parseInt(this.liquidationPrice)
        this.symbol = symbol
        return this
    }

    prepareCounterOrderBinance = (options) => {
        let order = {}
        if (options.quantityFraction) {
            options.quantity = (this.size / options.quantityFraction).toFixed(3)
        }
        order.quantity = options.quantity || this.size
        if (order.quantity > this.size)
            throw new Error("Counter order size is more than position size")
        order.side = this.side == "BUY" ? "SELL" : "BUY"
        order.price = options.price ? order.side == "BUY" ?
            options.price + options.premimumMargin :
            options.price - options.premimumMargin :
            false

        order.params = options.params ? options.params : {}
        if (options.timeInForce)
            order.params.timeInForce = options.timeInForce
        return order
    }

    transformFTX = (positions, leverage, symbol) => { 
        if(!positions.result || !positions.success)
            return this 
        let position = positions.result.filter(p => p.future === symbol)
        if (!position.length) {
            return this
        }
        position = position.pop()
        if (position.size === 0) 
            return this
        let pAmount = position.size
        this.isOpen = true
        this.side = position.side.toUpperCase()
        this.size = Math.abs(pAmount)
        this.entryPrice = position.recentAverageOpenPrice
        this.leverage = leverage
        this.liquidationPrice = this.side === "BUY" ? 
            this.entryPrice * (1 - (1/this.leverage - 0.02)):
            this.entryPrice * (1 + (1/this.leverage - 0.02))

        this.liquidationPrice = parseInt(this.liquidationPrice)
        this.markPrice = null
        this.uPNL = position.unrealizedPnl
        this.symbol = symbol
        return this
    }

    transformBitmex = (positions, symbol) => {
        let position = positions.filter(p => p.symbol === symbol)
        if (!position.length) {
            return this
        }
        position = position.pop()
        if (!position.isOpen) {
            return this
        }
        let pAmount = parseFloat(position.currentQty)
        this.isOpen = position.isOpen
        this.side = pAmount > 0 ? 'BUY' : 'SELL'
        this.size = Math.abs(pAmount)
        this.leverage = parseFloat(position.leverage)
        this.entryPrice = parseFloat(position.avgEntryPrice)
        this.liquidationPrice = this.side === "BUY" ? 
            this.entryPrice * (1 - (1/this.leverage - 0.02)):
            this.entryPrice * (1 + (1/this.leverage - 0.02))
        this.liquidationPrice = parseInt(this.liquidationPrice)
        this.markPrice = parseFloat(position.markPrice)
        this.uPNL = parseFloat(position.unrealisedPnl)
        this.symbol = symbol
        return this
    }

    prepareCounterOrderBitmex = (options) => {
        let order = {}
        if (options.quantityFraction) {
            options.quantity = parseInt(this.size / options.quantityFraction)
        }
        order.orderQty = options.quantity ? options.quantity : this.size
        order.ordType = "Market"
        order.side = this.side == "BUY" ? "Sell" : "Buy"
        if (order.orderQty > this.size)
            throw new Error("Counter order size is more than position size")
        if (options.price) {
            order.price = order.side == "Buy" ?
                options.price + options.premimumMargin :
                options.price - options.premimumMargin
            order.ordType = "Limit"
        }
        if (options.timeInForce)
            order.timeInForce = options.timeInForce
        return order
    }

    prepareCounterOrderFTX = (options) => {
        let order = {}
        options.premimumMargin = options.premimumMargin || 0
        if (options.quantityFraction) {
            options.quantity = (this.size / options.quantityFraction).toFixed(3)
        }
        order.quantity = options.quantity || this.size
        if (order.quantity > this.size)
            throw new Error("Counter order size is more than position size")
        order.side = this.side == "BUY" ? "SELL" : "BUY"
        order.price = options.price ? order.side == "BUY" ?
            options.price + options.premimumMargin :
            options.price - options.premimumMargin :
            null

        order.params = options.params ? options.params : {}
        if (options.timeInForce)
            order.params.timeInForce = options.timeInForce
        return order
    }

    transformQume = () => { }

    // transformBitfinex = ()=>{}

    toJSON = () => ({
        markPrice: this.markPrice,
        isOpen: this.isOpen,
        size: this.size,
        entryPrice: this.entryPrice,
        symbol: this.symbol,
        side: this.side,
        uPNL: this.uPNL,
        liquidationPrice: this.liquidationPrice,
        leverage: this.leverage
    })
}

module.exports = Position