import { newArrayProto } from './array'
import Dep from './dep'

class Observer {
  constructor(data) {
    // 给所有对象和数组本身都增加收集功能，增加dep (data类型可能是数组，也可能是对象)
    this.dep = new Dep()

    // data身上增加一个属性__ob__，职位this(这里this表示Observer类的实例)
    // 给数据增加了一个标识，数据上面有__ob__，则说明这个属性是被观测的
    // __ob__：这个属性是不可遍历的，不然下面遍历data这个数据，就会报错
    Object.defineProperty(data, '__ob__', {
      enumerable: false,
      value: this
    })
    if(Array.isArray(data)) {
      // 重写数组中的7个方法：保留数组原有的特性，并且重写数组的部分方法
      // 改变数组的原型
      data.__proto__ = newArrayProto
      // 数组里面的属性如果是对象的话，这个对象也要被劫持
      this.observeArray(data)
    }else {
      // 给data对象重新定义响应式数据，去覆盖之前的普通数据
      // Object.defineProperty()只能劫持已经存在的属性，后增加的数据和删除的数据是劫持不到的
      // vue2里面会有一些单独的api去处理上面的情况 (Vue.$set、Vue.$delete)
      this.walk(data)
    }
  }

  // 循环对象，对属性依次进行劫持
  walk(data) {
    // 重新定义响应式属性，覆盖之前的属性
    Object.keys(data).forEach(key => defineReactive(data, key, data[key]))
  }

  // 观察数组，如果数组中的属性是对象的话，也要对数组中的对象进行劫持
  observeArray(data) {
    data.forEach(item => observe(item))
  }
}


// 数组里面的值是数组，需要对数组里面的数组本身进行依赖收集 (数组里面嵌套数组，嵌套的数组，不过多少层都要对该数组本身进行依赖收集)
// 结论：这个方法也说明了data里面的数据数组如果是深层次的嵌套数组，会递归进行依赖收集 (递归多了性能就差)
// 问题：Object.defineProperty对于不存在的属性检测不到，存在的属性还要重写一些方法(vue.$set，vue.$delete，数组的7个方法等)
// 综合以上问题，vue3采用了Proxy进行数据的劫持和代理 (Proxy里面不存在的属性可以检测到，存在的属性也不用重写了，但是Proxy也需要进行递归)
function dependArray(value) {
  for(let i = 0; i < value.length; i++) {
    let current = value[i]
    current.__ob__ && current.__ob__.dep.depend()
    // 递归调用，不管数组里面嵌套多少层的数组，都能进行依赖收集
    if(Array.isArray(current)) {
      dependArray(current)
    }
  }
}


// 属性劫持
// defineReactive方法可以单独的去使用，所以不放在Observer类里面
export function defineReactive(target, key, value) {
  // 对所有的对象都进行深度属性劫持 (递归深度劫持)，childOb身上有一个dep用来收集依赖
  // observe函数返回的是new Observer(data)类的实例
  const childOb = observe(value)

  // 给每个属性增加一个Dep
  let dep = new Dep()

  // 对数据进行劫持
  Object.defineProperty(target, key, {
    get() {
      // new Watcher进行初次渲染的时候，会去使用被劫持的数据从而进入get方法里面，该属性的dep就去收集当前watcher
      if(Dep.target) {
        dep.depend()  // 让这个属性的收集器记住当前的watcher
        // 让用户传入的配置项data里面的数据，对象和数组本身也实现依赖收集 (以前依赖收集针对属性，这里依赖收集针对对象和数组本身)
        // 举例：vm里面数据hobby: [1, 2, 3]，初始页面中这样 {{hobby}}，模板中JSON.stringify(hobby)取值，取hobby的值
        // vm.hobby就会触发get进入这里，让vm.hobby这个数组的dep也收集依赖(收集当前watcher)
        // vm.hobby.push()方法调用的时候，push方法里面调用了vm.hobby这个数组的dev.notify()方法进行更新
        if(childOb) {
          childOb.dep.depend()

          // 数组里面的某一项是数组，要对这个数组本身也要进行依赖收集
          if(Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set(newValue) {
      if(newValue === value) return
      // 如果newValue值是一个对象，需要对这个对象再次进行代理
      observe(newValue)
      // 这里面使用了闭包，所以直接修改value值，get里面取值的时候，取的值相当于从闭包里面取出来的 
      value = newValue
      // 更新属性的时候，要去重新渲染视图 (告诉该dep，让dep去通知的watcher去更新视图)
      dep.notify()
    }
  })
}


export function observe(data) {
  // 对这个对象进行劫持
  if(typeof data !== 'object' || typeof data === null) {
    return  // 只对对象进行劫持
  }
  // 数据上面有__ob__属性，表示该数据已经被代理过了
  if(data.__ob__ instanceof Observer) {
    return data.__ob__
  }

  // 如果一个对象被劫持过了，那就不需要再被劫持了
  // 要判断一个对象是否被劫持过，可以增添一个实例，用实例来判断是否被劫持过
  return new Observer(data)
}