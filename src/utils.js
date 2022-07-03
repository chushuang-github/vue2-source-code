// 合并两个对象，成为一个新对象
const strats = {}
const LIFECYCLE = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed'
]
LIFECYCLE.forEach(hook => {
  // p是父亲，c是儿子
  strats[hook] = function(p, c) {
    // {} + {created:function(){}}   合并成   { created: [fn] }
    // {created: [fn]} + {created:function(){}}   合并成   { created: [fn, fn] }
    if(c) {
      if(p) {   // c有值，p有值
        return p.concat(c)
      }else {   // c有值，p没有值
        return [c]
      }
    }else {     // c没有值(直接使用p的值就ok了)
      return p
    }
  }
})

strats.components = function(parentVal, childVal) {
  // res的原型对象是parentVal
  const res = Object.create(parentVal)

  // 给res这个对象本身添加属性，res这个对象的原型是parentVal
  if(childVal) {
    for(let key in childVal) {
      res[key] = childVal[key]
    }
  }

  return res
}

export function mergeOptions(parent, child) {
  const options = {}
  for(let key in parent) {  // 循环老对象
    mergeField(key)
  }
  for(let key in child) {   // 循环新对象
    if(!parent.hasOwnProperty(key)) {
      mergeField(key)
    }
  }
  function mergeField(key) {
    // 对应mixin里面传入的生命周期的方法，我们需要将传入的生命周期的所有的函数放在一个数组里面
    // 策略模式：用策略模式减少if else (strats单词就是策略的意思)
    // 对于mixin传入组件里面的配置：生命周期、data、watch、props、methods、inject、computed...等这些配置
    // 我们都可以使用strats，来进行对Vue.mixin里面传入的全局配置和组件里面写的配置进行合并
    if(strats[key]) {
      options[key] = strats[key](parent[key], child[key])
    }else {
      // 不在策略中的属性，以新传入的为准(child里面的属性为准)
      // 新的属性优先(child里面的属性优先)，普通的方法，新传入的方法去替换之前的老的方法
      options[key] = child[key] || parent[key]
    }
  }
  return options
}