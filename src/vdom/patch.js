import { createComponentVNode, isSameVNode } from './index'

// 在之前的更新中，每次更新都会产生新的虚拟节点，通过新的虚拟节点生成真实dom，生成后的替换掉老的节点 
// 这样做就是把之前的节点全都用新的替换掉，哪怕更新一丢丢也是全部替换，这样做性能是比较差的
// 使用diff算法：第一次渲染产生虚拟节点，后面再次渲染产生的虚拟节点和前一次的虚拟节点进行比对，找出差异，只更新变化的内容
// diff算法是平级比较的过程，父亲和父亲比较，儿子和儿子比较

// 创建组件
function createComponent(vnode) {
  let i = vnode.data
  // i上面有hook属性，并且把i.hook值赋值给i变量，在走后面的i = i.init判断
  if((i = i.hook) && (i = i.init)) {
    i(vnode) // 初始化组件
  }
  // 如果是组件，就会进去上面的if判断执行i(vnode)方法，执行这个方法，就会在vnode身上添加componentInstance属性
  if(vnode.componentInstance) {
    return true
  }
}

// 标签里面添加属性
function patchProps(el, oldProps = {}, props = {}) {
  // 老的属性里面有，新的属性里面没有，删除老的节点里面的该属性
  let oldStyles = oldProps.style || {}
  let newStyles = props.style || {}
  for(let key in oldStyles) {
    if(!newStyles[key]) {
      el.style[key] = ''
    }
  }
  // 老的属性里面有，新的属性里面没有，删除该属性
  for(let key in oldProps) {
    if(!props[key]) {
      el.removeAttribute(key)
    }
  }
  // 用新的属性覆盖老的属性
  for(let key in props) {
    if(key === 'style') {
      for(let styleName in props.style) {
        el.style[styleName] = props.style[styleName]
      }
    }else {
      el.setAttribute(key, props[key])
    }
  }
}

