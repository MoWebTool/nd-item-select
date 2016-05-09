/**
 * @module ItemSelect
 * @author lzhengms <lzhengms@gmail.com>
 */

'use strict';

var $ = require('nd-jquery');
var Widget = require('nd-widget');
var Template = require('nd-template');
var debug = require('nd-debug');

var KEY_MAP = {
  UP: 38,
  DOWN: 40
};

//  isSearch: true, 在可选项列表中是否显示搜索框
var multiSelect = Widget.extend({
  Implements: [Template],
  templatePartials: {
    item: require('./src/item.handlebars'),
    search: require('./src/search.handlebars'),
    selected: require('./src/selected.handlebars'),
    unSelected: require('./src/unSelected.handlebars')
  },
  templateHelpers: {
    equal: require('./src/equal')
  },
  attrs: {
    trigger: null,
    model: {},
    data: {},
    proxy: null,
    position: 'left', //可选项在左边设置为left，右边设置为right，默认left
    maxCount: null, //已选列表，最多允许选择多少个
    // height: null,//已选和可选框的高度
    // width: null,//已选和可选框的宽度
    checkRepeat: true, //已选框是否判重。。未选框都是要判重的
    isRemove: true, //从未选框->已选框，是否要移除未选列表中的数据
    classPrefix: 'ui-multi-select',
    selectCls: 'ui-multi-item-selected',
    plugins: require('./src/plugins/search'),
    pluginCfg: {
      search: {
        disabled: false,
        searchProxy: null
      }
    },
    initialParams: {
      $offset: 0,
      $limit: 20,
      $count: true
    },
    buttons: [{
      role: 'add',
      text: '←',
      title: '添加'
    }, {
      role: 'remove',
      text: '→',
      title: '移除'
    }, {
      role: 'up',
      text: '↑',
      title: '上移'
    }, {
      role: 'down',
      text: '↓',
      title: '下移'
    }],
    template: require('./src/select.handlebars'),
    partial: function(data) {
      var template = require('./src/partial.handlebars');
      return template(data, {
        partials: this.templatePartials
      });
    },
    insertInto: function(element) {
      this.get('trigger').after(element).hide();
    },
    //过滤数据
    inFilter: function(){
       return data
    },
    //过滤数据
    outFilter: function(data) {
      return data
    }
  },
  events: {
    'click [data-role="add"]': 'add',
    'click [data-role="remove"]': 'remove',
    'click [data-role="up"]': 'up',
    'click [data-role="down"]': 'down',
    'click [data-role="item"]': 'select',
    'keydown [data-role="item"]': 'onKey'
  },

  initPlugins: function() {
    var pluginCfg = this.get('pluginCfg')
    if (!pluginCfg.search.disabled) {
      this.set('isSearch',true)
    }
    multiSelect.superclass.initPlugins.call(this)
  },

  setup: function(){
    // 设置最终状态
    this.set('params', $.extend({},this.get('initialParams'),this.get('params')))
  },

  _completeModel: function(data) {
    var model = {};
    var that = this;
    model['selectedList'] = data['selectedList'] || [];
    model['unSelectList'] = data['unSelectList'] || [];
    ['classPrefix', 'buttons', 'width', 'height', 'position', 'isSearch']
    .forEach(function(key) {
      model[key] = that.get(key)
    })
    return model;
  },

  _onRenderData: function(data) {
    this.set('model', this._completeModel(data));
    var model = this.get('model');

    if (this.get('isRemove')) {
      $.each(model['selectedList'], function(i, selectItem) {
        model['unSelectList'] = $.grep(model['unSelectList'], function(unSelectItem) {
          return unSelectItem.value !== selectItem.value && unSelectItem;
        });
      });
    }
    this._rendPartial();
  },

  _rendPartial: function() {
    this.$('[data-role="container"]').html(this.get('partial').call(this, this.get('model')));
  },

  add: function() {
    var that = this,
      checkRepeat = this.get('checkRepeat'),
      isRemove = this.get('isRemove'),
      model = this.get('model'),
      selectedList = this.getSelectedItems(),
      selectedLength = selectedList.length,
      list = this.getCurUnSelectedItems(),
      length = list.length,
      maxCount = this.get('maxCount') || 99999;

    if (!length) {
      debug.error('必须从可选项中选择一项');
    } else {
      if (maxCount < +selectedLength + length) {
        debug.error('不能选择超过设置的最大数量' + maxCount);
        return;
      }
      $.each(list, function(i, item) {
        item = $(item);
        var index = item.index(),
          value = item.data('value'),
          text = item.text();

        if (checkRepeat) {
          //判重
          if (!that._checkRepeat(selectedList, item)) {
            //增加已选列表中的选项
            model['selectedList'].push({
              value: value,
              text: text
            });
          }
        } else {
          //增加已选列表中的选项
          model['selectedList'].push({
            value: value,
            text: text
          });
        }
        //移除未选列表中的选项
        if (isRemove) {
          model['unSelectList'].splice(i === 0 ? index : index - i, 1);
        }
      });
      this._rendPartial();
    }

  },

  remove: function() {
    var that = this,
      model = this.get('model'),
      list = this.getCurSelectedItems(),
      length = list.length,
      unSelectedList = this.getUnSelectedItems();

    if (!length) {
      debug.error('必须从已选项中选择一项');
    } else {
      //数目减少
      $.each(list, function(i, item) {
        item = $(item);
        var index = item.index(),
          value = item.data('value'),
          text = item.text();
        //判重
        if (!that._checkRepeat(unSelectedList, item)) {
          //增加未选列表中的选项
          model['unSelectList'].push({
            value: value,
            text: text
          });
        }
        //移除已选列表中的选项
        model['selectedList'].splice(i === 0 ? index : index - i, 1);
      });
      this._rendPartial();
    }
  },

  _select: function(target, key) {

    var selectCls = this.get('selectCls');

    if (!target.hasClass(selectCls)) {
      target.addClass(selectCls);
    }

    //ctrl多选
    if (!key) {
      //没有按ctrl多选
      target.siblings().removeClass(selectCls);
    }
  },

  select: function(e) {
    var target = $(e.currentTarget),
      key = e.ctrlKey || e.metaKey;
    this._select(target, key);
  },

  up: function() {
    var list = this.getCurSelectedItems(),
      length = list.length;
    if (!length || length > 1) {
      debug.error('必须从已选项中选择一项且只能一项');
    } else {
      var target = list.eq(0),
        prev = target.prev();
      if (prev && prev.length) {
        target.insertBefore(prev);
      } else {
        debug.info('已经在第一项了');
      }
    }


  },

  down: function() {
    var list = this.getCurSelectedItems(),
      length = list.length;
    if (!length || length > 1) {
      debug.error('必须从已选项中选择一项且只能一项');
    } else {
      var target = list.eq(0),
        next = target.next();
      if (next && next.length) {
        target.insertAfter(next);
      } else {
        debug.info('已经是最后一项了');
      }
    }

  },

  onKey: function(e) {
    var target = $(e.currentTarget);
    e.preventDefault();

    switch (e.keyCode) {
      case KEY_MAP.UP:

        var prev = target.prev();
        if (prev && prev.length) {
          prev.trigger('focus');
          this._select(prev);
        }
        break;

      case KEY_MAP.DOWN:

        var next = target.next();
        if (next && next.length) {
          next.trigger('focus');
          this._select(next);
        }
        break;
    }
  },

  _checkRepeat: function(list, item) {
    var isRepeat = false;
    $.each(list, function(i, v) {
      if ('' + $(v).data('value') === '' + item.data('value')) {
        isRepeat = true;
        return false;
      }
    });
    return isRepeat;
  },

  _getSelectedCon: function() {
    return this.$('[data-role="selected-content"]');
  },

  _getUnSelectedCon: function() {
    return this.$('[data-role="unselected-content"]');
  },

  getSelectedItems: function() {
    //获取已选列表中的选项
    return this._getSelectedCon().find('[data-role="item"]');
  },

  getCurSelectedItems: function() {
    //获取已选列表中，当前选中的项
    return this._getSelectedCon().find('.' + this.get('selectCls') + '[data-role="item"]');
  },

  getUnSelectedItems: function() {
    //获取未选列表中的选项
    return this._getUnSelectedCon().find('[data-role="item"]');
  },

  getCurUnSelectedItems: function() {
    //获取未选列表中，当前选中的项
    return this._getUnSelectedCon().find('.' + this.get('selectCls') + '[data-role="item"]');
  },

  getValues: function() {
    return $.map(this.getSelectedItems(), function(item) {
      return $(item).data('value');
    });
  },

  setValues: function() {
    this.get('trigger').val(this.getValues().join(','));
  },

  addEvents: function(options,fn){
    fn && this.delegateEvents('click [data-role="' + options.role + '"]', fn)
  }

});

module.exports = multiSelect;
