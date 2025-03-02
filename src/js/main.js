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
  // Wait for window.services to be available
  const initApp = () => {
    if (!window.services) {
      setTimeout(initApp, 100); // Try again in 100ms
      return;
    }

    // Initialize modules once services are available
    window.utils = Utils;
    window.settings = new Settings();
    window.upload = new Upload();
    window.ocr = new OCR();
    window.translate = new Translate();
    window.ui = new UI();
    
    // Load initial settings
    window.settings.loadSettings();
    
    // 处理可能在初始化前接收到的图片
    if (window._pendingImageData && window.ocr) {
      console.log('Processing pending image data');
      window.ocr.processImage(window._pendingImageData);
      window._pendingImageData = null;
    }
  };

  initApp();
}); 