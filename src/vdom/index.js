// 构建虚拟DOM提供一些方法
// 是原始标签(div，span...)，还是组件标签(my-button...)
export const isReservedTag = (tag) => {
  return ['a', 'div', 'p', 'button', 'ul', 'li', 'span'].includes(tag)
}

// 创建元素的方法
// 之前讲过的h函数、项目里面的_c函数底层都是调用createElementVNode方法
export function createElementVNode(vm, tag, data, ...children) {
  if(data == null) {
    data = {}
  }
  let key = data.key
  if(key) {
    delete data.key
  }
  // 如果是原始标签
  if(isReservedTag(tag)) {
    return createVNode(vm, tag, key, data, children)
  }else {
    // 组件标签，创造一个组件的虚拟节点 (包含组件的构造函数)
    // Ctor有可能是Sub函数，也可以是组件的配置对象(这个对象包括template...等配置对象)
    const Ctor = vm.$options.components[tag]
    // 创建组件的虚拟节点
    return createComponentVNode(vm, tag, key, data, children, Ctor)
  }
}

export function createComponentVNode(vm, tag, key, data, children, Ctor) {
  if(typeof Ctor === 'object') {
    // vm.constructor就是vm的构造函数 - Vue，经过extend方法之后Ctor就一定是一个Sub函数了
    Ctor = vm.$options._base.extend(Ctor)
  }
  // 组件初始化的hook钩子函数
  data.hook = {
    // 稍后创造真实节点，如果是组件节点则调用此init方法(组件增加初始化钩子)
    init(vnode) {
      // 虚拟节点上面保存组件的实例对象
      let instance = vnode.componentInstance = new vnode.componentOptions.Ctor()
      instance.$mount()
    }
  }

  // 这里的Ctor一定是Sub构造函数：Sub.prototype = Object.create(Vue.prototype)
  return createVNode(vm, tag, key, data, children, null, { Ctor })
}

// 创建文本的方法，项目里面的_v函数底层就是调用createTextVNode方法
export function createTextVNode(vm, text) {
  return createVNode(vm, undefined, undefined, undefined, undefined, text)
}

// 创建虚拟节点
// 会有一个问题，虚拟dom不是和ast抽象语法树一样吗？
// 答：ast做的是语法层面的转化，它描述的是语法本身；虚拟dom是描述的dom元素，可以增加一些自定义的属性
// 虚拟dom和ast长的像，但是功能比较ast抽象语法树多 (ast可以描述html css js; 虚拟dom描述dom元素)
function createVNode(vm, tag, key, data, children, text, componentOptions) {
  return {
    vm,
    tag,
    key,
    data,
    children,
    text,
    componentOptions  // 组件的构造函数
    //... 后面可以扩展事件、指令、插槽，都可以在这里描述
  }
}

// 判断两个虚拟节点是否是同一个节点
export function isSameVNode(vnode1, vnode2) {
  return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key
}