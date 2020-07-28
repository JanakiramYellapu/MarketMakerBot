const config = require('./config')
const bitMex = require('./exchangeConnectors/bitmex/bitmex')
const math = require('mathjs')
const { logger } = require('./utils/logger')
const APIError = require('./utils/error')


class OrderManager {
    constructor({ DRY_RUN, symbol }) {
        this.symbol = symbol || config.SYMBOL
        this.exchange = new bitMex.Bitmex({
            API_KEY: config.API_KEY,
            API_SECRET: config.API_SECRET,
            testnet: DRY_RUN,
            symbol: this.symbol
        })
        logger.info("Connected to Exchange.")
        this.exchange.futuresBookTickerStream(this.symbol, (data) => this.ticker = data)
        logger.info(`Subscribed to ${this.symbol}.`)
        // Need to check without timeout this.ticker is not updated. ?
        setTimeout(() => { this.reset() }, 5000)
    }


    async reset() {
        try {
            const response = await Promise.all([
                await this.exchange.futuresCancelAll(this.symbol),
                await this.sanity_check(),
            ])
            this.run_loop()
            // Place some orders and check and log them.
        }
        catch (error) {
            throw new APIError({
                message: "Error while resetting.",
                meta: {
                    origin: "reset"
                }
            })
        }
    }



    async sanity_check() {
        try {
            //  Check if OB is empty - if so, can't quote 
            if (!this.ticker.bestBid && !this.ticker.bestAsk) {
                throw new APIError({
                    message: "OrderBook is empty.",
                    meta: {
                        origin: "sanityCheck"
                    }
                })
            }



            // check if market is open.
            // why we are checking not close? because there are two type of transaction based on market status like open market transaction and close market transaction.
            // if (this.ticker['state'] !== "Open" && this.ticker['state'] !== "Close") {
            //     throw new APIError({
            //         message: "Market is close.",
            //         meta: {
            //             origin: "sanityCheck"
            //         }
            //     })
            // }


            // check if we have enough balance.
            let balance = await this.exchange.futuresWallet()
            logger.info(` Balance ( ${balance.asset} ) : ${balance.balance}`)
            if (balance < 0) {
                throw new APIError({
                    message: "Low balance.",
                    meta: {
                        origin: "sanityCheck"
                    }
                })
            }

            // set starting position buy and sell.
            this.adjust_position_price()

            // throw an error and log it and restart it ? yes , if error occur in sanity then we should print appropriate message and restart.
            if (this.get_price_offset(-1) >= this.ticker["bestAsk"] || this.get_price_offset(1) <= this.ticker["bestBid"]) {
                logger.info(`Buy: ${this.start_position_buy} Sell: ${this.start_position_sell}`);
                logger.info(`First buy position: ${this.get_price_offset(-1)} Bitmex Best Ask: ${this.ticker["bestAsk"]} First sell position: ${this.get_price_offset(1)} Bitmex Best Bid: ${this.ticker["bestBid"]}`)
                throw new APIError({
                    message: "Exchange data is inconsistent.",
                    meta: {
                        origin: "sanityCheck"
                    }
                })
            }

            // # Messaging if the position limits are reached
            let pos = await this.exchange.futuresPosition(this.symbol)
            if (pos['currentQty'] > config.MAX_POSITION) {
                logger.info("Long delta limit exceeded");
                logger.info(`Current Position: ${pos['currentQty']} Maximum position: ${config.MAX_POSITION}`)
            }

            if (pos['currentQty'] < config.MIN_POSITION) {
                logger.info("Short delta limit exceeded");
                logger.info(`Current Position: ${pos['currentQty']} Maximum position: ${config.MIN_POSITION}`)
            }
        }
        catch (error) {
            logger.error(`SanityCheck failed:  ${error}`)
        }

    }


    async adjust_position_price() {
        this.start_position_buy = this.ticker["bestBid"] //+ this.ticker['tickLog']
        this.start_position_sell = this.ticker["bestAsk"] //- this.ticker['tickLog']

        // Back off if our spread is too small.
        if (this.start_position_buy * (1.00 + config.MIN_SPREAD) > this.start_position_sell) {
            this.start_position_buy *= (1.00 - (config.MIN_SPREAD / 2))
            this.start_position_sell *= (1.00 + (config.MIN_SPREAD / 2))
        }

        // Midpoint, used for simpler order placement.
        this.start_position_mid = 0 //this.ticker["mid"]
        logger.info(`Start Position: Buy: ${this.start_position_buy}, Sell: ${this.start_position_sell}, Mid:${this.start_position_mid}`);

    }

