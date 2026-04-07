<template>
  <view class="page">
    <view class="nav">
      <text class="back" @click="goBack">返回</text>
      <text class="title">测评详情</text>
      <text class="placeholder">  </text>
    </view>

    <view class="hero">
      <view class="hero-top">
        <text class="hero-title">AI 四诊合参 · 药食同源健康报告</text>
        <text class="settings" @click="goSettings">⚙</text>
      </view>

      <view class="hero-body">
        <view>
          <text class="name">{{ report.userName }}</text>
          <text class="meta">{{ report.gender }} / {{ report.age }}岁</text>
          <text class="meta">测评日期：{{ report.createdAt }}</text>
          <text class="meta">报告编号：{{ report.id }}</text>
        </view>
        <view class="score-circle">
          <text class="score">{{ report.score }}</text>
          <text class="score-label">综合评分</text>
        </view>
      </view>
    </view>

    <scroll-view class="section-tabs" scroll-x>
      <view
        v-for="item in sections"
        :key="item.key"
        class="tab-item"
        :class="{ active: activeSection === item.key }"
        @click="activeSection = item.key"
      >
        {{ item.label }}
      </view>
    </scroll-view>

    <view class="content card" v-if="activeSection === 'constitution'">
      <text class="content-title">体质辨识结果</text>
      <view class="tag-row">
        <text class="main-type">{{ report.constitution.mainType }}</text>
        <text class="tag">主要体质</text>
      </view>
      <view class="tag-row">
        <text class="sub-type">{{ report.constitution.secondType }}</text>
        <text class="tag">兼夹体质</text>
      </view>
      <text class="paragraph">{{ report.constitution.conclusion }}</text>
      <text class="sub-title">九型体质评估</text>
      <view v-for="item in report.constitution.bars" :key="item.label" class="bar-row">
        <text class="bar-label">{{ item.label }}</text>
        <view class="bar-track">
          <view
            class="bar-fill"
            :class="{ gold: item.highlight }"
            :style="{ width: item.value + '%' }"
          />
        </view>
        <text class="bar-value">{{ item.value }}%</text>
      </view>
    </view>

    <view class="content card" v-if="activeSection === 'tongue'">
      <text class="content-title">舌象分析</text>
      <text class="paragraph">{{ report.tongue.summary }}</text>
      <view class="tongue-row">
        <view class="tongue-item">
          <view class="tongue-placeholder">舌面图像</view>
          <text class="tongue-label">舌面</text>
        </view>
        <view class="tongue-item">
          <view class="tongue-placeholder">舌下图像</view>
          <text class="tongue-label">舌下</text>
        </view>
      </view>
      <view class="warn-box">
        <text class="warn-title">异常项目</text>
        <text v-for="(item, idx) in report.tongue.findings" :key="idx" class="warn-item">
          • {{ item }}
        </text>
      </view>
    </view>

    <view class="content card" v-if="activeSection === 'pulse'">
      <text class="content-title">脉诊分析</text>
      <text class="paragraph">{{ report.pulse.summary }}</text>
    </view>

    <view class="content card" v-if="activeSection === 'inquiry'">
      <text class="content-title">问诊分析</text>
      <text class="paragraph">{{ report.inquiry.summary }}</text>
    </view>

    <view class="content card" v-if="activeSection === 'climate'">
      <text class="content-title">五运六气分析</text>
      <text class="paragraph">{{ report.climate.summary }}</text>
    </view>

    <view class="content card" v-if="activeSection === 'risk'">
      <text class="content-title">风险评估</text>
      <view class="risk-level">{{ report.risk.level }}</view>
      <text v-for="(item, idx) in report.risk.items" :key="idx" class="risk-item">
        • {{ item }}
      </text>
    </view>

    <view class="content card" v-if="activeSection === 'plan'">
      <text class="content-title">调理方案</text>
      <text class="plan-item">饮食建议：{{ report.plan.diet }}</text>
      <text class="plan-item">作息建议：{{ report.plan.routine }}</text>
      <text class="plan-item">方药建议：{{ report.plan.medicine }}</text>
    </view>
  </view>
</template>

<script>
import { getLatestReport, getReportById } from "../../common/report-store";

