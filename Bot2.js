const config = require('./config')
const bitMex = require('./exchangeConnectors/bitmex/bitmex')
const math = require('mathjs')
const { loggers } = require('winston');
const log = loggers.get('Bot');
const APIError = require('./utils/error')



class OrderManager {
    constructor({DRY_RUN, symbol}) {
        this.symbol = symbol || config.SYMBOL
        this.exchange = new bitMex.Bitmex({
            API_KEY: config.API_KEY,
            API_SECRET: config.API_SECRET,
            testnet: DRY_RUN,
            symbol: this.symbol
        })
        console.log("Connected to Exchange.")
        this.reset()
    }


    async reset() {
        const response = await Promise.all([
            await this.exchange.futuresCancelAll(this.symbol), 
            await this.sanity_check()
        ])
        // console.log("response :", response[0])
        // Place some orders and check. 
    }



    async sanity_check() {

        //  Check if OB is empty - if so, can't quote 
        let ticker = await this.exchange.getTicker(this.symbol)
        // check if it is 0 or NOnne
        if(ticker['mid'] === "None"){
            throw new APIError({
                message : "OrderBook is empty."
            })
        }
        // check if market is open.
        if (ticker['state'] !== "Open" && ticker['state'] !== "Close") {
            throw new APIError({
                message : "Market is close."
            })
        }

        this.adjustPositionPrice(ticker)

        if (this.get_price_offset(-1) >= ticker["sell"] || this.get_price_offset(1) <= ticker["buy"]) {
            console.log("**************************************inside get-price-offset********************")
            console.log(`Buy: ${this.start_position_buy} Sell: ${this.start_position_sell}`);
            console.log(`First buy position: ${this.get_price_offset(-1)} Bitmex Best Ask: ${ticker["sell"]} First sell position: ${this.get_price_offset(1)} Bitmex Best Bid: ${ticker["buy"]}`)
            console.log("Sanity check failed, exchange data is inconsistent");
            process.exit(1)
        }

    }


    async adjustPositionPrice(ticker) {
        this.start_position_buy = ticker["buy"] + ticker['tickLog']
        this.start_position_sell = ticker["sell"] - ticker['tickLog']
        console.log("----->", this.start_position_buy)
        console.log("----->", this.start_position_sell)

        // Back off if our spread is too small.
        if (this.start_position_buy * (1.00 + config.MIN_SPREAD) > this.start_position_sell) {
            this.start_position_buy *= (1.00 - (config.MIN_SPREAD / 2))
            this.start_position_sell *= (1.00 + (config.MIN_SPREAD / 2))
        }

        // Midpoint, used for simpler order placement.
        this.start_position_mid = ticker["mid"]
        console.log(`Start Position: Buy: ${this.start_position_buy}, Sell: ${this.start_position_sell}, Mid:${this.start_position_mid}`);

        return ticker

    }

    async get_price_offset(index) {
        // """Given an index (1, -1, 2, -2, etc.) return the price for that side of the book.
        //    Negative is a buy, positive is a sell."""
        //  Maintain existing spreads for max profit
        let start_position
        if (config.MAINTAIN_SPREADS) {
            if (index < 0) {
                start_position = this.start_position_buy
                index = index + 1
            }
            else {
                start_position = this.start_position_sell
                index = index - 1
            }
            // First positions (index 1, -1) should start right at start_position, others should branch from there
            // let index = index < 0 ? index + 1 : index - 1
        }
        else {
            // # Offset mode: ticker comes from a reference exchange and we define an offset.
            let start_position = index < 0 ? this.start_position_buy : this.start_position_sell

            // If we're attempting to sell, but our sell price is actually lower than the buy,
            // move over to the sell side.
            if (index > 0 && start_position < this.start_position_buy) {
                start_position = this.start_position_sell
            }
            // # Same for buys.
            if (index < 0 && start_position > this.start_position_sell) {
                start_position = this.start_position_buy
            }
        }
       

        let temp = (start_position * (math.pow((1 + config.INTERVAL), index)))
        // console.log(start_position,"get offset value")//, temp, " index ",index)
        return temp
    }

    // # Position Limits

    // async short_position_limit_exceeded() {
    //     // """Returns True if the short position limit is exceeded"""
    //     if (!config.CHECK_POSITION_LIMITS) {
    //         return false
    //     }
    //     let position = await this.exchange.get_delta()
    //     return (position <= config.MIN_POSITION)
    // }

    // async long_position_limit_exceeded() {
    //     // """Returns True if the long position limit is exceeded"""
    //     if (!config.CHECK_POSITION_LIMITS) {
    //         return false
    //     }
    //     let position = await this.exchange.get_delta()
    //     return (position >= config.MAX_POSITION)
    // }

    run_loop() {
        // this.check_file_change()
        // setTimeout(config.LOOP_INTERVAL)
        // This will restart on very short downtime, but if it's longer,
        // the MM will crash entirely as it is unable to connect to the WS on boot.
        // if (this.check_connection()) {
        // console.log("Realtime data connection unexpectedly closed, restarting.")
        // this.restart()
        // }
        // this.sanity_check()  // Ensures health of mm - several cut - out points here
        // this.print_status()  // Print skew, delta, etc
        // this.place_orders()  // Creates desired orders and converges to existing

    }

}



function run() {
    const om = new OrderManager({DRY_RUN : true, symbol : config.SYMBOL});
    om.run_loop();
}
run()



