// 标签：<div style="color: red;">name: {{name}}</div>
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`

// 匹配到的分组是一个开始标签名字，标签两种形式：<xxx   or   <xxx:xxx
const startTagOpen = new RegExp(`^<${qnameCapture}`)

// 匹配结束标签的名字  </xxxx>
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)

// 匹配标签里面的属性
// [^]正则表示'除了'，[^\s"'<>\/=]+：除了 空格 " ' < > / = 这些符号一个或多个
// \s正则表示'空格'；+正则一个或多个；*正则0或多个；?正则0个或1个
// 注意：正则里面使用括号()表示捕获，但是(?:pattern)是⾮捕获型括号，匹配pattern，但不捕获匹配结果
// 总结：(后面有?:，表示该括号值匹配括号里面的内容，不捕获括号里面的内容
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/

// 匹配的内容：/>  or  >，开始标签为 <div>、自闭合标签<br />
const startTagClose = /^\s*(\/?)>/
// 匹配的内容：{{ aadfa }}
// \r正则表示换行；\n正则表示回车
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g


// 解析html字符串，生成AST抽象语法树
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
export function parseHTML(html) {
  const ELEMENT_TYPE = 1
  const TEXT_TYPE = 3
  const stack = []     // 使用栈结构，用于存放元素(栈-后进先出)
  let currentParent    // 指针，指向栈中的最后一个
  let root             // 根标签

  // 进栈构建父子关系，出栈改变指针
  // 匹配到开始标签
  function createASTElement(tag, attrs) {
    return {
      tag,
      type: ELEMENT_TYPE,
      children: [],
      attrs,
      parent: null
    }
  }
  function start(tag, attrs) {
    // 遇到开始标签
    let node = createASTElement(tag, attrs)  // 创建一个节点
    if(!root) {           // 看一下是否为空树，如果是空树则当前节点是根标签
      root = node
    }
    // 开始标签，currentParent有值，当前currentParent就是新创建的node的父元素(必须熟悉栈的操作)
    // node设置父节点，currentParent设置子节点
    if(currentParent) {
      node.parent = currentParent
      currentParent.children.push(node)
    }
    stack.push(node)  // 进行压栈操作
    currentParent = node  // currentParent为栈中最后一个元素
  }
  // 匹配到文本
  function chars(text) {
    // 文本，给currentParent设置值
    text = text.replace(/\s/g, '')  // 去掉空格
    text && currentParent.children.push({
      type: TEXT_TYPE,
      text,
      parent: currentParent
    })
  }
  // 匹配到结束标签
  function end(tag) {
    // 遇到结束标签，出栈
    let node = stack.pop()
    // 还可以校验标签是否合法 (结束的标签和栈弹出的标签是否一样)
    if(node.tag === tag) {
      currentParent = stack[stack.length - 1]
    }
  }
  // 解析完的字符串标签之后删除解析完的这部分字符串标签
  function advance(n) {
    html = html.substring(n)
  }
  // 判断是不是开始标签，是开始标签就解析，不是开始标签返回false
  function parseStartTag() {
    // 调用字符串的match方法结合正则表达式进行匹配标签字符串
    const start = html.match(startTagOpen)
    // 如果是开始标签
    if(start) {
      const match = {
        tagName: start[1],   // 标签名
        attrs: []
      }
      advance(start[0].length)
      // 如果不是开始标签对应的结束标签的话，就一直匹配下去
      let attr, end
      while(!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length)
        match.attrs.push({ name: attr[1], value: attr[3] || attr[4] || attr[5] || true })
      }
      if(end) {
        advance(end[0].length)
      }
      return match
    }
    // 不是开始标签，返回false
    return false
  }

  while(html) {
    // <div>aaa</div>     </div>     aaa</div>
    // 如果textEnd值为0，则表示是一个开始标签 或者 结束标签
    // 如果textEnd值大于0，则表示是文本的结束位置
    let textEnd = html.indexOf('<')
    if(textEnd === 0) {
      // 开始标签的匹配结果
      const startTagMatch = parseStartTag()
      if(startTagMatch) {  // 解析到的开始标签
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue
      }
      // 不是开始标签，就是结束标签 (直接删除结束标签)
      const endTagMatch = html.match(endTag)
      if(endTagMatch) {
        end(endTagMatch[1])
        advance(endTagMatch[0].length)
        continue
      }
    }
    // 处理文本
    if(textEnd > 0) {
      let text = html.substring(0, textEnd)
      if(text) {  // 解析到的文本
        chars(text)
        advance(text.length)
      }
    }
  }

  return root
}