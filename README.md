# @lr-fe/i18n-cli

一个用于处理多语言文件与 Excel 文件互相转换的命令行工具。

## 功能特点

- 支持将 Excel 文件转换为多语言文件（支持 json、js、ts 格式）
- 支持将多语言文件转换为 Excel 文件
- 支持嵌套格式的多语言文件生成
- 简单易用的命令行接口

## 安装

```bash
npm install @lr-fe/i18n-cli -g
```

```bash
yarn add @lr-fe/i18n-cli -g
```

```bash
pnpm add @lr-fe/i18n-cli -g
```

## 使用说明

### 1. 将 Excel 转换为多语言文件

```bash
i18n glocales <excel文件路径> <目标文件夹路径> <文件类型>
```

参数说明：

- <excel 文件路径> : Excel 文件的路径，必须是 .xlsx 格式
- <目标文件夹路径> : 生成的多语言文件存放的文件夹路径
- <文件类型> : 生成的文件类型，支持 json、js、ts
  选项：

- -n, --nested : 是否生成嵌套结构的多语言文件，默认为 false
  示例：

1.  生成 json 格式的多语言文件

```bash
i18n glocales ./language.xlsx ./locales json
```

```javascript
{
  hello: '你好',
  name: '姓名',
  age: '年龄',
  msg.success: "操作成功",
  msg.error: "操作失败",
}
```

2. 生成 js 嵌套格式的多语言文件

```bash
i18n glocales ./language.xlsx ./locales js -n
```

```javascript
export default {
  hello: '你好',
  name: '姓名',
  age: '年龄',
  msg: {
    success: '操作成功',
    error: '操作失败',
  },
}
```

3. 生成 js 非嵌套格式的多语言文件

```bash
i18n glocales ./language.xlsx ./locales js
```

```javascript
export default {
  'hello': '你好',
  'name': '姓名',
  'age': '年龄',
  'msg.success': '操作成功',
  'msg.error': '操作失败',
}
```

4. 生成 ts 嵌套格式的多语言文件

```bash
i18n glocales ./language.xlsx ./locales ts --nested
```

```typescript
export default {
  hello: '你好',
  name: '姓名',
  age: '年龄',
  msg: {
    success: '操作成功',
    error: '操作失败',
  },
}
```

### 2. 将多语言文件转换为 Excel

```bash
i18n gexcel <多语言文件夹路径> <excel文件路径> <文件类型>
```

参数说明：

- <多语言文件夹路径> : 多语言文件所在的文件夹路径
- <excel 文件路径> : 要生成的 Excel 文件路径
- <文件类型> : 源文件类型，支持 json、js、ts
  示例：

1. 将 json 格式的多语言文件转换为 Excel

```bash
i18n gexcel ./locales ./language.xlsx json
```

2. 将 js 格式的多语言文件转换为 Excel

```bash
i18n gexcel ./locales ./language.xlsx js
```

3. 将 ts 格式的多语言文件转换为 Excel

```bash
i18n gexcel ./locales ./language.xlsx ts
```

## Excel 文件格式要求

Excel 文件必须包含以下格式：

- 第一行为表头，包含 _key_ 列和语言列（如：zh、en 等）
- \_key\_ 列存放多语言的键名
- 其他列为对应语言的翻译内容
  示例：

  | \_key\_    | zh-cn    | zh-tw    | en-us             | ko-kr      | ja-jp    |
  | ---------- | -------- | -------- | ----------------- | ---------- | -------- |
  | hello      | 你好     | 你好     | Hello             | 안녕하세요 | 你好     |
  | name       | 姓名     | 姓名     | Name              | 이름       | 名前     |
  | age        | 年龄     | 年齡     | Age               | 나이       | 年齢     |
  | msg.sucess | 操作成功 | 操作成功 | Operation success | 작업 성공  | 操作成功 |
  | msg.error  | 操作失败 | 操作失敗 | Operation failed  | 작업 실패  | 操作失败 |

## 注意事项

1. Excel 文件必须是 .xlsx 格式
2. 确保目标文件夹具有写入权限
3. 使用嵌套模式时，键名应使用点号（.）分隔层级
