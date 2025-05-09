import fs from 'node:fs'
import fse from 'fs-extra'
import ExcelJS, { Cell, Row, Worksheet } from 'exceljs'
import path from 'node:path'
import { isObject, set, transform } from 'lodash-es'
import { FileType } from './constants.js'

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

const handleFileInfo = {
  [FileType.Json]: (name: string, content: Record<string, any>) => ({
    fileName: `${name}.${FileType.Json}`,
    fileContent: JSON.stringify(content, null, 2),
  }),
  [FileType.Js]: (name: string, content: Record<string, any>, cjs: boolean) => {
    const moduleType = cjs ? 'module.exports = ' : 'export default '
    return {
      fileName: `${name}.${FileType.Js}`,
      fileContent: `${moduleType}${JSON.stringify(content, null, 2)}`,
    }
  },
  cjs: (name: string, content: Record<string, any>) => ({
    fileName: `${name}.${FileType.Js}`,
    fileContent: `module.exports = ${JSON.stringify(content, null, 2)}`,
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
 * @param cjs 是否使用CommonJS模块，默认为false
 * @returns
 */
export async function gLocales(
  excelFilePath: string,
  targetFilePath: string,
  fileType: FileType,
  nested = false,
  cjs = false,
) {
  let result = await parseExcel(excelFilePath)

  if (nested) {
    let nestedResult: Record<string, any> = {}
    for (const lang in result) {
      if (Object.prototype.hasOwnProperty.call(result, lang)) {
        const langData = result[lang]
        for (const key in langData) {
          set(nestedResult, `${lang}.${key}`, langData[key])
        }
      }
    }
    result = nestedResult
  }

  Object.keys(result).forEach((lang) => {
    const { fileName, fileContent } = handleFileInfo[fileType](lang, result[lang], cjs)
    const targetPath = path.join(process.cwd(), targetFilePath, fileName)

    if (!fs.existsSync(targetFilePath)) {
      fs.mkdirSync(targetFilePath, { recursive: true })
    }
    fs.writeFileSync(targetPath, fileContent, {
      encoding: 'utf-8',
    })
  })
}

/**
 * 读取ts、js文件内容并转换为对象
 * @param filePath 目标文件路径
 * @returns
 */
const readTsOrJSAsObject = (filePath: string) => {
  const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' })
  let strObj = fileContent.replace(/^\s*export\s+default\s*/, '')
  if (isCjs(filePath)) {
    strObj = fileContent.replace(/^\s*module\.exports\s*=\s*/, '')
  }
  const obj = new Function(`"use strict"; return (${strObj})`)()
  return obj
}

const handleLocalesMap = {
  [FileType.Json]: (fileName: string, filePath: string) => ({
    lang: fileName.replace('.json', ''),
    fileContent: fse.readJsonSync(filePath, { encoding: 'utf-8' }),
  }),
  [FileType.Js]: (fileName: string, filePath: string) => {
    const fileContent = readTsOrJSAsObject(filePath)
    return {
      lang: fileName.replace('.js', ''),
      fileContent,
    }
  },
  [FileType.Ts]: (fileName: string, filePath: string) => {
    const fileContent = readTsOrJSAsObject(filePath)
    return {
      lang: fileName.replace('.ts', ''),
      fileContent,
    }
  },
}

/**
 * 将嵌套对象扁平化
 * @param o 对象
 * @param parentKey 父级key
 * @param result 结果
 * @returns
 */
function flatObj(o: any, parentKey: string, result: Record<string, any> = {}) {
  return transform(
    o,
    (pre, value, key: string) => {
      const newKey = parentKey ? `${parentKey}.${key}` : key
      if (isObject(value)) {
        return flatObj(value, newKey, pre)
      } else {
        pre[newKey] = value
      }
    },
    result,
  )
}

function isCjs(filePath: string) {
  return /module\.exports/.test(fs.readFileSync(filePath, { encoding: 'utf-8' }))
}

/**
 * 将多语言文件内容写入指定excel文件
 * @param originFilePath 源文件路径
 * @param excelFilePath excel文件路径
 * @param fileType 文件类型
 */
export async function gExcel(originFilePath: string, excelFilePath: string, fileType: FileType) {
  const originFiles = fs.readdirSync(originFilePath)
  const files = originFiles.filter((file) => file.endsWith(fileType))
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet 1')

  const langMap: Record<string, any> = {}

  files.forEach((file) => {
    const filePath = path.resolve(process.cwd(), originFilePath, file)
    try {
      const { lang, fileContent } = handleLocalesMap[fileType](file, filePath)
      const flatedJsonData = flatObj(fileContent, '', {})
      langMap[lang] = flatedJsonData
    } catch (error) {
      throw new Error(`Invalid ${fileType} file: ${filePath}, error: ${error}`)
    }
  })

  const header = ['_key_', ...Object.keys(langMap)]
  worksheet.columns = header.map((key) => ({ header: key, key }))
  const rows: Array<Record<string, any>> = []

  for (const lang in langMap) {
    if (Object.prototype.hasOwnProperty.call(langMap, lang)) {
      const langData = langMap[lang]
      for (const key in langData) {
        if (rows.find((row) => row._key_ === key)) {
          rows.forEach((row) => {
            if (row._key_ === key) {
              row[lang] = langData[key]
            }
          })
        } else {
          const row = { _key_: key, [lang]: langData[key] }
          rows.push(row)
        }
      }
    }
  }
  worksheet.addRows(rows)
  workbook.xlsx.writeFile(excelFilePath)
}
