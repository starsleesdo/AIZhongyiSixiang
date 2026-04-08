<template>
  <view class="page">
    <view class="card">
      <text class="title">后端服务地址</text>
      <input v-model="backendBaseUrl" class="input" placeholder="例如: http://127.0.0.1:3000" />
      <text class="tip">前端会通过该地址调用 AI 合参后端接口。</text>
    </view>

    <view class="card">
      <text class="title">模型提供商</text>
      <picker :range="providerLabels" @change="onProviderPick">
        <view class="picker">{{ providerLabels[selectedProviderIndex] }}</view>
      </picker>

      <text class="label">模型接口地址</text>
      <input v-model="form.baseUrl" class="input" placeholder="OpenAI 兼容接口地址" />

      <text class="label">模型名称</text>
      <input v-model="form.model" class="input" placeholder="例如 deepseek-chat" />

      <text class="label">接口密钥</text>
      <input
        v-model="form.apiKey"
        class="input"
        :password="!showKey"
        placeholder="请输入接口密钥"
      />
      <view class="row">
        <switch :checked="showKey" @change="onToggleKeyVisible" />
        <text class="row-label">显示接口密钥</text>
      </view>
      <text class="tip">你可以配置 DeepSeek、OpenAI、Qwen、GLM 或自定义兼容接口。</text>
    </view>

      <button class="save-btn" :loading="saving" @click="saveAll">
        {{ saving ? "保存中..." : "保存配置" }}
      </button>
      <button class="test-btn" @click="refreshProviders">刷新后端配置</button>
  </view>
</template>

<script>
import {
  getBaseUrl,
  getCurrentProvider,
  getProviders,
  saveProviderConfig,
  setBaseUrl,
  setCurrentProvider
} from "../../common/api";

const PROVIDERS = ["deepseek", "openai", "qwen", "glm", "custom"];

export default {
  data() {
    return {
      backendBaseUrl: getBaseUrl(),
      selectedProvider: getCurrentProvider(),
      providerLabels: [
        "DeepSeek",
        "OpenAI",
        "Qwen(通义)",
        "GLM(智谱)",
        "自定义"
      ],
      providerConfigs: {},
      selectedProviderIndex: 0,
      form: {
        baseUrl: "",
        model: "",
        apiKey: ""
      },
      showKey: false,
      saving: false
    };
  },
  onLoad() {
    this.selectedProviderIndex = Math.max(PROVIDERS.indexOf(this.selectedProvider), 0);
    this.refreshProviders();
  },
  methods: {
    onToggleKeyVisible(e) {
      this.showKey = !!e.detail.value;
    },
    onProviderPick(e) {
      this.selectedProviderIndex = Number(e.detail.value);
      this.selectedProvider = PROVIDERS[this.selectedProviderIndex];
      this.fillFormFromProvider();
    },
    fillFormFromProvider() {
      const hit = this.providerConfigs[this.selectedProvider] || {};
      this.form.baseUrl = hit.baseUrl || "";
      this.form.model = hit.model || "";
      this.form.apiKey = "";
    },
    async refreshProviders() {
      try {
        const data = await getProviders();
        this.providerConfigs = (data && data.providers) || {};
        this.fillFormFromProvider();
      } catch (err) {
        uni.showToast({
          title: (err && err.message) || "无法连接后端",
          icon: "none"
        });
      }
    },
    async saveAll() {
      if (this.saving) return;
      this.saving = true;
      try {
        setBaseUrl(this.backendBaseUrl.trim());
        setCurrentProvider(this.selectedProvider);
        await saveProviderConfig({
          provider: this.selectedProvider,
          baseUrl: this.form.baseUrl.trim(),
          model: this.form.model.trim(),
          apiKey: this.form.apiKey.trim()
        });
        uni.showToast({ title: "配置已保存", icon: "success" });
        this.refreshProviders();
      } catch (err) {
        uni.showToast({
          title: (err && err.message) || "保存失败",
          icon: "none"
        });
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #fff9e8;
  padding: 20rpx;
}

.card {
  margin-bottom: 16rpx;
  border-radius: 20rpx;
  background: #fff;
  padding: 22rpx;
}

.title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2a1e;
}

.label {
  margin-top: 16rpx;
  display: block;
  font-size: 26rpx;
  color: #3d463d;
}

.input,
.picker {
  margin-top: 10rpx;
  border: 1px solid #e1ceff;
  border-radius: 12rpx;
  min-height: 78rpx;
  padding: 0 18rpx;
  line-height: 78rpx;
  font-size: 26rpx;
  background: #eefbe8;
  color: #2d3a2f;
}

.tip {
  margin-top: 10rpx;
  display: block;
  font-size: 22rpx;
  color: #7a827a;
}

.row {
  margin-top: 12rpx;
  display: flex;
  align-items: center;
}

.row-label {
  margin-left: 10rpx;
  font-size: 24rpx;
  color: #5d665d;
}

.save-btn,
.test-btn {
  margin-top: 14rpx;
  border-radius: 12rpx;
  height: 84rpx;
  line-height: 84rpx;
  font-size: 30rpx;
}

.save-btn {
  background: #7c4dff;
  color: #fff;
}

.test-btn {
  background: #fff;
  color: #7c4dff;
  border: 1px solid #ceb5ff;
}
</style>



