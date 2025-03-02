export class Upload {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.uploadContent = document.getElementById('uploadContent');
        this.previewImage = document.getElementById('previewImage');
        
        this.setupEventListeners();
        
        // 初始化时确保UI状态正确
        this.reset();
    }
    
    setupEventListeners() {
        if (!this.uploadArea || !this.uploadContent) {
            console.error('Upload area elements not found');
            return;
        }
        
        // 拖放事件
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        
        // 点击上传
        this.uploadContent.addEventListener('click', () => this.triggerFileInput());
        
        // 粘贴事件
        document.addEventListener('paste', (e) => this.handlePaste(e));
    }
    
    triggerFileInput() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = (e) => this.handleFileSelect(e);
        fileInput.click();
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('drag-over');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('drag-over');
    }
    
    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('drag-over');
        
        const dt = e.dataTransfer;
        if (dt.files && dt.files[0]) {
            this.processFile(dt.files[0]);
        }
    }
    
    handleFileSelect(e) {
        if (e.target.files && e.target.files[0]) {
            this.processFile(e.target.files[0]);
        }
    }
    
    handlePaste(e) {
        if (e.clipboardData && e.clipboardData.items) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    this.processFile(file);
                    break;
                }
            }
        }
    }
    
    processFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            console.error('Invalid file type. Please select an image.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.showPreview(e.target.result);
            
            // 调用OCR处理
            if (window.ocr && typeof window.ocr.processImage === 'function') {
                window.ocr.processImage(e.target.result);
            } else {
                console.error('OCR module not ready');
            }
        };
        reader.readAsDataURL(file);
    }
    
    showPreview(imageData) {
        if (!imageData || !this.previewImage || !this.uploadContent) {
            console.error('Missing required elements for preview');
            return;
        }
        
        // 先清除之前的图片
        this.previewImage.src = '';
        
        // 设置新图片
        this.previewImage.onload = () => {
            this.uploadContent.classList.add('hide');
            this.previewImage.classList.add('show');
        };
        
        this.previewImage.onerror = (error) => {
            console.error('Failed to load image:', error);
            this.reset();
            if (window.utils && window.utils.showToast) {
                window.utils.showToast('图片加载失败', 'error');
            }
        };
        
        // 设置图片源
        this.previewImage.src = imageData;
    }
    
    reset() {
        if (!this.previewImage || !this.uploadContent) return;
        
        // 重置图片
        this.previewImage.src = '';
        this.previewImage.classList.remove('show');
        
        // 显示上传区域
        this.uploadContent.classList.remove('hide');
    }
}
