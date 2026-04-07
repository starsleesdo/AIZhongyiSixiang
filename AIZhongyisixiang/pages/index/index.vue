<template>
  <view class="page">
    <view class="top-row">
      <view class="brand">
        <view class="brand-logo">QH</view>
        <text class="brand-text">AI中医四象合参</text>
      </view>
      <view class="actions">
        <text class="user-text">{{ displayName }}</text>
        <text class="settings" @click="goSettings">⚙</text>
      </view>
    </view>

    <view class="welcome card">
      <text class="welcome-title">下午好，{{ displayName }}</text>
      <text class="welcome-subtitle">基于中医四诊合参，AI智能分析您的健康状态</text>
    </view>

    <view class="grid">
      <view class="grid-item card" @click="goToReport">
        <view class="grid-icon green">诊</view>
        <text class="grid-title">健康测评</text>
        <text class="grid-subtitle">舌诊 / 问诊 / 五运六气</text>
      </view>
      <view class="grid-item card" @click="goToReport">
        <view class="grid-icon gold">报</view>
        <text class="grid-title">我的报告</text>
        <text class="grid-subtitle">查看历史健康报告</text>
      </view>
    </view>

    <button class="start-btn" :loading="loading" @click="startAssessment">
      {{ loading ? "AI 合参中..." : "开始健康测评" }}
    </button>

    <view class="desc card">
      <text class="desc-title">服务号测评说明</text>
      <view class="desc-row">
        <text class="desc-no no1">1</text>
        <text class="desc-text">舌诊 - 拍摄舌面/舌底照片，AI智能分析舌象</text>
      </view>
      <view class="desc-row">
        <text class="desc-no no2">2</text>
        <text class="desc-text">问诊 - 通过智能问卷采集症状与体征信息</text>
      </view>
      <view class="desc-row">
        <text class="desc-no no3">3</text>
        <text class="desc-text">五运六气 - 基于出生时辰推算运气养生方案</text>
      </view>
    </view>
  </view>
</template>

<script>
import { generateReport, getAuthUser, getCurrentProvider } from "../../common/api";
import { prependHistory } from "../../common/report-store";

export default {
  data() {
    return {
      loading: false,
      displayName: "用户3968"
    };
  },
  onShow() {
    const authUser = getAuthUser();
    this.displayName = (authUser && authUser.name) || "用户3968";
  },
  methods: {
    goSettings() {
      uni.navigateTo({ url: "/pages/settings/index" });
    },
    goToReport() {
      uni.switchTab({ url: "/pages/report/index" });
    },
    async startAssessment() {
      if (this.loading) return;
      this.loading = true;
      uni.switchTab({ url: "/pages/report/index" });
      try {
        const authUser = getAuthUser();
        const data = await generateReport({
          provider: getCurrentProvider(),
          profile: {
            account: authUser && authUser.account,
            phone: authUser && authUser.phone,
            name: (authUser && authUser.name) || "用户3968",
            gender: (authUser && authUser.gender) || "男",
            age: (authUser && authUser.age) || 26
          },
          inquiryAnswers: [
            "最近易疲劳，饭后腹胀",
            "睡眠偏浅，怕冷",
            "偶有四肢发凉"
          ]
        });
        const report = prependHistory(data.report || data);
        uni.$emit("report-updated", report);
        uni.showToast({ title: "测评完成", icon: "success" });
      } catch (error) {
        uni.showToast({
          title: (error && error.message) || "测评失败",
          icon: "none"
        });
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 22rpx 26rpx 40rpx;
  background: #f3f4f2;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.03);
}

.top-row {
  margin-top: var(--status-bar-height);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
}

.brand-logo {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  background: #2c7148;
  color: #fff;
  line-height: 56rpx;
  text-align: center;
  font-size: 24rpx;
  margin-right: 14rpx;
}

.brand-text {
  font-size: 40rpx;
  font-weight: 700;
  color: #235538;
}

.actions {
  display: flex;
  align-items: center;
  color: #616661;
}

.user-text {
  font-size: 28rpx;
}

.settings {
  margin-left: 12rpx;
  font-size: 34rpx;
}

.welcome {
  margin-top: 26rpx;
}

.welcome-title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
}

.welcome-subtitle {
  margin-top: 12rpx;
  display: block;
  color: #7a817c;
  font-size: 26rpx;
}

.grid {
  margin-top: 26rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
}

.grid-item {
  text-align: center;
}

.grid-icon {
  width: 72rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 20rpx;
  margin: 0 auto 16rpx;
  color: #fff;
  font-size: 38rpx;
}

.green {
  background: #2c7148;
}

.gold {
  background: #d6b66f;
}

.grid-title {
  display: block;
  font-size: 38rpx;
  font-weight: 600;
}

.grid-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #7a817c;
}

.start-btn {
  margin-top: 28rpx;
  background: #2c7148;
  color: #fff;
  border-radius: 999rpx;
  font-size: 36rpx;
  height: 88rpx;
  line-height: 88rpx;
}

.desc {
  margin-top: 30rpx;
}

.desc-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
}

.desc-row {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
}

.desc-no {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  line-height: 36rpx;
  text-align: center;
  font-size: 22rpx;
  margin-right: 14rpx;
}

.no1 {
  color: #c68b74;
  background: #f9ede8;
}

.no2 {
  color: #aa965f;
  background: #f8f2e1;
}

.no3 {
  color: #4a8456;
  background: #eaf4ec;
}

.desc-text {
  font-size: 25rpx;
  color: #6f7770;
}
</style>
