import fs from 'node:fs'
import ExcelJS, { Cell, Row, Worksheet } from 'exceljs'
import path from 'node:path'
import { set } from 'lodash-es'

/**
 * 解析excel文件
 * @param excelFilePath excel文件路径
 * @returns excel文件内容
 */
export async function parseExcel(excelFilePath: string) {
  if (!excelFilePath) {
    throw new Error('excel file path is required')
  }
  if (!path.extname(excelFilePath).includes('xlsx')) {
    throw new Error('excel file must be xlsx')
  }
  if (!fs.existsSync(excelFilePath)) {
    throw new Error('excel file not found')
  }
  try {
    const workbook = new ExcelJS.Workbook()
    const wb = await workbook.xlsx.readFile(excelFilePath)
    const list: Array<Record<string, any>> = []
    wb.eachSheet((sheet: Worksheet) => {
      let header: string[]
      sheet.eachRow((row: Row) => {
        if (row.number === 1) {
          header = row.values as string[]
          return
        }
        const rowResult: Record<string, any> = {}
        row.eachCell((cell: Cell, cellNumber: number) => {
          rowResult[header[cellNumber]] = cell.value
        })
        list.push(rowResult)
      })
    })
    if (list.length === 0) {
      throw new Error('excel file is empty')
    }
    const langMap = list.reduce((pre, cur) => {
      Object.keys(cur).forEach((key) => {
        if (key !== '_key_') {
          if (pre[key]) {
            pre[key][cur._key_] = cur[key]
          } else {
            pre[key] = { [cur._key_]: cur[key] }
          }
        }
      })
      return pre
    }, {})
    return langMap
  } catch (error) {
    throw new Error('parse excel file failed')
  }
}

export enum FileType {
  Json = 'json',
  Js = 'js',
  Ts = 'ts',
}

const handleFileInfo = {
  [FileType.Json]: (name: string, content: Record<string, any>) => ({
    fileName: `${name}.${FileType.Json}`,
    fileContent: JSON.stringify(content, null, 2),
  }),
  [FileType.Js]: (name: string, content: Record<string, any>) => ({
    fileName: `${name}.${FileType.Js}`,
    fileContent: `export default ${JSON.stringify(content, null, 2)}`,
  }),
  [FileType.Ts]: (name: string, content: Record<string, any>) => ({
    fileName: `${name}.${FileType.Ts}`,
    fileContent: `export default ${JSON.stringify(content, null, 2)}`,
  }),
}

/**
 * 将excel文件转换为目标文件
 * @param excelFilePath excel文件路径
 * @param targetFilePath 目标文件路径
 * @param fileType 目标文件类型
 * @param nested 是否嵌套结构，默认为false
 * @returns
 */
export async function gLocales(excelFilePath: string, targetFilePath: string, fileType: FileType, nested = false) {
  let result = await parseExcel(excelFilePath)

  if (nested) {
    let nestedResult: Record<string, any> = {}
    Object.keys(result).forEach((lang) => {
      Object.keys(result[lang]).forEach((key) => {
        set(nestedResult, `${lang}.${key}`, result[lang][key])
      })
    })
    result = nestedResult
  }

  Object.keys(result).forEach((lang) => {
    const { fileName, fileContent } = handleFileInfo[fileType](lang, result[lang])
    const targetPath = path.join(process.cwd(), targetFilePath, fileName)

    if (!fs.existsSync(targetFilePath)) {
      fs.mkdirSync(targetFilePath, { recursive: true })
    }
    fs.writeFileSync(targetPath, fileContent, {
      encoding: 'utf-8',
    })
  })
}

const handleLocalesMap = {
  [FileType.Json]: (fileName: string, filePath: string) => ({
    lang: fileName.replace('.json', ''),
    fileContent: fs.readFileSync(filePath, { encoding: 'utf-8' }),
  }),
  [FileType.Js]: (fileName: string, filePath: string) => ({
    lang: fileName.replace('.js', ''),
    fileContent: fs.readFileSync(filePath, { encoding: 'utf-8' }).replace(/^\s*export\s+default\s*/, ''),
  }),
  [FileType.Ts]: (fileName: string, filePath: string) => ({
    lang: fileName.replace('.ts', ''),
    fileContent: fs.readFileSync(filePath, { encoding: 'utf-8' }).replace(/^\s*export\s+default\s*/, ''),
  }),
}

export async function gExcel(originFilePath: string, excelFilePath: string, fileType: FileType) {
  const originFiles = fs.readdirSync(originFilePath)
  const files = originFiles.filter((file) => file.endsWith(fileType))
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet 1')

  const langMap: Record<string, any> = {}

  files.forEach((file) => {
    const filePath = path.join(originFilePath, file)
    const { lang, fileContent } = handleLocalesMap[fileType](file, filePath)
    try {
      const jsonData = JSON.parse(fileContent)
      langMap[lang] = jsonData
    } catch (error) {
      throw new Error(`Invalid ${fileType} file: ${filePath}`)
    }
  })

  const header = ['_key_', ...Object.keys(langMap)]
  worksheet.columns = header.map((key) => ({ header: key, key }))
  const rows: Array<Record<string, any>> = []
  Object.keys(langMap).forEach((lang) => {
    Object.keys(langMap[lang]).forEach((key) => {
      if (rows.find((row) => row._key_ === key)) {
        rows.forEach((row) => {
          if (row._key_ === key) {
            row[lang] = langMap[lang][key]
          }
        })
      } else {
        const row = { _key_: key, [lang]: langMap[lang][key] }
        rows.push(row)
      }
    })
  })
  worksheet.addRows(rows)
  workbook.xlsx.writeFile(excelFilePath)
}
