<template>
  <view class="page">
    <view class="card">
      <text class="title">用户注册</text>
      <input v-model="form.account" class="input" placeholder="账号" />
      <input v-model="form.phone" class="input" placeholder="手机号" />
      <input v-model="form.name" class="input" placeholder="姓名" />
      <input v-model="form.password" class="input" password placeholder="密码" />
      <view class="grid">
        <input v-model="form.gender" class="input" placeholder="性别(男/女)" />
        <input v-model="form.age" class="input" type="number" placeholder="年龄" />
      </view>
      <button class="main-btn" :loading="loading" @click="handleRegister">
        {{ loading ? "注册中..." : "注册并登录" }}
      </button>
      <view class="row">
        <text class="muted">已有账号？</text>
        <text class="link" @click="goLogin">去登录</text>
      </view>
    </view>
  </view>
</template>

<script>
import { registerUser } from "../../common/api";

export default {
  data() {
    return {
      loading: false,
      form: {
        account: "",
        phone: "",
        name: "",
        password: "",
        gender: "男",
        age: "26"
      }
    };
  },
  methods: {
    goLogin() {
      uni.navigateTo({ url: "/pages/auth/login" });
    },
    async handleRegister() {
      if (this.loading) return;
      const p = this.form;
      if (!p.account.trim() || !p.phone.trim() || !p.name.trim() || !p.password.trim()) {
        uni.showToast({ title: "请填写完整信息", icon: "none" });
        return;
      }
      this.loading = true;
      try {
        await registerUser({
          account: p.account.trim(),
          phone: p.phone.trim(),
          name: p.name.trim(),
          password: p.password,
          gender: p.gender.trim() || "男",
          age: Number(p.age) || 26
        });
        uni.showToast({ title: "注册成功", icon: "success" });
        setTimeout(() => {
          uni.switchTab({ url: "/pages/user/index" });
        }, 300);
      } catch (err) {
        uni.showToast({ title: (err && err.message) || "注册失败", icon: "none" });
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

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10rpx;
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
