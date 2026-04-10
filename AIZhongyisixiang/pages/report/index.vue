<template>
  <view class="page">
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
        <view class="tongue-item" @click="openTongueImagePicker('surface')">
          <image
            v-if="report.tongue.faceImage"
            class="tongue-image"
            :src="report.tongue.faceImage"
            mode="aspectFill"
          />
          <view v-else class="tongue-placeholder">舌面图像</view>
          <text class="tongue-tip">点击拍照或从相册选择</text>
          <text class="tongue-label">舌面</text>
        </view>
        <view class="tongue-item" @click="openTongueImagePicker('under')">
          <image
            v-if="report.tongue.underImage"
            class="tongue-image"
            :src="report.tongue.underImage"
            mode="aspectFill"
          />
          <view v-else class="tongue-placeholder">舌下图像</view>
          <text class="tongue-tip">点击拍照或从相册选择</text>
          <text class="tongue-label">舌下</text>
        </view>
      </view>
      <view class="warn-box">
        <text class="warn-title">舌诊分析</text>
        <text class="analysis-text">{{ report.tongue.analysis }}</text>
      </view>
    </view>

    <view class="content card" v-if="activeSection === 'inquiry'">
      <text class="content-title">问诊分析</text>
      <view v-for="item in inquiryQuestions" :key="item.key" class="inquiry-block">
        <text class="inquiry-title">{{ item.title }}</text>
        <radio-group @change="onInquiryOptionChange($event, item.key)">
          <label v-for="opt in item.options" :key="opt.code" class="inquiry-option">
            <radio
              :value="opt.label"
              :checked="getInquiryAnswerValue(item.key) === opt.label"
              color="#7c4dff"
            />
            <text class="inquiry-option-text">{{ opt.code }}. {{ opt.label }}</text>
          </label>
        </radio-group>
      </view>
      <view class="warn-box">
        <text class="warn-title">问诊总结</text>
        <text class="analysis-text">{{ report.inquiry.summary }}</text>
      </view>
    </view>

    <view class="content card" v-if="activeSection === 'pulse'">
      <text class="content-title">脉诊分析</text>
      <text class="paragraph">{{ report.pulse.summary }}</text>

      <view class="pulse-inputs">
        <view class="input-group">
          <text class="input-label">频率值（bpm）</text>
          <input class="input-field" type="number" v-model="pulseForm.frequency" placeholder="例如 78" />
        </view>
        <view class="input-group">
          <text class="input-label">压力信号（逗号分隔）</text>
          <textarea class="signal-field" v-model="pulseForm.signalText" placeholder="例如 0.32,0.55,0.88,0.61..." />
        </view>
        <view class="pulse-actions">
          <button class="pulse-btn" @click="runPulseAnalysisFromInput">解析脉象</button>
          <button class="pulse-btn light" @click="mockPulseSample">示例数据</button>
        </view>
      </view>

      <view class="warn-box">
        <text class="warn-title">脉诊结果</text>
        <text class="analysis-text">{{ report.pulse.analysis }}</text>
      </view>
    </view>

    <view class="content card" v-if="activeSection === 'climate'">
      <text class="content-title">五运六气分析</text>
      <text class="paragraph">{{ report.climate.summary }}</text>
      <view class="climate-inputs">
        <view class="grid-inputs">
          <view class="input-group">
            <text class="input-label">出生年</text>
            <picker
              mode="selector"
              :range="yearOptions"
              :value="climatePickerIndex.year"
              @change="onClimatePickerChange('year', $event)"
            >
              <view class="picker-field" :class="{ placeholder: !climateForm.birthYear }">
                {{ climateForm.birthYear ? climateForm.birthYear + "年" : "请选择年份" }}
              </view>
            </picker>
          </view>
          <view class="input-group">
            <text class="input-label">月</text>
            <picker
              mode="selector"
              :range="monthOptions"
              :value="climatePickerIndex.month"
              @change="onClimatePickerChange('month', $event)"
            >
              <view class="picker-field" :class="{ placeholder: !climateForm.birthMonth }">
                {{ climateForm.birthMonth ? climateForm.birthMonth + "月" : "请选择月份" }}
              </view>
            </picker>
          </view>
          <view class="input-group">
            <text class="input-label">日</text>
            <picker
              mode="selector"
              :range="dayOptions"
              :value="climatePickerIndex.day"
              @change="onClimatePickerChange('day', $event)"
            >
              <view class="picker-field" :class="{ placeholder: !climateForm.birthDay }">
                {{ climateForm.birthDay ? climateForm.birthDay + "日" : "请选择日期" }}
              </view>
            </picker>
          </view>
          <view class="input-group">
            <text class="input-label">时（0-23）</text>
            <picker
              mode="selector"
              :range="hourOptions"
              :value="climatePickerIndex.hour"
              @change="onClimatePickerChange('hour', $event)"
            >
              <view class="picker-field" :class="{ placeholder: climateForm.birthHour === '' }">
                {{ climateForm.birthHour !== "" ? climateForm.birthHour + "时" : "请选择小时" }}
              </view>
            </picker>
          </view>
        </view>
        <view class="pulse-actions">
          <button class="pulse-btn" @click="runClimateAnalysis">生成五运六气分析</button>
        </view>
      </view>
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
  </view>
