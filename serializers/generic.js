class Leverage {
    constructor() {
        this.symbol = null
        this.leverage = null
        this.exchange = null
    }

    // transformBinance = ({ symbol, leverage }) => {
    //     this.symbol = symbol
    //     this.leverage = leverage
    //     this.exchange = "BINANCE"
    //     return this
    // }

    // transformBitmex = ({ symbol, leverage }) => {
    //     this.symbol = symbol
    //     this.leverage = leverage
    //     this.exchange = "BITMEX"
    //     return this
    // }
    // transformFTX = ({ symbol, leverage }) => {
    //     this.symbol = symbol
    //     this.leverage = leverage
    //     this.exchange = "FTX"
    //     return this
    // }
    // toJSON = () => ({
    //     symbol: this.symbol,
    //     leverage: this.leverage,
    //     exchange: this.exchange
    // })
}

class Wallet {
    constructor() {
        this.balance = null
        this.asset = null
        this.exchange = null
    }

    transformBinance = (wallets, asset) => {
        let wallet = wallets.filter(w => w.asset == asset)
        if (!wallet.length)
            throw new Error("No wallet for asset " + asset)
        wallet = wallet.pop()
        this.balance = wallet.balance
        this.asset = wallet.asset
        this.exchange = "BINANCE"
        return this
    }
    
    transformFTX = (wallets, asset) => {
        if (!wallets.result)
            return this
        let wallet = wallets.result.filter(w => w.coin == asset)
        if (!wallet.length)
            return this
        wallet = wallet.pop()
        this.balance = wallet.total
        this.asset = wallet.coin
        this.exchange = "FTX"
        return this
    }

    transformBitmex = (wallet) => {
        this.balance = wallet.amount
        this.asset = wallet.currency
        this.exchange = "BITMEX"
        return this
    }

    transformBitfinex =(wallets, asset) =>{
        let wallet = wallets.result.filter(w => w.currency == asset)
        if (!wallet.length)
            return this
        wallet = wallet.pop()
        this.balance = wallet.amount
        this.asset = wallet.currency
        this.exchange = "BITFINEX"
    }

    toJSON = () => ({
        balance: this.balance,
        asset: this.asset,
        exchange: this.exchange
    })
}

class BookTicker {
    constructor() {
        this.bestBid = null
        this.bestAsk = null
        this.bestBidQty = null
        this.bestAskQty = null
        this.exchange = null
        this.timestamp = null
        this.symbol = null
    }
    transformBinance = (ticker) => {
        this.bestAsk = parseFloat(ticker.bestAsk)
        this.bestBid = parseFloat(ticker.bestBid)
        this.bestBidQty = parseFloat(ticker.bestBidQty)
        this.bestAskQty = parseFloat(ticker.bestAskQty)
        this.symbol = ticker.symbol
        this.timestamp = new Date()
        this.exchange = "BINANCE"
        return this
    }

    transformFTX = (ticker, symbol) => {
        this.bestAsk = ticker.ask
        this.bestBid = ticker.bid
        this.bestBidQty = ticker.bidSize
        this.bestAskQty = ticker.askSize
        this.symbol = symbol
        this.timestamp = new Date(ticker.time*1000)
        this.exchange = "FTX"
        return this
    }
    transformBitmex = (ticker, symbol) => {
        this.bestAsk = parseFloat(ticker[0]["asks"][0][0])
        this.bestBid = parseFloat(ticker[0]["bids"][0][0])
        this.bestBidQty = parseFloat(ticker[0]["bids"][0][1])
        this.bestAskQty = parseFloat(ticker[0]["asks"][0][1])
        this.symbol = symbol
        this.timestamp = new Date(ticker[0].timestamp)
        this.exchange = "BITMEX"
        return this
    }

    transformBitfinex = (ticker, symbol) =>{
        this.bestAsk = ticker[2]
        this.bestBid = ticker[0]
        this.bestBidQty = ticker[1]
        this.bestAskQty = ticker[3]
        this.symbol = symbol
        // this.timestamp = 
        this.exchange = "BITFINEX"
        return this
    }

    toJSON = () => ({
        bestBid: this.bestBid,
        bestAsk: this.bestAsk,
        bestBidQty: this.bestBidQty,
        bestAskQty: this.bestAskQty,
        exchange: this.exchange,
        timestamp: this.timestamp,
        symbol: this.symbol,
    })
}

class SpreadData {
    constructor({
        sourceEntrySide,
        targetEntrySide,
        entrySpread,
        exitSpread,
        shouldEnter,
        shouldExit,
        sourceExitSide,
        targetExitSide,
        sourceEntryLimitPrice,
        targetEntryLimitPrice,
        targetExitLimitPrice,
        sourceExitLimitPrice,
        currentSpread,
        circuitBreaker,

    }) {
        this.sourceEntrySide = sourceEntrySide
        this.targetEntrySide = targetEntrySide
        this.entrySpread = entrySpread
        this.exitSpread = exitSpread
        this.shouldEnter = shouldEnter
        this.shouldExit = shouldExit
        this.currentSpread = currentSpread
        this.sourceExitSide = sourceExitSide
        this.targetExitSide = targetExitSide
        this.sourceEntryLimitPrice = sourceEntryLimitPrice
        this.targetEntryLimitPrice = targetEntryLimitPrice
        this.targetExitLimitPrice = targetExitLimitPrice
        this.sourceExitLimitPrice = sourceExitLimitPrice
        this.circuitBreaker = circuitBreaker
    }

    // entryMeta = () => ({
    //     currentSpread: this.currentSpread,
    //     entrySpread: this.entrySpread,
    //     sourceEntrySide: this.sourceEntrySide,
    //     targetEntrySide: this.targetEntrySide,
    //     sourceEntryLimitPrice: this.sourceEntryLimitPrice,
    //     targetEntryLimitPrice: this.targetEntryLimitPrice,
    // })

    // exitMeta = () => ({
    //     exitSpread: this.exitSpread,
    //     sourceExitSide: this.sourceExitSide,
    //     targetExitSide: this.targetExitSide,
    //     targetExitLimitPrice: this.targetExitLimitPrice,
    //     sourceExitLimitPrice: this.sourceExitLimitPrice,
    //     circuitBreaker: this.circuitBreaker
    // })
}

module.exports = {
    Wallet,
    Leverage,
    BookTicker,
    SpreadData
}