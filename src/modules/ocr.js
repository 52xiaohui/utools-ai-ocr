export class OCR {
    constructor() {
        this.resultContainer = document.getElementById('result');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        
        // 缓存上一次处理的图片数据
        this.lastImageData = null;
        
        // 注意：不再在构造函数中绑定按钮事件
        // 按钮事件在main.js中统一处理
    }
    
    processImage(imageData) {
        if (!imageData) {
            console.error('No image data provided');
            return;
        }
        
        // 缓存图片数据用于重新识别
        this.lastImageData = imageData;
        
        // 显示预览
        if (window.upload) {
            window.upload.showPreview(imageData);
        }
        
        // 显示loading
        this.showLoading();
        
        // 调用服务进行识别
        if (window.settings && window.settings.getSettings) {
            const settings = window.settings.getSettings();
            const ocrService = settings.ocrService || 'qwen';
            
            // 根据选择的服务执行不同的识别逻辑
            if (ocrService === 'qwen') {
                this.processWithQwen(imageData, settings);
            } else if (ocrService === 'openai') {
                this.processWithOpenAI(imageData, settings);
            } else {
                this.hideLoading();
                this.showError('未知的OCR服务');
            }
        } else {
            this.hideLoading();
            this.showError('设置模块未就绪');
        }
    }
    
    processWithQwen(imageData, settings) {
        /* 
        此处实现通义千问API调用
        为了保持简洁，这里省略了具体实现
        */
        
        // 模拟API调用成功
        setTimeout(() => {
            const mockResult = "这是通义千问OCR识别的结果\n\n可以包含**Markdown**格式\n\n- 列表项1\n- 列表项2\n\n```python\nprint('Hello World')\n```";
            this.displayResult(mockResult, true); // 第二个参数表示使用Markdown渲染
        }, 1000);
    }
    
    processWithOpenAI(imageData, settings) {
        /* 
        此处实现OpenAI API调用
        为了保持简洁，这里省略了具体实现
        */
        
        // 模拟API调用成功
        setTimeout(() => {
            const mockResult = "这是OpenAI识别的文本结果\n\n可以包含数学公式: $E=mc^2$";
            this.displayResult(mockResult, true);
        }, 1000);
    }
    
    displayResult(text, useMarkdown = false) {
        if (!this.resultContainer) return;
        
        this.hideLoading();
        
        // 清除之前的内容
        this.resultContainer.innerHTML = '';
        
        if (useMarkdown && window.markdownParser) {
            // 使用Markdown渲染
            this.resultContainer.classList.add('markdown-content');
            this.resultContainer.innerHTML = window.markdownParser.parse(text);
            
            // 如果有MathJax，渲染数学公式
            if (window.MathJax) {
                try {
                    window.MathJax.typeset([this.resultContainer]);
                } catch (error) {
                    console.error('MathJax渲染失败:', error);
                }
            }
        } else {
            // 纯文本显示
            this.resultContainer.classList.remove('markdown-content');
            this.resultContainer.textContent = text;
        }
    }
    
    reprocessImage() {
        if (this.lastImageData) {
            this.processImage(this.lastImageData);
        } else {
            if (window.utils && window.utils.showToast) {
                window.utils.showToast('没有可重新处理的图片', 'error');
            } else {
                console.error('没有可重新处理的图片');
            }
        }
    }
    
    captureScreenshot() {
        if (window.utools && window.utools.screenCapture) {
            window.utools.screenCapture((imageData) => {
                if (imageData) {
                    this.processImage(imageData);
                }
            });
        } else {
            if (window.utils && window.utils.showToast) {
                window.utils.showToast('截图功能仅在uTools中可用', 'error');
            } else {
                console.error('截图功能仅在uTools中可用');
            }
        }
    }
    
    clearResult() {
        // 清除识别结果
        if (this.resultContainer) {
            this.resultContainer.innerHTML = '';
            this.resultContainer.classList.remove('markdown-content');
        }
        
        // 重置上传区域
        if (window.upload) {
            window.upload.reset();
        }
        
        // 清除缓存的图片
        this.lastImageData = null;
    }
    
    showLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'block';
        }
    }
    
    hideLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'none';
        }
    }
    
    showError(message) {
        this.showToast(message, 'error');
    }
    
    showToast(message, type = 'info') {
        if (window.ui && window.ui.showToast) {
            window.ui.showToast(message, type);
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
}
