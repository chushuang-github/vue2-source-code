import Dep from "./dep"
import { pushTarget, popTarget } from './dep'

let id = 0

// watcher就是观察者，属性对应的dep就是被观察者，属性变化被观察者会去通知所有的观察者去更新视图 -> 观察者模式
// Watcher就是真正更新视图的东西
// 不同组件有不同的watcher(每个组件都会去new一个Watcher)，使用id进行唯一标识
class Watcher {
  // 渲染watcher：exprOrFn函数作用调用vm._update(vm._render())渲染模板
  // 计算属性computed的watcher：exprOrFn函数是Object.defineProperty监控计算属性的getter方法
  // watch的watcher：调用exprOrFn函数，可以获取watch监听的那个属性的值
  constructor(vm, exprOrFn, options, cb) {
    this.vm = vm
    this.id = id++   // 每一个watcher都增加一个唯一标识
    this.renderWatcher = options  // true表示是一个渲染的watcher

    // watch创建的watcher，exprOrFn可能为字符串，也可能为函数
    // 计算属性创建的watcher 和 渲染watcher传入的exprOrFn值为函数
    if(typeof exprOrFn === 'string') {
      this.getter = function() {
        return vm[exprOrFn]
      }
    }else {
      this.getter = exprOrFn   // getter意味着调用这个函数可以发生取值
    }

    this.deps = []     // watcher记录dep：后续我们实现计算属性，和一些清理工作需要用到
    this.depsId = new Set()   // 收集的dep的id(每一个dep里面有一个id属性作为唯一标识)
    this.lazy = options.lazy  // 一个表示，表示当前watcher是计算属性watcher
    this.dirty = this.lazy    // 计算属性的缓存值
    this.cb = cb              // watch配置项的回调函数
    this.user = options.user  // 表示是用户自己的watcher

    this.value = this.lazy ? undefined : this.get()
  }

  get() {
    // 模板被编译成render函数，在模板编译的render函数里面取值的时候，才会收集依赖 (Dep.target赋值为当前watcher)
    pushTarget(this)               // 在Dep类上面添加静态属性，静态属性只有一份
    let value = this.getter.call(this.vm)      // 调用vm._update(vm._render())进行渲染
    popTarget()                    // 渲染完毕之后，就清空
    return value
  }

  evaluate() {
    this.value = this.get()     // 获取到用户函数的返回值，并且还要标识为脏
    this.dirty = false
  }

  depend() {
    let i = this.deps.length
    while(i--) {
      this.deps[i].depend()
    }
  }

  // 改方法在Dep类里面的depend方法中调用
  // watcher记录dep：一个组件(watcher)对应着多个属性，重复的属性也不用记录
  addDep(dep) {
    let id = dep.id
    // 如果当前watcher没有收集过这个dep，才会去收集 (去重了，没有才会添加)
    if(!this.depsId.has(id)) {
      this.deps.push(dep)   // 收集dep
      this.depsId.add(id)   // 存取dep的唯一标识id属性
      // watcher已经记住了dep，并且已经去重了，在这里调用当前dep的addSub方法并传递当前watcher实例对象
      // 调用dep里面的addSub方法，让dep也去记住watcher
      dep.addSub(this)
    }
  }

  // watcher里面更新视图的方法
  // 属性变化，Object.defineProperte里面的set方法会监听到属性变化，该属性的dep调用notify方法
  // 在dep里面的notify方法里面，遍历所有的watcher，调用watcher的update方法更新视图 (下面进行了异步更新的优化)
  // 优化：多个属性在同一方法里面更新，就会调用多次update，我们需要实现异步更新的功能
  update() {
    // this.lazy为true，表示当前watcher为计算属性的watcher
    if(this.lazy) {
      // 如果是计算属性，依赖的值发生变化，取计算属性值的时候，dirty为true就会重新调用getter方法计算(计算属性为脏值)
      this.dirty = true
    }
    // 调用get方法去更新视图 (直接更新，有个问题就是会多次更新，vue源码里面使用的是异步更新)
    // this.get()
    // 把当前的watcher暂存起来，等一个方法里面属性全部修改完毕在进行异步更新视图
    queueWatcher(this)
  }

  // 异步更新视图里面调用的run方法去更新视图
  run() {
    let oldValue = this.value
    let newValue = this.get()
    // 如果是用户自己是watcher，就表示是watch配置项创建的watcher
    if(this.user) {
      this.cb.call(this.vm, newValue, oldValue)
      this.value = newValue
    }
  }
}


