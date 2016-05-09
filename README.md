# nd-item-select

[![spm version](http://spm.crossjs.com/badge/nd-item-select)](http://spm.crossjs.com/package/nd-item-select)

> item select suport add, remove, up, down

## 安装

```bash
$ spm install nd-item-select --save
```

## 使用

```js
var ItemSelect = require('nd-item-select');
// use ItemSelect
var data = {
  selectedList: [{
    value: 1,
    text: 'text1'
  }, {
    value: 2,
    text: 'text2'
  }, {
    value: 3,
    text: 'text3'
  }, {
    value: 11,
    text: 'text01'
  }, {
    value: 12,
    text: 'text02'
  }, {
    value: 13,
    text: 'text04'
  }, {
    value: 14,
    text: 'text05'
  }, {
    value: 15,
    text: 'text06'
  }, {
    value: 16,
    text: 'text07'
  }, {
    value: 17,
    text: 'text17'
  }],

  unSelectList: [{
    value: 8,
    text: 'un1'
  }, {
    value: 6,
    text: 'un2'
  }, {
    value: 7,
    text: 'un3'
  }]
}

var itemCmp = new ItemSelect({
  trigger: form.getField('projects'),
  pluginCfg: {
    search: {
      disabled: false,
      searchProxy: new AdminProject()
    }
  },
  params: {
    $limit: 100
  },
  inFilter: function(data) {
    data.$filter = ['name', 'like', data['key']].join(' ')
    return data
  },
  outFilter: function(data) {
    data.unSelectList = data.items.map(function(item) {
      item.text = item.name
      item.value = item.project_id
      return item
    })
    data.selectedList = this.get('data').selectedList
    return data
  },
  buttons: [{
    role: 'add',
    text: '→',
    title: '添加'
  }, {
    role: 'remove',
    text: '←',
    title: '移除'
  }]
})

itemCmp.set('data', data).render()
```
