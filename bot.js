const config = require('./config')
const bitMex = require('./exchangeConnectors/bitmex/bitmex')
var Promise = require('promise');
const math = require('mathjs')
const wait = n => new Promise(r => setTimeout(r, n));

// const bybit = require('./exchangeConnectors/bybit')
// console.log()

class ExchangeInterface {
    constructor(dry_run = "False") {
        this.dry_run = config.DRY_RUN
        this.symbol = config.SYMBOL
        console.log(this.symbol)
        // this.exchange = await exchanges(exchangeName)
        // this.bitmex = bitmex.Bitmex(base_url = config.BASE_URL, symbol = this.symbol,
            // apiKey = config.API_KEY, apiSecret = config.API_SECRET,
            // orderIDPrefix = config.ORDERID_PREFIX, postOnly = config.POST_ONLY,
            // timeout = config.TIMEOUT)
        this.bitmex = new bitMex.Bitmex({
                                   API_KEY:config.API_KEY, 
                                    API_SECRET:config.API_SECRET,
                                    testnet: this.dry_run,
                                    symbol:this.symbol
                                        })  
         }

    async get_instrument(symbol = "None") {
        if (symbol === "None") {
            symbol = this.symbol
            return await this.bitmex.futuresInstrument(symbol)
        }
    }

    async check_if_orderbook_empty() {
        // """This function checks whether the order book is empty"""
        let instrument = await  this.get_instrument()
        // console.log(instrument)
        if (instrument['midPrice'] === "None") {
            throw errors.MarketEmptyError("Orderbook is empty, cannot quote")
        }
        else{
            console.log(`order book not empty and midPrice ${instrument['midPrice']}`)
        }
    }

    async check_market_open() {
        let instrument = await   this.get_instrument()
        if (instrument['state'] !== "Open" && instrument['state'] !== "Close") {
                throw(`The instrument ${this.symbol} is not open State: ${instrument['state']}`)
            // throw errors.MarketClosedError(`The instrument ${this.symbol} is not open State: ${instrument['state']}`)
        }else{
            console.log("market open")
        }
        console.log("ss")
    }
    async get_ticker(symbol = "None") {
        if (symbol === "None") {
            symbol = this.symbol
            let ticker = await this.bitmex.getTicker(symbol)
            console.log("ticker ",ticker)
            return ticker
        }

    }
    get_orders(){
        // if(this.dry_run)
            //   return []
        return this.bitmex.futuresOpenOrders()
    }
       

    async get_highest_buy(){
        console.log("inside get highest buy")
        let buys = await  this.get_orders()
        let temp = []
        for(let data of buys){
            if(data.side == "BUY"){
                temp.push(data.price)
            }
        }
        // console.log(temp)
        if(!temp.length){
            console.log("buys legth zero")
            return  (-math.pow(2,32))
        }
        let highest_buy = math.max(temp)
        let high =  highest_buy ? highest_buy :  (-math.pow(2,32))
        console.log("highest buy=",high)
        return high
    }

    async get_lowest_sell(){
        let buys = await  this.get_orders()
        let temp = []
        for(let data of buys){
            if(data.side == "SELL"){
                temp.push(data.price)
            }
        }
        // console.log(temp)
        if(!temp.length){
            console.log("sell legth zero")
            return  math.pow(2,32)
        }
        let lowest_sell = math.min(temp)
        let low =  lowest_sell ? lowest_sell :  math.pow(2,32)
        console.log("lowest sell=",low)
        return low
    }

    async get_position(symbol="None"){
        if(symbol == "None"){
            symbol = this.symbol
        }
        // console.log("inside get-position")
        let pos = await this.bitmex.futuresPosition(symbol)//[0].currentQty
        console.log(pos[0].currentQty)
        return pos[0].currentQty
    }

    async get_delta(symbol="None"){
        if(symbol == "None"){
            symbol = this.symbol
        }
        let qty = await this.get_position(symbol)
        // console.log("curren-qty",qty)
        return qty//[0].currentQty
    }

