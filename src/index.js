import { initMixin } from './init'
import { initLifeCycle } from './lifecycle'
import { initGlobalAPI } from './globalAPI'
import { initStateMixin } from './state'
import { compilerToFunction } from './compiler'
import { patch, createElement } from './vdom/patch'

// options就是用户的选项
function Vue(options) {
  this._init(options)
}

initMixin(Vue)       // 扩展init方法
initLifeCycle(Vue)
initGlobalAPI(Vue)   // 扩展Vue.mixin方法 (全局api的实现)
initStateMixin(Vue)  // 扩展vm.$nextTick、vm.$watch...

export default Vue



// 测试diff算法的代码
// compilerToFunction模板编译成render函数
// render函数调用变成虚拟节点
// createElement(虚拟节点)变成真正的dom节点
// const render1 = compilerToFunction(`<ul style="color: red;">
//   <li key="a">a</li>
//   <li key="b">b</li>
//   <li key="c">c</li>
//   <li key="d">d</li>
// </ul>`)
// let vm1 = new Vue({
//   data: {
//     name: '珠峰'
//   }
// })
// const prevVnode = render1.call(vm1)

// let el = createElement(prevVnode)
// document.body.appendChild(el)

// const render2 = compilerToFunction(`<ul style="color: blue;">
//   <li key="b">b</li>
//   <li key="m">m</li>
//   <li key="a">a</li>
//   <li key="p">p</li>
//   <li key="c">c</li>
//   <li key="q">q</li>
// </ul>`)
// let vm2 = new Vue({
//   data: {
//     name: '教育'
//   }
// })
// const nextVnode = render2.call(vm2)

// setTimeout(() => {
//   patch(prevVnode, nextVnode)
// }, 1500)