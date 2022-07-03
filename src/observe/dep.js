let id = 0   // 当前dep的唯一标识

// Dep用来收集依赖，一个属性会对应一个dep，dep将使用该属性的一个或多个组件收集起来
// 首次渲染的时候手机依赖，更新的再次收集依赖
class Dep {
  constructor() {
    this.id = id++          // 属性的dep要收集watcher
    this.subs = []   // 存放着当前属性对应的watcher (Set容器可以去重，防止重复收集依赖)
  }

  // 收集器，收集watcher (watcher记录dep，还是dep收集watcher，都不能重复收集)
  // 先调用watcher里面addDep方法，让watcher记住dep；
  // watcher如果记录成功会调用dep里面的addSub方法，让dep也能收集watcher
  depend() {
    // 注意：dep收集watcher时，不要重复收集 (一个属性在一个watcher里面使用了多次，这个属性收集一次该watcher就可以了)
    // watcher和dep是多对多的关系
    // watcher也要去记录dep：实现计算属性，和组件卸载是一些清理工作需要用到
    // watcher的get方法里面，给Dep.target赋值为了当前的watcher，这里就是调用watcher里面的addDep
    Dep.target.addDep(this)

    // dep收集watcher：属性发生变化，让该属性的dep去通过watcher重新渲染视图
    // this.subs.push(Dep.target)   // 直接收集会重复收集
  }

  // dep真正收集watcher的方法 (该方法在Watcher里面的addDep方法中调用)
  addSub(watcher) {
    this.subs.push(watcher)
  }

  // dep通过watcher更新视图，重新渲染页面
  notify() {
    // 遍历该dep收集的所有watcher，调用watcher的update方法去更新视图
    this.subs.forEach(watcher => watcher.update())
  }
}
// 在Dep类上面增加一个静态属性
Dep.target = null

let stack = []
export function pushTarget(watcher) {
  stack.push(watcher)
  Dep.target = watcher
}
export function popTarget() {
  stack.pop()
  Dep.target = stack[stack.length - 1]
}

export default Dep