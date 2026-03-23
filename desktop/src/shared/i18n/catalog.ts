export type Locale = "zh-CN" | "en-US";

export type MessageKey =
  | "app.title"
  | "app.subtitle"
  | "menu.file"
  | "menu.edit"
  | "menu.view"
  | "menu.analysis"
  | "menu.help"
  | "nav.workspace"
  | "nav.projects"
  | "nav.catalog"
  | "nav.templates"
  | "nav.runs"
  | "nav.settings"
  | "toolbar.save"
  | "toolbar.compile"
  | "toolbar.run"
  | "toolbar.export"
  | "toolbar.language"
  | "toolbar.connected"
  | "toolbar.disconnected"
  | "workspace.browser"
  | "workspace.layers"
  | "workspace.toolbox"
  | "workspace.parameters"
  | "workspace.ai"
  | "workspace.execution"
  | "workspace.script"
  | "workspace.logs"
  | "workspace.results"
  | "workspace.empty"
  | "workspace.mapHint"
  | "workspace.currentProject"
  | "workspace.noProject"
  | "workspace.noWorkflow"
  | "workspace.noRun"
  | "workspace.noTemplates"
  | "workspace.noDatasets"
  | "workspace.currentTool"
  | "workspace.aiHint"
  | "workspace.compiledFrom"
  | "workspace.toolboxHint"
  | "page.projects.title"
  | "page.projects.subtitle"
  | "page.catalog.title"
  | "page.catalog.subtitle"
  | "page.templates.title"
  | "page.templates.subtitle"
  | "page.runs.title"
  | "page.runs.subtitle"
  | "page.settings.title"
  | "page.settings.subtitle"
  | "project.title"
  | "project.name"
  | "project.description"
  | "project.create"
  | "project.current"
  | "project.noSelection"
  | "project.recent"
  | "browser.assets"
  | "browser.noAssets"
  | "browser.addToLayers"
  | "catalog.datasets"
  | "catalog.local"
  | "templates.builtIn"
  | "templates.saved"
  | "templates.skills"
  | "templates.aiDrafts"
  | "runs.history"
  | "runs.exports"
  | "runs.artifacts"
  | "settings.language"
  | "settings.basemap"
  | "settings.theme"
  | "settings.connection"
  | "settings.theme.google"
  | "settings.aiProvider"
  | "settings.aiProviderName"
  | "settings.aiModel"
  | "settings.aiBaseUrl"
  | "settings.aiApiKey"
  | "settings.aiEnabled"
  | "settings.aiSave"
  | "settings.aiHint"
  | "map.title"
  | "map.baseLayers"
  | "map.eeLayers"
  | "map.localLayers"
  | "auth.title"
  | "auth.mode"
  | "auth.status"
  | "auth.project"
  | "auth.browser"
  | "auth.openBrowser"
  | "auth.complete"
  | "auth.accountEmail"
  | "auth.projectOptional"
  | "auth.serviceAccount"
  | "auth.test"
  | "auth.disconnect"
  | "auth.path"
  | "tool.search"
  | "tool.category.data"
  | "tool.category.preprocess"
  | "tool.category.index"
  | "tool.category.statistics"
  | "tool.category.export"
  | "tool.category.ai"
  | "tool.quickIndex.name"
  | "tool.quickIndex.description"
  | "tool.quickIndex.dataset"
  | "tool.quickIndex.index"
  | "tool.quickIndex.start"
  | "tool.quickIndex.end"
  | "tool.quickIndex.save"
  | "tool.quickIndex.status"
  | "tool.trueColor.name"
  | "tool.trueColor.description"
  | "tool.trueColor.save"
  | "tool.trueColor.status"
  | "tool.roi.upload"
  | "tool.roi.hint"
  | "tool.export.destination"
  | "tool.export.filename"
  | "tool.export.scale"
  | "tool.export.local"
  | "tool.export.drive"
  | "tool.preprocess.name"
  | "tool.preprocess.description"
  | "tool.statistics.name"
  | "tool.statistics.description"
  | "tool.export.name"
  | "tool.export.description"
  | "tool.ai.name"
  | "tool.ai.description"
  | "tool.planned"
  | "dock.collapse"
  | "dock.expand"
  | "layers.visibility"
  | "layers.rename"
  | "layers.delete"
  | "layers.opacity"
  | "layers.up"
  | "layers.down"
  | "layers.source"
  | "layers.none"
  | "layers.addBasemap"
  | "basemap.provider"
  | "basemap.style"
  | "basemap.apiKey"
  | "basemap.confirm"
  | "basemap.cancel"
  | "inspector.title"
  | "inspector.noSelection"
  | "inspector.layerName"
  | "inspector.layerType"
  | "inspector.layerOpacity"
  | "inspector.layerSource"
  | "inspector.tool"
  | "ai.title"
  | "ai.goal"
  | "ai.generate"
  | "ai.materialize"
  | "ai.generatedSteps"
  | "ai.notReady"
  | "ai.templateGoal"
  | "ai.recommend"
  | "ai.draft"
  | "ai.explain"
  | "console.execution"
  | "console.script"
  | "console.logs"
  | "console.result"
  | "status.working";

