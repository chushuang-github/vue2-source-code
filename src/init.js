// 给Vue增加init方法
import { initState } from './state'
import { compilerToFunction } from './compiler'
import { mountComponent, callHook } from './lifecycle'
import { mergeOptions } from './utils'

export function initMixin(Vue) {
  // 用于组件初始化操作
  Vue.prototype._init = function(options) {
    // vue vm.$options 就是获取用户的配置
    // 我们使用vue的时候，$nextTick $data $attr......
    const vm = this

    // this.constructor.options：this是Vue的实例，this.constructor就是Vue构造函数
    // 将用户传的配置选项和Vue的全局配置进行合并
    // 我们定义的全局指令、全局过滤器...等都会挂载到vue实例上面，所以每个组件都可以使用全局的一些东西
    // Vue.extend里面调用this._init，此时this.constructor就是Sub构造函数，this就Sub函数的实例对象
    vm.$options = mergeOptions(this.constructor.options, options)  // 将用户的选项挂载在实例上面

    // 初始化状态之前：执行beforeCreate生命周期函数
    callHook(vm, 'beforeCreate')

    // 初始化状态、初始化计算属性、初始化watch...等都在这里面
    initState(vm)

    // 初始化状态之后：执行created生命周期函数
    callHook(vm, 'created')

    // 实现数据的挂载：如果options配置里面传入了el选项，进行挂载操作
    if(options.el) {
      vm.$mount(options.el)
    }
  }

  Vue.prototype.$mount = function(el) {
    const vm = this
    el = document.querySelector(el)

    let ops = vm.$options
    // 如果options配置项里面有render和template配置，优先使用这两个
    // 优先级：render > template > el
    if(!ops.render) {
      let template   // template是一个字符串类型的
      // 没有template，但是有el
      if(!ops.template && el) {
        template = el.outerHTML
      }else {
        // 有template，使用template (用template里面的内容去替换掉el对应的dom元素的内容)
        template = ops.template
      }

      // 模板编译
      if(template) {
        // compilerToFunction：模板编译成render函数
        const render = compilerToFunction(template)
        ops.render = render  // jsx最终会被编译成 h('xxx)
      }
    }

    mountComponent(vm, el)  // 组件的挂载
  }
}

