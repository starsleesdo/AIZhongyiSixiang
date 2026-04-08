<template>
  <view class="page">
    <view class="header">
      <text class="title">我的</text>
      <text v-if="loggedIn" class="api-btn" @click="goSettings">API</text>
      <text v-else class="settings-placeholder"></text>
    </view>

    <view v-if="!loggedIn" class="card">
      <text class="section-title">请先登录</text>
      <text class="meta">登录后可查看你的历史测评报告与健康记录。</text>
      <view class="login-row">
        <button class="login-btn" @click="goLogin">登录</button>
        <button class="register-btn" @click="goRegister">注册</button>
      </view>
    </view>

    <template v-else>
      <view class="profile card">
        <view class="avatar">{{ avatarText }}</view>
        <view class="profile-info">
          <text class="name">{{ profileName }}</text>
          <text class="meta">账号：{{ user.account }}</text>
          <text class="meta">手机号：{{ user.phone }}</text>
          <text class="meta">最新测评日期：{{ latestDate || "-" }}</text>
        </view>
      </view>

      <view class="card">
        <text class="section-title">快捷入口</text>
        <view class="menu-item" @click="goLatestReport">
          <text>查看最新报告</text>
          <text class="arrow">></text>
        </view>
        <view class="menu-item" @click="goSettings">
          <text>模型 API 设置</text>
          <text class="arrow">></text>
        </view>
      </view>

      <view class="card">
        <text class="section-title">历史测评列表</text>
        <view v-if="groupedHistory.length === 0" class="empty">暂无测评记录</view>
        <view v-for="group in groupedHistory" :key="group.period" class="group">
          <text class="group-title">{{ group.period }}</text>
          <view
            v-for="item in group.items"
            :key="item.id"
            class="history-item"
            @click="openDetail(item.id)"
          >
            <view>
              <text class="item-date">{{ item.createdAt }}</text>
              <text class="item-desc">{{ item.constitution.mainType }} · 综合评分 {{ item.score }}</text>
            </view>
            <text class="arrow">></text>
          </view>
        </view>
      </view>

      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </template>
  </view>
</template>

<script>
import {
  getAuthUser,
  getUserReports,
  logoutUser,
  clearAuthSession
} from "../../common/api";
import { getLatestReport, saveReportHistory } from "../../common/report-store";

export default {
  data() {
    return {
      loggedIn: false,
      user: null,
      latestDate: "",
      history: []
    };
  },
  computed: {
    profileName() {
      return (this.user && this.user.name) || "未登录用户";
    },
    avatarText() {
      const name = this.profileName;
      return name ? name.slice(-2) : "U";
    },
    groupedHistory() {
      const map = {};
      this.history.forEach((item) => {
        const period = String(item.createdAt || "").slice(0, 7) || "未分组";
        if (!map[period]) {
          map[period] = [];
        }
        map[period].push(item);
      });
      return Object.keys(map)
        .sort((a, b) => b.localeCompare(a))
        .map((period) => ({ period, items: map[period] }));
    }
  },
  onShow() {
    this.refresh();
  },
  methods: {
    async refresh() {
      const user = getAuthUser();
      if (!user) {
        this.loggedIn = false;
        this.user = null;
        this.latestDate = "";
        this.history = [];
        return;
      }
      this.loggedIn = true;
      this.user = user;
      await this.loadReports();
    },
    async loadReports() {
      try {
        const data = await getUserReports();
        const reports = data.reports || [];
        this.latestDate = data.latestAssessmentDate || (reports[0] && reports[0].createdAt) || "";
        this.history = reports;
        saveReportHistory(reports);
      } catch (err) {
        clearAuthSession();
        this.loggedIn = false;
        this.user = null;
        this.history = [];
        this.latestDate = "";
        uni.showToast({ title: "登录已失效，请重新登录", icon: "none" });
      }
    },
    goSettings() {
      uni.navigateTo({ url: "/pages/settings/index" });
    },
    goLogin() {
      uni.navigateTo({ url: "/pages/auth/login" });
    },
    goRegister() {
      uni.navigateTo({ url: "/pages/auth/register" });
    },
    goLatestReport() {
      const fromRemote = Array.isArray(this.history) && this.history.length ? this.history[0] : null;
      const latest = fromRemote || getLatestReport();
      if (latest && latest.id) {
        this.openDetail(latest.id);
        return;
      }
      uni.switchTab({ url: "/pages/report/index" });
    },
    openDetail(id) {
      uni.navigateTo({ url: `/pages/report/detail?id=${encodeURIComponent(id)}` });
    },
    async handleLogout() {
      await logoutUser();
      this.loggedIn = false;
      this.user = null;
      this.history = [];
      this.latestDate = "";
      uni.showToast({ title: "已退出登录", icon: "success" });
    }
  }
};
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #fff9e8;
  padding: calc(var(--status-bar-height) + 16rpx) 20rpx 20rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 44rpx;
  font-weight: 700;
  color: #5b33cc;
}

.api-btn {
  min-width: 76rpx;
  height: 48rpx;
  line-height: 48rpx;
  text-align: center;
  border-radius: 999rpx;
  border: 1px solid #e1ceff;
  color: #5b33cc;
  background: rgba(255, 255, 255, 0.92);
  font-size: 22rpx;
  padding: 0 14rpx;
}

.settings-placeholder {
  width: 76rpx;
  height: 48rpx;
}

.card {
  margin-top: 18rpx;
  padding: 22rpx;
  border-radius: 20rpx;
  background: #fff;
}

.profile {
  display: flex;
  align-items: center;
}

.avatar {
  width: 92rpx;
  height: 92rpx;
  border-radius: 50%;
  background: #7c4dff;
  color: #fff;
  line-height: 92rpx;
  text-align: center;
  font-size: 26rpx;
  font-weight: 700;
}

.profile-info {
  margin-left: 18rpx;
}

.name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
}

.meta {
  display: block;
  margin-top: 8rpx;
  color: #667066;
  font-size: 24rpx;
}

.login-row {
  margin-top: 20rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.login-btn,
.register-btn {
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.login-btn {
  background: #7c4dff;
  color: #fff;
}

.register-btn {
  background: #fff;
  color: #7c4dff;
  border: 1px solid #ceb5ff;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
}

.menu-item {
  margin-top: 12rpx;
  padding: 14rpx 0;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #eadbff;
  font-size: 28rpx;
  color: #313a31;
}

.menu-item:last-child {
  border-bottom: none;
}

.arrow {
  color: #95a194;
}

.group {
  margin-top: 12rpx;
}

.group-title {
  display: block;
  font-size: 24rpx;
  color: #6f7a70;
}

.history-item {
  margin-top: 10rpx;
  padding: 14rpx 0;
  border-bottom: 1px solid #eadbff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-item:last-child {
  border-bottom: none;
}

.item-date {
  display: block;
  font-size: 26rpx;
  color: #1f2a1e;
}

.item-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 24rpx;
  color: #5d685d;
}

.empty {
  margin-top: 12rpx;
  font-size: 26rpx;
  display: block;
  color: #768176;
}

.logout-btn {
  margin-top: 24rpx;
  background: #fff;
  color: #b3261e;
  border: 1px solid #f0c3bf;
  border-radius: 12rpx;
  height: 84rpx;
  line-height: 84rpx;
  font-size: 30rpx;
}
</style>