export default {
  data() {
    return {
      activeSection: "tongue",
      sections: [
        { key: "tongue", label: "舌诊" },
        { key: "pulse", label: "脉诊" },
        { key: "inquiry", label: "问诊" },
        { key: "climate", label: "五运六气" },
        { key: "risk", label: "风险评估" },
        { key: "plan", label: "调理方案" },
        { key: "constitution", label: "健康总览" }
      ],
      report: getLatestReport()
    };
  },
  onLoad(query) {
    const id = query && query.id;
    this.report = getReportById(id) || getLatestReport();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    goSettings() {
      uni.navigateTo({ url: "/pages/settings/index" });
    }
  }
};
</script>

<style lang="scss" scoped>
.page {
  background: #f4f5f2;
  min-height: 100vh;
  padding-bottom: 36rpx;
}

.nav {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: calc(var(--status-bar-height) + 10rpx) 20rpx 14rpx;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back,
.title {
  font-size: 28rpx;
  color: #1f2a1e;
}

.title {
  font-weight: 700;
}

.placeholder {
  width: 70rpx;
}

.hero {
  background: radial-gradient(circle at 80% 0%, #3f8c5c, #245d40);
  padding: 24rpx;
  color: #fff;
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-title {
  font-size: 24rpx;
  opacity: 0.95;
}

.settings {
  font-size: 34rpx;
}

.hero-body {
  margin-top: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
}

.meta {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  opacity: 0.9;
}

.score-circle {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score {
  font-size: 56rpx;
  font-weight: 700;
}

.score-label {
  font-size: 22rpx;
}

.section-tabs {
  white-space: nowrap;
  background: #fff;
  border-bottom: 1px solid #eef0ec;
}

.tab-item {
  display: inline-block;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #6f766f;
}

.active {
  color: #23573a;
  font-weight: 700;
  border-bottom: 4rpx solid #2c7148;
}

.card {
  margin: 18rpx 18rpx 0;
  background: #fff;
  border-radius: 22rpx;
  padding: 24rpx;
}

.content-title {
  font-size: 42rpx;
  font-weight: 700;
  color: #1f2a1e;
  display: block;
}

.tag-row {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.main-type,
.sub-type {
  font-size: 46rpx;
  font-weight: 700;
  color: #2b633e;
}

.tag {
  font-size: 22rpx;
  color: #7b7f74;
  background: #f1f3ed;
  border-radius: 10rpx;
  padding: 6rpx 12rpx;
}

.paragraph {
  margin-top: 14rpx;
  display: block;
  font-size: 26rpx;
  color: #4e554e;
  line-height: 1.7;
}

.sub-title {
  margin-top: 20rpx;
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}

.bar-row {
  display: flex;
  align-items: center;
  margin-top: 14rpx;
}

.bar-label {
  width: 110rpx;
  font-size: 24rpx;
  color: #495149;
}

.bar-track {
  flex: 1;
  height: 20rpx;
  border-radius: 999rpx;
  background: #edf1ec;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999rpx;
  background: #2c7148;
}

.bar-fill.gold {
  background: #d2b271;
}

.bar-value {
  width: 88rpx;
  text-align: right;
  font-size: 24rpx;
  color: #465046;
}

.tongue-row {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.tongue-item {
  text-align: center;
}

.tongue-placeholder {
  height: 220rpx;
  border-radius: 18rpx;
  background: linear-gradient(150deg, #f2d0d0, #e6b4b4);
  color: #8f4c4c;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tongue-label {
  margin-top: 8rpx;
  display: block;
  color: #676f67;
  font-size: 24rpx;
}

.warn-box {
  margin-top: 20rpx;
  border: 1px dashed #e3c9c9;
  border-radius: 16rpx;
  padding: 16rpx;
}

.warn-title {
  display: block;
  color: #aa5858;
  font-size: 26rpx;
  font-weight: 700;
}

.warn-item,
.risk-item,
.plan-item {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #4c554d;
  line-height: 1.7;
}

.risk-level {
  margin-top: 14rpx;
  color: #2c7148;
  font-size: 34rpx;
  font-weight: 700;
}
</style>