    async cancel_all_orders(){
        // if(this.dry_run){
        //      return
        // }
        console.log("Resetting current position. Cancelling all existing orders.");
        let temp = await this.get_instrument()
        let tickLog = temp['tickLog']
        // # In certain cases, a WS update might not make it through before we call this.
        // # For that reason, we grab via HTTP to ensure we grab them all.
        let orders = await this.bitmex.futuresOpenOrders()//http_open_orders()
        // console.log("@@@@@@@@@@@@@@@@@@@@@",orders)
        for(let order of orders){
            console.log(order)
            console.log(`Cancelling: ${order['side']} ${order['orderQty']} ${tickLog} ${order['price']} `);
        }
        console.log("orders-length",orders.length)
        if(orders.length){
            for(let order of orders){
                this.bitmex.futuresCancelOrder(this.symbol,order['orderID'])
            }
        }
        // sleep(config.API_REST_INTERVAL)
    }


}
class OrderManager {
    constructor() {
        this.exchange = new ExchangeInterface()
        // this.instrument = this.exchange.get_instrument()
        this.start_time = new Date()
        // console.log(this.start_time)
        this.instrument = this.exchange.get_instrument()
        // console.log(this.instrument)
        this.starting_qty = this.exchange.get_delta()
        this.running_qty = this.starting_qty
        // console.log("runn",this.running_qty)
        this.reset()
    }


    reset(){
        this.exchange.cancel_all_orders()
        // this.sanity_check()
    }

    async sanity_check() {

        //  Check if OB is empty - if so, can't quote.
        this.exchange.check_if_orderbook_empty()

        //  Ensure market is still open.
        this.exchange.check_market_open()

        // # Get ticker, which sets price offsets and prints some debugging info.
        let ticker = await this.get_ticker()
        // console.log(ticker)

        // # Sanity check:
        // let get = await this.get_price_offset(-1)
        // console.log("=========get",get)
        if(this.get_price_offset(-1) >= ticker["sell"] || this.get_price_offset(1) <= ticker["buy"]){
            console.log("**************************************inside get-price-offset********************")
            console.log(`Buy: ${this.start_position_buy} Sell: ${this.start_position_sell}`);
            console.log(`First buy position: ${this.get_price_offset(-1)} Bitmex Best Ask: ${ticker["sell"]} First sell position: ${this.get_price_offset(1)} Bitmex Best Bid: ${ticker["buy"]}`)            
            console.log("Sanity check failed, exchange data is inconsistent");            
            process.exit(1)
        }

        // # Messaging if the position limits are reached
        if(await this.long_position_limit_exceeded()){
            console.log("Long delta limit exceeded");
            console.log(`Current Position: ${this.exchange.get_delta()} Maximum position: ${config.MAX_POSITION}`)            
        }
        else{
            console.log("long position limit not exceeded")
        }

        if(await this.short_position_limit_exceeded()){
            console.log("Short delta limit exceeded");
            console.log(`Current Position: ${this.exchange.get_delta()} Maximum position: ${config.MIN_POSITION}`)            
        }
        else{
            console.log("short position limit not exceeded")
        }


    }


