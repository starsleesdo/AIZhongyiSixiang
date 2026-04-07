<template>
  <view class="page">
    <view class="header">
      <text class="title">分享 App</text>
      <text class="subtitle">邀请家人朋友一起做中医智能测评</text>
    </view>

    <view class="card">
      <text class="card-title">分享方式</text>
      <view class="share-grid">
        <view class="share-item" @click="copyLink">
          <text class="icon">链</text>
          <text class="label">复制链接</text>
        </view>
        <view class="share-item" @click="shareText">
          <text class="icon">文</text>
          <text class="label">复制文案</text>
        </view>
        <view class="share-item" @click="savePoster">
          <text class="icon">海</text>
          <text class="label">保存海报</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">推荐文案</text>
      <text class="copy-text">{{ recommendation }}</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      appLink: "https://example.com/ai-zhongyi-sixiang",
      recommendation:
        "我在用 AI中医四象合参 做舌诊、问诊、脉诊和五运六气分析，还能生成风险评估与调理方案，推荐你也试试。"
    };
  },
  methods: {
    copyToClipboard(text, successTitle) {
      uni.setClipboardData({
        data: text,
        success: () => {
          uni.showToast({ title: successTitle, icon: "success" });
        }
      });
    },
    copyLink() {
      this.copyToClipboard(this.appLink, "链接已复制");
    },
    shareText() {
      this.copyToClipboard(this.recommendation, "文案已复制");
    },
    savePoster() {
      uni.showToast({ title: "海报功能可继续扩展", icon: "none" });
    }
  }
};
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #eff7f0, #f6f7f4 28%);
  padding: calc(var(--status-bar-height) + 16rpx) 20rpx 20rpx;
}

.header {
  margin-bottom: 16rpx;
}

.title {
  display: block;
  font-size: 42rpx;
  font-weight: 700;
  color: #205338;
}

.subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #667066;
}

.card {
  margin-top: 14rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 22rpx;
}

.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #203126;
}

.share-grid {
  margin-top: 16rpx;
  display: grid;
  gap: 12rpx;
  grid-template-columns: repeat(3, 1fr);
}

.share-item {
  border-radius: 14rpx;
  background: #f4f8f4;
  padding: 20rpx 10rpx;
  text-align: center;
}

.icon {
  width: 56rpx;
  height: 56rpx;
  line-height: 56rpx;
  display: inline-block;
  border-radius: 50%;
  background: #2c7148;
  color: #fff;
  font-size: 24rpx;
}

.label {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #364436;
}

.copy-text {
  margin-top: 12rpx;
  display: block;
  color: #4d584d;
  line-height: 1.7;
  font-size: 26rpx;
}
</style>