// 异步更新
let queue = []  // 队列，保存所有需要更新视图的watcher(需要去重，Set容器去重，对象去重都可以)
let has = {}    // 使用对象去重
let pending = false   // 防抖
function flushSchedulerQueue () {
  let flushQueue = queue.slice(0)
  queue = []
  has = {}
  pending = false
  flushQueue.forEach(watcher => {
    watcher.run()   // 调用watcher里面run方法真正的更新视图
  })
}
function queueWatcher(watcher) {
  const id = watcher.id
  // 对象去重
  if(!has[id]) {
    queue.push(watcher)
    has[id] = true
    // vue一个方法里面多次更新数据，调用多次update方法，不管update执行多少次，最终只执行一次页面重新渲染的操作
    if(!pending) {
      // setTimeout是在一个宏任务队列里面去执行的
      nextTick(flushSchedulerQueue)
      pending = true
    }
  }
}


// 异步更新，实现nextTick函数 (异步的批处理)
let callbacks = []
let waiting = false
function flushCallbacks() {
  let cbs = callbacks.slice(0)
  waiting = false
  callbacks = []
  cbs.forEach(cb => cb())
}

// 微任务：promise.then回调、MutationObserver API(h5的api，只能在浏览器中使用，node中不可以使用)、queueMicrotask
// vue源码里面 nextTick 没有直接使用 setTimeout 去异步执行callbacks队列里面的回调函数，而是采用了优雅降级的方式
// vue源码内部采用的是promise(ie不兼容) -> MutationObserver -> 可以考虑ie专享的setImmediate方法 -> setTimeout
// vue源码看支不支持promise，不支持使用MutationObserver，还不支持在使用setImmediate，最后不行就使用setTimeout
// 其中：setImmediate 和 setTimeout是宏任务
export function nextTick(cb) {
  callbacks.push(cb)
  if(!waiting) {
    // setTimeout(() => {
    //   flushCallbacks()
    // }, 0)
    // 采用优雅降级的方式
    timerFunc()
    waiting = true
  }
}
// 异步执行api优先级：promise(ie不兼容) -> MutationObserver API -> setImmediate方法 -> setTimeout方法
let timerFunc
if(Promise) {
  timerFunc = () => {
    Promise.resolve().then(flushCallbacks)
  }
}else if(MutationObserver) {
  // MutationObserver：监听DOM元素的变化，DOM元素变化去执行MutationObserver里面传入的回调函数(是异步执行的)
  let observer = new MutationObserver(flushCallbacks)
  // 创建一个文本节点
  let textNode = document.createTextNode(1)
  // 调用observer.observe方法，去监控文本的变化
  observer.observe(textNode, {
    characterData: true    // 监控的是文本的数据
  })
  timerFunc = () => {
    // 改变textNode节点文本的数据，文本数据变化，会去执行MutationObserver里面传入的回调函数
    textNode.textContent = 2
  }
}else if(setImmediate) {  // ie浏览器才能使用
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
}else {
  timerFunc = () => {
    setTimeout(flushCallbacks)
  }
}

// 属性(一个属性一个dep)和组件(一个组件一个watcher)关系：多对多的关系
// 一个属性可以在多个组件里面使用，一个组件里面可以使用多个属性
// 给每个属性增加一个dep，目的就是收集watcher (依赖收集：就是让属性收集它所依赖的watcher)
// dep：是一个自定义属性(收集器)，可以用来收集watcher，一个组件对应一个watcher (dep让属性和组件产生关联)
// watcher：当属性发生变化的时候，该属性对应的dep通知收集的watcher，watcher就去重新更新视图(重新渲染)
// 1) 1个组件中，有多个属性(n个属性会对应一个组件)，n个属性会有n个dep对应一个watcher
// 2) 1个属性，也可能对应着多个组件 (一个属性，在多个组件里面使用，这个属性就对应着多个watcher)
//    1个属性，对应着一个dep，这个属性被多个组件使用 (该属性的dep就收集了多个watcher)


// Watcher 和 Dep如何关联起来？
// 前置：Dep类增加一个静态属性target；Object.defineProperty劫持每一个属性的时候给每一个属性增加一个dep
// 1) 当我们创建渲染Watcher类实例的时候，会把当前的watcher放到Dep.target身上
// 2) Watcher类里面回去调用get方法，get方法去调用传入getter函数(就是vm._update(vm._render())函数)，
//    调用getter函数会去取值(这些值已经被数据劫持过了)，会去走Object.defineProperty的get方法

export default Watcher