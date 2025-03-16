import { Command } from 'commander'
import { FileType, gExcel, gLocales } from './utils.js'
import chalk from 'chalk'

const program = new Command()

const allowedFileTypes = Object.values(FileType)

program.name('excel i18n tool').description('多语言文件转excel文件、excel文件转多语言文件工具').version('1.0.0')

program
  .command('glocales')
  .description(`将excel中的数据生成${allowedFileTypes.join('、')}文件`)
  .argument('<excelFilePath>', 'excel文件路径')
  .argument('<targetFilePath>', 'json文件路径')
  .argument('<fileType>', '文件类型，支持json、js、ts')
  .option('-n, --nested', '是否嵌套结构，默认为false', false)
  .action((excelFilePath, targetFilePath, fileType, options) => {
    const { nested } = options
    try {
      const allowedFileTypes = Object.values(FileType)
      if (!allowedFileTypes.includes(fileType)) {
        throw new Error(`不支持的文件类型: ${fileType}，支持的文件类型有: ${allowedFileTypes.join('、')}`)
      }
      gLocales(excelFilePath, targetFilePath, fileType, nested)
    } catch (error: any) {
      console.log(chalk.red(error.message))
    }
  })

program
  .command('gexcel')
  .description(`将多语言${allowedFileTypes.join('、')}文件生成excel文件`)
  .argument('<originFilePath>', 'json文件路径')
  .argument('<excelFilePath>', 'excel文件路径')
  .argument('<fileType>', '文件类型，支持json、js、ts')
  .action((originFilePath, excelFilePath, fileType) => {
    try {
      const allowedFileTypes = Object.values(FileType)
      if (!allowedFileTypes.includes(fileType)) {
        throw new Error(`不支持的文件类型: ${fileType}，支持的文件类型有: ${allowedFileTypes.join('、')}`)
      }
      gExcel(originFilePath, excelFilePath, fileType)
    } catch (error: any) {
      console.log(chalk.red(error.message))
    }
  })

program.parse()
