<template>
  <view class="page">
    <view class="nav">
      <text class="back" @click="goBack">返回</text>
      <text class="title">测评详情</text>
      <text class="export-nav" @click="exportPdf">{{ exportingPdf ? "导出中" : "导出JPG" }}</text>
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

    <button class="export-btn" :loading="exportingPdf" @click="exportPdf">
      {{ exportingPdf ? "正在导出..." : "保存报告图片到相册" }}
    </button>

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
          <image
            v-if="report.tongue.faceImage"
            class="tongue-image"
            :src="report.tongue.faceImage"
            mode="aspectFill"
          />
          <view v-else class="tongue-placeholder">舌面图像</view>
          <text class="tongue-label">舌面</text>
        </view>
        <view class="tongue-item">
          <image
            v-if="report.tongue.underImage"
            class="tongue-image"
            :src="report.tongue.underImage"
            mode="aspectFill"
          />
          <view v-else class="tongue-placeholder">舌下图像</view>
          <text class="tongue-label">舌下</text>
        </view>
      </view>
      <view class="warn-box">
        <text class="warn-title">舌诊分析</text>
        <text class="analysis-text">{{ report.tongue.analysis }}</text>
      </view>
    </view>

    <view class="content card" v-if="activeSection === 'pulse'">
      <text class="content-title">脉诊分析</text>
      <text class="paragraph">{{ report.pulse.summary }}</text>
      <view class="warn-box">
        <text class="warn-title">脉诊结果</text>
        <text class="analysis-text">{{ report.pulse.analysis }}</text>
      </view>
    </view>

    <view class="content card" v-if="activeSection === 'inquiry'">
      <text class="content-title">问诊分析</text>
      <view class="inquiry-list">
        <view v-for="item in inquiryItems" :key="item.key" class="inquiry-row">
          <text class="inquiry-label">{{ item.title }}</text>
          <text class="inquiry-answer">{{ item.answer }}</text>
        </view>
      </view>
      <view class="warn-box">
        <text class="warn-title">问诊总结</text>
        <text class="analysis-text">{{ report.inquiry.summary }}</text>
      </view>
    </view>

    <view class="content card" v-if="activeSection === 'climate'">
      <text class="content-title">五运六气分析</text>
      <text class="paragraph">{{ report.climate.summary }}</text>
      <view class="warn-box">
        <text class="warn-title">岁运解读结果</text>
        <text class="analysis-text">{{ report.climate.analysis }}</text>
      </view>
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

    <canvas canvas-id="pdfCanvas" class="pdf-canvas" />
  </view>
</template>

