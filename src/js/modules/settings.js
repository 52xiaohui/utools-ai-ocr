// 设置相关功能
export class Settings {
  constructor() {
    this.settingsModal = document.getElementById('settingsModal');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.closeSettings = document.getElementById('closeSettings');
    this.saveSettings = document.getElementById('saveSettings');
    this.apiToken = document.getElementById('apiToken');
    this.deeplxUrl = document.getElementById('deeplxUrl');
    
    // 添加节流控制标志
    this.isUpdatingModels = false;
    this.lastModelUpdate = 0;
    
    this.initEventListeners();
  }

  initEventListeners() {
    // 打开设置面板
    this.settingsBtn.addEventListener('click', () => {
      this.loadSettings();
      this.settingsModal.classList.add('show');
    });

    // 关闭设置面板
    this.closeSettings.addEventListener('click', () => {
      this.settingsModal.classList.remove('show');
    });

    // 点击遮罩层关闭
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.settingsModal.classList.remove('show');
      }
    });

    // 保存设置
    this.saveSettings.addEventListener('click', () => this.saveSettingsToStorage());

    // 翻译服务切换监听
    document.querySelectorAll('input[name="translateService"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.updateTranslateSettings(e.target.value);
      });
    });

    // OCR服务切换监听
    document.querySelectorAll('input[name="ocrService"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.updateOcrSettings(e.target.value);
      });
    });
  }

  loadSettings() {
    const settings = window.services.getSettings();
    if (settings) {
      // API Token设置
      if (this.apiToken) {
        this.apiToken.value = settings.tokens?.join(',') || '';
      }
      
      // DeepLX设置
      if (this.deeplxUrl) {
        this.deeplxUrl.value = settings.deeplxUrl || '';
      }
      
      // 翻译服务设置
      const translateService = settings.translateService || 'deeplx';
      const radioButton = document.querySelector(`input[name="translateService"][value="${translateService}"]`);
      if (radioButton) {
        radioButton.checked = true;
        this.updateTranslateSettings(translateService);
      }
      
      // OpenAI翻译设置
      const openaiKey = document.getElementById('openaiKey');
      const openaiBaseUrl = document.getElementById('openaiBaseUrl');
      const openaiModel = document.getElementById('openaiModel');
      
      if (openaiKey) openaiKey.value = settings.openaiKey || '';
      if (openaiBaseUrl) openaiBaseUrl.value = settings.openaiBaseUrl || '';
      if (openaiModel) openaiModel.value = settings.openaiModel || '';
      
      // OCR服务设置
      const ocrService = settings.ocrService || 'qwen';
      const ocrRadio = document.querySelector(`input[name="ocrService"][value="${ocrService}"]`);
      if (ocrRadio) {
        ocrRadio.checked = true;
        setTimeout(() => this.updateOcrSettings(ocrService), 0);
      }
      
      // OpenAI OCR设置
      const openaiOcrKey = document.getElementById('openaiOcrKey');
      const openaiOcrBaseUrl = document.getElementById('openaiOcrBaseUrl');
      const openaiOcrModel = document.getElementById('openaiOcrModel');
      const openaiOcrTemperature = document.getElementById('openaiOcrTemperature');
      
      if (openaiOcrKey) openaiOcrKey.value = settings.openaiOcrKey || '';
      if (openaiOcrBaseUrl) openaiOcrBaseUrl.value = settings.openaiOcrBaseUrl || '';
      if (openaiOcrModel) openaiOcrModel.value = settings.openaiOcrModel || 'gpt-4-vision-preview';
      if (openaiOcrTemperature) openaiOcrTemperature.value = settings.openaiOcrTemperature || 0.7;
      
      // 更新模型选择
      this.updateModelSelect().catch(console.error);
    }
  }

  saveSettingsToStorage() {
    const settings = {
      tokens: this.apiToken?.value.trim().split(',').map(t => t.trim()).filter(t => t) || [],
      deeplxUrl: this.deeplxUrl?.value.trim() || '',
      openaiKey: document.getElementById('openaiKey')?.value.trim() || '',
      openaiBaseUrl: document.getElementById('openaiBaseUrl')?.value.trim() || '',
      openaiModel: document.getElementById('openaiModel')?.value.trim() || '',
      translateService: document.querySelector('input[name="translateService"]:checked')?.value || 'deeplx',
      targetLang: window.currentLang,
      model: document.getElementById('modelSelect')?.value || 'qwen2.5-vl-72b-instruct',
      ocrService: document.querySelector('input[name="ocrService"]:checked')?.value || 'qwen',
      openaiOcrKey: document.getElementById('openaiOcrKey')?.value.trim() || '',
      openaiOcrBaseUrl: document.getElementById('openaiOcrBaseUrl')?.value.trim() || '',
      openaiOcrModel: document.getElementById('openaiOcrModel')?.value.trim() || 'gpt-4-vision-preview',
      openaiOcrTemperature: parseFloat(document.getElementById('openaiOcrTemperature')?.value || '0.7')
    };
    
    window.services.saveSettings(settings);
    this.settingsModal.classList.remove('show');
    window.utils.showToast('设置已保存', 'success');
  }

  updateTranslateSettings(service) {
    document.querySelector('.deeplx-setting').style.display = 
      service === 'deeplx' ? 'block' : 'none';
    document.querySelector('.openai-setting').style.display = 
      service === 'openai' ? 'block' : 'none';
  }

  updateOcrSettings(service) {
    // 更新OCR设置显示
    const qwenSetting = document.querySelector('.qwen-setting');
    const openaiSetting = document.querySelector('.openai-ocr-setting');
    
    if (qwenSetting) {
      qwenSetting.style.display = service === 'qwen' ? 'block' : 'none';
    }
    
    if (openaiSetting) {
      openaiSetting.style.display = service === 'openai' ? 'block' : 'none';
    }
  }

  async updateModelSelect() {
    const modelSelect = document.getElementById('modelSelect');
    const token = window.services.getRandomToken();
    const now = Date.now();
    
    // 如果正在更新或者距离上次更新不到30秒，则跳过
    if (this.isUpdatingModels || (now - this.lastModelUpdate < 30000)) {
        return;
    }
    
    if (!token) {
        modelSelect.innerHTML = '<option value="">请先设置 API Token</option>';
        modelSelect.disabled = true;
        return;
    }
    
    try {
        this.isUpdatingModels = true;
        modelSelect.disabled = true;
        modelSelect.innerHTML = '<option value="">加载中...</option>';
        
        const models = await this.fetchModels(token);
        
        if (!models.length) {
            throw new Error('没有找到可用的视觉模型');
        }
        
        const settings = window.services.getSettings();
        const currentModel = settings.model || 'qwen2.5-vl-72b-instruct';
        
        modelSelect.innerHTML = models.map(model => `
            <option value="${model.id}" ${model.id === currentModel ? 'selected' : ''}>
                ${model.name} - ${model.info.meta.short_description}
            </option>
        `).join('');
        
        this.lastModelUpdate = now;
    } catch (error) {
        console.error('更新模型列表失败:', error);
        modelSelect.innerHTML = `<option value="qwen2.5-vl-72b-instruct">
            Qwen2.5-VL-72B-Instruct - Smart large vision-language model
        </option>`;
        window.utils.showToast(`获取模型列表失败: ${error.message}`, 'error');
    } finally {
        this.isUpdatingModels = false;
        modelSelect.disabled = false;
    }
  }

  async fetchModels(token) {
    const response = await fetch('https://chat.qwenlm.ai/api/models', {
      headers: {
        'authorization': `Bearer ${token}`,
      }
    });
    
    if (!response.ok) throw new Error('获取模型列表失败');
    
    const data = await response.json();
    return data.data.filter(model => model.info?.meta?.capabilities?.vision === true);
  }
} 