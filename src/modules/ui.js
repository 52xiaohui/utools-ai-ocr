export class UI {
    constructor() {
        this.editBtn = document.getElementById('editBtn');
        this.result = document.getElementById('result');
        this.resultEditor = document.getElementById('resultEditor');
        
        this.setupEventListeners();
        this.setupResponsiveUI();
        
        // 用于保存原始的Markdown内容
        this.originalMarkdown = '';
    }

    setupEventListeners() {
        // 编辑按钮处理
        if (this.editBtn) {
            this.editBtn.addEventListener('click', () => this.toggleEditMode());
        }
        
        // 编辑器内容变更处理
        if (this.resultEditor) {
            this.resultEditor.addEventListener('input', () => {
                this.resizeEditor();
            });
        }
    }

    setupResponsiveUI() {
        // 监听窗口大小变化，调整UI元素
        window.addEventListener('resize', () => {
            this.adjustDropdownMenus();
            this.resizeEditor();
        });

        // 初始调整
        this.adjustDropdownMenus();
        
        // uTools特定处理
        if (window.utools) {
            // 监听uTools窗口变化
            window.utools.onPluginEnter(({ code, type, payload }) => {
                console.log('Plugin entered:', code, type, payload);
                // 处理从其他地方进入的情况
                if (type === 'over' && payload) {
                    // 处理覆盖模式下的图片数据
                    if (window.processPluginImage) {
                        window.processPluginImage(payload);
                    }
                }
            });
        }
    }

    // 调整下拉菜单的显示位置
    adjustDropdownMenus() {
        const dropdownMenus = document.querySelectorAll('.dropdown-menu.show');
        dropdownMenus.forEach(menu => {
            const rect = menu.getBoundingClientRect();
            const buttonRect = menu.previousElementSibling.getBoundingClientRect();
            const spaceAbove = buttonRect.top;
            const spaceBelow = window.innerHeight - buttonRect.bottom;
            
            if (spaceAbove < rect.height && spaceBelow > rect.height) {
                // 如果上方空间不足但下方空间足够，改为向下弹出
                menu.classList.add('dropdown-up');
            } else {
                // 否则默认向上弹出
                menu.classList.remove('dropdown-up');
            }
        });
    }

    // 切换编辑模式
    toggleEditMode() {
        if (!this.result || !this.resultEditor) return;
        
        const isEditing = this.resultEditor.style.display !== 'none';
        
        if (isEditing) {
            // 从编辑模式切换到显示模式
            const content = this.resultEditor.value;
            
            // 保存原始Markdown内容
            this.originalMarkdown = content;
            
            // 判断是否包含Markdown格式
            const containsMarkdown = window.utils && window.utils.containsMarkdown ? 
                window.utils.containsMarkdown(content) : 
                this.detectMarkdown(content);
            
            if (containsMarkdown && window.markdownParser) {
                // 使用Markdown渲染
                this.result.classList.add('markdown-content');
                this.result.innerHTML = window.markdownParser.parse(content);
                
                // 如果有MathJax，重新渲染公式
                if (window.MathJax) {
                    try {
                        window.MathJax.typeset([this.result]);
                    } catch (error) {
                        console.error('MathJax渲染失败:', error);
                    }
                }
            } else {
                // 纯文本显示
                this.result.classList.remove('markdown-content');
                this.result.textContent = content;
            }
            
            this.result.style.display = 'block';
            this.resultEditor.style.display = 'none';
            this.editBtn.title = '编辑';
        } else {
            // 从显示模式切换到编辑模式
            if (this.originalMarkdown && this.result.classList.contains('markdown-content')) {
                // 使用保存的原始Markdown
                this.resultEditor.value = this.originalMarkdown;
            } else {
                // 使用当前文本内容
                this.resultEditor.value = this.result.textContent;
            }
            
            this.result.style.display = 'none';
            this.resultEditor.style.display = 'block';
            this.editBtn.title = '完成';
            
            // 自适应高度
            this.resizeEditor();
            // 聚焦编辑器
            this.resultEditor.focus();
        }
    }
    
    // 从渲染后的HTML提取原始Markdown
    extractMarkdownSource() {
        // 这里简化处理，实际情况可能需要更复杂的逻辑
        return this.result.textContent;
    }
    
    // 检测文本是否包含Markdown格式
    detectMarkdown(text) {
        if (!text) return false;
        
        // 简单检测一些常见的Markdown语法
        const markdownPatterns = [
            /^#+\s+/m,           // 标题
            /\*\*.+?\*\*/,       // 粗体
            /\*.+?\*/,           // 斜体
            /\[.+?\]\(.+?\)/,    // 链接
            /^\s*[-*+]\s+/m,     // 列表项
            /^\s*\d+\.\s+/m      // 有序列表项
        ];
        
        return markdownPatterns.some(pattern => pattern.test(text));
    }

    // 自适应编辑器高度
    resizeEditor() {
        if (!this.resultEditor) return;
        
        this.resultEditor.style.height = 'auto';
        this.resultEditor.style.height = this.resultEditor.scrollHeight + 'px';
    }

    // 显示Toast通知
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
}
