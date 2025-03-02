// OCR识别相关功能
export class OCR {
  constructor() {
    this.resultDiv = document.getElementById('result');
    this.resultEditor = document.getElementById('resultEditor');
    this.loadingSpinner = document.getElementById('loadingSpinner');
    this.retranslateBtn = document.getElementById('retranslateBtn');
    this.editBtn = document.getElementById('editBtn');
    this.currentOcrText = null;

    this.initEventListeners();
  }

  initEventListeners() {
    // 重新识别功能
    this.retranslateBtn?.addEventListener('click', () => {
      if (window.upload.currentImageData) {
        this.resultDiv.innerHTML = '';
        this.loadingSpinner.style.display = 'block';
        this.processImage(window.upload.currentImageData);
      }
    });

    // 编辑功能
    this.editBtn?.addEventListener('click', () => {
      if (this.resultEditor.style.display === 'none') {
        // 切换到编辑模式
        this.resultEditor.value = this.resultDiv.innerText || '';
        this.resultEditor.style.display = 'block';
        this.resultDiv.style.display = 'none';
        this.editBtn.title = '保存';
      } else {
        // 保存编辑并切换回显示模式
        const newText = this.resultEditor.value;
        this.updateContent(newText);
        this.resultEditor.style.display = 'none';
        this.resultDiv.style.display = 'block';
        this.editBtn.title = '编辑';
        this.renderResult(newText);
      }
    });
  }

  async renderResult(text) {
    if (!text) return;

    // 处理数学公式
    const processedText = text
      .replace(/\\（/g, '\\(')
      .replace(/\\）/g, '\\)')
      .replace(/\$([^$]+)\$/g, (match, formula) => {
        if (!/^\\[a-zA-Z]/.test(formula.trim())) {
          return `$${formula}$`;
        }
        return match;
      })
      .replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
        if (!/^\\[a-zA-Z]/.test(formula.trim())) {
          return `$$${formula}$$`;
        }
        return match;
      })
      .replace(/\n{3,}/g, '\n\n')
      .replace(/([^\n])\n([^\n])/g, '$1\n$2')
      .trim();

    try {
      // 检查markdown解析器是否可用
      if (typeof window.markdownParser === 'undefined') {
        console.warn('Markdown parser not available, displaying plain text');
        this.resultDiv.textContent = processedText;
      } else {
        // 渲染Markdown
        this.resultDiv.innerHTML = window.markdownParser.parse(processedText);
        this.resultDiv.classList.add('markdown-body');
      }

      // 渲染数学公式
      if (window.utils.initMathJax()) {
        try {
          await MathJax.typesetPromise([this.resultDiv]);
        } catch (error) {
          console.error('MathJax渲染失败:', error);
          setTimeout(async () => {
            try {
              await MathJax.typesetPromise([this.resultDiv]);
            } catch (e) {
              console.error('MathJax重试渲染失败:', e);
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('渲染结果失败:', error);
      // 降级处理：直接显示文本
      this.resultDiv.textContent = processedText;
    }
  }

  async processImage(imageData) {
    if (!imageData) return;

    // 更新预览
    window.upload.updatePreview(imageData);

    // 清空结果并显示加载
    this.resultDiv.innerHTML = '';
    this.loadingSpinner.style.display = 'block';

    try {
      const settings = window.services.getSettings();
      const ocrService = settings.ocrService || 'qwen';

      let result;
      if (ocrService === 'qwen') {
        result = await this.processWithQwen(imageData, settings);
      } else {
        result = await this.processWithOpenAI(imageData, settings);
      }

      this.updateContent(result);
      await this.renderResult(result);

    } catch (error) {
      window.utils.showToast(`处理失败: ${error.message}`, 'error');
      this.resultDiv.textContent = '';
    } finally {
      this.loadingSpinner.style.display = 'none';
    }
  }

  async processWithQwen(imageData, settings) {
    if (!window.services) {
      throw new Error('服务初始化失败，请检查preload.js是否正确加载');
    }

    const token = window.services.getRandomToken();
    if (!token) {
      window.settings.settingsModal.classList.add('show');
      throw new Error('请先设置API Token');
    }

    // 保存图片到临时文件
    const imagePath = window.services.saveTempImage(imageData);

    // 上传文件
    const formData = new FormData();
    formData.append('file', await fetch(imagePath).then(r => r.blob()));

    const uploadResponse = await fetch('https://chat.qwenlm.ai/api/v1/files/', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const uploadData = await uploadResponse.json();
    if (!uploadData.id) throw new Error('文件上传失败');

    const defaultPrompt = '请识别图片中的内容。对于数学公式和数学符号，请使用标准的LaTeX格式输出。' +
      '要求：\n' +
      '1. 所有数学公式和单个数学符号都要用LaTeX格式\n' +
      '2. 普通文本保持原样\n' +
      '3. 严格保持原文的段落格式和换行\n' +
      '4. 对于代码块，请使用 markdown 格式输出';

    const prompt = defaultPrompt;

    const model = settings.model || 'qwen2.5-vl-72b-instruct';

    // 调用识别 API
    const recognizeResponse = await fetch('https://chat.qwenlm.ai/api/chat/completions', {
      credentials: 'omit',
      method: 'POST',
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        'Accept': '*/*',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stream: false,
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
                chat_type: "t2t",
                feature_config: {
                  thinking_enabled: false
                }
              },
              {
                type: 'image',
                image: uploadData.id
              },
            ],
          },
        ]
      }),
    });

    const recognizeData = await recognizeResponse.json();
    return recognizeData.choices[0]?.message?.content || '识别失败';
  }

  async processWithOpenAI(imageData, settings) {
    if (!settings.openaiOcrKey) {
      throw new Error('请先设置OpenAI API Key');
    }

    // 将base64图片数据转换为URL格式
    const imageUrl = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;

    const defaultPrompt = '请识别图片中的内容。对于数学公式和数学符号，请使用标准的LaTeX格式输出。' +
      '要求：\n' +
      '1. 所有数学公式和单个数学符号都要用LaTeX格式\n' +
      '2. 普通文本保持原样\n' +
      '3. 严格保持原文的段落格式和换行\n' +
      '4. 对于代码块，请使用 markdown 格式输出';

    const prompt = defaultPrompt;

    const response = await fetch(`${settings.openaiOcrBaseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openaiOcrKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.openaiOcrModel || 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        temperature: settings.openaiOcrTemperature || 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || '识别请求失败');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '识别失败';
  }

  // 添加更新内容的方法
  updateContent(text) {
    this.currentOcrText = text;
    this.resultEditor.value = text;
  }

  // 添加clear方法
  clear() {
    this.updateContent('');
    this.resultDiv.innerHTML = '';
    this.resultEditor.style.display = 'none';
    this.resultDiv.style.display = 'block';
    this.editBtn.title = '编辑';
  }
} 