<script>
import { getLatestReport, getReportById } from "../../common/report-store";
import { buildTongueAnalysis } from "../../common/tongue-analysis";
import { buildPulseAnalysis, parsePressureSignal } from "../../common/pulse-analysis";
import { buildWuYunLiuQiAnalysis } from "../../common/wuyunliuqi-analysis";
import {
  buildInquiryDisplayItems,
  buildInquirySummary,
  normalizeInquiryAnswers
} from "../../common/inquiry-schema";

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
      report: getLatestReport(),
      exportingPdf: false
    };
  },
  computed: {
    inquiryItems() {
      return buildInquiryDisplayItems((this.report.inquiry && this.report.inquiry.answers) || {});
    }
  },
  onLoad(query) {
    const id = query && query.id;
    this.report = getReportById(id) || getLatestReport();
    this.ensureInquiryData();
    this.ensureTongueAnalysis();
    this.ensurePulseAnalysis();
    this.ensureClimateAnalysis();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    goSettings() {
      uni.navigateTo({ url: "/pages/settings/index" });
    },
    ensureInquiryData() {
      if (!this.report.inquiry) {
        this.$set(this.report, "inquiry", {});
      }
      const answers = normalizeInquiryAnswers(this.report.inquiry.answers || {});
      this.$set(this.report.inquiry, "answers", answers);
      this.$set(this.report.inquiry, "summary", buildInquirySummary(answers));
    },
    ensureTongueAnalysis() {
      if (!this.report) return;
      if (!this.report.tongue) {
        this.$set(this.report, "tongue", {});
      }
      const result = buildTongueAnalysis(this.report.tongue);
      this.$set(this.report.tongue, "traits", result.traits);
      this.$set(this.report.tongue, "analysis", result.text);
    },
    ensurePulseAnalysis() {
      if (!this.report) return;
      if (!this.report.pulse) {
        this.$set(this.report, "pulse", {});
      }
      const frequency = this.report.pulse.frequency;
      const signal = parsePressureSignal(this.report.pulse.pressureSignal);
      const result = buildPulseAnalysis({
        frequency,
        pressureSignal: signal
      });
      const safeFrequency = Number.isFinite(Number(frequency)) ? Number(frequency) : null;
      const summaryFrequency = safeFrequency == null ? "未填写" : `${String(safeFrequency)} 次/分钟`;
      this.$set(this.report.pulse, "types", result.types);
      this.$set(this.report.pulse, "analysis", result.text);
      this.$set(
        this.report.pulse,
        "summary",
        "已分析脉搏频率：" +
          summaryFrequency +
          "；判定脉象：" +
          (result.types.length ? result.types.join("、") : "平脉") +
          "。"
      );
    },
    ensureClimateAnalysis() {
      if (!this.report) return;
      if (!this.report.climate) {
        this.$set(this.report, "climate", {});
      }
      const hasAnalysis = Boolean(this.report.climate.analysis && String(this.report.climate.analysis).trim());
      if (
        !hasAnalysis &&
        this.report.climate.birthYear &&
        this.report.climate.birthMonth &&
        this.report.climate.birthDay &&
        this.report.climate.birthHour
      ) {
        const result = buildWuYunLiuQiAnalysis({
          birthYear: this.report.climate.birthYear,
          birthMonth: this.report.climate.birthMonth,
          birthDay: this.report.climate.birthDay,
          birthHour: this.report.climate.birthHour
        });
        if (result.ok) {
          this.$set(this.report.climate, "analysis", result.text);
          if (!this.report.climate.summary) {
            this.$set(this.report.climate, "summary", `当前${result.currentYear}年，已生成五运六气提醒。`);
          }
        }
      }
    },
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    withTimeout(promise, timeoutMs, timeoutMessage) {
      return new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(new Error(timeoutMessage || "操作超时"));
        }, timeoutMs);
        Promise.resolve(promise)
          .then((value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            resolve(value);
          })
          .catch((err) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            reject(err);
          });
      });
    },
    showExportLoading(title) {
      uni.showLoading({
        title: String(title || "正在导出"),
        mask: true
      });
    },
    wrapCanvasText(ctx, text, maxWidth) {
      const content = String(text || "");
      if (!content) return [""];
      const lines = [];
      let current = "";
      const chars = Array.from(content);
      chars.forEach((char) => {
        const next = current + char;
        if (ctx.measureText(next).width > maxWidth && current) {
          lines.push(current);
          current = char;
        } else {
          current = next;
        }
      });
      if (current) lines.push(current);
      return lines.length ? lines : [""];
    },
    drawCanvasAsync(ctx) {
      return this.withTimeout(
        new Promise((resolve) => {
          ctx.draw(false, () => resolve());
        }),
        20000,
        "画布渲染超时"
      );
    },
    canvasToJpg(width, height) {
      const convertOnce = () =>
        this.withTimeout(
          new Promise((resolve, reject) => {
            uni.canvasToTempFilePath(
              {
                canvasId: "pdfCanvas",
                fileType: "jpg",
                quality: 0.95,
                width,
                height,
                destWidth: width,
                destHeight: height,
                success: (res) => resolve(res.tempFilePath),
                fail: reject
              },
              this
            );
          }),
          20000,
          "导出图片超时"
        );
      return convertOnce().catch(async () => {
        await this.sleep(120);
        return convertOnce();
      });
    },
    getImageInfoSafe(src) {
      if (!src) return Promise.resolve(null);
      return this.withTimeout(
        new Promise((resolve) => {
          uni.getImageInfo({
            src,
            success: (res) => resolve(res),
            fail: () => resolve(null)
          });
        }),
        10000,
        "读取图片信息超时"
      ).catch(() => null);
    },
    async renderSectionToImage(section, index, total) {
      this.showExportLoading(`渲染页面 ${index + 1}/${total}`);
      const width = 1120;
      const estimatedHeight = Math.max(
        1300,
        Math.min(2600, 320 + section.lines.length * 44 + (section.images || []).length * 520)
      );
      const height = estimatedHeight;
      const maxTextWidth = width - 120;
      const ctx = uni.createCanvasContext("pdfCanvas", this);

      ctx.setFillStyle("#ffffff");
      ctx.fillRect(0, 0, width, height);
      let y = 90;

      ctx.setFillStyle("#7c4dff");
      ctx.setFontSize(40);
      ctx.fillText("AI中医四象合参报告", 60, y);
      y += 60;

      ctx.setFillStyle("#555");
      ctx.setFontSize(24);
      ctx.fillText(`报告编号：${this.report.id}`, 60, y);
      y += 40;
      ctx.fillText(`导出时间：${new Date().toLocaleString()}`, 60, y);
      y += 60;

      ctx.setFillStyle("#1f2a1e");
      ctx.setFontSize(34);
      ctx.fillText(section.title, 60, y);
      y += 52;

      ctx.setFillStyle("#3f4a40");
      ctx.setFontSize(26);
      section.lines.forEach((line) => {
        const wrapped = this.wrapCanvasText(ctx, line, maxTextWidth);
        wrapped.forEach((row) => {
          ctx.fillText(row, 60, y);
          y += 38;
        });
        y += 8;
      });

      for (let i = 0; i < (section.images || []).length; i += 1) {
        const imageItem = section.images[i];
        const imageInfo = await this.getImageInfoSafe(imageItem.src);
        ctx.setFillStyle("#666");
        ctx.setFontSize(24);
        ctx.fillText(imageItem.label, 60, y);
        y += 34;
        if (!imageInfo) {
          ctx.setFillStyle("#b3261e");
          ctx.fillText("图片加载失败", 60, y);
          y += 42;
          continue;
        }
        const maxImageWidth = width - 140;
        const maxImageHeight = 420;
        const ratio = Math.min(maxImageWidth / imageInfo.width, maxImageHeight / imageInfo.height);
        const drawW = Math.round(imageInfo.width * ratio);
        const drawH = Math.round(imageInfo.height * ratio);
        ctx.drawImage(imageItem.src, 60, y, drawW, drawH);
        y += drawH + 24;
      }

      await this.drawCanvasAsync(ctx);
      return this.canvasToJpg(width, height);
    },
    buildExportSections() {
      const inquiryLines = this.inquiryItems.map((item) => `${item.title}：${item.answer}`);
      const bars = (this.report.constitution && this.report.constitution.bars) || [];
      const tongueImages = [];
      if (this.report.tongue && this.report.tongue.faceImage) {
        tongueImages.push({ label: "舌面图像", src: this.report.tongue.faceImage });
      }
      if (this.report.tongue && this.report.tongue.underImage) {
        tongueImages.push({ label: "舌下图像", src: this.report.tongue.underImage });
      }

      return [
        {
          title: "基础信息",
          lines: [
            `姓名：${this.report.userName}`,
            `性别/年龄：${this.report.gender} / ${this.report.age}岁`,
            `测评日期：${this.report.createdAt}`,
            `综合评分：${this.report.score}`
          ],
          images: []
        },
        {
          title: "健康总览",
          lines: [
            `主要体质：${this.report.constitution.mainType}`,
            `兼夹体质：${this.report.constitution.secondType}`,
            `结论：${this.report.constitution.conclusion}`,
            ...bars.map((item) => `${item.label}：${item.value}%`)
          ],
          images: []
        },
        {
          title: "舌诊",
          lines: [
            `概述：${this.report.tongue.summary}`,
            "分析结果：",
            ...String(this.report.tongue.analysis || "").split("\n").filter(Boolean)
          ],
          images: tongueImages
        },
        {
          title: "脉诊",
          lines: [
            `概述：${this.report.pulse.summary}`,
            "分析结果：",
            ...String(this.report.pulse.analysis || "").split("\n").filter(Boolean)
          ],
          images: []
        },
        {
          title: "问诊",
          lines: [...inquiryLines, `总结：${this.report.inquiry.summary}`],
          images: []
        },
        {
          title: "五运六气",
          lines: [
            `概述：${this.report.climate.summary}`,
            ...String(this.report.climate.analysis || "").split("\n").filter(Boolean)
          ],
          images: []
        },
        {
          title: "风险评估与调理方案",
          lines: [
            `风险等级：${this.report.risk.level}`,
            ...((this.report.risk && this.report.risk.items) || []).map((item) => `- ${item}`),
            `饮食建议：${this.report.plan.diet}`,
            `作息建议：${this.report.plan.routine}`,
            `方药建议：${this.report.plan.medicine}`
          ],
          images: []
        }
      ];
    },
    saveImageByUni(filePath) {
      return this.withTimeout(
        new Promise((resolve, reject) => {
          uni.saveImageToPhotosAlbum({
            filePath,
            success: () => resolve(),
            fail: reject
          });
        }),
        15000,
        "保存图片到相册超时"
      );
    },
    saveImageByPlusGallery(filePath) {
      // #ifdef APP-PLUS
      return this.withTimeout(
        new Promise((resolve, reject) => {
          if (typeof plus === "undefined" || !plus.gallery || !plus.gallery.save) {
            reject(new Error("plus.gallery 不可用"));
            return;
          }
          plus.gallery.save(
            filePath,
            () => resolve(),
            (err) => reject(err || new Error("保存到系统相册失败"))
          );
        }),
        15000,
        "保存图片到相册超时"
      );
      // #endif
      // #ifndef APP-PLUS
      return Promise.reject(new Error("当前平台不支持 plus.gallery"));
      // #endif
    },
    async saveImageToAlbum(filePath) {
      try {
        await this.saveImageByUni(filePath);
      } catch (error) {
        // 在 App 端尝试使用 plus.gallery 作为兜底，提升兼容性
        await this.saveImageByPlusGallery(filePath);
      }
    },
    async exportPdf() {
      if (this.exportingPdf) return;
      // #ifdef APP-PLUS
      this.exportingPdf = true;
      try {
        this.showExportLoading("准备导出...");
        const sections = this.buildExportSections();
        let savedCount = 0;
        for (let i = 0; i < sections.length; i += 1) {
          const tempPath = await this.renderSectionToImage(sections[i], i, sections.length);
          await this.saveImageToAlbum(tempPath);
          savedCount += 1;
        }
        uni.hideLoading();
        uni.showModal({
          title: "保存成功",
          content: `已保存 ${savedCount} 张报告图片到系统相册`,
          showCancel: false
        });
      } catch (error) {
        console.error("export images failed:", error);
        uni.hideLoading();
        const msg = String((error && (error.errMsg || error.message)) || "");
        if (msg.includes("auth deny") || msg.includes("authorize")) {
          uni.showModal({
            title: "无相册权限",
            content: "请在系统设置中允许应用访问相册后重试。",
            showCancel: false
          });
        } else {
          uni.showToast({
            title: "保存失败，请检查相册权限",
            icon: "none"
          });
        }
      } finally {
        uni.hideLoading();
        this.exportingPdf = false;
      }
      // #endif
      // #ifndef APP-PLUS
      uni.showToast({ title: "请在手机App端使用该功能", icon: "none" });
      // #endif
    }
  }
};
</script>

