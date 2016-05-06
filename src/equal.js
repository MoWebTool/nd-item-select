'use strict'

module.exports = function(value, expect, options) {
  return value === expect ? options.fn(this) : options.inverse(this)
}
