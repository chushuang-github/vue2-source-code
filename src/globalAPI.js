import { mergeOptions } from './utils'

export function initGlobalAPI(Vue) {
  // 全局的mixin，其实就是把这些属性全部合并在Vue.options身上
  // Vue组件在初始化的时候，会将自己的配置对象和全局配置对象进行合并
  Vue.options = {
    _base: Vue
  }

  // Vue的静态属性和静态方法：这里mixin注意讲普通方法 + 生命周期是如何通过mixin进行混入的
  Vue.mixin = function (mixin) {
    // 我们期望将全局的options 和 用户的选项进行合并
    // 如果mixin里面传入的方法是普通的方法，新传入的方法之前去替换掉以前的方法
    // 如果mixin里面传入的是生命周期的方法，要按照下面的方式进行合并 (用一个数组将所有的生命周期方法收集起来)
    // {} + {created:function(){}}   合并成   { created: [fn] }
    // {created: [fn]} + {created:function(){}}   合并成   { created: [fn, fn] }
    this.options = mergeOptions(this.options, mixin)
    return this
  }

  // 实现Vue.extend
  Vue.extend = function (options) {
    // Vue.extend()返回Sub，new Sub().$mount(选择器)进行挂载
    // Sub必须去继承Vue，才能让Sub的实例对象身上有$mount方法
    function Sub(options = {}) {
      // 默认对子类进行初始化操作
      this._init(options)
    }
    // 让Vue.prototype._proto__ = Vue.prototype
    Sub.prototype = Object.create(Vue.prototype)
    Sub.prototype.constructor = Sub

    // 将用户Vue.extend()里面传入的参数和全局的Vue.options进行合并
    // Vue.options里面放的是全局的组件，options里面放的是局部的组件
    Sub.options = mergeOptions(Vue.options, options)
    return Sub
  }

  // 实现Vue.component
  // Vue.component是创建一个全局的组件，我们需要将这个组件混入到全局里面
  // 如果是全局的自定义指令，也是一样的，就是增加Vue.options.directive = {}
  Vue.options.components = {}
  Vue.component = function (id, definition) {
    // 如果definition已经是一个Sub函数了，就表示用户自己调用了Vue.extend
    definition = typeof definition === 'function' ? definition : Vue.extend(definition)
    Vue.options.components[id] = definition
  }
}
