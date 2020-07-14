const config = require('./config')


class OrderManager {
    constructor(exchangeObj) {
        this.exchange = exchangeObj;
    }

    run_loop =()=>{
        this.check_file_change()
        // setTimeout(config.LOOP_INTERVAL)
        // This will restart on very short downtime, but if it's longer,
        // the MM will crash entirely as it is unable to connect to the WS on boot.
        if (this.check_connection()) {
            console.log("Realtime data connection unexpectedly closed, restarting.")
            this.restart()
        }

        this.sanity_check()  // Ensures health of mm - several cut - out points here
        this.print_status()  // Print skew, delta, etc
        this.place_orders()  // Creates desired orders and converges to existing

    }

}



const run = (exchangeObj) => {
    const om = new OrderManager(exchangeObj);
    om.run_loop();
}
