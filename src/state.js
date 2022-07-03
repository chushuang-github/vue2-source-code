import { observe } from './observe'
import Watcher, { nextTick } from './observe/watcher'
import Dep from './observe/dep'

// 对数据进行劫持
export function initState(vm) {
  const opts = vm.$options
  // 初始化data
  if(opts.data) {
    initData(vm)
  }
  // 初始化计算属性computed
  if(opts.computed) {
    initComputed(vm)
  }
  // 初始化watch
  if(opts.watch) {
    initWatch(vm)
  }
}

function initData(vm) {
  // new Vue的时候，传入的data可能是函数，也可能是对象
  let data = vm.$options.data
  data = typeof data === 'function' ? data.call(vm) : data

  // 在vue的实例对象上面添加一个属性._data值为data，data是被劫持的对象(_data也就是被劫持的对象)
  vm._data = data
  // 对数据进行劫持 vue2里面使用了 Object.defineProperty()
  observe(data)

  // 将vm._data使用vm来代理
  for(let key in data) {
    proxy(vm, '_data', key)
  }
}
function proxy(vm, target, key) {
  Object.defineProperty(vm, key, {
    get() {
      // 读取vm[target][key]值的时候，回去触发defineReactive函数里面的劫持
      return vm[target][key]
    },
    set(newValue) {
      vm[target][key] = newValue
    }
  })
}

// vue2里面计算属性根本不会收集依赖，只会让自己依赖的属性去收集依赖
function initComputed(vm) {
  const computed = vm.$options.computed
  const watchers = vm._computedWatchers = {}   // 将计算属性watcher保存到vm身上
  for(let key in computed) {
    let userDef = computed[key]

    // 计算属性的watcher，监控计算属性中get的变化
    let fn = typeof userDef === 'function' ? userDef : userDef.get   // 计算属性的get方法
    // 直接new Watcher，默认就会去执行一遍fn函数，计算属性是不需要立即执行的，所以增加第三个参数让fn不立即执行
    // 将属性和watcher对应起来
    watchers[key] = new Watcher(vm, fn, { lazy: true })

    defineComputed(vm, key, userDef)
  }
}
function defineComputed(target, key, userDef) {
  // const getter = typeof userDef === 'function' ? userDef : userDef.get
  const setter = userDef.set || (() => {})

  // 将计算属性里面的属性挂载在vm实例身上
  Object.defineProperty(target, key, {
    get: createComputedGetter(key),
    set: setter
  })
}
function createComputedGetter(key) {
  // 我们需要检测是否执行这个getter
  return function() {
    const watcher = this._computedWatchers[key]   // 获取到对应计算属性的watcher
    if(watcher.dirty) {
      // 计算属性的值，也是在计算属性对应的watcher里面算出来的，计算属性watcher里面的dirty属性标记走缓存还是重新计算
      // 如果是脏的，就去执行用户传入的函数(计算属性watcher里面的dirty为true，就需要重新执行getter方法计算)
      // 求值后dirty变成了false，下次就直接取值，不调用getter求值了 (前提是计算属性依赖的数据没法发生变化)
      watcher.evaluate()
    }
    if(Dep.target) {   // 计算属性的watcher出栈后还有渲染watcher，让计算属性依赖的值也去收集上一次watcher
      watcher.depend()
    }
    return watcher.value
  }
}

function initWatch(vm) {
  let watch = vm.$options.watch
  for(let key in watch) {
    const handler = watch[key]    // 字符串 数组 函数
    if(Array.isArray(handler)) {
      for(let i = 0; i< handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    }else {
      createWatcher(vm, key, handler)
    }
  }
}
function createWatcher(vm, key, handler) {
  // 因为watch的写法种类太多，所有有很多情况是需要进行判断的
  // handler可能是字符串获取函数 (handler也可能是对象，但是这里没有考虑这种情况)
  if(typeof handler === 'string') {
    handler = vm[handler]
  }
  return vm.$watch(key, handler)
}

export function initStateMixin(Vue) {
  Vue.prototype.$nextTick = nextTick
  Vue.prototype.$watch = function(exprOrFn, cb, options = {}) {
    // exprOrFn：字符串firstName or () => vm.firstName
    // watch肯定是一个观察者，所以也是要new Watcher (这个watcher也会被监听的属性的dep收集起来)
    // firstName值变化了，执行cb回调函数
    new Watcher(this, exprOrFn, { user: true }, cb)
  }
}