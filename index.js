'use strict';

var $ = require('jquery'),
  Widget = require('nd-widget'),
  Template = require('nd-template'),
  Alert = require('nd-alert');


var KEY_MAP = {
  UP: 38,
  DOWN: 40
};


var multiSelect = Widget.extend({
  Implements: [Template],
  templatePartials: {
    item: require('./src/item.handlebars')
  },
  attrs: {
    trigger: null,
    model: {},
    data: {},
    maxCount: null,//已选列表，最多允许选择多少个
    height: null,//已选和可选框的高度
    width: null,//已选和可选框的宽度
    checkRepeat: true,//已选框是否判重。。未选框都是要判重的
    isRemove: true,//从未选框->已选框，是否要移除未选列表中的数据
    classPrefix: 'ui-multi-select',
    selectCls: 'ui-multi-item-selected',
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
    partial: function (data) {
      var template = require('./src/partial.handlebars');
      return template(data, {
        partials: this.templatePartials
      });
    },
    insertInto: function (element, parentNode) {
      this.get('trigger').after(element).hide();
    }
  },
  events: {
    'click [data-role=add]': 'add',
    'click [data-role=remove]': 'remove',
    'click [data-role=up]': 'up',
    'click [data-role=down]': 'down',
    'click [data-role=item]': 'select',
    'keydown [data-role=item]': 'onKey'
  },

  _completeModel: function (data) {
    var model = {};
    model.classPrefix = this.get('classPrefix');
    model.buttons = this.get('buttons');
    model['selectedList'] = data['selectedList'] ? data['selectedList'] : [];
    model['unSelectList'] = data['unSelectList'] ? data['unSelectList'] : [];
    model['width'] = this.get('width');
    model['height'] = this.get('height');
    return model;
  },

  _onRenderData: function (data) {
    this.set('model', this._completeModel(data));
    var model=this.get('model');

    if (this.get('isRemove')) {
      $.each(model['selectedList'],function(i,selectItem){
        model['unSelectList']= $.grep(model['unSelectList'],function(unSelectItem){
          return unSelectItem.value!==selectItem.value&&unSelectItem;
        });
      });
    }
    this._rendPartial();
  },

  _rendPartial: function () {
    this.$('[data-role=container]').html(this.get('partial').call(this, this.get('model')));
  },

  add: function (e) {
    var that = this,
      checkRepeat = this.get('checkRepeat'),
      isRemove = this.get('isRemove'),
      model = this.get('model'),
      selectedList = this.getSelectedItems(),
      selectedLength = selectedList.length,
      list = this.getCurUnSelectedItems(),
      length = list.length,
      maxCount = this.get('maxCount');

    if (!length) {
      Alert.show('必须从可选项中选择一项', null, {title: '提示'});
    } else {
      if (maxCount < +selectedLength + length) {
        Alert.show('不能超过最大奖项' + maxCount + '数量', null, {title: '提示'});
        return;
      }
      $.each(list, function (i, item) {
        item = $(item);
        var index = item.index(),
          value = item.data('value'),
          text = item.text();

        if (checkRepeat) {
          //判重
          if (!that._checkRepeat(selectedList, item)) {
            //增加已选列表中的选项
            model['selectedList'].push({value: value, text: text});
          }
        } else {
          //增加已选列表中的选项
          model['selectedList'].push({value: value, text: text});
        }
        //移除未选列表中的选项
        if (isRemove) {
          model['unSelectList'].splice(i===0?index:index-i, 1);
        }
      });
      this._rendPartial();
    }

  },

  remove: function (e) {
    var that = this,
      selectCls = this.get('selectCls'),
      model = this.get('model'),
      list = this.getCurSelectedItems(),
      length = list.length,
      unSelectedList = this.getUnSelectedItems();

    if (!length) {
      Alert.show('必须从已选项中选择一项', null, {title: '提示'});
    } else {
      //数目减少
      $.each(list, function (i, item) {
        item = $(item);
        var index = item.index(),
          value = item.data('value'),
          text = item.text();
        //判重
        if (!that._checkRepeat(unSelectedList, item)) {
          //增加未选列表中的选项
          model['unSelectList'].push({value: value, text: text});
        }
        //移除已选列表中的选项
        model['selectedList'].splice(i===0?index:index-i, 1);
      });
      this._rendPartial();
    }
  },

  _select: function (target, key) {

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

  select: function (e) {
    var target = $(e.currentTarget),
      key = e.ctrlKey || e.metaKey;
    this._select(target, key);
  },

  up: function (e) {
    var list = this.getCurSelectedItems(), length = list.length;
    if (!length || length > 1) {
      Alert.show('必须从已选项中选择一项且只能一项', null, {title: '提示'});
    } else {
      var target = list.eq(0),
        prev = target.prev();
      if (prev && prev.length) {
        target.insertBefore(prev);
      } else {
        Alert.show('已经在第一项了', null, {title: '提示'});
      }
    }


  },

  down: function (e) {
    var list = this.getCurSelectedItems(), length = list.length;
    if (!length || length > 1) {
      Alert.show('必须从已选项中选择一项且只能一项', null, {title: '提示'});
    } else {
      var target = list.eq(0),
        next = target.next();
      if (next && next.length) {
        target.insertAfter(next);
      } else {
        Alert.show('已经是最后一项了', null, {title: '提示'});
      }
    }

  },


  onKey: function (e) {
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

  _checkRepeat: function (list, item) {
    var isRepeat = false;
    $.each(list, function (i, v) {
      if ('' + $(v).data('value') === '' + item.data('value')) {
        isRepeat = true;
        return false;
      }
    });
    return isRepeat;
  },

  _getSelectedCon: function () {
    return this.$('[data-role=selected-content]');
  },

  _getUnSelectedCon: function () {
    return this.$('[data-role=unSelected-content]');
  },

  getSelectedItems: function () {
    //获取已选列表中的选项
    return this._getSelectedCon().find('[data-role=item]');
  },

  getCurSelectedItems: function () {
    //获取已选列表中，当前选中的项
    return this._getSelectedCon().find('.' + this.get('selectCls') + '[data-role=item]')
  },

  getUnSelectedItems: function () {
    //获取未选列表中的选项
    return this._getUnSelectedCon().find('[data-role=item]');
  },

  getCurUnSelectedItems: function () {
    //获取未选列表中，当前选中的项
    return this._getUnSelectedCon().find('.' + this.get('selectCls') + '[data-role=item]')
  },

  getValues: function () {
    return $.map(this.getSelectedItems(), function (item, i) {
      return $(item).data('value');
    });
  },

  setValues: function () {
    this.get('trigger').val(this.getValues().join(','));
  }

});

module.exports = multiSelect;
