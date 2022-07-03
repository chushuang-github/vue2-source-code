import { parseHTML } from './parse'

function genProps(attrs) {
  let str = ''
  for(let i = 0; i < attrs.length; i++) {
    let attr = attrs[i]
    if(attr.name === 'style') {
      // color: blue; background: blue  -->  {color: 'blue', background: 'blue'}
      let obj = {}
      attr.value.split(';').filter(Boolean).forEach(item => {
        let [key, value] = item.split(':')
        obj[key.trim()] = value.trim()
      })
      attr.value = obj
    }
    str += `${attr.name}:${JSON.stringify(attr.value)},`
  }
  return `{${str.slice(0, -1)}}`
}

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g  // 匹配：{{ adfad }}
function gen(node) {
  if(node.type === 1) {
    return codegen(node)
  }else {
    // 文本
    let text = node.text
    if(!defaultTagRE.test(text)) {
      return `_v(${JSON.stringify(text)})`
    }else {
      // {{name}}hello{{age}}  -->  _v(_s(name) + 'hello' + _s(name))
      let tokens = []
      let match
      let lastIndex = 0  // 最后匹配到的位置
      // exec() 方法用于检索字符串中的正则表达式的匹配 (exec里面正则如何是全局匹配，则需要注意下面的点)
      // exec:如果在一个字符串中完成了一次模式匹配之后要开始检索新的字符串，就必须手动地把 lastIndex 属性重置为 0
      defaultTagRE.lastIndex = 0
      // 正则表达式的捕获方法 正则.exec(字符串)
      while(match = defaultTagRE.exec(text)) {
        // text：{{name}}hello{{age}}world
        // match：['{{name}}', 'name', index: 0, input: '{{name}}hello{{age}}', groups: undefined]
        // match：['{{age}}', 'age', index: 13, input: '{{name}}hello{{age}}', groups: undefined]
        let index = match.index  // 匹配的位置
        if(index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)))
        }
        tokens.push(`_s(${match[1].trim()})`)
        lastIndex = index + match[0].length
      }
      if(lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)))
      }
      // tokens：['_s(name)', '"hello"', '_s(age)', '"world"']
      return `_v(${tokens.join('+')})`
    }
  }
}

function genChildren(children) {
  if(children) {
    return children.map(child => gen(child)).join(',')
  }
}

function codegen(ast) {
  let children = genChildren(ast.children)
  let code = `_c('${ast.tag}',${
    ast.attrs.length > 0 ? genProps(ast.attrs) : 'null'
  }${
    ast.children.length > 0 ? `,${children}` : ''
  })`
  return code
}

// vue3采用的不是正则
// 对模板进行编译
export function compilerToFunction(template) {
  // 1.将template转化成ast抽象语法树 (利用栈型结构来构建AST抽象语法树)
  let ast = parseHTML(template)

  // 2.生成render方法 (render方法执行后的返回结果就是虚拟dom)
  // 把ast抽象语法树组装成下面的形式，将ast抽象语法树拼接成字符串代码
  // _c就相当于h函数，第三个参数开始一直往后面就是子标签
  //  `_c(
  //     'div',
  //     {id:"app",style:{"color":"blue","background":"orange"}},
  //     _c('div',{style:{"color":"red"}},_v(_s(name),"hello",_s(age),"world")), 
  //     _c('span',null,_v("world"))
  //   )`

  // 模板引擎的实现原理：with + new Function()
  let code = codegen(ast)
  // with语法：code这个字符串代码里面的变量优先从this里面取值，this是什么要去看如何调用render函数的
  code = `with(this){return ${code}}`
  let render = new Function(code)   // 根据代码生成render函数
  // _c就是h函数，只不过名字不一样；文本使用_v函数；文本里面的变量使用_s函数
  // ƒ anonymous() {
  //   with(this){return _c('div',{id:"app",style:{"color":"blue","background":"orange"}},_c('div',{style:{"color":"red"}},_v(_s(name),"hello",_s(age),"world")),_c('span',null,_v("world")))}
  // }
  return render
}