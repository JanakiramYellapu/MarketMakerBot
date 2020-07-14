const Order = require("./order")
const Position = require("./position")
const Generic = require("./generic")

module.exports = {
    Order,
    Position,
    ...Generic
}