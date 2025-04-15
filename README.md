# HTML to Image Service

一个简单易用的 HTML 转图片服务，可以将任何 HTML 或 SVG 内容转换为高质量图片。

## 快速开始

访问我们的在线服务：

```
https://mcpdev.xyz/
```

## 主要功能

- **HTML 转图片**：将 HTML 或 SVG 内容转换为 PNG、JPEG 或 WebP 图片
- **自定义尺寸**：指定图片宽度和高度，或让服务自动调整
- **多语言支持**：支持中文和英文界面
- **在线演示**：直接在浏览器中试用服务

## 如何使用

1. 访问在线演示页面：
   ```
   https://mcpdev.xyz/demo.html
   ```

2. 在编辑器中输入您的 HTML 代码

3. 设置图片尺寸和格式

4. 点击“转换为图片”按钮

5. 查看并下载生成的图片

## MCP 服务

MCP 服务入口：
```
https://mcpdev.xyz/mcp
```


您可以使用 MCP 客户端连接到此服务，将 HTML 转换为图片。

## API 使用示例

```javascript
// 示例：将 HTML 转换为图片
const response = await fetch('https://mcpdev.xyz/api/html-to-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    htmlContent: '<div style="background: linear-gradient(to right, #ff6b6b, #556270); padding: 20px; color: white; font-family: Arial;"><h1>你好，世界！</h1><p>这段 HTML 将被转换为图片</p></div>',
    width: 800,
    height: 400,
    format: 'png'
  })
});

const result = await response.json();
// result.imageUrl 包含生成图片的 URL
```

## 参数说明

- `htmlContent`：要转换的 HTML 或 SVG 内容（必填）
- `width`：图片宽度，单位为像素（可选）
- `height`：图片高度，单位为像素（可选）
- `format`：图片格式，支持 'png'、'jpeg' 或 'webp'（默认为 'png'）

## 支持本项目

如果您觉得这个服务对您有帮助，欢迎通过主页上的二维码进行捐赠，请我喝杯咖啡！

## 许可证

MIT