    async get_ticker() {
        let ticker = await this.exchange.get_ticker()
        let tickLog = await this.exchange.get_instrument()['tickLog']
        this.instrument = await this.exchange.get_instrument()

        //  Set up our buy & sell positions as the smallest possible unit above and below the current spread
        //  and we'll work out from there. That way we always have the best price but we don't kill wide
        //  and potentially profitable spreads.
        // console.log("====>",ticker["buy"]) //+ this.instrument['tickSize'])
        this.start_position_buy = ticker["buy"] + this.instrument['tickSize']
        this.start_position_sell = ticker["sell"] - this.instrument['tickSize']
        console.log("----->",this.start_position_buy)
        console.log("----->",this.start_position_sell)
        // // # If we're maintaining spreads and we already have orders in place,
        // // # make sure they're not ours. If they are, we need to adjust, otherwise we'll
        // // # just work the orders inward until they collide.
        if(config.MAINTAIN_SPREADS){
            console.log("inside maintain spreads")
            if(ticker['buy'] == this.exchange.get_highest_buy()){
                this.start_position_buy = ticker["buy"]
                console.log("pr")
                }
            if(ticker['sell'] == this.exchange.get_lowest_sell()){
                this.start_position_sell = ticker["sell"]
                console.log("pr")
                }
        }

        // # Back off if our spread is too small.
        if(this.start_position_buy * (1.00 + config.MIN_SPREAD) > this.start_position_sell){
            this.start_position_buy *= (1.00 - (config.MIN_SPREAD / 2))
            this.start_position_sell *= (1.00 + (config.MIN_SPREAD / 2))
        }

        // # Midpoint, used for simpler order placement.
        this.start_position_mid = ticker["mid"]
        console.log(`Start Position: Buy: ${this.start_position_buy}, Sell: ${this.start_position_sell}, Mid:${this.start_position_mid}`);
        
        return ticker
               
    }

    async get_price_offset(index){
        console.log("index =>",index)
        if(index<0){
            console.log("negative")
        }
        // """Given an index (1, -1, 2, -2, etc.) return the price for that side of the book.
        //    Negative is a buy, positive is a sell."""
        // # Maintain existing spreads for max profit
        let start_position
        if(config.MAINTAIN_SPREADS){
            if(index<0){
                // console.log("debug")
                // console.log("start_position_buy",this.start_position_buy)
                 start_position = this.start_position_buy
                index =  index + 1
            }
            else{
                 start_position = this.start_position_sell
                index =  index - 1
            }
            // # First positions (index 1, -1) should start right at start_position, others should branch from there
            // let index = index < 0 ? index + 1 : index - 1
        }
        else{
            // # Offset mode: ticker comes from a reference exchange and we define an offset.
            let start_position = index < 0 ? this.start_position_buy : this.start_position_sell

            // # If we're attempting to sell, but our sell price is actually lower than the buy,
            // # move over to the sell side.
            if(index > 0 &&  start_position < this.start_position_buy){
                start_position = this.start_position_sell
            }
            // # Same for buys.
            if(index < 0 && start_position > this.start_position_sell){
                start_position = this.start_position_buy
            }
        }
        // await wait(3*1000)
        // console.log("start-position",start_position)
        // console.log("index",index)

        let temp = (start_position * (math.pow((1 + config.INTERVAL), index)))
        // console.log(start_position,"get offset value")//, temp, " index ",index)
        return temp//, this.instrument['tickSize'])
    }

    // # Position Limits

    async short_position_limit_exceeded(){
        // """Returns True if the short position limit is exceeded"""
        if(!config.CHECK_POSITION_LIMITS){
            return false
        }
        let position = await this.exchange.get_delta()
        return (position <= config.MIN_POSITION)
    }

    async long_position_limit_exceeded(){
        // """Returns True if the long position limit is exceeded"""
        if(!config.CHECK_POSITION_LIMITS){
            return false
        }
        let position = await this.exchange.get_delta()
        return (position >= config.MAX_POSITION)
    }

    run_loop (){
        // this.check_file_change()
        // setTimeout(config.LOOP_INTERVAL)
        // This will restart on very short downtime, but if it's longer,
        // the MM will crash entirely as it is unable to connect to the WS on boot.
        // if (this.check_connection()) {
            // console.log("Realtime data connection unexpectedly closed, restarting.")
            // this.restart()
        // }

        this.sanity_check()  // Ensures health of mm - several cut - out points here
        // this.print_status()  // Print skew, delta, etc
        // this.place_orders()  // Creates desired orders and converges to existing

    }

}



function run(){
    const om = new OrderManager();
    om.run_loop();
}
run()
