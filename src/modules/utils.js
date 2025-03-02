export const Utils = {
    /**
     * 显示Toast通知
     * @param {string} message 通知消息
     * @param {string} type 通知类型 (success, error, info)
     */
    showToast(message, type = 'info') {
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
    },
    
    /**
     * 生成随机ID
     * @returns {string} 随机ID
     */
    generateId() {
        return Math.random().toString(36).substring(2, 10);
    },
    
    /**
     * 复制文本到剪贴板
     * @param {string} text 要复制的文本
     * @returns {Promise} 复制操作的Promise
     */
    copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            if (window.utools && window.utools.copyText) {
                // 使用uTools的API
                window.utools.copyText(text);
                resolve(true);
            } else {
                // 使用Web API
                navigator.clipboard.writeText(text)
                    .then(() => resolve(true))
                    .catch(err => reject(err));
            }
        });
    },
    
    /**
     * 检测是否为uTools环境
     * @returns {boolean} 是否为uTools环境
     */
    isUTools() {
        return typeof window.utools !== 'undefined';
    },
    
    /**
     * 格式化日期
     * @param {Date} date 日期对象
     * @param {string} format 格式字符串，如 'YYYY-MM-DD HH:mm:ss'
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        const pad = (num) => String(num).padStart(2, '0');
        
        return format
            .replace('YYYY', date.getFullYear())
            .replace('MM', pad(date.getMonth() + 1))
            .replace('DD', pad(date.getDate()))
            .replace('HH', pad(date.getHours()))
            .replace('mm', pad(date.getMinutes()))
            .replace('ss', pad(date.getSeconds()));
    },
    
    /**
     * 检测字符串是否包含Markdown格式
     * @param {string} text 要检测的文本
     * @returns {boolean} 是否包含Markdown格式
     */
    containsMarkdown(text) {
        if (!text) return false;
        
        const markdownPatterns = [
            /^#+\s+/m,           // 标题
            /\*\*.+?\*\*/,       // 粗体
            /\*.+?\*/,           // 斜体
            /\[.+?\]\(.+?\)/,    // 链接
            /^\s*[-*+]\s+/m,     // 列表项
            /^\s*\d+\.\s+/m,     // 有序列表项
            /^```[\s\S]*?```/m,  // 代码块
            /`[^`]+`/,           // 行内代码
            /!\[.+?\]\(.+?\)/,   // 图片
            /^>\s+/m,            // 引用
            /\|.+\|.+\|/,        // 表格
            /^-{3,}/m,           // 水平分割线
            /^={3,}/m            // 水平分割线
        ];
        
        return markdownPatterns.some(pattern => pattern.test(text));
    }
};
