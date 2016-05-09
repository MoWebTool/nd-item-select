'use strict'

var $ = require('nd-jquery')
var Promise = require('nd-promise')
var debug = require('nd-debug');


module.exports = {
  name: 'search',
  disabled: true,
  starter: function() {
    var plugin = this,
      host = plugin.host

    host.addEvents({
      role: 'list-search'
    }, function(e) {
      var that = this
      var options = {}
      var val = host.$('[data-role="list-search-key"]').val()
      var searchProxy = host.get('pluginCfg').search.searchProxy || host.get('proxy')
      var inFilter = host.get('inFilter')

      // maybe destroyed
      if (!inFilter) {
        return
      }

      var params = options.data =
        // 开放给外部处理
        inFilter.call(this, $.extend({}, host.get('params'), {
          key: val
        }))
      delete options.data.key
      if (!val) {
        delete options.data.$filter
      }

      searchProxy.GET(options)
        .then(function(data) {
          var outFilter = host.get('outFilter')

          // maybe destroyed
          if (!outFilter) {
            return
          }

          new Promise(function(resolve) {
              // 开放给外部处理
              if (outFilter.length === 2) {
                outFilter.call(that, data, resolve)
              } else {
                resolve(outFilter.call(that, data))
              }
            })
            .then(function(data) {
              that.set('data', data)
            })
        })
        .catch(debug.error)
    })

    // 通知就绪
    this.ready()
  }
}
