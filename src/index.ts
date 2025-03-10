import { Command } from 'commander'

const program = new Command()

program.name('excelToJson').description('excel转json工具').version('1.0.0')

program
  .command('extract')
  .description('提取excel中的数据并生成json文件')
  .argument('<excelFilePath>', 'excel文件路径')
  .argument('<jsonFilePath>', 'json文件路径')
  .argument('<extractOnlyFirstSheet>', '只提取第一个sheet的数据')
  .action((excelFilePath, jsonFilePath, extractOnlyFirstSheet) => {
    console.log('excelFilePath:', excelFilePath)
    console.log('jsonFilePath:', jsonFilePath)
  })

program.parse()
