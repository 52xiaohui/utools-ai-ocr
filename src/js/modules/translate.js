// 翻译相关功能
export class Translate {
  constructor() {
    this.translateBtn = document.getElementById('translateBtn');
    this.translateDropdown = document.querySelector('.dropdown-menu');
    this.translateItems = document.querySelectorAll('[data-lang]');
    this.translateToggle = document.querySelector('.dropdown-toggle');
    this.resultDiv = document.getElementById('result');
    this.loadingSpinner = document.getElementById('loadingSpinner');
    
    this.currentLang = 'ZH';
    this.isTranslating = false;

    this.initEventListeners();
  }

  initEventListeners() {
    // 点击翻译按钮
    if (this.translateBtn) {
      this.translateBtn.addEventListener('click', () => this.translateText());
    }

    // 点击语言选项
    if (this.translateItems && this.translateItems.length > 0) {
      this.translateItems.forEach(item => {
        if (item) {
          item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // 阻止事件冒泡
            
            // 只更新选中状态，不触发翻译
            this.translateItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            this.currentLang = item.dataset.lang;
            
            // 更新翻译按钮的提示文本
            if (this.translateBtn) {
              const langName = item.textContent.trim();
              this.translateBtn.setAttribute('title', `翻译到${langName}`);
            }
            
            if (this.translateDropdown) {
              this.translateDropdown.classList.remove('show');
            }
            if (this.translateToggle) {
              this.translateToggle.classList.remove('active');
            }
          });
        }
      });
    }

    // 点击下拉按钮和点击外部关闭
    if (document && this.translateToggle && this.translateDropdown && this.translateBtn) {
      document.addEventListener('click', (e) => {
        if (e.target.closest('.dropdown-toggle')) {
          const btnRect = this.translateBtn.getBoundingClientRect();
          
          // 设置下拉菜单位置
          this.translateDropdown.style.bottom = (window.innerHeight - btnRect.top + 10) + 'px';
          this.translateDropdown.style.right = (window.innerWidth - btnRect.right) + 'px';
          
          this.translateDropdown.classList.toggle('show');
          this.translateToggle.classList.toggle('active');
        } else if (!e.target.closest('.dropdown-menu')) {
          this.translateDropdown.classList.remove('show');
          this.translateToggle.classList.remove('active');
        }
      });
    }

    // 初始化选中状态
    if (this.translateItems && this.translateItems.length > 0) {
      const zhOption = Array.from(this.translateItems).find(item => item.getAttribute('data-lang') === 'ZH');
      if (zhOption) {
        zhOption.classList.add('active');
      }
    }
  }

  // 添加一个处理翻译的方法，用于从main.js中调用
  handleTranslate(targetLang) {
    // 更新当前语言
    if (targetLang) {
      this.currentLang = targetLang;
      
      // 更新UI选中状态
      if (this.translateItems) {
        this.translateItems.forEach(item => {
          if (item.getAttribute('data-lang') === targetLang) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    }
    
    // 调用翻译方法
    this.translateText();
  }

  async translateText() {
    if (this.isTranslating) {
      window.utils.showToast('正在翻译中，请稍候', 'info');
      return;
    }

    this.isTranslating = true;
    if (this.loadingSpinner) {
      this.loadingSpinner.style.display = 'block';
    }

    try {
      if (!window.ocr?.currentOcrText) {
        window.utils.showToast('请先进行OCR识别', 'error');
        this.isTranslating = false;
        if (this.loadingSpinner) {
          this.loadingSpinner.style.display = 'none';
        }
        return;
      }

      const settings = window.services.getSettings();
      const translateService = settings.translateService || 'deeplx';

      // 显示开始翻译的提示
      window.utils.showToast(`开始翻译到${this.getLangName(this.currentLang)}...`, 'info');

      if (translateService === 'deeplx' && !settings.deeplxUrl) {
        window.utils.showToast('请先设置DeepLX API地址', 'error');
        window.settings.settingsModal.classList.add('show');
        this.isTranslating = false;
        if (this.loadingSpinner) {
          this.loadingSpinner.style.display = 'none';
        }
        return;
      }

      if (translateService === 'openai' && !settings.openaiKey) {
        window.utils.showToast('请先设置OpenAI API Key', 'error');
        window.settings.settingsModal.classList.add('show');
        this.isTranslating = false;
        if (this.loadingSpinner) {
          this.loadingSpinner.style.display = 'none';
        }
        return;
      }

      let translatedText = await (translateService === 'deeplx' ? 
        this.translateWithDeepLX(settings) : 
        this.translateWithOpenAI(settings));

      // 处理翻译结果
      translatedText = translatedText
        .replace(/\\（/g, '\\(')
        .replace(/\\）/g, '\\)')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // 更新内容
      window.ocr.updateContent(translatedText);
      await window.ocr.renderResult(translatedText);

      // 渲染数学公式
      if (window.utils.initMathJax()) {
        try {
          await MathJax.typesetPromise([this.resultDiv]);
        } catch (error) {
          console.error('数学公式渲染失败:', error);
          window.utils.showToast('数学公式渲染失败，但翻译结果已保存', 'warning');
        }
      }

      // 只有在真正完成翻译后才显示成功提示
      window.utils.showToast('翻译完成', 'success');
    } catch (error) {
      console.error('翻译错误:', error);
      window.utils.showToast(`翻译失败: ${error.message}`, 'error');
    } finally {
      this.isTranslating = false;
      if (this.loadingSpinner) {
        this.loadingSpinner.style.display = 'none';
      }
    }
  }

  // 获取语言名称
  getLangName(langCode) {
    const langMap = {
      'ZH': '中文',
      'EN': '英文',
      'JA': '日语',
      'KO': '韩语',
      'FR': '法语',
      'DE': '德语',
      'ES': '西班牙语',
      'RU': '俄语'
    };
    return langMap[langCode] || langCode;
  }

  async translateWithDeepLX(settings) {
    const response = await fetch(settings.deeplxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: window.ocr.currentOcrText,
        source_lang: 'AUTO',
        target_lang: this.currentLang
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`翻译请求失败: ${errorText}`);
    }

    const data = await response.json();
    if (data.code === 200 && data.data) {
      return data.data;
    }
    throw new Error(data.message || '翻译失败');
  }

  async translateWithOpenAI(settings) {
    const targetLangMap = {
      'ZH': '请将以下文本翻译成中文，保持所有LaTeX公式和代码块格式不变，保持原文的段落结构：\n',
      'EN': 'Please translate the following text into English, keep all LaTeX formulas and code blocks unchanged, maintain the original paragraph structure:\n',
      'JA': '以下の文章を日本語に翻訳してください。LaTeX数式とコードブロックの形式を保持し、原文の段落構造を維持してください：\n',
      'KO': '다음 텍스트를 한국어로 번역하되, 모든 LaTeX 수식과 코드 블록 형식을 유지하고 원문의 단락 구조를 유지하십시오:\n',
      'FR': 'Veuillez traduire le texte suivant en français, en conservant toutes les formules LaTeX et les blocs de code, et en maintenant la structure des paragraphes:\n',
      'DE': 'Bitte übersetzen Sie den folgenden Text ins Deutsche, behalten Sie alle LaTeX-Formeln und Codeblöcke bei und bewahren Sie die Absatzstruktur:\n',
      'ES': 'Por favor, traduce el siguiente texto al español, manteniendo todas las fórmulas LaTeX y bloques de código, y conservando la estructura de párrafos:\n',
      'RU': 'Переведите следующий текст на русский язык, сохраняя все формулы LaTeX и блоки кода, поддерживая структуру абзацев:\n'
    };

    const response = await fetch(`${settings.openaiBaseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.openaiModel || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的翻译助手。在翻译时：1. 保持所有LaTeX公式不变 2. 保持所有代码块格式不变 3. 保持原文的段落结构 4. 保持原文的换行方式'
          },
          {
            role: 'user',
            content: `${targetLangMap[this.currentLang] || targetLangMap['EN']}\n${window.ocr.currentOcrText}`
          }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || '翻译请求失败');
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content;
    if (!translatedText) throw new Error('翻译结果为空');
    
    return translatedText;
  }
} 