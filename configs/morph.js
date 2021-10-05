/* eslint-disable @typescript-eslint/no-var-requires */
// 生成ts类型文件
const path = require('path')
const fs = require('fs')
const { Project } = require('ts-morph')
const vueCompiler = require('@vue/compiler-sfc')
const klawSync = require('klaw-sync')
// klaw-sync是一个 Node.js 递归和快速文件系统walker，它是klaw的同步对应物。它递归地列出目录中的所有文件和目录，并返回一个对象数组，每个对象都有两个属性：path和stats。path是文件或目录的完整路径，stats是fs.Stats 的一个实例
const ora = require('ora')
// 主要用来实现node.js命令行环境的loading效果，和显示各种状态的图标等
const TSCONFIG_PATH = path.resolve(__dirname, '../tsconfig.json')

const DEMO_RE = /\/demo\/\w+\.vue$/

const TEST_RE = /__test__|__tests__/
// 不包含的文件
const excludedFiles = [
  'mock',
  'package.json',
  'spec',
  'test',
  'tests',
  'css',
  '.DS_Store',
]
const exclude = path => !excludedFiles.some(f => path.includes(f))

const genVueTypes = async () => {
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      declaration: true,
      emitDeclarationOnly: true,
      noEmitOnError: false,
      outDir: path.resolve(__dirname, '../types'),
      baseUrl: path.resolve(__dirname, '../'),
      paths: {
        '@element-plus/*': ['packages/*'],
      },
    },
    tsConfigFilePath: TSCONFIG_PATH,
    skipAddingFilesFromTsConfig: true,
  })

  const sourceFiles = []

  const filePaths = klawSync(path.resolve(__dirname, '../packages/components'), {
    nodir: true,
  })
    .map(item => item.path)
    .filter(path => !DEMO_RE.test(path))
    .filter(path => !TEST_RE.test(path))
    .filter(exclude)
  await Promise.all(
    filePaths.map(async file => {
      // 如果是vue文件
      if (file.endsWith('.vue')) {
        const content = await fs.promises.readFile(file, 'utf-8')
        const sfc = vueCompiler.parse(content)
        // sfc 编译为一个对象
        const { script, scriptSetup } = sfc.descriptor
        if (script || scriptSetup) {
          let content = ''
          let isTS = false
          if (script && script.content) {
            content += script.content
            if (script.lang === 'ts') isTS = true
          }
          if (scriptSetup) {
            const compiled = vueCompiler.compileScript(sfc.descriptor, {
              id: 'xxx',
            })
            content += compiled.content
            if (scriptSetup.lang === 'ts') isTS = true
          }
          const sourceFile = project.createSourceFile(
            path.relative(process.cwd(), file) + (isTS ? '.ts' : '.js'),
            content,
          )
          sourceFiles.push(sourceFile)
        }
      } else if (file.endsWith('.ts')) {
        const sourceFile = project.addSourceFileAtPath(file)
        sourceFiles.push(sourceFile)
      }
    }),
  )

  // const diagnostics = project.getPreEmitDiagnostics()

  // TODO: print all diagnoses status and fix them one by one.
  // console.log(project.formatDiagnosticsWithColorAndContext(diagnostics))

  await project.emit({
    emitOnlyDtsFiles: true,
  })

  for (const sourceFile of sourceFiles) {

    const emitOutput = sourceFile.getEmitOutput()
    for (const outputFile of emitOutput.getOutputFiles()) {
      const filepath = outputFile.getFilePath()
      // 创建d.ts文件
      await fs.promises.mkdir(path.dirname(filepath), {
        recursive: true,
      })

      await fs.promises.writeFile(filepath, outputFile.getText(), 'utf8')
    }
  }
}


const spinner = ora('Generate types...\n').start()

genVueTypes()
  .then(() => spinner.succeed('Success !\n'))
  .catch(e => spinner.fail(`${e} !\n`))
