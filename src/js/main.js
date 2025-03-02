// 主入口文件
import { Settings } from './modules/settings.js';
import { Upload } from './modules/upload.js';
import { OCR } from './modules/ocr.js';
import { Translate } from './modules/translate.js';
import { UI } from './modules/ui.js';
import { Utils } from './modules/utils.js';

// 立即定义全局处理函数，确保它在最早的时间被定义
window.processPluginImage = (imageData) => {
  console.log('processPluginImage called (global)');
  if (!imageData) {
    console.error('No image data provided');
    return;
  }

  // 此时可能还没初始化完，添加到队列中
  const processImage = () => {
    if (window.ocr && typeof window.ocr.processImage === 'function') {
      console.log('Executing OCR.processImage');
      window.ocr.processImage(imageData);
    } else {
      console.log('OCR module not ready yet, retrying in 100ms');
      setTimeout(processImage, 100);
    }
  };

  processImage();
};

document.addEventListener('DOMContentLoaded', () => {
  // 检测是否在uTools环境中运行
  if (window.utools) {
    document.body.classList.add('utools-plugin');
  }
  
  // 先初始化服务
  window.services = {}; // 确保services对象存在
  
  // 初始化工具类
  window.utils = Utils;
  
  // 绑定UI按钮事件，确保在模块初始化前就设置好
  setupButtonEventListeners();
  
  // 初始化应用
  initApp();
  
  function setupButtonEventListeners() {
    // 获取所有下拉切换按钮
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    // 为每个下拉切换按钮添加点击事件
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // 阻止事件冒泡
            const dropdown = this.nextElementSibling;
            
            // 关闭所有其他下拉菜单
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                if (menu !== dropdown) menu.classList.remove('show');
            });
            
            // 切换当前下拉菜单
            dropdown.classList.toggle('show');
            
            // 如果菜单打开，确保其正确显示
            if (dropdown.classList.contains('show')) {
                const rect = dropdown.getBoundingClientRect();
                const spaceAbove = rect.top;
                const spaceBelow = window.innerHeight - toggle.getBoundingClientRect().bottom;
                
                // 检查上方空间是否足够显示菜单
                if (spaceAbove < rect.height && spaceBelow > rect.height) {
                    // 如果上方空间不足但下方空间足够，改为向下弹出
                    dropdown.classList.add('dropdown-up');
                } else {
                    // 否则默认向上弹出
                    dropdown.classList.remove('dropdown-up');
                }
            }
            
            // 点击外部区域关闭下拉菜单
            document.addEventListener('click', function closeDropdown(event) {
                if (!toggle.contains(event.target) && !dropdown.contains(event.target)) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            });
        });
    });

    // 处理复制按钮事件
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            copyText('formatted');
        });
    }

    // 处理复制菜单项点击
    const copyItems = document.querySelectorAll('[data-copy]');
    copyItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // 阻止冒泡以防止触发文档点击事件
            const copyType = this.getAttribute('data-copy');
            copyText(copyType);
            
            // 点击后关闭下拉菜单
            const dropdown = this.closest('.dropdown-menu');
            if (dropdown) dropdown.classList.remove('show');
            
            // 更新激活状态
            copyItems.forEach(ci => ci.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // 处理翻译按钮事件
    const translateBtn = document.getElementById('translateBtn');
    if (translateBtn) {
        translateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // 获取当前激活的语言选项，如果没有则默认为中文
            const activeItem = document.querySelector('[data-lang].active');
            const targetLang = activeItem ? activeItem.getAttribute('data-lang') : 'ZH';
            
            // 调用翻译功能
            handleTranslation(targetLang);
        });
    }
    
    // 处理翻译菜单项点击
    const translateItems = document.querySelectorAll('[data-lang]');
    translateItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // 阻止冒泡以防止触发文档点击事件
            const langCode = this.getAttribute('data-lang');
            
            // 调用翻译功能
            handleTranslation(langCode);
            
            // 点击后关闭下拉菜单
            const dropdown = this.closest('.dropdown-menu');
            if (dropdown) dropdown.classList.remove('show');
            
            // 更新激活状态
            translateItems.forEach(ti => ti.classList.remove('active'));
            this.classList.add('active');
            
            // 更新翻译按钮文本
            if (translateBtn) {
                const langName = this.textContent;
                translateBtn.setAttribute('title', `翻译到${langName}`);
            }
        });
    });
    
    // 处理截图按钮事件
    const screenshotBtn = document.getElementById('screenshotBtn');
    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', function(e) {
            e.preventDefault();
            captureScreenshot();
        });
    }
    
    // 处理重新识别按钮事件
    const retranslateBtn = document.getElementById('retranslateBtn');
    if (retranslateBtn) {
        retranslateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            reprocessImage();
        });
    }
    
    // 默认激活中文选项
    const zhOption = document.querySelector('[data-lang="ZH"]');
    if (zhOption) zhOption.classList.add('active');
  }
  
  // 初始化应用
  function initApp() {
    try {
      // 初始化模块
      window.settings = new Settings();
      window.upload = new Upload();
      window.ocr = new OCR();
      window.translate = new Translate();
      window.ui = new UI();
      
      // 加载设置
      if (window.settings && window.settings.loadSettings) {
        window.settings.loadSettings();
      }
      
      // 处理可能在初始化前接收到的图片
      if (window._pendingImageData && window.ocr) {
        console.log('Processing pending image data');
        window.ocr.processImage(window._pendingImageData);
        window._pendingImageData = null;
      }
    } catch (error) {
      console.error('初始化失败:', error);
      showToast('应用初始化失败: ' + error.message, 'error');
    }
  }
  
  // 处理翻译
  function handleTranslation(targetLang) {
    if (window.translate && typeof window.translate.handleTranslate === 'function') {
      window.translate.handleTranslate(targetLang);
    } else {
      translateText(targetLang);  // 回退到旧的翻译函数
    }
  }
  
  // 截图功能
  function captureScreenshot() {
    if (window.ocr && typeof window.ocr.captureScreenshot === 'function') {
      window.ocr.captureScreenshot();
    } else if (window.utools && window.utools.screenCapture) {
      window.utools.screenCapture((imageData) => {
        if (imageData) {
          if (window.ocr && typeof window.ocr.processImage === 'function') {
            window.ocr.processImage(imageData);
          } else {
            showToast('OCR模块未就绪', 'error');
          }
        }
      });
    } else {
      showToast('截图功能仅在uTools中可用', 'error');
    }
  }
  
  // 重新处理图片
  function reprocessImage() {
    if (window.ocr && typeof window.ocr.reprocessImage === 'function') {
      window.ocr.reprocessImage();
    } else {
      showToast('OCR模块未就绪', 'error');
    }
  }
  
  // 复制文本函数
  function copyText(type) {
    const resultElement = document.getElementById('result');
    if (!resultElement) {
      showToast('找不到结果容器', 'error');
      return;
    }
    
    let textToCopy;
    
    if (type === 'formatted') {
      // 如果是格式化文本，获取HTML内容
      textToCopy = resultElement.innerHTML;
    } else {
      // 否则获取纯文本
      textToCopy = resultElement.textContent;
    }
    
    // 检查uTools环境
    if (window.utools && window.utools.copyText) {
      // 使用uTools API复制文本
      window.utools.copyText(textToCopy);
      showToast('复制成功', 'success');
    } else {
      // 使用标准Web API复制文本
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            showToast('复制成功', 'success');
          })
          .catch(err => {
            showToast('复制失败: ' + err, 'error');
          });
      } else {
        showToast('没有可复制的内容', 'error');
      }
    }
  }
  
  // 翻译文本函数 (作为备用)
  function translateText(targetLang) {
    const resultElement = document.getElementById('result');
    const textToTranslate = resultElement.textContent;
    
    if (!textToTranslate || textToTranslate.trim() === '') {
        showToast('没有可翻译的内容', 'error');
        return;
    }
    
    // 显示loading状态
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'block';
    
    showToast(`开始翻译到${getLangName(targetLang)}...`, 'info');
    
    // 模拟翻译过程
    setTimeout(() => {
        const translatedText = `[翻译到${getLangName(targetLang)}] ` + textToTranslate;
        displayTranslationResult(translatedText);
        if (spinner) spinner.style.display = 'none';
    }, 1000);
  }
  
  // 获取语言名称
  function getLangName(langCode) {
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
  
  // 显示翻译结果
  function displayTranslationResult(text) {
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
      
      showToast('翻译完成', 'success');
  }
  
  // 显示Toast通知函数
  function showToast(message, type = 'info') {
      const toastContainer = document.getElementById('toastContainer');
      if (!toastContainer) return;
      
      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      
      toastContainer.appendChild(toast);
      
      // 3秒后自动删除
      setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 300);
      }, 3000);
  }
});