import * as XLSX from 'xlsx'

export const xlsxToJson = (file: File, options?: { extractOnlyFirstSheet: boolean } & XLSX.Sheet2JSONOpts) => {
  const { extractOnlyFirstSheet = false, ...otherOptions } = options || {}
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetNames = workbook.SheetNames
      let result = []
      for (let sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          blankrows: false,
          defval: '',
          range: 2,
          raw: false,
          ...otherOptions,
        })
        result.push(jsonData)
        if (extractOnlyFirstSheet) {
          break
        }
      }
      resolve(result)
    }
    reader.onerror = (e) => {
      reject(e)
    }
    reader.readAsArrayBuffer(file)
  })
}