</template>

<script>
import { getLatestReport, getReportHistory, saveReportHistory } from "../../common/report-store";
import { buildTongueAnalysis } from "../../common/tongue-analysis";
import {
  buildPulseAnalysis,
  normalizePulsePayload,
  parsePressureSignal
} from "../../common/pulse-analysis";
import { buildWuYunLiuQiAnalysis } from "../../common/wuyunliuqi-analysis";
import {
  INQUIRY_QUESTIONS,
  buildInquirySummary,
  normalizeInquiryAnswers
} from "../../common/inquiry-schema";

const YEAR_OPTIONS = Array.from({ length: 201 }, (_, idx) => 1900 + idx);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, idx) => idx + 1);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, idx) => idx);
const DEFAULT_DAY_OPTIONS = Array.from({ length: 31 }, (_, idx) => idx + 1);

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
      inquiryQuestions: INQUIRY_QUESTIONS,
      report: getLatestReport(),
      pulseForm: {
        frequency: "",
        signalText: ""
      },
      climateForm: {
        birthYear: "",
        birthMonth: "",
        birthDay: "",
        birthHour: ""
      },
      yearOptions: YEAR_OPTIONS,
      monthOptions: MONTH_OPTIONS,
      hourOptions: HOUR_OPTIONS,
      dayOptions: DEFAULT_DAY_OPTIONS,
      climatePickerIndex: {
        year: 0,
        month: 0,
        day: 0,
        hour: 0
      }
    };
  },
  onLoad() {
    this.onReportUpdated = () => {
      this.report = getLatestReport();
      this.syncPulseFormFromReport();
      this.syncClimateFormFromReport();
      this.ensureInquiryData(false);
      this.ensureTongueAnalysis(false);
      this.ensurePulseAnalysis(false);
      this.ensureClimateAnalysis(false);
    };
    uni.$on("report-updated", this.onReportUpdated);

    this.onHardwarePulseData = (payload) => {
      this.handleHardwarePulseData(payload);
    };
    uni.$on("hardware-pulse-data", this.onHardwarePulseData);

    this.syncPulseFormFromReport();
    this.syncClimateFormFromReport();
    this.ensureInquiryData(false);
    this.ensureTongueAnalysis(false);
    this.ensurePulseAnalysis(false);
    this.ensureClimateAnalysis(false);
  },
  onUnload() {
    if (this.onReportUpdated) {
      uni.$off("report-updated", this.onReportUpdated);
    }
    if (this.onHardwarePulseData) {
      uni.$off("hardware-pulse-data", this.onHardwarePulseData);
    }
  },
  onShow() {
    this.report = getLatestReport();
    this.syncPulseFormFromReport();
    this.syncClimateFormFromReport();
    this.ensureInquiryData(false);
    this.ensureTongueAnalysis(false);
    this.ensurePulseAnalysis(false);
    this.ensureClimateAnalysis(false);
  },
  methods: {
    openTongueImagePicker(target) {
      uni.showActionSheet({
        itemList: ["拍照", "从相册选择"],
        success: (res) => {
          const sourceType = res.tapIndex === 0 ? ["camera"] : ["album"];
          this.chooseTongueImage(target, sourceType);
        }
      });
    },
    chooseTongueImage(target, sourceType) {
      uni.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType,
        success: (res) => {
          const tempPath = Array.isArray(res.tempFilePaths) ? res.tempFilePaths[0] : "";
          if (!tempPath) return;
          const field = target === "under" ? "underImage" : "faceImage";
          if (!this.report.tongue) {
            this.$set(this.report, "tongue", {});
          }
          this.$set(this.report.tongue, field, tempPath);
          this.ensureTongueAnalysis(false);
          this.persistReportUpdate();
          uni.showToast({ title: "图片已更新", icon: "success" });
        },
        fail: (err) => {
          const msg = JSON.stringify(err || {});
          if (msg.includes("cancel")) return;
          uni.showToast({ title: "选择失败", icon: "none" });
        }
      });
    },
    syncPulseFormFromReport() {
      const pulse = (this.report && this.report.pulse) || {};
      this.pulseForm.frequency = pulse.frequency != null && pulse.frequency !== "" ? String(pulse.frequency) : "";
      this.pulseForm.signalText = String(pulse.pressureSignal || "");
    },
    syncClimateFormFromReport() {
      const climate = (this.report && this.report.climate) || {};
      this.climateForm.birthYear =
        climate.birthYear != null && climate.birthYear !== "" ? String(climate.birthYear) : "";
      this.climateForm.birthMonth =
        climate.birthMonth != null && climate.birthMonth !== "" ? String(climate.birthMonth) : "";
      this.climateForm.birthDay =
        climate.birthDay != null && climate.birthDay !== "" ? String(climate.birthDay) : "";
      this.climateForm.birthHour =
        climate.birthHour != null && climate.birthHour !== "" ? String(climate.birthHour) : "";
      this.syncClimatePickerFromForm();
    },
    getDaysInMonth(year, month) {
      const y = Number(year);
      const m = Number(month);
      if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) {
        return 31;
      }
      return new Date(y, m, 0).getDate();
    },
    updateDayOptionsByYearMonth() {
      const year = Number(this.climateForm.birthYear || this.yearOptions[this.climatePickerIndex.year] || 1900);
      const month = Number(this.climateForm.birthMonth || this.monthOptions[this.climatePickerIndex.month] || 1);
      const totalDays = this.getDaysInMonth(year, month);
      this.dayOptions = Array.from({ length: totalDays }, (_, idx) => idx + 1);
      const dayVal = Number(this.climateForm.birthDay);
      if (dayVal && dayVal <= totalDays) {
        this.climatePickerIndex.day = Math.max(this.dayOptions.indexOf(dayVal), 0);
      } else if (dayVal > totalDays) {
        this.climateForm.birthDay = String(totalDays);
        this.climatePickerIndex.day = totalDays - 1;
      } else if (this.climatePickerIndex.day >= totalDays) {
        this.climatePickerIndex.day = totalDays - 1;
      }
    },
    syncClimatePickerFromForm() {
      const yearVal = Number(this.climateForm.birthYear);
      const monthVal = Number(this.climateForm.birthMonth);
      const hourVal = Number(this.climateForm.birthHour);
      const yearIndex = this.yearOptions.indexOf(yearVal);
      const monthIndex = this.monthOptions.indexOf(monthVal);
      const hourIndex = this.hourOptions.indexOf(hourVal);
      this.climatePickerIndex.year = yearIndex >= 0 ? yearIndex : 0;
      this.climatePickerIndex.month = monthIndex >= 0 ? monthIndex : 0;
      this.climatePickerIndex.hour = hourIndex >= 0 ? hourIndex : 0;
      this.updateDayOptionsByYearMonth();
      const dayVal = Number(this.climateForm.birthDay);
      const dayIndex = this.dayOptions.indexOf(dayVal);
      this.climatePickerIndex.day = dayIndex >= 0 ? dayIndex : 0;
    },
    onClimatePickerChange(type, event) {
      const index = Number(event && event.detail ? event.detail.value : 0) || 0;
      if (type === "year") {
        this.climatePickerIndex.year = index;
        this.climateForm.birthYear = String(this.yearOptions[index]);
        this.updateDayOptionsByYearMonth();
        return;
      }
      if (type === "month") {
        this.climatePickerIndex.month = index;
        this.climateForm.birthMonth = String(this.monthOptions[index]);
        this.updateDayOptionsByYearMonth();
        return;
      }
      if (type === "day") {
        this.climatePickerIndex.day = index;
        this.climateForm.birthDay = String(this.dayOptions[index]);
        return;
      }
      if (type === "hour") {
        this.climatePickerIndex.hour = index;
        this.climateForm.birthHour = String(this.hourOptions[index]);
      }
    },
    getInquiryAnswerValue(key) {
      const inquiry = this.report && this.report.inquiry ? this.report.inquiry : {};
      const answers = inquiry.answers || {};
      return answers[key] || "";
    },
    onInquiryOptionChange(event, key) {
      if (!this.report.inquiry) {
        this.$set(this.report, "inquiry", {});
      }
      const safeAnswers = normalizeInquiryAnswers(this.report.inquiry.answers || {});
      safeAnswers[key] = event && event.detail ? event.detail.value : "";
      const nextAnswers = normalizeInquiryAnswers(safeAnswers);
      this.$set(this.report.inquiry, "answers", nextAnswers);
      this.$set(this.report.inquiry, "summary", buildInquirySummary(nextAnswers));
      this.persistReportUpdate();
    },
    ensureInquiryData(needSave = true) {
      if (!this.report) return;
      if (!this.report.inquiry) {
        this.$set(this.report, "inquiry", {});
      }
      const nextAnswers = normalizeInquiryAnswers(this.report.inquiry.answers || {});
      const nextSummary = buildInquirySummary(nextAnswers);
      const changed =
        JSON.stringify(this.report.inquiry.answers || {}) !== JSON.stringify(nextAnswers) ||
        String(this.report.inquiry.summary || "") !== nextSummary;
      this.$set(this.report.inquiry, "answers", nextAnswers);
      this.$set(this.report.inquiry, "summary", nextSummary);
      if (changed && needSave) {
        this.persistReportUpdate();
      }
    },
    handleHardwarePulseData(payload) {
      const parsed = normalizePulsePayload(payload);
      if (parsed.frequency == null && parsed.signal.length === 0) {
        return;
      }
      if (parsed.frequency != null) {
        this.pulseForm.frequency = String(parsed.frequency);
      }
      if (parsed.signalText) {
        this.pulseForm.signalText = parsed.signalText;
      }
      this.applyPulseAnalysis(parsed.frequency, parsed.signal, true);
      uni.showToast({ title: "硬件脉诊数据已接收", icon: "none" });
    },
    runPulseAnalysisFromInput() {
      const frequency = this.pulseForm.frequency === "" ? null : Number(this.pulseForm.frequency);
      const signal = parsePressureSignal(this.pulseForm.signalText);
      if (frequency == null && signal.length === 0) {
        uni.showToast({ title: "请先输入频率或压力信号", icon: "none" });
        return;
      }
      this.applyPulseAnalysis(frequency, signal, true);
    },
    mockPulseSample() {
      this.pulseForm.frequency = "76";
      this.pulseForm.signalText =
        "0.22,0.38,0.61,0.82,0.64,0.41,0.29,0.45,0.72,0.91,0.68,0.42,0.27,0.44,0.7,0.88,0.66,0.43,0.3";
      this.runPulseAnalysisFromInput();
    },
    runClimateAnalysis() {
      const birthYear = Number(this.climateForm.birthYear);
      const birthMonth = Number(this.climateForm.birthMonth);
      const birthDay = Number(this.climateForm.birthDay);
      const birthHour = Number(this.climateForm.birthHour);
      const result = buildWuYunLiuQiAnalysis({ birthYear, birthMonth, birthDay, birthHour });
      if (!result.ok) {
        uni.showToast({ title: result.message || "输入不完整", icon: "none" });
        return;
      }
      if (!this.report.climate) {
        this.$set(this.report, "climate", {});
      }
      this.$set(this.report.climate, "birthYear", String(result.birth.year));
      this.$set(this.report.climate, "birthMonth", String(result.birth.month));
      this.$set(this.report.climate, "birthDay", String(result.birth.day));
      this.$set(this.report.climate, "birthHour", String(result.birth.hour));
      this.$set(this.report.climate, "analysis", result.text);
      this.$set(
        this.report.climate,
        "summary",
        `当前${result.currentYear}年，已结合出生年月日时生成先天体质与岁运提醒。`
      );
      this.persistReportUpdate();
    },
    applyPulseAnalysis(frequency, pressureSignal, needSave = true) {
      if (!this.report.pulse) {
        this.$set(this.report, "pulse", {});
      }
      const safeFrequency = Number.isFinite(Number(frequency)) ? Number(frequency) : null;
      const safeSignal = Array.isArray(pressureSignal)
        ? pressureSignal
        : parsePressureSignal(pressureSignal);
      const result = buildPulseAnalysis({
        frequency: safeFrequency,
        pressureSignal: safeSignal
      });
      const summaryFrequency =
        safeFrequency == null ? "未填写" : `${String(safeFrequency)} 次/分钟`;

      this.$set(this.report.pulse, "frequency", safeFrequency == null ? "" : safeFrequency);
      this.$set(this.report.pulse, "pressureSignal", safeSignal.join(","));
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

      if (needSave) {
        this.persistReportUpdate();
      }
    },
    persistReportUpdate() {
      const history = getReportHistory();
      const snapshot = JSON.parse(JSON.stringify(this.report));
      const idx = history.findIndex((item) => item.id === snapshot.id);
      if (idx >= 0) {
        history.splice(idx, 1, snapshot);
      } else {
        history.unshift(snapshot);
      }
      saveReportHistory(history);
      uni.$emit("report-updated");
    },
    ensureTongueAnalysis(needSave = true) {
      if (!this.report) return;
      if (!this.report.tongue) {
        this.$set(this.report, "tongue", {});
      }
      const result = buildTongueAnalysis(this.report.tongue);
      this.$set(this.report.tongue, "traits", result.traits);
      this.$set(this.report.tongue, "analysis", result.text);
      if (needSave) {
        this.persistReportUpdate();
      }
    },
    ensurePulseAnalysis(needSave = true) {
      if (!this.report) return;
      if (!this.report.pulse) {
        this.$set(this.report, "pulse", {});
      }
      const frequency = this.report.pulse.frequency;
      const signal = parsePressureSignal(this.report.pulse.pressureSignal);
      this.applyPulseAnalysis(frequency, signal, needSave);
    },
    ensureClimateAnalysis(needSave = true) {
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
          this.$set(this.report.climate, "summary", `当前${result.currentYear}年，已自动补齐五运六气分析。`);
          if (needSave) {
            this.persistReportUpdate();
          }
        }
      }
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

