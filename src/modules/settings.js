export class Settings {
    constructor() {
        this.settings = {}; // 存储设置
        this.defaultSettings = {
            ocrService: 'qwen',
            apiToken: '',
            qwenModel: 'qwen2.5-vl-72b-instruct',
            openaiOcrBaseUrl: 'https://api.openai.com/v1',
            openaiOcrKey: '',
            openaiOcrModel: 'gpt-4-vision-preview',
            openaiOcrTemperature: 0.7,
            translateService: 'deeplx',
            deeplxUrl: 'https://api.deeplx.org/translate',
            openaiBaseUrl: 'https://api.openai.com/v1',
            openaiKey: '',
            openaiModel: 'gpt-4o-mini'
        };
        
        // 绑定设置相关按钮
        this.bindSettingsButtons();
    }
    
    // 绑定设置相关按钮
    bindSettingsButtons() {
        // 设置按钮
        const settingsBtn = document.getElementById('settingsBtn');
        const closeSettingsBtn = document.getElementById('closeSettings');
        const saveSettingsBtn = document.getElementById('saveSettings');
        const settingsModal = document.getElementById('settingsModal');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettingsModal();
            });
        }
        
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                settingsModal.classList.remove('show');
            });
        }
        
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettingsFromForm();
                settingsModal.classList.remove('show');
            });
        }
        
        // OCR服务选择
        const ocrServiceRadios = document.querySelectorAll('input[name="ocrService"]');
        ocrServiceRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.toggleOcrSettings(radio.value);
            });
        });
        
        // 翻译服务选择
        const translateServiceRadios = document.querySelectorAll('input[name="translateService"]');
        translateServiceRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.toggleTranslateSettings(radio.value);
            });
        });
    }
    
    // 切换OCR设置显示
    toggleOcrSettings(service) {
        const qwenSetting = document.querySelector('.qwen-setting');
        const openaiSetting = document.querySelector('.openai-ocr-setting');
        
        if (service === 'qwen') {
            qwenSetting.style.display = 'block';
            openaiSetting.style.display = 'none';
        } else {
            qwenSetting.style.display = 'none';
            openaiSetting.style.display = 'block';
        }
    }
    
    // 切换翻译设置显示
    toggleTranslateSettings(service) {
        const deeplxSetting = document.querySelector('.deeplx-setting');
        const openaiSetting = document.querySelector('.openai-setting');
        
        if (service === 'deeplx') {
            deeplxSetting.style.display = 'block';
            openaiSetting.style.display = 'none';
        } else {
            deeplxSetting.style.display = 'none';
            openaiSetting.style.display = 'block';
        }
    }
    
    // 打开设置模态框
    openSettingsModal() {
        // 填充设置表单
        this.fillSettingsForm();
        
        // 显示模态框
        const settingsModal = document.getElementById('settingsModal');
        settingsModal.classList.add('show');
    }
    
    // 填充设置表单
    fillSettingsForm() {
        const settings = this.getSettings();
        
        // OCR服务
        const ocrServiceRadios = document.querySelectorAll('input[name="ocrService"]');
        ocrServiceRadios.forEach(radio => {
            radio.checked = radio.value === settings.ocrService;
        });
        
        // 通义千问设置
        document.getElementById('apiToken').value = settings.apiToken || '';
        const modelSelect = document.getElementById('modelSelect');
        if (modelSelect) {
            // 清空现有选项
            modelSelect.innerHTML = '';
            
            // 添加模型选项
            const models = [
                { value: 'qwen2.5-vl-72b-instruct', text: 'Qwen2.5-VL-72B-Instruct (推荐)' },
                { value: 'qwen2.5-vl-7b-instruct', text: 'Qwen2.5-VL-7B-Instruct' }
            ];
            
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.text;
                option.selected = model.value === settings.qwenModel;
                modelSelect.appendChild(option);
            });
        }
        
        // OpenAI OCR设置
        document.getElementById('openaiOcrBaseUrl').value = settings.openaiOcrBaseUrl || '';
        document.getElementById('openaiOcrKey').value = settings.openaiOcrKey || '';
        document.getElementById('openaiOcrModel').value = settings.openaiOcrModel || '';
        document.getElementById('openaiOcrTemperature').value = settings.openaiOcrTemperature || 0.7;
        
        // 翻译服务
        const translateServiceRadios = document.querySelectorAll('input[name="translateService"]');
        translateServiceRadios.forEach(radio => {
            radio.checked = radio.value === settings.translateService;
        });
        
        // DeepLX设置
        document.getElementById('deeplxUrl').value = settings.deeplxUrl || '';
        
        // OpenAI翻译设置
        document.getElementById('openaiBaseUrl').value = settings.openaiBaseUrl || '';
        document.getElementById('openaiKey').value = settings.openaiKey || '';
        document.getElementById('openaiModel').value = settings.openaiModel || '';
        
        // 切换设置显示
        this.toggleOcrSettings(settings.ocrService);
        this.toggleTranslateSettings(settings.translateService);
    }
    
    // 从表单保存设置
    saveSettingsFromForm() {
        const settings = {};
        
        // OCR服务
        settings.ocrService = document.querySelector('input[name="ocrService"]:checked').value;
        
        // 通义千问设置
        settings.apiToken = document.getElementById('apiToken').value;
        settings.qwenModel = document.getElementById('modelSelect').value;
        
        // OpenAI OCR设置
        settings.openaiOcrBaseUrl = document.getElementById('openaiOcrBaseUrl').value;
        settings.openaiOcrKey = document.getElementById('openaiOcrKey').value;
        settings.openaiOcrModel = document.getElementById('openaiOcrModel').value;
        settings.openaiOcrTemperature = document.getElementById('openaiOcrTemperature').value;
        
        // 翻译服务
        settings.translateService = document.querySelector('input[name="translateService"]:checked').value;
        
        // DeepLX设置
        settings.deeplxUrl = document.getElementById('deeplxUrl').value;
        
        // OpenAI翻译设置
        settings.openaiBaseUrl = document.getElementById('openaiBaseUrl').value;
        settings.openaiKey = document.getElementById('openaiKey').value;
        settings.openaiModel = document.getElementById('openaiModel').value;
        
        // 保存设置
        this.saveSettings(settings);
        
        // 显示保存成功提示
        if (window.ui && window.ui.showToast) {
            window.ui.showToast('设置已保存', 'success');
        }
    }
    
    // 获取设置
    getSettings() {
        return { ...this.defaultSettings, ...this.settings };
    }
    
    // 保存设置
    saveSettings(settings) {
        this.settings = settings;
        
        // 保存到localStorage或uTools
        if (window.utools && window.utools.dbStorage) {
            window.utools.dbStorage.setItem('qwen-ocr-settings', settings);
        } else {
            localStorage.setItem('qwen-ocr-settings', JSON.stringify(settings));
        }
    }
    
    // 加载设置
    loadSettings() {
        try {
            let loadedSettings = null;
            
            // 从localStorage或uTools加载
            if (window.utools && window.utools.dbStorage) {
                loadedSettings = window.utools.dbStorage.getItem('qwen-ocr-settings');
            } else {
                const settingsStr = localStorage.getItem('qwen-ocr-settings');
                if (settingsStr) {
                    loadedSettings = JSON.parse(settingsStr);
                }
            }
            
            if (loadedSettings) {
                this.settings = loadedSettings;
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }
}