<style lang="scss" scoped>
.page {
  background: #fff9e8;
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

.export-nav {
  min-width: 110rpx;
  text-align: right;
  font-size: 24rpx;
  color: #7c4dff;
}

.hero {
  background: radial-gradient(circle at 80% 0%, #8b6bff, #5b33cc);
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

.export-btn {
  margin: 16rpx 18rpx 0;
  background: #7c4dff;
  color: #fff;
  border-radius: 12rpx;
  height: 78rpx;
  line-height: 78rpx;
  font-size: 28rpx;
}

.section-tabs {
  white-space: nowrap;
  background: #fff;
  border-bottom: 1px solid #eadbff;
  margin-top: 16rpx;
}

.tab-item {
  display: inline-block;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  color: #6f766f;
}

.active {
  color: #5b33cc;
  font-weight: 700;
  border-bottom: 4rpx solid #7c4dff;
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
  color: #5b33cc;
}

.tag {
  font-size: 22rpx;
  color: #7b7f74;
  background: #fff3c9;
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
  background: #f1e8ff;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 999rpx;
  background: #7c4dff;
}

.bar-fill.gold {
  background: #ffe3a0;
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

.tongue-image {
  width: 100%;
  height: 320rpx;
  border-radius: 18rpx;
  display: block;
}

.tongue-placeholder {
  height: 320rpx;
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

.inquiry-list {
  margin-top: 14rpx;
  border: 1px solid #eadbff;
  border-radius: 14rpx;
  overflow: hidden;
}

.inquiry-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 18rpx;
  border-bottom: 1px solid #f0e8ff;
}

.inquiry-row:last-child {
  border-bottom: none;
}

.inquiry-label {
  color: #485348;
  font-size: 24rpx;
}

.inquiry-answer {
  color: #5b33cc;
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

.risk-item,
.plan-item {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #4c554d;
  line-height: 1.7;
}

.analysis-text {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  color: #424b43;
  line-height: 1.7;
  white-space: pre-line;
}

.risk-level {
  margin-top: 14rpx;
  color: #7c4dff;
  font-size: 34rpx;
  font-weight: 700;
}

.pdf-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 1120px;
  height: 2600px;
  opacity: 0;
}
</style>