.section-tabs {
  white-space: nowrap;
  background: #fff;
  border-bottom: 1px solid #eadbff;
  padding-top: calc(var(--status-bar-height) + 6rpx);
  padding-right: 0;
}

.tab-item {
  display: inline-block;
  padding: 18rpx 24rpx 20rpx;
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

.tongue-tip {
  margin-top: 8rpx;
  display: block;
  color: #7d7d7d;
  font-size: 22rpx;
}

.tongue-label {
  margin-top: 8rpx;
  display: block;
  color: #676f67;
  font-size: 24rpx;
}

.inquiry-block {
  margin-top: 14rpx;
  border: 1px solid #eadbff;
  border-radius: 12rpx;
  padding: 14rpx;
  background: #fdfaff;
}

.inquiry-title {
  display: block;
  color: #3f4a40;
  font-size: 25rpx;
  font-weight: 600;
}

.inquiry-option {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
}

.inquiry-option-text {
  margin-left: 10rpx;
  color: #505950;
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

.pulse-inputs {
  margin-top: 16rpx;
  border: 1px solid #eadbff;
  border-radius: 14rpx;
  padding: 14rpx;
  background: #fffdf2;
}

.climate-inputs {
  margin-top: 16rpx;
  border: 1px solid #eadbff;
  border-radius: 14rpx;
  padding: 14rpx;
  background: #fffdf2;
}

.grid-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10rpx;
}

.input-group + .input-group {
  margin-top: 12rpx;
}

.input-label {
  display: block;
  font-size: 24rpx;
  color: #4f5c51;
  margin-bottom: 8rpx;
}

.input-field,
.signal-field {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #b8e3b3;
  border-radius: 10rpx;
  background: #eefbe8;
  padding: 10rpx 12rpx;
  font-size: 25rpx;
  color: #2c362d;
}

.picker-field {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #b8e3b3;
  border-radius: 10rpx;
  background: #eefbe8;
  padding: 0 12rpx;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 25rpx;
  color: #2c362d;
}

.picker-field.placeholder {
  color: #8b968c;
}

.signal-field {
  min-height: 140rpx;
  background: #fff0f6;
  border-color: #f5cddd;
}

.pulse-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 14rpx;
}

.pulse-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 24rpx;
  color: #fff;
  background: #7c4dff;
  border-radius: 10rpx;
}

.pulse-btn.light {
  background: #efe6ff;
  color: #5b33cc;
}

.risk-level {
  margin-top: 14rpx;
  color: #7c4dff;
  font-size: 34rpx;
  font-weight: 700;
}
</style>

