import Watcher from './observe/watcher'
import { createElementVNode, createTextVNode } from './vdom'
import { patch } from './vdom/patch'

export function initLifeCycle(Vue) {
  // 相当于h函数： _c('span', null, _v("world"))
  Vue.prototype._c = function () {
    return createElementVNode(this, ...arguments)
  }

  Vue.prototype._v = function () {
    return createTextVNode(this, ...arguments)
  }

  // _s函数就是将值转为字符串
  Vue.prototype._s = function (value) {
    if (typeof value !== 'object') return value
    // 如果是对象类型，取值必须要通过JSON.stringify(value)进行取值
    // 如果对象类型不通过JSON.stringify进行取值，页面中显示的就是：[object Object]这样的形式
    return JSON.stringify(value)
  }

  // 渲染为虚拟DOM：vm.$options.render函数里面使用了with(this)，所有使用的变量和函数都会优先在vm里面去找
  Vue.prototype._render = function () {
    // 绑定render函数里面this为vm，让render函数里面的this执行Vue的实例vm
    return this.$options.render.call(this) // 通过AST抽象语法树转义后生成的render
  }

  // 虚拟DOM -> 真实DOM
  Vue.prototype._update = function (vnode) {
    const vm = this
    const el = vm.$el

    // patch方法：初始化功能，更新功能diff算法(虚拟dom -> 真实dom)
    // vnode创建真实dom替换原来的el
    const preVnode = vm._vnode
    vm._vnode = vnode // 把组件产生最新的虚拟节点保存到vm身上
    if (preVnode) {
      // 如果有preVnode，表示之前渲染过了
      vm.$el = patch(preVnode, vnode)
    } else {
      // 第一次渲染
      vm.$el = patch(el, vnode)
    }
  }
}

// 组件挂载
export function mountComponent(vm, el) {
  // 这里的el是进过querySelector处理过的真实的dom元素
  // 挂载el实例
  vm.$el = el

  // 1.调用render方法，产生虚拟DOM
  // 2.根据虚拟DOM产生真实DOM
  // 3.插入到el元素中
  // vm._render()  --> vm.$options.render() 返回虚拟节点
  // vm._update(虚拟节点)  虚拟节点变成真实节点
  const updateComponent = () => {
    vm._update(vm._render())
  }
  // 一个组件会new一个Watcher
  new Watcher(vm, updateComponent, true) // 第三个参数true表示是一个渲染过程
}

// 调用vue的生命周期函数
export function callHook(vm, hook) {
  const handlers = vm.$options[hook]
  if (handlers) {
    // 生命周期函数里面的this都是当前vue的实例
    handlers.forEach((handler) => handler.call(vm))
  }
}

// vue核心流程
// 1) 创建了响应式数据 (对象使用Object.defineProperty方法进行劫持，数组使用重新7个方法实现劫持)
// 2) 模板转化成AST抽象语法树 (通过正则匹配标签)
// 3) AST抽象语法树转化成了render函数 (render方法就是创建虚拟dom的方法)
// 4) 后续每次数据更新可以只执行render函数 (无需再次执行AST转化的过程)
// 5) render函数目的是产生虚拟节点 (render函数调用的时候，使用了响应式数据，更新数据会被监测到，数据更新之后就去重新执行render函数)
// 6) 根据生成的虚拟节点创造真实DOM

// vue和react在数据发生变化更新视图的区别？
// vue是组件级别的更新；react整棵树的更新；