type Catalog = Record<MessageKey, string>;

export const messages: Record<Locale, Catalog> = {
  "zh-CN": {
    "app.title": "GeoMind",
    "app.subtitle": "AI 工作流客户端",
    "menu.file": "文件",
    "menu.edit": "编辑",
    "menu.view": "视图",
    "menu.analysis": "分析",
    "menu.help": "帮助",
    "nav.workspace": "工作区",
    "nav.projects": "项目",
    "nav.catalog": "数据目录",
    "nav.templates": "模板 / Skills",
    "nav.runs": "运行与导出",
    "nav.settings": "设置",
    "toolbar.save": "保存工作流",
    "toolbar.compile": "编译计划",
    "toolbar.run": "运行",
    "toolbar.export": "下载结果",
    "toolbar.language": "语言",
    "toolbar.connected": "已连接",
    "toolbar.disconnected": "未连接",
    "workspace.browser": "资源浏览器",
    "workspace.layers": "图层",
    "workspace.toolbox": "工具箱",
    "workspace.parameters": "参数",
    "workspace.ai": "AI",
    "workspace.execution": "执行计划",
    "workspace.script": "脚本",
    "workspace.logs": "日志",
    "workspace.results": "结果",
    "workspace.empty": "选择一个工具开始，或让 AI 生成初始流程。",
    "workspace.mapHint": "地图优先。工具、图层和结果都围绕地图展开。",
    "workspace.currentProject": "当前项目",
    "workspace.noProject": "未选择项目",
    "workspace.noWorkflow": "暂无工作流",
    "workspace.noRun": "暂无运行记录",
    "workspace.noTemplates": "暂无模板",
    "workspace.noDatasets": "暂无数据集",
    "workspace.currentTool": "当前工具",
    "workspace.aiHint": "AI 负责推荐、补全和解释，不替代基础工具路径。",
    "workspace.compiledFrom": "来源工作流",
    "workspace.toolboxHint": "分类折叠、搜索过滤，参数在右侧编辑。",
    "page.projects.title": "项目",
    "page.projects.subtitle": "管理最近项目、创建新项目并切换上下文。",
    "page.catalog.title": "数据目录",
    "page.catalog.subtitle": "浏览可用 GEE 数据目录和本地输入入口。",
    "page.templates.title": "模板 / Skills",
    "page.templates.subtitle": "查看内置模板、用户模板和 AI 草案。",
    "page.runs.title": "运行与导出",
    "page.runs.subtitle": "跟踪运行历史、导出队列和产物。",
    "page.settings.title": "设置",
    "page.settings.subtitle": "配置语言、Earth Engine 连接和应用偏好。",
    "project.title": "项目",
    "project.name": "项目名称",
    "project.description": "项目说明",
    "project.create": "创建项目",
    "project.current": "当前项目",
    "project.noSelection": "未选择项目",
    "project.recent": "最近项目",
    "catalog.datasets": "GEE 数据目录",
    "catalog.local": "本地输入",
    "templates.builtIn": "内置模板",
    "templates.saved": "用户模板",
    "templates.skills": "开发 Skills",
    "templates.aiDrafts": "AI 草案",
    "runs.history": "运行历史",
    "runs.exports": "导出",
    "runs.artifacts": "产物",
    "settings.language": "语言",
    "settings.basemap": "底图",
    "settings.theme": "主题",
    "settings.connection": "Earth Engine 连接",
    "settings.theme.google": "Win10 工具风浅色主题",
    "settings.aiProvider": "AI 提供商",
    "settings.aiProviderName": "提供商",
    "settings.aiModel": "模型",
    "settings.aiBaseUrl": "Base URL",
    "settings.aiApiKey": "API Key",
    "settings.aiEnabled": "启用 AI 工作流生成",
    "settings.aiSave": "保存 AI 配置",
    "settings.aiHint": "配置 API key 后，AI 面板才能生成结构化线性流程。",
    "map.title": "地图画布",
    "map.baseLayers": "底图",
    "map.eeLayers": "EE 图层",
    "map.localLayers": "本地图层",
    "auth.title": "Earth Engine 连接",
    "auth.mode": "模式",
    "auth.status": "状态",
    "auth.project": "项目",
    "auth.browser": "浏览器登录",
    "auth.openBrowser": "打开浏览器",
    "auth.complete": "标记浏览器登录完成",
    "auth.accountEmail": "账户邮箱",
    "auth.projectOptional": "项目 ID（可选）",
    "auth.serviceAccount": "服务账号",
    "auth.test": "测试连接",
    "auth.disconnect": "断开连接",
    "auth.path": "服务账号 JSON 路径",
    "tool.search": "搜索工具",
    "tool.category.data": "数据输入",
    "tool.category.preprocess": "预处理",
    "tool.category.index": "指数分析",
    "tool.category.statistics": "统计",
    "tool.category.export": "导出",
    "tool.category.ai": "AI 辅助",
    "tool.quickIndex.name": "指数监测",
    "tool.quickIndex.description": "面向常见指数分析的向导式工具，生成统一 WorkflowSpec。",
    "tool.quickIndex.dataset": "数据集",
    "tool.quickIndex.index": "指数",
    "tool.quickIndex.start": "开始日期",
    "tool.quickIndex.end": "结束日期",
    "tool.quickIndex.save": "保存指数流程",
    "tool.quickIndex.status": "生成 ROI -> 数据源 -> 过滤 -> 合成 -> 指数 -> 统计 -> 导出的标准工作流。",
    "tool.trueColor.name": "真彩色合成",
    "tool.trueColor.description": "上传 ROI，生成中值合成真彩色影像并导出。",
    "tool.trueColor.save": "保存真彩流程",
    "tool.trueColor.status": "生成 ROI -> 数据源 -> 过滤 -> 中值合成 -> 真彩渲染 -> 导出流程。",
    "tool.roi.upload": "上传 ROI",
    "tool.roi.hint": "支持 GeoJSON 和 Shapefile ZIP",
    "tool.export.destination": "导出目标",
    "tool.export.filename": "文件名",
    "tool.export.scale": "分辨率",
    "tool.export.local": "本地下载",
    "tool.export.drive": "Google Drive",
    "tool.preprocess.name": "预处理模板",
    "tool.preprocess.description": "预留给云掩膜、重采样和裁剪流程。",
    "tool.statistics.name": "区域统计模板",
    "tool.statistics.description": "预留给面积统计和时间序列汇总。",
    "tool.export.name": "导出模板",
    "tool.export.description": "预留给 GeoTIFF、CSV 和任务导出流程。",
    "tool.ai.name": "AI 流程草拟",
    "tool.ai.description": "由 AI 生成可审阅的流程草案和模板。",
    "tool.planned": "后续扩展",
    "dock.collapse": "折叠",
    "dock.expand": "展开",
    "layers.visibility": "显示",
    "layers.rename": "重命名",
    "layers.delete": "删除",
    "layers.opacity": "透明度",
    "layers.up": "上移",
    "layers.down": "下移",
    "layers.source": "来源",
    "layers.none": "暂无图层",
    "layers.addBasemap": "添加底图",
    "basemap.provider": "图源",
    "basemap.style": "样式",
    "basemap.apiKey": "API Key（可选）",
    "basemap.confirm": "添加",
    "basemap.cancel": "取消",
    "inspector.title": "检查器",
    "inspector.noSelection": "未选择图层或工具。",
    "inspector.layerName": "图层名称",
    "inspector.layerType": "图层类型",
    "inspector.layerOpacity": "透明度",
    "inspector.layerSource": "图层来源",
    "inspector.tool": "工具",
    "ai.title": "AI 助手",
    "ai.goal": "任务目标",
    "ai.generate": "生成线性流程",
    "ai.materialize": "固化工作流",
    "ai.generatedSteps": "已生成步骤",
    "ai.notReady": "AI 尚未就绪，请先在设置页配置 API key。",
    "ai.templateGoal": "模板目标",
    "ai.recommend": "推荐流程",
    "ai.draft": "草拟模板",
    "ai.explain": "解释脚本",
    "console.execution": "执行计划",
    "console.script": "脚本",
    "console.logs": "日志",
    "console.result": "结果",
    "status.working": "处理中..."
  },
  "en-US": {
    "app.title": "GeoMind",
    "app.subtitle": "AI workflow client",
    "menu.file": "File",
    "menu.edit": "Edit",
    "menu.view": "View",
    "menu.analysis": "Analysis",
    "menu.help": "Help",
    "nav.workspace": "Workspace",
    "nav.projects": "Projects",
    "nav.catalog": "Data Catalog",
    "nav.templates": "Templates / Skills",
    "nav.runs": "Runs / Exports",
    "nav.settings": "Settings",
    "toolbar.save": "Save workflow",
    "toolbar.compile": "Compile plan",
    "toolbar.run": "Run",
    "toolbar.export": "Download result",
    "toolbar.language": "Language",
    "toolbar.connected": "Connected",
    "toolbar.disconnected": "Disconnected",
    "workspace.browser": "Browser",
    "workspace.layers": "Layers",
    "workspace.toolbox": "Toolbox",
    "workspace.parameters": "Parameters",
    "workspace.ai": "AI",
    "workspace.execution": "Execution Plan",
    "workspace.script": "Script",
    "workspace.logs": "Logs",
    "workspace.results": "Results",
    "workspace.empty": "Choose a tool or let AI generate an initial flow.",
    "workspace.mapHint": "Map-first layout. Tools, layers, and results revolve around the map canvas.",
    "workspace.currentProject": "Current project",
    "workspace.noProject": "No project selected",
    "workspace.noWorkflow": "No workflow",
    "workspace.noRun": "No runs yet",
    "workspace.noTemplates": "No templates",
    "workspace.noDatasets": "No datasets",
    "workspace.currentTool": "Current tool",
    "workspace.aiHint": "AI recommends, fills, and explains. It does not replace the base tool path.",
    "workspace.compiledFrom": "Compiled from workflow",
    "workspace.toolboxHint": "Collapsed categories, search filtering, and parameters edited on the right.",
    "page.projects.title": "Projects",
    "page.projects.subtitle": "Manage recent projects, create new work, and switch context.",
    "page.catalog.title": "Data Catalog",
    "page.catalog.subtitle": "Browse available GEE catalogs and local input entry points.",
    "page.templates.title": "Templates / Skills",
    "page.templates.subtitle": "Review built-in templates, saved templates, and AI drafts.",
    "page.runs.title": "Runs / Exports",
    "page.runs.subtitle": "Track run history, export queue, and artifacts.",
    "page.settings.title": "Settings",
    "page.settings.subtitle": "Configure language, Earth Engine connection, and app preferences.",
    "project.title": "Project",
    "project.name": "Project name",
    "project.description": "Project description",
    "project.create": "Create project",
    "project.current": "Current project",
    "project.noSelection": "No project selected",
    "project.recent": "Recent projects",
    "catalog.datasets": "GEE datasets",
    "catalog.local": "Local inputs",
    "templates.builtIn": "Built-in templates",
    "templates.saved": "Saved templates",
    "templates.skills": "Development skills",
    "templates.aiDrafts": "AI drafts",
    "runs.history": "Run history",
    "runs.exports": "Exports",
    "runs.artifacts": "Artifacts",
    "settings.language": "Language",
    "settings.basemap": "Basemap",
    "settings.theme": "Theme",
    "settings.connection": "Earth Engine connection",
    "settings.theme.google": "Win10 tool-style light theme",
    "settings.aiProvider": "AI Provider",
    "settings.aiProviderName": "Provider",
    "settings.aiModel": "Model",
    "settings.aiBaseUrl": "Base URL",
    "settings.aiApiKey": "API Key",
    "settings.aiEnabled": "Enable AI workflow generation",
    "settings.aiSave": "Save AI Config",
    "settings.aiHint": "Configure an API key before using structured AI workflow generation.",
    "map.title": "Map Canvas",
    "map.baseLayers": "Base layers",
    "map.eeLayers": "EE layers",
    "map.localLayers": "Local layers",
    "auth.title": "Earth Engine Connection",
    "auth.mode": "Mode",
    "auth.status": "Status",
    "auth.project": "Project",
    "auth.browser": "Browser login",
    "auth.openBrowser": "Open browser",
    "auth.complete": "Mark browser login complete",
    "auth.accountEmail": "Account email",
    "auth.projectOptional": "Project ID (optional)",
    "auth.serviceAccount": "Service account",
    "auth.test": "Test connection",
    "auth.disconnect": "Disconnect",
    "auth.path": "Service account JSON path",
    "tool.search": "Search tools",
    "tool.category.data": "Data Input",
    "tool.category.preprocess": "Preprocess",
    "tool.category.index": "Index",
    "tool.category.statistics": "Statistics",
    "tool.category.export": "Export",
    "tool.category.ai": "AI Assist",
    "tool.quickIndex.name": "Index Monitoring",
    "tool.quickIndex.description": "Wizard-driven index workflow that compiles into a shared WorkflowSpec.",
    "tool.quickIndex.dataset": "Dataset",
    "tool.quickIndex.index": "Index",
    "tool.quickIndex.start": "Start date",
    "tool.quickIndex.end": "End date",
    "tool.quickIndex.save": "Save index flow",
    "tool.quickIndex.status": "Creates a standard ROI -> dataset -> filter -> composite -> index -> stats -> export workflow.",
    "tool.trueColor.name": "True Color Composite",
    "tool.trueColor.description": "Upload an ROI and build a median true color composite export workflow.",
    "tool.trueColor.save": "Save true color flow",
    "tool.trueColor.status": "Creates an ROI -> dataset -> filter -> median composite -> true color render -> export workflow.",
    "tool.roi.upload": "Upload ROI",
    "tool.roi.hint": "Supports GeoJSON and Shapefile ZIP",
    "tool.export.destination": "Export destination",
    "tool.export.filename": "Filename",
    "tool.export.scale": "Scale",
    "tool.export.local": "Local download",
    "tool.export.drive": "Google Drive",
    "tool.preprocess.name": "Preprocess Template",
    "tool.preprocess.description": "Reserved for cloud mask, resample, and clip flows.",
    "tool.statistics.name": "Regional Statistics Template",
    "tool.statistics.description": "Reserved for area statistics and time-series summaries.",
    "tool.export.name": "Export Template",
    "tool.export.description": "Reserved for GeoTIFF, CSV, and task export flows.",
    "tool.ai.name": "AI Flow Drafting",
    "tool.ai.description": "Use AI to produce reviewable flow drafts and templates.",
    "tool.planned": "Planned",
    "dock.collapse": "Collapse",
    "dock.expand": "Expand",
    "layers.visibility": "Visibility",
    "layers.rename": "Rename",
    "layers.delete": "Delete",
    "layers.opacity": "Opacity",
    "layers.up": "Move up",
    "layers.down": "Move down",
    "layers.source": "Source",
    "layers.none": "No layers",
    "layers.addBasemap": "Add basemap",
    "basemap.provider": "Provider",
    "basemap.style": "Style",
    "basemap.apiKey": "API key (optional)",
    "basemap.confirm": "Add",
    "basemap.cancel": "Cancel",
    "inspector.title": "Inspector",
    "inspector.noSelection": "No layer or tool selected.",
    "inspector.layerName": "Layer name",
    "inspector.layerType": "Layer type",
    "inspector.layerOpacity": "Opacity",
    "inspector.layerSource": "Layer source",
    "inspector.tool": "Tool",
    "ai.title": "AI Assistant",
    "ai.goal": "Goal",
    "ai.generate": "Generate Linear Flow",
    "ai.materialize": "Materialize Workflow",
    "ai.generatedSteps": "Generated Steps",
    "ai.notReady": "AI is not ready. Configure the API key in Settings first.",
    "ai.templateGoal": "Template goal",
    "ai.recommend": "Recommend flow",
    "ai.draft": "Draft template",
    "ai.explain": "Explain script",
    "console.execution": "Execution Plan",
    "console.script": "Script",
    "console.logs": "Logs",
    "console.result": "Results",
    "status.working": "Working..."
  }
};
