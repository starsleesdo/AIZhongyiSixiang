<template>
  <view class="page">
    <view class="card">
      <text class="title">用户登录</text>
      <input v-model="form.accountOrPhone" class="input" placeholder="账号或手机号" />
      <input v-model="form.password" class="input" password placeholder="密码" />
      <button class="main-btn" :loading="loading" @click="handleLogin">
        {{ loading ? "登录中..." : "登录" }}
      </button>
      <view class="row">
        <text class="muted">还没有账号？</text>
        <text class="link" @click="goRegister">去注册</text>
      </view>
    </view>
  </view>
</template>

<script>
import { loginUser } from "../../common/api";

export default {
  data() {
    return {
      loading: false,
      form: {
        accountOrPhone: "",
        password: ""
      }
    };
  },
  methods: {
    goRegister() {
      uni.navigateTo({ url: "/pages/auth/register" });
    },
    async handleLogin() {
      if (this.loading) return;
      if (!this.form.accountOrPhone.trim() || !this.form.password.trim()) {
        uni.showToast({ title: "请输入账号和密码", icon: "none" });
        return;
      }
      this.loading = true;
      try {
        await loginUser({
          accountOrPhone: this.form.accountOrPhone.trim(),
          password: this.form.password
        });
        uni.showToast({ title: "登录成功", icon: "success" });
        setTimeout(() => {
          uni.switchTab({ url: "/pages/user/index" });
        }, 300);
      } catch (err) {
        uni.showToast({ title: (err && err.message) || "登录失败", icon: "none" });
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
  background: #f4f6f2;
  padding: 24rpx;
}

.card {
  margin-top: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}

.title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  margin-bottom: 14rpx;
}

.input {
  border: 1px solid #d4dfd4;
  border-radius: 12rpx;
  min-height: 82rpx;
  padding: 0 16rpx;
  margin-top: 12rpx;
  font-size: 28rpx;
}

.main-btn {
  margin-top: 20rpx;
  background: #2c7148;
  color: #fff;
  border-radius: 12rpx;
  height: 84rpx;
  line-height: 84rpx;
  font-size: 30rpx;
}

.row {
  margin-top: 16rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8rpx;
}

.muted {
  color: #778177;
  font-size: 24rpx;
}

.link {
  color: #2c7148;
  font-size: 24rpx;
}
</style>
