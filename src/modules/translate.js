export class Translate {
    constructor() {
        // 初始化翻译服务，不需要在构造函数中尝试访问DOM
        this.initialized = false;
        
        // 不再尝试访问DOM元素
        // 这些将在main.js中处理
    }
    
    /**
     * 处理翻译请求
     * @param {string} targetLang 目标语言代码
     */
    handleTranslate(targetLang) {
        const resultElement = document.getElementById('result');
        if (!resultElement) {
            this.showError('无法找到结果容器元素');
            return;
        }
        
        const textToTranslate = resultElement.textContent;
        
        if (!textToTranslate || textToTranslate.trim() === '') {
            this.showError('没有可翻译的内容');
            return;
        }
        
        // 显示加载状态
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'block';
        
        this.showToast(`开始翻译到${this.getLangName(targetLang)}...`, 'info');
        
        this.translateText(textToTranslate, targetLang)
            .then(result => {
                if (result && result.text) {
                    this.displayTranslationResult(result.text);
                    this.showToast('翻译完成', 'success');
                } else {
                    throw new Error('翻译结果为空');
                }
            })
            .catch(error => {
                this.showError(error.message);
                console.error('翻译错误:', error);
            })
            .finally(() => {
                if (spinner) spinner.style.display = 'none';
            });
    }
    
    /**
     * 显示错误信息
     */
    showError(message) {
        this.showToast('翻译失败: ' + message, 'error');
    }
    
    /**
     * 显示Toast通知
     */
    showToast(message, type = 'info') {
        if (window.utils && window.utils.showToast) {
            window.utils.showToast(message, type);
        } else {
            const toastContainer = document.getElementById('toastContainer');
            if (!toastContainer) return;
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            toastContainer.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }
    
    /**
     * 翻译文本
     * @param {string} text 要翻译的文本
     * @param {string} targetLang 目标语言代码
     * @returns {Promise} 包含翻译结果的Promise
     */
    async translateText(text, targetLang = 'ZH') {
        if (!text || text.trim() === '') {
            throw new Error('翻译文本不能为空');
        }
        
        // 获取翻译设置
        const settings = window.settings ? window.settings.getSettings() : {};
        const translateService = settings.translateService || 'deeplx';
        
        // 根据设置选择翻译服务
        try {
            if (translateService === 'deeplx') {
                return await this.translateWithDeepLX(text, targetLang, settings);
            } else if (translateService === 'openai') {
                return await this.translateWithOpenAI(text, targetLang, settings);
            } else {
                throw new Error(`不支持的翻译服务: ${translateService}`);
            }
        } catch (error) {
            console.error('翻译失败:', error);
            throw error;
        }
    }
    
    /**
     * 使用DeepLX API翻译
     */
    async translateWithDeepLX(text, targetLang, settings) {
        const deeplxUrl = settings.deeplxUrl || 'https://api.deeplx.org/translate';
        
        // 目标语言映射
        const langMap = {
            'ZH': 'ZH',
            'EN': 'EN',
            'JA': 'JA',
            'KO': 'KO',
            'FR': 'FR',
            'DE': 'DE',
            'ES': 'ES',
            'RU': 'RU'
        };
        
        const targetLangCode = langMap[targetLang] || 'ZH';
        
        // 检查URL是否有效
        if (!deeplxUrl || !deeplxUrl.startsWith('http')) {
            throw new Error('无效的DeepLX API URL');
        }
        
        try {
            const response = await fetch(deeplxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    source_lang: 'auto',
                    target_lang: targetLangCode
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.text) {
                throw new Error('翻译结果为空');
            }
            
            return {
                text: data.text,
                from: data.source_lang,
                to: data.target_lang
            };
        } catch (error) {
            console.error('DeepLX 翻译失败:', error);
            throw new Error(`DeepLX 翻译失败: ${error.message}`);
        }
    }
    
    /**
     * 使用OpenAI API翻译
     */
    async translateWithOpenAI(text, targetLang, settings) {
        const baseUrl = settings.openaiBaseUrl || 'https://api.openai.com/v1';
        const apiKey = settings.openaiKey;
        const model = settings.openaiModel || 'gpt-4o-mini';
        
        if (!apiKey) {
            throw new Error('OpenAI API Key不能为空');
        }
        
        // 语言名称映射
        const langNameMap = {
            'ZH': '中文',
            'EN': '英文',
            'JA': '日语',
            'KO': '韩语',
            'FR': '法语',
            'DE': '德语',
            'ES': '西班牙语',
            'RU': '俄语'
        };
        
        const targetLangName = langNameMap[targetLang] || '中文';
        
        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: `你是一个专业的翻译助手。请将用户输入的文本翻译成${targetLangName}。保持原始文本的格式和结构，包括换行符、标点符号等。保留原文中的代码块、数学公式和Markdown格式。`
                        },
                        {
                            role: 'user',
                            content: text
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 4000
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API错误: ${errorData.error?.message || response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('翻译结果为空');
            }
            
            return {
                text: data.choices[0].message.content,
                from: 'auto',
                to: targetLang
            };
        } catch (error) {
            console.error('OpenAI 翻译失败:', error);
            throw new Error(`OpenAI 翻译失败: ${error.message}`);
        }
    }
    
    /**
     * 显示翻译结果
     */
    displayTranslationResult(text) {
        const resultElement = document.getElementById('result');
        if (!resultElement) return;
        
        // 判断是否需要Markdown渲染
        if (resultElement.classList.contains('markdown-content') && window.markdownParser) {
            resultElement.innerHTML = window.markdownParser.parse(text);
            // 如果有MathJax，重新渲染公式
            if (window.MathJax) {
                try {
                    window.MathJax.typeset([resultElement]);
                } catch (error) {
                    console.error('MathJax渲染失败:', error);
                }
            }
        } else {
            resultElement.textContent = text;
        }
    }
    
    /**
     * 获取语言名称
     */
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
}