    async get_price_offset(index) {
        // """Given an index (1, -1, 2, -2, etc.) return the price for that side of the book.
        //    Negative is a buy, positive is a sell."""
        //  Maintain existing spreads for max profit
        let start_position
        if (config.MAINTAIN_SPREADS) {
            start_position = index < 0 ? this.start_position_buy : this.start_position_sell
            index = index < 0 ? index + 1 : index - 1
            // First positions (index 1, -1) should start right at start_position, others should branch from there
            // let index = index < 0 ? index + 1 : index - 1
        }
        else {
            // # Offset mode: this.ticker comes from a reference exchange and we define an offset.
            start_position = index < 0 ? this.start_position_buy : this.start_position_sell

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

        // round -off ?
        let temp = (start_position * (math.pow((1 + config.INTERVAL), index)))
        // console.log(start_position,"get offset value")//, temp, " index ",index)
        return (math.round(temp * 2)) / 2
    }

    async place_orders() {
        // Create order items for use in convergence.
        logger.info("Preparing orders...")
        let buy_orders = []
        let sell_orders = []
        let index = config.ORDER_PAIRS
        while (index) {
            buy_orders.push(await this.prepare_order(-index))
            sell_orders.push(await this.prepare_order(index))
            index--;
        }
        buy_orders.map(order => logger.info(JSON.stringify(order)))
        sell_orders.map(order => logger.info(JSON.stringify(order)))
        return this.converge_orders(buy_orders, sell_orders)
    }
    async prepare_order(index) {
        // Create an order object.
        let order = {}
        order.quantity = config.ORDER_START_SIZE + ((math.abs(index) - 1) * config.ORDER_STEP_SIZE)
        order.price = await this.get_price_offset(index)
        order.side = index < 0 ? "BUY" : "SELL"
        return order
    }

    async converge_orders(buy_orders, sell_orders) {
        //"""Converge the orders we currently have in the book with what we want to be in the book.
        //This involves amending any open orders and creating new ones if any have filled completely.
        //We start from the closest orders outward."""

        // tickLog = this.exchange.get_instrument()['tickLog']
        let to_amend = []
        let to_create = []
        let to_cancel = []
        let buys_matched = 0
        let sells_matched = 0
        let existing_orders = await this.exchange.futuresOpenOrders()

        //  Check all existing orders and match them up with what we want to place.
        //  If there's an open one, we might be able to amend it to fit what we want.
        for (let order of existing_orders) {

            if (order['side'] == 'BUY') {
                desired_order = buy_orders[buys_matched]
                buys_matched += 1
            }
            else {
                desired_order = sell_orders[sells_matched]
                sells_matched += 1
            }


            //  Found an existing order.Do we need to amend it ?
            if (desired_order['orderQty'] != order['leavesQty'] || (
                desired_order['price'] != order['price'] &&
                math.abs((desired_order['price'] / order['price']) - 1) > config.RELIST_INTERVAL)) {
                to_amend.push({
                    'orderID': order['orderId'], 'orderQty': order['cumQty'] + desired_order['orderQty'],
                    'price': desired_order['price'], 'side': order['side']
                })
            }

        }
        while (buys_matched < buy_orders.length) {
            to_create.push(buy_orders[buys_matched])
            buys_matched += 1
        }

        while (sells_matched < (sell_orders.length)) {
            to_create.push(sell_orders[sells_matched])
            sells_matched += 1
        }

        if ((to_amend.length) > 0) {
            // for (amended_order in reversed(to_amend)) {
            //     // reference_order = [o for o in existing_orders if o['orderID'] == amended_order['orderID']][0]
            //     logger.info("Amending %4s: %d @ %.*f to %d @ %.*f (%+.*f)" % (
            //         amended_order['side'],
            //         reference_order['leavesQty'], tickLog, reference_order['price'],
            //         (amended_order['orderQty'] - reference_order['cumQty']), tickLog, amended_order['price'],
            //         tickLog, (amended_order['price'] - reference_order['price'])
            //     ))
            // }
            //  This can fail if an order has closed in the time we were processing.
            //  The API will send us`invalid ordStatus`, which means that the order's status (Filled/Canceled)
            //  made it not amendable.
            //  If that happens, we need to catch it and re - tick.
            // try:
            // this.exchange.amend_bulk_orders(to_amend)
            // except requests.exceptions.HTTPError as e:
            // errorObj = e.response.json()
            // if errorObj['error']['message'] == 'Invalid ordStatus':
            //     logger.warn("Amending failed. Waiting for order data to converge and retrying.")
            // sleep(0.5)
            // return this.place_orders()
            // else:
            // logger.error("Unknown error on amend: %s. Exiting" % errorObj)
            // sys.exit(1)
        }

        if ((to_create.length) > 0) {
            logger.info(`No of orders creating : ${to_create.length}`)
            for (let i = to_create.length - 1; i >= 0; i--) {
                let order = to_create[i]
                logger.info(`ORDER -> SIDE : ${order['side']}, QUANTITY :  ${order['quantity']}, PRICE : ${order['price']}`)
            }
            // tocreate.map(order => this.exchange.futuresBuy(
            //     order['side'],
            //     order['orderQty'],
            //     order['price']
            // ))
        }

        // Could happen if we exceed a delta limit
        // if (len(to_cancel) > 0) {
        //     logger.info("Canceling %d orders:" % (len(to_cancel)))
        //     for (order in reversed(to_cancel)) {
        //         logger.info("%4s %d @ %.*f" % (order['side'], order['leavesQty'], tickLog, order['price']))
        //     }
        //     this.exchange.cancel_bulk_orders(to_cancel)
        // }
    }
    async run_loop() {
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
        this.place_orders()  // Creates desired orders and converges to existing

    }

}


function run() {
    logger.info('Bot started.')
    const om = new OrderManager({ DRY_RUN: true, symbol: config.SYMBOL });
}
run()



