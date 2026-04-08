<script>
export default {
  data() {
    return {
      bootFixed: false
    };
  },
  onLaunch() {
    this.ensureAppReady();
  },
  onShow() {
    this.ensureAppReady();
  },
  methods: {
    ensureAppReady() {
      if (this.bootFixed) return;
      this.bootFixed = true;
      // #ifdef APP-PLUS
      setTimeout(() => {
        try {
          if (typeof plus !== "undefined" && plus.navigator) {
            plus.navigator.closeSplashscreen();
          }
        } catch (e) {}
        try {
          const pages = getCurrentPages();
          if (!pages || pages.length === 0) {
            uni.reLaunch({ url: "/pages/index/index" });
          }
        } catch (e) {}
      }, 300);
      // #endif
    }
  }
}
</script>

<style lang="scss">
page {
  background: #fff9e8;
  color: #1f2a1e;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}
</style>
