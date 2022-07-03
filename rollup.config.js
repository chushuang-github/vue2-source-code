// rollup.config.js文件 
// rollup打包推荐使用ES Module进行导出 (默认支持ES Module)
// 注意：如果打包的文件使用了commonjs导出，需要进行rollup的配置
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'

export default {
  // 入口
  input: './src/index.js',
  // 出口
  output: {
    file: './dist/vue.js',  // 打包文件路径
    name: 'Vue',   // 打包完成之后，会在全局添加一个属性叫做Vue
    format: 'umd',  // umd:打包支持commonjs和es module导出
    sourcemap: true  // 是否生成sourcemap映射文件(true为生成映射文件)
  },
  plugins: [
    // rollup配置babel进行语法转化
    babel({
      exclude: 'node_modules/**',  // 排除node_modules下的所有模块
    }),
    // 按照node规范来解析模块(通过import导入模块的时候，可以省略index开头的文件)
    // 如果不配置的话，import导入文件，需要文件名为index.js，路径上面也要写上
    resolve()
  ]
}