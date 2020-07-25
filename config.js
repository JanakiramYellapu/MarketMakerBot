const ENV = "development"

// Connection-Auth

// API URL.
BASE_URL = "https://testnet.bitmex.com/api/v1/"
// BASE_URL = "https://www.bitmex.com/api/v1/" // Once you're ready, uncomment this.

// The BitMEX API requires permanent API keys. Go to https://testnet.bitmex.com/app/apiKeys to fill these out.
// API_KEY = "iQ9b-iw9Z6m9NtC1-MLqE-Eo"
// API_SECRET = "lhBkTaHPdFVO0MLqjPQqGA66N-jo0mzzq960ZKVyBp2K7jdr"

// const API_KEY = "PxgBFzDaf3v7kjUZqHc-uVU-"
// const API_SECRET = "bElUAmx0JAOEvJtzxKeSLCVLyB9Paw3kRdW4cWAKVNM6jNjU"

const API_KEY =  "ZLxQoSxYmpMOXT_M_STHudMV"
const API_SECRET =  "PWeh1XiJ8kg_139lNq6LvJB6AB3vR1pHbF3Dqj07x2IuqXtZ"

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Target
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Instrument to market make on BitMEX.
const SYMBOL = "XBTUSD"


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Order Size & Spread
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// How many pairs of buy/sell orders to keep open
const ORDER_PAIRS = 6

// ORDER_START_SIZE will be the number of contracts submitted on level 1
// Number of contracts from level 1 to ORDER_PAIRS - 1 will follow the function
// [ORDER_START_SIZE + ORDER_STEP_SIZE (Level -1)]
const ORDER_START_SIZE = 100
const ORDER_STEP_SIZE = 100

// Distance between successive orders, as a percentage (example: 0.005 for 0.5%)
const INTERVAL = 0.005

// Minimum spread to maintain, in percent, between asks & bids
const MIN_SPREAD = 0.01

// If True, market-maker will place orders just inside the existing spread and work the interval % outwards,
// rather than starting in the middle and killing potentially profitable spreads.
const MAINTAIN_SPREADS = true

// This number defines far much the price of an existing order can be from a desired order before it is amended.
// This is useful for avoiding unnecessary calls and maintaining your ratelimits.
//
// Further information:
// Each order is designed to be (INTERVAL*n)% away from the spread.
// If the spread changes and the order has moved outside its bound defined as
// abs((desired_order['price'] / order['price']) - 1) > settings.RELIST_INTERVAL)
// it will be resubmitted.
//
// 0.01 == 1%
const RELIST_INTERVAL = 0.01


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Trading Behavior
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Position limits - set to True to activate. Values are in contracts.
// If you exceed a position limit, the bot will log and stop quoting that side.
const CHECK_POSITION_LIMITS = true//false
const MIN_POSITION = -10000
const MAX_POSITION = 10000

// If True, will only send orders that rest in the book (ExecInst: ParticipateDoNotInitiate).
// Use to guarantee a maker rebate.
// However -- orders that would have matched immediately will instead cancel, and you may end up with
// unexpected delta. Be careful.
const POST_ONLY = "False"

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Misc Behavior, Technicals
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// If true, don't set up any orders, just say what we would do
// DRY_RUN = True
const DRY_RUN = "TRUE"

// How often to re-check and replace orders.
// Generally, it's safe to make this short because we're fetching from websockets. But if too many
// order amend/replaces are done, you may hit a ratelimit. If so, email BitMEX if you feel you need a higher limit.
const LOOP_INTERVAL = 5

// Wait times between orders / errors
const API_REST_INTERVAL = 1
const API_ERROR_INTERVAL = 10
const TIMEOUT = 7

// If we're doing a dry run, use these numbers for BTC balances
const DRY_BTC = 50

// Available levels: logging.(DEBUG|INFO|WARN|ERROR)
// const LOG_LEVEL = logging.INFO

// To uniquely identify orders placed by this bot, the bot sends a ClOrdID (Client order ID) that is attached
// to each order so its source can be identified. This keeps the market maker from cancelling orders that are
// manually placed, or orders placed by another bot.
//
// If you are running multiple bots on the same symbol, give them unique ORDERID_PREFIXes - otherwise they will
// cancel each others' orders.
// Max length is 13 characters.
const ORDERID_PREFIX = "mm_bitmex_"

// If any of these files (and this file) changes, reload the bot.
// const WATCHED_FILES = [join('market_maker', 'market_maker.py'), join('market_maker', 'bitmex.py'), 'settings.py']


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BitMEX Portfolio
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Specify the contracts that you hold. These will be used in portfolio calculations.
const CONTRACTS = ['XBTUSD']


module.exports ={
    ENV,
    SYMBOL,
    API_KEY,
    API_SECRET,
    INTERVAL,
    MIN_SPREAD,
    MAINTAIN_SPREADS,
    RELIST_INTERVAL,
    CHECK_POSITION_LIMITS,
    MIN_POSITION,
    MAX_POSITION,
    POST_ONLY,
    DRY_RUN,
    LOOP_INTERVAL,
    API_REST_INTERVAL,
    API_ERROR_INTERVAL,
    TIMEOUT,
    DRY_BTC,
    // LOG_LEVEL,
    ORDERID_PREFIX,
    // WATCHED_FILES,
    CONTRACTS,
}