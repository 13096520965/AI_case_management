# 案件批量导入说明

本文档说明如何使用 Excel/CSV 模板批量导入案件到系统，以及服务端接口的使用方式和字段说明。

## 概要
- 接口：POST /api/cases/import
- 请求类型：multipart/form-data
- 文件字段名：`file`（单文件）
- 支持文件类型：.xls、.xlsx、.csv
- 单文件大小限制：10MB（后端 multer 内存存储限制，可按需调整）
- 认证：需要有效的 Bearer JWT（请求头 Authorization: Bearer <token>）

## 必填列
导入时会对每行做基本校验，以下字段为必填：
- case_type / 案件类型
- case_cause / 案由
- industry_segment / 产业板块

若任一必填字段缺失，该行将被标记为失败并返回行号与原因。

## 可选列（常用）
- case_number / 案号（字符串，系统会校验唯一性）
- internal_number / 内部编号（字符串，系统会校验唯一性）
- court / 法院
- target_amount / 标的额（数字）
- filing_date / 立案日期（推荐格式 YYYY-MM-DD）
- handler / 承接人
- is_external_agent / 是否外部代理（可为 1/0、true/false、是/否）
- law_firm_name / 律所名称
- agent_lawyer / 代理律师
- agent_contact / 代理联系方式

注意：系统在内部使用英文状态码（例如 `active`, `in_progress`, `closed`, `archived`），但为方便用户界面显示，模板中可填写中文状态（例如 `立案`、`审理中`、`已结案`、`已归档`）。导入时服务会自动把常见中文状态转换为系统内部代码：

- `立案` -> `active`
- `审理中`/`进行中` -> `in_progress`
- `已结案`/`结案` -> `closed`
- `已归档`/`归档` -> `archived`

如果模板中直接填写英文状态码（例如 `active`），系统会直接使用该值。

## 列名支持
模板同时支持中文列名和英文列名（上面列出的英文/中文）。
例如表头可以为 `case_type` 或 `案件类型`，系统会自动映射。

## 错误与返回
后端返回格式示例：
{
  "message": "导入完成",
  "results": {
    "total": 10,
    "success": 8,
    "failures": [
      { "row": 3, "reason": "缺少必填字段：案件类型/案由/产业板块" },
      { "row": 6, "reason": "案号已存在: 2025ABC001" }
    ]
  }
}

说明：`row` 表示 Excel 中的行号（含表头）。

## 使用示例（curl）
```bash
curl -H "Authorization: Bearer <your_token>" -F "file=@/path/to/case-import-template.xlsx" http://your-server-host:3000/api/cases/import
```

## 前端已集成
前端已在“案件管理”列表页添加了“导入 Excel”按钮，使用 `caseApi.importCases(formData)` 上传文件（字段名 `file`）。如果你使用前端界面导入，前端会自动携带已登录用户的认证信息（若你的前端 request 配置已注入 token）。

## 模板文件
仓库中提供了两个模板：
- `docs/case-import-template.csv`（CSV 文本模板，适合 Excel 打开并另存为 xlsx）
- `docs/case-import-template.xlsx`（直接的 Excel 文件示例）

建议先用模板填写测试数据并在测试环境验证；导入后请检查失败列表并按提示修正后重试。

## 可选改进
- 导出失败详情为 CSV/Excel 以便回溯并修正
- 支持批量事务（全部成功才提交）或按行提交（当前为按行尝试创建，失败行不影响其它行）
- 增加更严格的数据格式校验（日期、数值、金额格式）

如需我帮忙把失败详情导出为文件或在前端添加失败详情弹窗，我可以继续实现。