export function createElement(vnode) {
  let { tag, data, children, text } = vnode
  if(typeof tag === 'string') {  // 标签
    // 创建真实元素，也要区分是组件还是元素
    if(createComponent(vnode)) { // 组件
      return vnode.componentInstance.$el
    }

    // 在虚拟节点上面增加该虚拟节点对应的真实dom
    vnode.el = document.createElement(tag)
    // 更新属性
    patchProps(vnode.el, {}, data)
    children.forEach(child => {
      vnode.el.appendChild(createElement(child))
    })
  }else {
    // 创建文件节点
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}

export function patch(oldVnode, vnode) {
  if(!oldVnode) { // 组件的挂载
    return createElement(vnode)
  }

  // 初始化渲染 
  // 判断oldVnode是真实dom还是虚拟dom，真实dom表示初始化渲染，虚拟dom表示进行diff算法进行更新
  // 真实dom元素身上有nodeType属性，如果是虚拟dom nodeType值为undefined
  const isRealElement = oldVnode.nodeType
  if(isRealElement) {
    // 初始化渲染
    const elm = oldVnode
    const parentElm = elm.parentNode  // 获取父节点
    // 根据虚拟节点，创建真实节点
    let newElm = createElement(vnode)
    // 新的dom插入老的dom后一个兄弟节点之前，删除老的dom (elm.nextSibling获取元素的下一个兄弟节点)
    parentElm.insertBefore(newElm, elm.nextSibling)
    parentElm.removeChild(elm)

    return newElm
  }else {
    // diff算法
    // 1、两个节点不是同一个节点：直接删除老的删除新的(不进行比对)
    // 2、两个节点是同一个节点 (判断虚拟dom的tag属性和key属性，tag和key一样的，就是同一个节点)
    //    比较两个节点的属性是否有差异，复用老的节点，将差异的属性更新
    // 3、节点比较完毕，就需要比较两个虚拟的子节点
    return patchVNode(oldVnode, vnode)
  }
}

function patchVNode(oldVnode, vnode) {
  if(!isSameVNode(oldVnode, vnode)) {   // 不是同一个节点
    let el = createElement(vnode)
    oldVnode.el.parentNode.replaceChild(el, oldVnode.el)
    return el
  }

  // 文本的请求：文本期望比较一下文本的内容
  let el = vnode.el = oldVnode.el      // 走到这儿就是相同节点了，相同节点复用
  if(!oldVnode.tag) {    // 是文本，文本不相同，用新的文本覆盖就的文本(tag是undefined就表示文本节点)
    if(oldVnode.text !== vnode.text) {
      el.textContent = vnode.text
    }
  }

  // 相同节点(标签)：我们需要比对标签的属性
  patchProps(el, oldVnode.data, vnode.data)

  // 比较子节点 (diff算法比较难的地方就在这儿)
  // 一方有子节点，一方没有子节点；两方都有子节点
  let oldChildren = oldVnode.children  || []
  let newChildren = vnode.children  || []
  if(oldChildren.length > 0 && newChildren.length > 0) {   // 老的和新的都有子节点
    // 完整的diff算法，需要比较两个人的儿子
    updateChildren(el, oldChildren, newChildren)
  }else if(newChildren.length > 0) {   // 没有老的子节点，有新的子节点
    mountChildren(el, newChildren)
  }else if(oldChildren.length > 0) {   // 没有新的子节点，有老的子节点
    el.innerHTML = ""
  }

  return el
}

function mountChildren(el, newChildren) {
  for(let i = 0; i < newChildren.length; i++) {
    let child = newChildren[i]
    el.appendChild(createElement(child))
  }
}

function updateChildren(el, oldChildren, newChildren) {
  // 为了比较两个子节点，增高性能，会有一些优化手段
  // vue2中采用指针的方式比较两个节点
  // 4个指针
  let oldStartIndex = 0
  let newStartIndex = 0
  let oldEndIndex = oldChildren.length - 1
  let newEndIndex = newChildren.length - 1

  // 4个指针对应的虚拟节点
  let oldStartVnode = oldChildren[0]
  let newStartVnode = newChildren[0]
  let oldEndVnode = oldChildren[oldEndIndex]
  let newEndVnode = newChildren[newEndIndex]

  function makeIndexByKey(children) {
    // 对老的节点做一个映射，这样就不用每次都去遍历老的节点了
    let map = {}
    children.forEach((child, index) => {
      map[child.key] = index
    })
    return map
  }
  // 做映射表的原因是，避免每次都去遍历老的节点{ 老节点的key: 老节点的索引, .... }
  let map = makeIndexByKey(oldChildren)

  // 新虚拟节点和老虚拟节点，两者有其中一个头指针 大于等于 尾指针，则停止循环
  while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    // 如果老虚拟节点被标记为undefined了，就直接跳过
    if(oldStartVnode === undefined) {
      oldStartVnode = oldChildren[++oldStartIndex]
    }else if(oldEndVnode === undefined) {
      oldEndVnode = oldChildren[--oldEndIndex]
    }else if(isSameVNode(oldStartVnode, newStartVnode)) {
      patchVNode(oldStartVnode, newStartVnode)     // 如果是相同节点，低估比较子节点
      oldStartVnode = oldChildren[++oldStartIndex]
      newStartVnode = newChildren[++newStartIndex]
    }else if(isSameVNode(oldEndVnode, newEndVnode)) {
      patchVNode(oldEndVnode, newEndVnode)     // 如果是相同节点，低估比较子节点
      oldEndVnode = oldChildren[--oldEndIndex]
      newEndVnode = newChildren[--newEndIndex]
    }else if(isSameVNode(oldStartVnode, newEndVnode)) {
      patchVNode(oldStartVnode, newEndVnode)
      // insertBefore可以移动元素
      el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)
      oldStartVnode = oldChildren[++oldStartIndex]
      newEndVnode = newChildren[--newEndIndex]
    }else if(isSameVNode(oldEndVnode, newStartVnode)) {
      patchVNode(oldEndVnode, newStartVnode)
      el.insertBefore(oldEndVnode.el, oldStartVnode.el)
      oldEndVnode = oldChildren[--oldEndIndex]
      newStartVnode = newChildren[++newStartIndex]
    }else {
      // 乱序比对
      // 根据老的列表做一个映射关系，用新的去找，找到则移动，找不到则添加，最后多余的就删除
      // moveIndex如果有值，说明拿到的老的里面的节点是需要移动的
      let moveIndex = map[newStartVnode.key]
      if(moveIndex !== undefined) {
        let moveVnode = oldChildren[moveIndex] // 找到对应的节点，进行复用
        el.insertBefore(moveVnode.el, oldStartVnode.el)
        // 移动过的节点，在老的虚拟节点里面清空 (不能删除，删除会导致后面的虚拟节点前移)
        oldChildren[moveIndex] = undefined     // 标识这个虚拟节点对应的dom节点已经移动走了
        patchVNode(moveVnode, newStartVnode)   // 处理过的节点进行比对
      }else {
        let childEl = createElement(newStartVnode)
        el.insertBefore(childEl, oldStartVnode.el)   // 老节点里面没有，创建一个新的节点插在oldStartVnode前面
      }
      newStartVnode = newChildren[++newStartIndex]   // 新虚拟节点第一个节点前移(处理过了)
    }
  }

  // 插入节点 (可能插入前面，可能插入后面，也可能在中间插入，)
  if(newStartIndex <= newEndIndex) {
    for(let i = newStartIndex; i <= newEndIndex; i++) {
      let childEl = createElement(newChildren[i])
      // while过后newEndIndex值对应的后面一个节点newEndIndex + 1，向newEndIndex + 1这个索引对应节点的前面插入就ok了
      // 如果newEndIndex + 1索引对应的节点不存在，就向el的最后插入节点
      let anchor = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].el : null
      el.insertBefore(childEl, anchor)   // anchor为null是则会认为是appendChild (向el的最后插入childEl)
    }
  }

  // 删除节点
  if(oldStartIndex <= oldEndIndex) {
    for(let i = oldStartIndex; i <= oldEndIndex; i++) {
      if(oldChildren[i]) {
        let childEl = oldChildren[i].el
        el.removeChild(childEl)
      }
    }
  }
}