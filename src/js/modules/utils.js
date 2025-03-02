// 工具函数
export class Utils {
  static showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  static initMathJax() {
    if (typeof MathJax === 'undefined') {
        console.error('MathJax not loaded');
        return false;
    }

    try {
        // 确保MathJax已经完全加载
        if (!MathJax.typesetPromise) {
            console.log('等待MathJax初始化...');
            return false;
        }

        return true;
    } catch (error) {
        console.error('MathJax初始化失败:', error);
        return false;
    }
  }
} 