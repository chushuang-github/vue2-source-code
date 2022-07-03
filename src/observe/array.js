// 我们希望重写数组中的部分方法
// 获取数组的原型
let oldArrayProto = Array.prototype

// Object.create(oldArrayProto)：以数组原型对象为原型，创建一个新的对象
// newArrayProto.__proto === oldArrayProto
export let newArrayProto = Object.create(oldArrayProto)

// 重写的7个方法 (这7个方法是会修改原数组的)
let methods = [
  'push',
  'pop',
  'shift',
  'unshift',
  'reverse',
  'sort',
  'splice'
]

// 重新数组方法：重新的方法内部依然调用原数组里面的方法，保证重新的方法依然能够实现数组的功能
// 但是实现了数组这7个方法的劫持
methods.forEach(method => {
  newArrayProto[method] = function(...args) {
    const result = oldArrayProto[method].call(this, ...args)

    // 如果调用数组的push和unshift方法新增数据，新增的数据是对象的话，也需要对这个对象进行劫持
    // 数组的splice方法也可以新增数据
    // 数组增加的数据
    let inserted
    // this.__ob__：Observer类的实例对象
    let ob = this.__ob__

    switch(method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':  // arr.splice(1, 1, {a: 1}, {b: 2})
        inserted = args.slice(2)
        break
      default:
        break
    }
    // 如果有新增的，再次对新增的数据进行劫持
    if(inserted) {
      // 这里this表示数组，在Observer类里面写了data.__ob__，所以这里的数组(this)身上也会有__ob__
      ob.observeArray(inserted)
    }

    // 调用数组的7方法，会在这里劫持到 (对数组进行依赖收集，调用dep的notify方法，让dep去通过watcher进行更新)
    ob.dep.notify()

    return result
  }
})