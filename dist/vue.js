(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;

    var _s, _e;

    try {
      for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  // 我们希望重写数组中的部分方法
  // 获取数组的原型
  var oldArrayProto = Array.prototype; // Object.create(oldArrayProto)：以数组原型对象为原型，创建一个新的对象
  // newArrayProto.__proto === oldArrayProto

  var newArrayProto = Object.create(oldArrayProto); // 重写的7个方法 (这7个方法是会修改原数组的)

  var methods = ['push', 'pop', 'shift', 'unshift', 'reverse', 'sort', 'splice']; // 重新数组方法：重新的方法内部依然调用原数组里面的方法，保证重新的方法依然能够实现数组的功能
  // 但是实现了数组这7个方法的劫持

  methods.forEach(function (method) {
    newArrayProto[method] = function () {
      var _oldArrayProto$method;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var result = (_oldArrayProto$method = oldArrayProto[method]).call.apply(_oldArrayProto$method, [this].concat(args)); // 如果调用数组的push和unshift方法新增数据，新增的数据是对象的话，也需要对这个对象进行劫持
      // 数组的splice方法也可以新增数据
      // 数组增加的数据


      var inserted; // this.__ob__：Observer类的实例对象

      var ob = this.__ob__;

      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break;

        case 'splice':
          // arr.splice(1, 1, {a: 1}, {b: 2})
          inserted = args.slice(2);
          break;
      } // 如果有新增的，再次对新增的数据进行劫持


      if (inserted) {
        // 这里this表示数组，在Observer类里面写了data.__ob__，所以这里的数组(this)身上也会有__ob__
        ob.observeArray(inserted);
      } // 调用数组的7方法，会在这里劫持到 (对数组进行依赖收集，调用dep的notify方法，让dep去通过watcher进行更新)


      ob.dep.notify();
      return result;
    };
  });

  var id$1 = 0; // 当前dep的唯一标识
  // Dep用来收集依赖，一个属性会对应一个dep，dep将使用该属性的一个或多个组件收集起来
  // 首次渲染的时候手机依赖，更新的再次收集依赖

  var Dep = /*#__PURE__*/function () {
    function Dep() {
      _classCallCheck(this, Dep);

      this.id = id$1++; // 属性的dep要收集watcher

      this.subs = []; // 存放着当前属性对应的watcher (Set容器可以去重，防止重复收集依赖)
    } // 收集器，收集watcher (watcher记录dep，还是dep收集watcher，都不能重复收集)
    // 先调用watcher里面addDep方法，让watcher记住dep；
    // watcher如果记录成功会调用dep里面的addSub方法，让dep也能收集watcher


    _createClass(Dep, [{
      key: "depend",
      value: function depend() {
        // 注意：dep收集watcher时，不要重复收集 (一个属性在一个watcher里面使用了多次，这个属性收集一次该watcher就可以了)
        // watcher和dep是多对多的关系
        // watcher也要去记录dep：实现计算属性，和组件卸载是一些清理工作需要用到
        // watcher的get方法里面，给Dep.target赋值为了当前的watcher，这里就是调用watcher里面的addDep
        Dep.target.addDep(this); // dep收集watcher：属性发生变化，让该属性的dep去通过watcher重新渲染视图
        // this.subs.push(Dep.target)   // 直接收集会重复收集
      } // dep真正收集watcher的方法 (该方法在Watcher里面的addDep方法中调用)

    }, {
      key: "addSub",
      value: function addSub(watcher) {
        this.subs.push(watcher);
      } // dep通过watcher更新视图，重新渲染页面

    }, {
      key: "notify",
      value: function notify() {
        // 遍历该dep收集的所有watcher，调用watcher的update方法去更新视图
        this.subs.forEach(function (watcher) {
          return watcher.update();
        });
      }
    }]);

    return Dep;
  }(); // 在Dep类上面增加一个静态属性


  Dep.target = null;
  var stack = [];
  function pushTarget(watcher) {
    stack.push(watcher);
    Dep.target = watcher;
  }
  function popTarget() {
    stack.pop();
    Dep.target = stack[stack.length - 1];
  }

  var Observer = /*#__PURE__*/function () {
    function Observer(data) {
      _classCallCheck(this, Observer);

      // 给所有对象和数组本身都增加收集功能，增加dep (data类型可能是数组，也可能是对象)
      this.dep = new Dep(); // data身上增加一个属性__ob__，职位this(这里this表示Observer类的实例)
      // 给数据增加了一个标识，数据上面有__ob__，则说明这个属性是被观测的
      // __ob__：这个属性是不可遍历的，不然下面遍历data这个数据，就会报错

      Object.defineProperty(data, '__ob__', {
        enumerable: false,
        value: this
      });

      if (Array.isArray(data)) {
        // 重写数组中的7个方法：保留数组原有的特性，并且重写数组的部分方法
        // 改变数组的原型
        data.__proto__ = newArrayProto; // 数组里面的属性如果是对象的话，这个对象也要被劫持

        this.observeArray(data);
      } else {
        // 给data对象重新定义响应式数据，去覆盖之前的普通数据
        // Object.defineProperty()只能劫持已经存在的属性，后增加的数据和删除的数据是劫持不到的
        // vue2里面会有一些单独的api去处理上面的情况 (Vue.$set、Vue.$delete)
        this.walk(data);
      }
    } // 循环对象，对属性依次进行劫持


    _createClass(Observer, [{
      key: "walk",
      value: function walk(data) {
        // 重新定义响应式属性，覆盖之前的属性
        Object.keys(data).forEach(function (key) {
          return defineReactive(data, key, data[key]);
        });
      } // 观察数组，如果数组中的属性是对象的话，也要对数组中的对象进行劫持

    }, {
      key: "observeArray",
      value: function observeArray(data) {
        data.forEach(function (item) {
          return observe(item);
        });
      }
    }]);

    return Observer;
  }(); // 数组里面的值是数组，需要对数组里面的数组本身进行依赖收集 (数组里面嵌套数组，嵌套的数组，不过多少层都要对该数组本身进行依赖收集)
  // 结论：这个方法也说明了data里面的数据数组如果是深层次的嵌套数组，会递归进行依赖收集 (递归多了性能就差)
  // 问题：Object.defineProperty对于不存在的属性检测不到，存在的属性还要重写一些方法(vue.$set，vue.$delete，数组的7个方法等)
  // 综合以上问题，vue3采用了Proxy进行数据的劫持和代理 (Proxy里面不存在的属性可以检测到，存在的属性也不用重写了，但是Proxy也需要进行递归)


  function dependArray(value) {
    for (var i = 0; i < value.length; i++) {
      var current = value[i];
      current.__ob__ && current.__ob__.dep.depend(); // 递归调用，不管数组里面嵌套多少层的数组，都能进行依赖收集

      if (Array.isArray(current)) {
        dependArray(current);
      }
    }
  } // 属性劫持
  // defineReactive方法可以单独的去使用，所以不放在Observer类里面


  function defineReactive(target, key, value) {
    // 对所有的对象都进行深度属性劫持 (递归深度劫持)，childOb身上有一个dep用来收集依赖
    // observe函数返回的是new Observer(data)类的实例
    var childOb = observe(value); // 给每个属性增加一个Dep

    var dep = new Dep(); // 对数据进行劫持

    Object.defineProperty(target, key, {
      get: function get() {
        // new Watcher进行初次渲染的时候，会去使用被劫持的数据从而进入get方法里面，该属性的dep就去收集当前watcher
        if (Dep.target) {
          dep.depend(); // 让这个属性的收集器记住当前的watcher
          // 让用户传入的配置项data里面的数据，对象和数组本身也实现依赖收集 (以前依赖收集针对属性，这里依赖收集针对对象和数组本身)
          // 举例：vm里面数据hobby: [1, 2, 3]，初始页面中这样 {{hobby}}，模板中JSON.stringify(hobby)取值，取hobby的值
          // vm.hobby就会触发get进入这里，让vm.hobby这个数组的dep也收集依赖(收集当前watcher)
          // vm.hobby.push()方法调用的时候，push方法里面调用了vm.hobby这个数组的dev.notify()方法进行更新

          if (childOb) {
            childOb.dep.depend(); // 数组里面的某一项是数组，要对这个数组本身也要进行依赖收集

            if (Array.isArray(value)) {
              dependArray(value);
            }
          }
        }

        return value;
      },
      set: function set(newValue) {
        if (newValue === value) return; // 如果newValue值是一个对象，需要对这个对象再次进行代理

        observe(newValue); // 这里面使用了闭包，所以直接修改value值，get里面取值的时候，取的值相当于从闭包里面取出来的 

        value = newValue; // 更新属性的时候，要去重新渲染视图 (告诉该dep，让dep去通知的watcher去更新视图)

        dep.notify();
      }
    });
  }
  function observe(data) {
    // 对这个对象进行劫持
    if (_typeof(data) !== 'object' || _typeof(data) === null) {
      return; // 只对对象进行劫持
    } // 数据上面有__ob__属性，表示该数据已经被代理过了


    if (data.__ob__ instanceof Observer) {
      return data.__ob__;
    } // 如果一个对象被劫持过了，那就不需要再被劫持了
    // 要判断一个对象是否被劫持过，可以增添一个实例，用实例来判断是否被劫持过


    return new Observer(data);
  }

  var id = 0; // watcher就是观察者，属性对应的dep就是被观察者，属性变化被观察者会去通知所有的观察者去更新视图 -> 观察者模式
  // Watcher就是真正更新视图的东西
  // 不同组件有不同的watcher(每个组件都会去new一个Watcher)，使用id进行唯一标识

  var Watcher = /*#__PURE__*/function () {
    // 渲染watcher：exprOrFn函数作用调用vm._update(vm._render())渲染模板
    // 计算属性computed的watcher：exprOrFn函数是Object.defineProperty监控计算属性的getter方法
    // watch的watcher：调用exprOrFn函数，可以获取watch监听的那个属性的值
    function Watcher(vm, exprOrFn, options, cb) {
      _classCallCheck(this, Watcher);

      this.vm = vm;
      this.id = id++; // 每一个watcher都增加一个唯一标识

      this.renderWatcher = options; // true表示是一个渲染的watcher
      // watch创建的watcher，exprOrFn可能为字符串，也可能为函数
      // 计算属性创建的watcher 和 渲染watcher传入的exprOrFn值为函数

      if (typeof exprOrFn === 'string') {
        this.getter = function () {
          return vm[exprOrFn];
        };
      } else {
        this.getter = exprOrFn; // getter意味着调用这个函数可以发生取值
      }

      this.deps = []; // watcher记录dep：后续我们实现计算属性，和一些清理工作需要用到

      this.depsId = new Set(); // 收集的dep的id(每一个dep里面有一个id属性作为唯一标识)

      this.lazy = options.lazy; // 一个表示，表示当前watcher是计算属性watcher

      this.dirty = this.lazy; // 计算属性的缓存值

      this.cb = cb; // watch配置项的回调函数

      this.user = options.user; // 表示是用户自己的watcher

      this.value = this.lazy ? undefined : this.get();
    }

    _createClass(Watcher, [{
      key: "get",
      value: function get() {
        // 模板被编译成render函数，在模板编译的render函数里面取值的时候，才会收集依赖 (Dep.target赋值为当前watcher)
        pushTarget(this); // 在Dep类上面添加静态属性，静态属性只有一份

        var value = this.getter.call(this.vm); // 调用vm._update(vm._render())进行渲染

        popTarget(); // 渲染完毕之后，就清空

        return value;
      }
    }, {
      key: "evaluate",
      value: function evaluate() {
        this.value = this.get(); // 获取到用户函数的返回值，并且还要标识为脏

        this.dirty = false;
      }
    }, {
      key: "depend",
      value: function depend() {
        var i = this.deps.length;

        while (i--) {
          this.deps[i].depend();
        }
      } // 改方法在Dep类里面的depend方法中调用
      // watcher记录dep：一个组件(watcher)对应着多个属性，重复的属性也不用记录

    }, {
      key: "addDep",
      value: function addDep(dep) {
        var id = dep.id; // 如果当前watcher没有收集过这个dep，才会去收集 (去重了，没有才会添加)

        if (!this.depsId.has(id)) {
          this.deps.push(dep); // 收集dep

          this.depsId.add(id); // 存取dep的唯一标识id属性
          // watcher已经记住了dep，并且已经去重了，在这里调用当前dep的addSub方法并传递当前watcher实例对象
          // 调用dep里面的addSub方法，让dep也去记住watcher

          dep.addSub(this);
        }
      } // watcher里面更新视图的方法
      // 属性变化，Object.defineProperte里面的set方法会监听到属性变化，该属性的dep调用notify方法
      // 在dep里面的notify方法里面，遍历所有的watcher，调用watcher的update方法更新视图 (下面进行了异步更新的优化)
      // 优化：多个属性在同一方法里面更新，就会调用多次update，我们需要实现异步更新的功能

    }, {
      key: "update",
      value: function update() {
        // this.lazy为true，表示当前watcher为计算属性的watcher
        if (this.lazy) {
          // 如果是计算属性，依赖的值发生变化，取计算属性值的时候，dirty为true就会重新调用getter方法计算(计算属性为脏值)
          this.dirty = true;
        } // 调用get方法去更新视图 (直接更新，有个问题就是会多次更新，vue源码里面使用的是异步更新)
        // this.get()
        // 把当前的watcher暂存起来，等一个方法里面属性全部修改完毕在进行异步更新视图


        queueWatcher(this);
      } // 异步更新视图里面调用的run方法去更新视图

    }, {
      key: "run",
      value: function run() {
        var oldValue = this.value;
        var newValue = this.get(); // 如果是用户自己是watcher，就表示是watch配置项创建的watcher

        if (this.user) {
          this.cb.call(this.vm, newValue, oldValue);
          this.value = newValue;
        }
      }
    }]);

    return Watcher;
  }(); // 异步更新


  var queue = []; // 队列，保存所有需要更新视图的watcher(需要去重，Set容器去重，对象去重都可以)

  var has = {}; // 使用对象去重

  var pending = false; // 防抖

  function flushSchedulerQueue() {
    var flushQueue = queue.slice(0);
    queue = [];
    has = {};
    pending = false;
    flushQueue.forEach(function (watcher) {
      watcher.run(); // 调用watcher里面run方法真正的更新视图
    });
  }

  function queueWatcher(watcher) {
    var id = watcher.id; // 对象去重

    if (!has[id]) {
      queue.push(watcher);
      has[id] = true; // vue一个方法里面多次更新数据，调用多次update方法，不管update执行多少次，最终只执行一次页面重新渲染的操作

      if (!pending) {
        // setTimeout是在一个宏任务队列里面去执行的
        nextTick(flushSchedulerQueue);
        pending = true;
      }
    }
  } // 异步更新，实现nextTick函数 (异步的批处理)


  var callbacks = [];
  var waiting = false;

  function flushCallbacks() {
    var cbs = callbacks.slice(0);
    waiting = false;
    callbacks = [];
    cbs.forEach(function (cb) {
      return cb();
    });
  } // 微任务：promise.then回调、MutationObserver API(h5的api，只能在浏览器中使用，node中不可以使用)、queueMicrotask
  // vue源码里面 nextTick 没有直接使用 setTimeout 去异步执行callbacks队列里面的回调函数，而是采用了优雅降级的方式
  // vue源码内部采用的是promise(ie不兼容) -> MutationObserver -> 可以考虑ie专享的setImmediate方法 -> setTimeout
  // vue源码看支不支持promise，不支持使用MutationObserver，还不支持在使用setImmediate，最后不行就使用setTimeout
  // 其中：setImmediate 和 setTimeout是宏任务


  function nextTick(cb) {
    callbacks.push(cb);

    if (!waiting) {
      // setTimeout(() => {
      //   flushCallbacks()
      // }, 0)
      // 采用优雅降级的方式
      timerFunc();
      waiting = true;
    }
  } // 异步执行api优先级：promise(ie不兼容) -> MutationObserver API -> setImmediate方法 -> setTimeout方法

  var timerFunc;

  if (Promise) {
    timerFunc = function timerFunc() {
      Promise.resolve().then(flushCallbacks);
    };
  } else if (MutationObserver) {
    // MutationObserver：监听DOM元素的变化，DOM元素变化去执行MutationObserver里面传入的回调函数(是异步执行的)
    var observer = new MutationObserver(flushCallbacks); // 创建一个文本节点

    var textNode = document.createTextNode(1); // 调用observer.observe方法，去监控文本的变化

    observer.observe(textNode, {
      characterData: true // 监控的是文本的数据

    });

    timerFunc = function timerFunc() {
      // 改变textNode节点文本的数据，文本数据变化，会去执行MutationObserver里面传入的回调函数
      textNode.textContent = 2;
    };
  } else if (setImmediate) {
    // ie浏览器才能使用
    timerFunc = function timerFunc() {
      setImmediate(flushCallbacks);
    };
  } else {
    timerFunc = function timerFunc() {
      setTimeout(flushCallbacks);
    };
  } // 属性(一个属性一个dep)和组件(一个组件一个watcher)关系：多对多的关系

  function initState(vm) {
    var opts = vm.$options; // 初始化data

    if (opts.data) {
      initData(vm);
    } // 初始化计算属性computed


    if (opts.computed) {
      initComputed(vm);
    } // 初始化watch


    if (opts.watch) {
      initWatch(vm);
    }
  }

  function initData(vm) {
    // new Vue的时候，传入的data可能是函数，也可能是对象
    var data = vm.$options.data;
    data = typeof data === 'function' ? data.call(vm) : data; // 在vue的实例对象上面添加一个属性._data值为data，data是被劫持的对象(_data也就是被劫持的对象)

    vm._data = data; // 对数据进行劫持 vue2里面使用了 Object.defineProperty()

    observe(data); // 将vm._data使用vm来代理

    for (var key in data) {
      proxy(vm, '_data', key);
    }
  }

  function proxy(vm, target, key) {
    Object.defineProperty(vm, key, {
      get: function get() {
        // 读取vm[target][key]值的时候，回去触发defineReactive函数里面的劫持
        return vm[target][key];
      },
      set: function set(newValue) {
        vm[target][key] = newValue;
      }
    });
  } // vue2里面计算属性根本不会收集依赖，只会让自己依赖的属性去收集依赖


  function initComputed(vm) {
    var computed = vm.$options.computed;
    var watchers = vm._computedWatchers = {}; // 将计算属性watcher保存到vm身上

    for (var key in computed) {
      var userDef = computed[key]; // 计算属性的watcher，监控计算属性中get的变化

      var fn = typeof userDef === 'function' ? userDef : userDef.get; // 计算属性的get方法
      // 直接new Watcher，默认就会去执行一遍fn函数，计算属性是不需要立即执行的，所以增加第三个参数让fn不立即执行
      // 将属性和watcher对应起来

      watchers[key] = new Watcher(vm, fn, {
        lazy: true
      });
      defineComputed(vm, key, userDef);
    }
  }

  function defineComputed(target, key, userDef) {
    // const getter = typeof userDef === 'function' ? userDef : userDef.get
    var setter = userDef.set || function () {}; // 将计算属性里面的属性挂载在vm实例身上


    Object.defineProperty(target, key, {
      get: createComputedGetter(key),
      set: setter
    });
  }

  function createComputedGetter(key) {
    // 我们需要检测是否执行这个getter
    return function () {
      var watcher = this._computedWatchers[key]; // 获取到对应计算属性的watcher

      if (watcher.dirty) {
        // 计算属性的值，也是在计算属性对应的watcher里面算出来的，计算属性watcher里面的dirty属性标记走缓存还是重新计算
        // 如果是脏的，就去执行用户传入的函数(计算属性watcher里面的dirty为true，就需要重新执行getter方法计算)
        // 求值后dirty变成了false，下次就直接取值，不调用getter求值了 (前提是计算属性依赖的数据没法发生变化)
        watcher.evaluate();
      }

      if (Dep.target) {
        // 计算属性的watcher出栈后还有渲染watcher，让计算属性依赖的值也去收集上一次watcher
        watcher.depend();
      }

      return watcher.value;
    };
  }

  function initWatch(vm) {
    var watch = vm.$options.watch;

    for (var key in watch) {
      var handler = watch[key]; // 字符串 数组 函数

      if (Array.isArray(handler)) {
        for (var i = 0; i < handler.length; i++) {
          createWatcher(vm, key, handler[i]);
        }
      } else {
        createWatcher(vm, key, handler);
      }
    }
  }

  function createWatcher(vm, key, handler) {
    // 因为watch的写法种类太多，所有有很多情况是需要进行判断的
    // handler可能是字符串获取函数 (handler也可能是对象，但是这里没有考虑这种情况)
    if (typeof handler === 'string') {
      handler = vm[handler];
    }

    return vm.$watch(key, handler);
  }

  function initStateMixin(Vue) {
    Vue.prototype.$nextTick = nextTick;

    Vue.prototype.$watch = function (exprOrFn, cb) {
      // exprOrFn：字符串firstName or () => vm.firstName
      // watch肯定是一个观察者，所以也是要new Watcher (这个watcher也会被监听的属性的dep收集起来)
      // firstName值变化了，执行cb回调函数
      new Watcher(this, exprOrFn, {
        user: true
      }, cb);
    };
  }

  // 标签：<div style="color: red;">name: {{name}}</div>
  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z]*";
  var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")"); // 匹配到的分组是一个开始标签名字，标签两种形式：<xxx   or   <xxx:xxx

  var startTagOpen = new RegExp("^<".concat(qnameCapture)); // 匹配结束标签的名字  </xxxx>

  var endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>")); // 匹配标签里面的属性
  // [^]正则表示'除了'，[^\s"'<>\/=]+：除了 空格 " ' < > / = 这些符号一个或多个
  // \s正则表示'空格'；+正则一个或多个；*正则0或多个；?正则0个或1个
  // 注意：正则里面使用括号()表示捕获，但是(?:pattern)是⾮捕获型括号，匹配pattern，但不捕获匹配结果
  // 总结：(后面有?:，表示该括号值匹配括号里面的内容，不捕获括号里面的内容

  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配的内容：/>  or  >，开始标签为 <div>、自闭合标签<br />

  var startTagClose = /^\s*(\/?)>/; // 匹配的内容：{{ aadfa }}
  // 也可以使用htmlparser2第三方库进行解析   npm i htmlparser2

  /*
    <div id="app">
      <div style="color: red;">name: {{name}}</div>
      <span>age: {{age}}</span>
    </div>
  */

  /* 解析成下面的AST抽象语法树形式(标签type为1，文本type为3)
    {
      tag: 'div',
      type: 1,
      attrs: [{ name: 'id', value: 'app' }, {}, {}...],
      parent: null,
      children: [
        {
          tag: 'div',
          type: 1,
          attrs: [{ name: 'style', value: 'color: red;' }],
          parent: 父级的div元素,
          children: [{ type: 3, text: 'name: {{name}}' }]
        },
        {
          tag: 'span',
          type: 1,
          attrs: [],
          parent: 父级的div元素,
          children: [{ type: 3, text: 'age: {{age}}' }]
        },
      ]
    }
  */
  // html标签字符串解析成AST抽象语法树
  // vue2里面html字符串最开始肯定是一个 <
  // html字符串，解析完之后，就在html里面删除解析完的这部分字符串 

  function parseHTML(html) {
    var ELEMENT_TYPE = 1;
    var TEXT_TYPE = 3;
    var stack = []; // 使用栈结构，用于存放元素(栈-后进先出)

    var currentParent; // 指针，指向栈中的最后一个

    var root; // 根标签
    // 进栈构建父子关系，出栈改变指针
    // 匹配到开始标签

    function createASTElement(tag, attrs) {
      return {
        tag: tag,
        type: ELEMENT_TYPE,
        children: [],
        attrs: attrs,
        parent: null
      };
    }

    function start(tag, attrs) {
      // 遇到开始标签
      var node = createASTElement(tag, attrs); // 创建一个节点

      if (!root) {
        // 看一下是否为空树，如果是空树则当前节点是根标签
        root = node;
      } // 开始标签，currentParent有值，当前currentParent就是新创建的node的父元素(必须熟悉栈的操作)
      // node设置父节点，currentParent设置子节点


      if (currentParent) {
        node.parent = currentParent;
        currentParent.children.push(node);
      }

      stack.push(node); // 进行压栈操作

      currentParent = node; // currentParent为栈中最后一个元素
    } // 匹配到文本


    function chars(text) {
      // 文本，给currentParent设置值
      text = text.replace(/\s/g, ''); // 去掉空格

      text && currentParent.children.push({
        type: TEXT_TYPE,
        text: text,
        parent: currentParent
      });
    } // 匹配到结束标签


    function end(tag) {
      // 遇到结束标签，出栈
      var node = stack.pop(); // 还可以校验标签是否合法 (结束的标签和栈弹出的标签是否一样)

      if (node.tag === tag) {
        currentParent = stack[stack.length - 1];
      }
    } // 解析完的字符串标签之后删除解析完的这部分字符串标签


    function advance(n) {
      html = html.substring(n);
    } // 判断是不是开始标签，是开始标签就解析，不是开始标签返回false


    function parseStartTag() {
      // 调用字符串的match方法结合正则表达式进行匹配标签字符串
      var start = html.match(startTagOpen); // 如果是开始标签

      if (start) {
        var match = {
          tagName: start[1],
          // 标签名
          attrs: []
        };
        advance(start[0].length); // 如果不是开始标签对应的结束标签的话，就一直匹配下去

        var attr, _end;

        while (!(_end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          advance(attr[0].length);
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5] || true
          });
        }

        if (_end) {
          advance(_end[0].length);
        }

        return match;
      } // 不是开始标签，返回false


      return false;
    }

    while (html) {
      // <div>aaa</div>     </div>     aaa</div>
      // 如果textEnd值为0，则表示是一个开始标签 或者 结束标签
      // 如果textEnd值大于0，则表示是文本的结束位置
      var textEnd = html.indexOf('<');

      if (textEnd === 0) {
        // 开始标签的匹配结果
        var startTagMatch = parseStartTag();

        if (startTagMatch) {
          // 解析到的开始标签
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue;
        } // 不是开始标签，就是结束标签 (直接删除结束标签)


        var endTagMatch = html.match(endTag);

        if (endTagMatch) {
          end(endTagMatch[1]);
          advance(endTagMatch[0].length);
          continue;
        }
      } // 处理文本


      if (textEnd > 0) {
        var text = html.substring(0, textEnd);

        if (text) {
          // 解析到的文本
          chars(text);
          advance(text.length);
        }
      }
    }

    return root;
  }

  function genProps(attrs) {
    var str = '';

    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];

      if (attr.name === 'style') {
        (function () {
          // color: blue; background: blue  -->  {color: 'blue', background: 'blue'}
          var obj = {};
          attr.value.split(';').filter(Boolean).forEach(function (item) {
            var _item$split = item.split(':'),
                _item$split2 = _slicedToArray(_item$split, 2),
                key = _item$split2[0],
                value = _item$split2[1];

            obj[key.trim()] = value.trim();
          });
          attr.value = obj;
        })();
      }

      str += "".concat(attr.name, ":").concat(JSON.stringify(attr.value), ",");
    }

    return "{".concat(str.slice(0, -1), "}");
  }

  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // 匹配：{{ adfad }}

  function gen(node) {
    if (node.type === 1) {
      return codegen(node);
    } else {
      // 文本
      var text = node.text;

      if (!defaultTagRE.test(text)) {
        return "_v(".concat(JSON.stringify(text), ")");
      } else {
        // {{name}}hello{{age}}  -->  _v(_s(name) + 'hello' + _s(name))
        var tokens = [];
        var match;
        var lastIndex = 0; // 最后匹配到的位置
        // exec() 方法用于检索字符串中的正则表达式的匹配 (exec里面正则如何是全局匹配，则需要注意下面的点)
        // exec:如果在一个字符串中完成了一次模式匹配之后要开始检索新的字符串，就必须手动地把 lastIndex 属性重置为 0

        defaultTagRE.lastIndex = 0; // 正则表达式的捕获方法 正则.exec(字符串)

        while (match = defaultTagRE.exec(text)) {
          // text：{{name}}hello{{age}}world
          // match：['{{name}}', 'name', index: 0, input: '{{name}}hello{{age}}', groups: undefined]
          // match：['{{age}}', 'age', index: 13, input: '{{name}}hello{{age}}', groups: undefined]
          var index = match.index; // 匹配的位置

          if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
          }

          tokens.push("_s(".concat(match[1].trim(), ")"));
          lastIndex = index + match[0].length;
        }

        if (lastIndex < text.length) {
          tokens.push(JSON.stringify(text.slice(lastIndex)));
        } // tokens：['_s(name)', '"hello"', '_s(age)', '"world"']


        return "_v(".concat(tokens.join('+'), ")");
      }
    }
  }

  function genChildren(children) {
    if (children) {
      return children.map(function (child) {
        return gen(child);
      }).join(',');
    }
  }

  function codegen(ast) {
    var children = genChildren(ast.children);
    var code = "_c('".concat(ast.tag, "',").concat(ast.attrs.length > 0 ? genProps(ast.attrs) : 'null').concat(ast.children.length > 0 ? ",".concat(children) : '', ")");
    return code;
  } // vue3采用的不是正则
  // 对模板进行编译


  function compilerToFunction(template) {
    // 1.将template转化成ast抽象语法树 (利用栈型结构来构建AST抽象语法树)
    var ast = parseHTML(template); // 2.生成render方法 (render方法执行后的返回结果就是虚拟dom)
    // 把ast抽象语法树组装成下面的形式，将ast抽象语法树拼接成字符串代码
    // _c就相当于h函数，第三个参数开始一直往后面就是子标签
    //  `_c(
    //     'div',
    //     {id:"app",style:{"color":"blue","background":"orange"}},
    //     _c('div',{style:{"color":"red"}},_v(_s(name),"hello",_s(age),"world")), 
    //     _c('span',null,_v("world"))
    //   )`
    // 模板引擎的实现原理：with + new Function()

    var code = codegen(ast); // with语法：code这个字符串代码里面的变量优先从this里面取值，this是什么要去看如何调用render函数的

    code = "with(this){return ".concat(code, "}");
    var render = new Function(code); // 根据代码生成render函数
    // _c就是h函数，只不过名字不一样；文本使用_v函数；文本里面的变量使用_s函数
    // ƒ anonymous() {
    //   with(this){return _c('div',{id:"app",style:{"color":"blue","background":"orange"}},_c('div',{style:{"color":"red"}},_v(_s(name),"hello",_s(age),"world")),_c('span',null,_v("world")))}
    // }

    return render;
  }

  // 构建虚拟DOM提供一些方法
  // 是原始标签(div，span...)，还是组件标签(my-button...)
  var isReservedTag = function isReservedTag(tag) {
    return ['a', 'div', 'p', 'button', 'ul', 'li', 'span'].includes(tag);
  }; // 创建元素的方法
  // 之前讲过的h函数、项目里面的_c函数底层都是调用createElementVNode方法

  function createElementVNode(vm, tag, data) {
    if (data == null) {
      data = {};
    }

    var key = data.key;

    if (key) {
      delete data.key;
    } // 如果是原始标签


    for (var _len = arguments.length, children = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
      children[_key - 3] = arguments[_key];
    }

    if (isReservedTag(tag)) {
      return createVNode(vm, tag, key, data, children);
    } else {
      // 组件标签，创造一个组件的虚拟节点 (包含组件的构造函数)
      // Ctor有可能是Sub函数，也可以是组件的配置对象(这个对象包括template...等配置对象)
      var Ctor = vm.$options.components[tag]; // 创建组件的虚拟节点

      return createComponentVNode(vm, tag, key, data, children, Ctor);
    }
  }
  function createComponentVNode(vm, tag, key, data, children, Ctor) {
    if (_typeof(Ctor) === 'object') {
      // vm.constructor就是vm的构造函数 - Vue，经过extend方法之后Ctor就一定是一个Sub函数了
      Ctor = vm.$options._base.extend(Ctor);
    } // 组件初始化的hook钩子函数


    data.hook = {
      // 稍后创造真实节点，如果是组件节点则调用此init方法(组件增加初始化钩子)
      init: function init(vnode) {
        // 虚拟节点上面保存组件的实例对象
        var instance = vnode.componentInstance = new vnode.componentOptions.Ctor();
        instance.$mount();
      }
    }; // 这里的Ctor一定是Sub构造函数：Sub.prototype = Object.create(Vue.prototype)

    return createVNode(vm, tag, key, data, children, null, {
      Ctor: Ctor
    });
  } // 创建文本的方法，项目里面的_v函数底层就是调用createTextVNode方法

  function createTextVNode(vm, text) {
    return createVNode(vm, undefined, undefined, undefined, undefined, text);
  } // 创建虚拟节点
  // 会有一个问题，虚拟dom不是和ast抽象语法树一样吗？
  // 答：ast做的是语法层面的转化，它描述的是语法本身；虚拟dom是描述的dom元素，可以增加一些自定义的属性
  // 虚拟dom和ast长的像，但是功能比较ast抽象语法树多 (ast可以描述html css js; 虚拟dom描述dom元素)

  function createVNode(vm, tag, key, data, children, text, componentOptions) {
    return {
      vm: vm,
      tag: tag,
      key: key,
      data: data,
      children: children,
      text: text,
      componentOptions: componentOptions // 组件的构造函数
      //... 后面可以扩展事件、指令、插槽，都可以在这里描述

    };
  } // 判断两个虚拟节点是否是同一个节点


  function isSameVNode(vnode1, vnode2) {
    return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key;
  }

  // 这样做就是把之前的节点全都用新的替换掉，哪怕更新一丢丢也是全部替换，这样做性能是比较差的
  // 使用diff算法：第一次渲染产生虚拟节点，后面再次渲染产生的虚拟节点和前一次的虚拟节点进行比对，找出差异，只更新变化的内容
  // diff算法是平级比较的过程，父亲和父亲比较，儿子和儿子比较
  // 创建组件

  function createComponent(vnode) {
    var i = vnode.data; // i上面有hook属性，并且把i.hook值赋值给i变量，在走后面的i = i.init判断

    if ((i = i.hook) && (i = i.init)) {
      i(vnode); // 初始化组件
    } // 如果是组件，就会进去上面的if判断执行i(vnode)方法，执行这个方法，就会在vnode身上添加componentInstance属性


    if (vnode.componentInstance) {
      return true;
    }
  } // 标签里面添加属性


  function patchProps(el) {
    var oldProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    // 老的属性里面有，新的属性里面没有，删除老的节点里面的该属性
    var oldStyles = oldProps.style || {};
    var newStyles = props.style || {};

    for (var key in oldStyles) {
      if (!newStyles[key]) {
        el.style[key] = '';
      }
    } // 老的属性里面有，新的属性里面没有，删除该属性


    for (var _key in oldProps) {
      if (!props[_key]) {
        el.removeAttribute(_key);
      }
    } // 用新的属性覆盖老的属性


    for (var _key2 in props) {
      if (_key2 === 'style') {
        for (var styleName in props.style) {
          el.style[styleName] = props.style[styleName];
        }
      } else {
        el.setAttribute(_key2, props[_key2]);
      }
    }
  }

  function createElement(vnode) {
    var tag = vnode.tag,
        data = vnode.data,
        children = vnode.children,
        text = vnode.text;

    if (typeof tag === 'string') {
      // 标签
      // 创建真实元素，也要区分是组件还是元素
      if (createComponent(vnode)) {
        // 组件
        return vnode.componentInstance.$el;
      } // 在虚拟节点上面增加该虚拟节点对应的真实dom


      vnode.el = document.createElement(tag); // 更新属性

      patchProps(vnode.el, {}, data);
      children.forEach(function (child) {
        vnode.el.appendChild(createElement(child));
      });
    } else {
      // 创建文件节点
      vnode.el = document.createTextNode(text);
    }

    return vnode.el;
  }
  function patch(oldVnode, vnode) {
    if (!oldVnode) {
      // 组件的挂载
      return createElement(vnode);
    } // 初始化渲染 
    // 判断oldVnode是真实dom还是虚拟dom，真实dom表示初始化渲染，虚拟dom表示进行diff算法进行更新
    // 真实dom元素身上有nodeType属性，如果是虚拟dom nodeType值为undefined


    var isRealElement = oldVnode.nodeType;

    if (isRealElement) {
      // 初始化渲染
      var elm = oldVnode;
      var parentElm = elm.parentNode; // 获取父节点
      // 根据虚拟节点，创建真实节点

      var newElm = createElement(vnode); // 新的dom插入老的dom后一个兄弟节点之前，删除老的dom (elm.nextSibling获取元素的下一个兄弟节点)

      parentElm.insertBefore(newElm, elm.nextSibling);
      parentElm.removeChild(elm);
      return newElm;
    } else {
      // diff算法
      // 1、两个节点不是同一个节点：直接删除老的删除新的(不进行比对)
      // 2、两个节点是同一个节点 (判断虚拟dom的tag属性和key属性，tag和key一样的，就是同一个节点)
      //    比较两个节点的属性是否有差异，复用老的节点，将差异的属性更新
      // 3、节点比较完毕，就需要比较两个虚拟的子节点
      return patchVNode(oldVnode, vnode);
    }
  }

  function patchVNode(oldVnode, vnode) {
    if (!isSameVNode(oldVnode, vnode)) {
      // 不是同一个节点
      var _el = createElement(vnode);

      oldVnode.el.parentNode.replaceChild(_el, oldVnode.el);
      return _el;
    } // 文本的请求：文本期望比较一下文本的内容


    var el = vnode.el = oldVnode.el; // 走到这儿就是相同节点了，相同节点复用

    if (!oldVnode.tag) {
      // 是文本，文本不相同，用新的文本覆盖就的文本(tag是undefined就表示文本节点)
      if (oldVnode.text !== vnode.text) {
        el.textContent = vnode.text;
      }
    } // 相同节点(标签)：我们需要比对标签的属性


    patchProps(el, oldVnode.data, vnode.data); // 比较子节点 (diff算法比较难的地方就在这儿)
    // 一方有子节点，一方没有子节点；两方都有子节点

    var oldChildren = oldVnode.children || [];
    var newChildren = vnode.children || [];

    if (oldChildren.length > 0 && newChildren.length > 0) {
      // 老的和新的都有子节点
      // 完整的diff算法，需要比较两个人的儿子
      updateChildren(el, oldChildren, newChildren);
    } else if (newChildren.length > 0) {
      // 没有老的子节点，有新的子节点
      mountChildren(el, newChildren);
    } else if (oldChildren.length > 0) {
      // 没有新的子节点，有老的子节点
      el.innerHTML = "";
    }

    return el;
  }

  function mountChildren(el, newChildren) {
    for (var i = 0; i < newChildren.length; i++) {
      var child = newChildren[i];
      el.appendChild(createElement(child));
    }
  }

  function updateChildren(el, oldChildren, newChildren) {
    // 为了比较两个子节点，增高性能，会有一些优化手段
    // vue2中采用指针的方式比较两个节点
    // 4个指针
    var oldStartIndex = 0;
    var newStartIndex = 0;
    var oldEndIndex = oldChildren.length - 1;
    var newEndIndex = newChildren.length - 1; // 4个指针对应的虚拟节点

    var oldStartVnode = oldChildren[0];
    var newStartVnode = newChildren[0];
    var oldEndVnode = oldChildren[oldEndIndex];
    var newEndVnode = newChildren[newEndIndex];

    function makeIndexByKey(children) {
      // 对老的节点做一个映射，这样就不用每次都去遍历老的节点了
      var map = {};
      children.forEach(function (child, index) {
        map[child.key] = index;
      });
      return map;
    } // 做映射表的原因是，避免每次都去遍历老的节点{ 老节点的key: 老节点的索引, .... }


    var map = makeIndexByKey(oldChildren); // 新虚拟节点和老虚拟节点，两者有其中一个头指针 大于等于 尾指针，则停止循环

    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
      // 如果老虚拟节点被标记为undefined了，就直接跳过
      if (oldStartVnode === undefined) {
        oldStartVnode = oldChildren[++oldStartIndex];
      } else if (oldEndVnode === undefined) {
        oldEndVnode = oldChildren[--oldEndIndex];
      } else if (isSameVNode(oldStartVnode, newStartVnode)) {
        patchVNode(oldStartVnode, newStartVnode); // 如果是相同节点，低估比较子节点

        oldStartVnode = oldChildren[++oldStartIndex];
        newStartVnode = newChildren[++newStartIndex];
      } else if (isSameVNode(oldEndVnode, newEndVnode)) {
        patchVNode(oldEndVnode, newEndVnode); // 如果是相同节点，低估比较子节点

        oldEndVnode = oldChildren[--oldEndIndex];
        newEndVnode = newChildren[--newEndIndex];
      } else if (isSameVNode(oldStartVnode, newEndVnode)) {
        patchVNode(oldStartVnode, newEndVnode); // insertBefore可以移动元素

        el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
        oldStartVnode = oldChildren[++oldStartIndex];
        newEndVnode = newChildren[--newEndIndex];
      } else if (isSameVNode(oldEndVnode, newStartVnode)) {
        patchVNode(oldEndVnode, newStartVnode);
        el.insertBefore(oldEndVnode.el, oldStartVnode.el);
        oldEndVnode = oldChildren[--oldEndIndex];
        newStartVnode = newChildren[++newStartIndex];
      } else {
        // 乱序比对
        // 根据老的列表做一个映射关系，用新的去找，找到则移动，找不到则添加，最后多余的就删除
        // moveIndex如果有值，说明拿到的老的里面的节点是需要移动的
        var moveIndex = map[newStartVnode.key];

        if (moveIndex !== undefined) {
          var moveVnode = oldChildren[moveIndex]; // 找到对应的节点，进行复用

          el.insertBefore(moveVnode.el, oldStartVnode.el); // 移动过的节点，在老的虚拟节点里面清空 (不能删除，删除会导致后面的虚拟节点前移)

          oldChildren[moveIndex] = undefined; // 标识这个虚拟节点对应的dom节点已经移动走了

          patchVNode(moveVnode, newStartVnode); // 处理过的节点进行比对
        } else {
          var childEl = createElement(newStartVnode);
          el.insertBefore(childEl, oldStartVnode.el); // 老节点里面没有，创建一个新的节点插在oldStartVnode前面
        }

        newStartVnode = newChildren[++newStartIndex]; // 新虚拟节点第一个节点前移(处理过了)
      }
    } // 插入节点 (可能插入前面，可能插入后面，也可能在中间插入，)


    if (newStartIndex <= newEndIndex) {
      for (var i = newStartIndex; i <= newEndIndex; i++) {
        var _childEl = createElement(newChildren[i]); // while过后newEndIndex值对应的后面一个节点newEndIndex + 1，向newEndIndex + 1这个索引对应节点的前面插入就ok了
        // 如果newEndIndex + 1索引对应的节点不存在，就向el的最后插入节点


        var anchor = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].el : null;
        el.insertBefore(_childEl, anchor); // anchor为null是则会认为是appendChild (向el的最后插入childEl)
      }
    } // 删除节点


    if (oldStartIndex <= oldEndIndex) {
      for (var _i = oldStartIndex; _i <= oldEndIndex; _i++) {
        if (oldChildren[_i]) {
          var _childEl2 = oldChildren[_i].el;
          el.removeChild(_childEl2);
        }
      }
    }
  }

  function initLifeCycle(Vue) {
    // 相当于h函数： _c('span', null, _v("world"))
    Vue.prototype._c = function () {
      return createElementVNode.apply(void 0, [this].concat(Array.prototype.slice.call(arguments)));
    };

    Vue.prototype._v = function () {
      return createTextVNode.apply(void 0, [this].concat(Array.prototype.slice.call(arguments)));
    }; // _s函数就是将值转为字符串


    Vue.prototype._s = function (value) {
      if (_typeof(value) !== 'object') return value; // 如果是对象类型，取值必须要通过JSON.stringify(value)进行取值
      // 如果对象类型不通过JSON.stringify进行取值，页面中显示的就是：[object Object]这样的形式

      return JSON.stringify(value);
    }; // 渲染为虚拟DOM：vm.$options.render函数里面使用了with(this)，所有使用的变量和函数都会优先在vm里面去找


    Vue.prototype._render = function () {
      // 绑定render函数里面this为vm，让render函数里面的this执行Vue的实例vm
      return this.$options.render.call(this); // 通过AST抽象语法树转义后生成的render
    }; // 虚拟DOM -> 真实DOM


    Vue.prototype._update = function (vnode) {
      var vm = this;
      var el = vm.$el; // patch方法：初始化功能，更新功能diff算法(虚拟dom -> 真实dom)
      // vnode创建真实dom替换原来的el

      var preVnode = vm._vnode;
      vm._vnode = vnode; // 把组件产生最新的虚拟节点保存到vm身上

      if (preVnode) {
        // 如果有preVnode，表示之前渲染过了
        vm.$el = patch(preVnode, vnode);
      } else {
        // 第一次渲染
        vm.$el = patch(el, vnode);
      }
    };
  } // 组件挂载

  function mountComponent(vm, el) {
    // 这里的el是进过querySelector处理过的真实的dom元素
    // 挂载el实例
    vm.$el = el; // 1.调用render方法，产生虚拟DOM
    // 2.根据虚拟DOM产生真实DOM
    // 3.插入到el元素中
    // vm._render()  --> vm.$options.render() 返回虚拟节点
    // vm._update(虚拟节点)  虚拟节点变成真实节点

    var updateComponent = function updateComponent() {
      vm._update(vm._render());
    }; // 一个组件会new一个Watcher


    new Watcher(vm, updateComponent, true); // 第三个参数true表示是一个渲染过程
  } // 调用vue的生命周期函数

  function callHook(vm, hook) {
    var handlers = vm.$options[hook];

    if (handlers) {
      // 生命周期函数里面的this都是当前vue的实例
      handlers.forEach(function (handler) {
        return handler.call(vm);
      });
    }
  } // vue核心流程
  // 1) 创建了响应式数据 (对象使用Object.defineProperty方法进行劫持，数组使用重新7个方法实现劫持)
  // 2) 模板转化成AST抽象语法树 (通过正则匹配标签)
  // 3) AST抽象语法树转化成了render函数 (render方法就是创建虚拟dom的方法)
  // 4) 后续每次数据更新可以只执行render函数 (无需再次执行AST转化的过程)
  // 5) render函数目的是产生虚拟节点 (render函数调用的时候，使用了响应式数据，更新数据会被监测到，数据更新之后就去重新执行render函数)
  // 6) 根据生成的虚拟节点创造真实DOM
  // vue和react在数据发生变化更新视图的区别？
  // vue是组件级别的更新；react整棵树的更新；

  // 合并两个对象，成为一个新对象
  var strats = {};
  var LIFECYCLE = ['beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeDestroy', 'destroyed'];
  LIFECYCLE.forEach(function (hook) {
    // p是父亲，c是儿子
    strats[hook] = function (p, c) {
      // {} + {created:function(){}}   合并成   { created: [fn] }
      // {created: [fn]} + {created:function(){}}   合并成   { created: [fn, fn] }
      if (c) {
        if (p) {
          // c有值，p有值
          return p.concat(c);
        } else {
          // c有值，p没有值
          return [c];
        }
      } else {
        // c没有值(直接使用p的值就ok了)
        return p;
      }
    };
  });

  strats.components = function (parentVal, childVal) {
    // res的原型对象是parentVal
    var res = Object.create(parentVal); // 给res这个对象本身添加属性，res这个对象的原型是parentVal

    if (childVal) {
      for (var key in childVal) {
        res[key] = childVal[key];
      }
    }

    return res;
  };

  function mergeOptions(parent, child) {
    var options = {};

    for (var key in parent) {
      // 循环老对象
      mergeField(key);
    }

    for (var _key in child) {
      // 循环新对象
      if (!parent.hasOwnProperty(_key)) {
        mergeField(_key);
      }
    }

    function mergeField(key) {
      // 对应mixin里面传入的生命周期的方法，我们需要将传入的生命周期的所有的函数放在一个数组里面
      // 策略模式：用策略模式减少if else (strats单词就是策略的意思)
      // 对于mixin传入组件里面的配置：生命周期、data、watch、props、methods、inject、computed...等这些配置
      // 我们都可以使用strats，来进行对Vue.mixin里面传入的全局配置和组件里面写的配置进行合并
      if (strats[key]) {
        options[key] = strats[key](parent[key], child[key]);
      } else {
        // 不在策略中的属性，以新传入的为准(child里面的属性为准)
        // 新的属性优先(child里面的属性优先)，普通的方法，新传入的方法去替换之前的老的方法
        options[key] = child[key] || parent[key];
      }
    }

    return options;
  }

  // 给Vue增加init方法
  function initMixin(Vue) {
    // 用于组件初始化操作
    Vue.prototype._init = function (options) {
      // vue vm.$options 就是获取用户的配置
      // 我们使用vue的时候，$nextTick $data $attr......
      var vm = this; // this.constructor.options：this是Vue的实例，this.constructor就是Vue构造函数
      // 将用户传的配置选项和Vue的全局配置进行合并
      // 我们定义的全局指令、全局过滤器...等都会挂载到vue实例上面，所以每个组件都可以使用全局的一些东西
      // Vue.extend里面调用this._init，此时this.constructor就是Sub构造函数，this就Sub函数的实例对象

      vm.$options = mergeOptions(this.constructor.options, options); // 将用户的选项挂载在实例上面
      // 初始化状态之前：执行beforeCreate生命周期函数

      callHook(vm, 'beforeCreate'); // 初始化状态、初始化计算属性、初始化watch...等都在这里面

      initState(vm); // 初始化状态之后：执行created生命周期函数

      callHook(vm, 'created'); // 实现数据的挂载：如果options配置里面传入了el选项，进行挂载操作

      if (options.el) {
        vm.$mount(options.el);
      }
    };

    Vue.prototype.$mount = function (el) {
      var vm = this;
      el = document.querySelector(el);
      var ops = vm.$options; // 如果options配置项里面有render和template配置，优先使用这两个
      // 优先级：render > template > el

      if (!ops.render) {
        var template; // template是一个字符串类型的
        // 没有template，但是有el

        if (!ops.template && el) {
          template = el.outerHTML;
        } else {
          // 有template，使用template (用template里面的内容去替换掉el对应的dom元素的内容)
          template = ops.template;
        } // 模板编译


        if (template) {
          // compilerToFunction：模板编译成render函数
          var render = compilerToFunction(template);
          ops.render = render; // jsx最终会被编译成 h('xxx)
        }
      }

      mountComponent(vm, el); // 组件的挂载
    };
  }

  function initGlobalAPI(Vue) {
    // 全局的mixin，其实就是把这些属性全部合并在Vue.options身上
    // Vue组件在初始化的时候，会将自己的配置对象和全局配置对象进行合并
    Vue.options = {
      _base: Vue
    }; // Vue的静态属性和静态方法：这里mixin注意讲普通方法 + 生命周期是如何通过mixin进行混入的

    Vue.mixin = function (mixin) {
      // 我们期望将全局的options 和 用户的选项进行合并
      // 如果mixin里面传入的方法是普通的方法，新传入的方法之前去替换掉以前的方法
      // 如果mixin里面传入的是生命周期的方法，要按照下面的方式进行合并 (用一个数组将所有的生命周期方法收集起来)
      // {} + {created:function(){}}   合并成   { created: [fn] }
      // {created: [fn]} + {created:function(){}}   合并成   { created: [fn, fn] }
      this.options = mergeOptions(this.options, mixin);
      return this;
    }; // 实现Vue.extend


    Vue.extend = function (options) {
      // Vue.extend()返回Sub，new Sub().$mount(选择器)进行挂载
      // Sub必须去继承Vue，才能让Sub的实例对象身上有$mount方法
      function Sub() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        // 默认对子类进行初始化操作
        this._init(options);
      } // 让Vue.prototype._proto__ = Vue.prototype


      Sub.prototype = Object.create(Vue.prototype);
      Sub.prototype.constructor = Sub; // 将用户Vue.extend()里面传入的参数和全局的Vue.options进行合并
      // Vue.options里面放的是全局的组件，options里面放的是局部的组件

      Sub.options = mergeOptions(Vue.options, options);
      return Sub;
    }; // 实现Vue.component
    // Vue.component是创建一个全局的组件，我们需要将这个组件混入到全局里面
    // 如果是全局的自定义指令，也是一样的，就是增加Vue.options.directive = {}


    Vue.options.components = {};

    Vue.component = function (id, definition) {
      // 如果definition已经是一个Sub函数了，就表示用户自己调用了Vue.extend
      definition = typeof definition === 'function' ? definition : Vue.extend(definition);
      Vue.options.components[id] = definition;
    };
  }

  function Vue(options) {
    this._init(options);
  }

  initMixin(Vue); // 扩展init方法

  initLifeCycle(Vue);
  initGlobalAPI(Vue); // 扩展Vue.mixin方法 (全局api的实现)

  initStateMixin(Vue); // 扩展vm.$nextTick、vm.$watch...
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

  return Vue;

}));
//# sourceMappingURL=vue.js.map
