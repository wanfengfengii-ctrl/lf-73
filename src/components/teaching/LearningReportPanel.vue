<script setup lang="ts">import { computed } from 'vue';
import { FileText, CheckCircle2, XCircle, Lightbulb, ArrowRight, Target, AlertTriangle, BookOpen, TrendingUp, Calendar, Award } from 'lucide-vue-next';
import type { LearningReport } from '@/types/incense';
import { useTeaching } from '@/composables/useTeaching';
import { getTemplateById } from '@/data/teachingTemplates';
const props = defineProps<{
 report: LearningReport;
}>();
const emit = defineEmits<{
 (e: 'close'): void;
 (e: 'selectTemplate', templateId: string): void;
}>();
const { getPracticeStats } = useTeaching();
const stats = computed(() => getPracticeStats());
const formattedDate = computed(() => {
 return new Date(props.report.generatedAt).toLocaleString('zh-CN', {
 year: 'numeric',
 month: 'long',
 day: 'numeric',
 hour: '2-digit',
 minute: '2-digit',
 });
});
const overallGrade = computed(() => {
 const score = props.report.scoreBreakdown.reduce((sum, s) => sum + s.score, 0);
 const max = props.report.scoreBreakdown.reduce((sum, s) => sum + s.maxScore, 0);
 const pct = max > 0 ? (score / max) * 100 : 0;
 if (pct >= 90)
 return { grade: '优秀', color: 'text-green-600', bg: 'bg-green-100' };
 if (pct >= 75)
 return { grade: '良好', color: 'text-blue-600', bg: 'bg-blue-100' };
 if (pct >= 60)
 return { grade: '合格', color: 'text-amber-600', bg: 'bg-amber-100' };
 return { grade: '待提高', color: 'text-red-600', bg: 'bg-red-100' };
});
function getTemplateName(id: string): string {
 const template = getTemplateById(id);
 return template?.name || id;
}
</script>

<template>
  <div class="bg-white rounded-2xl shadow-lg max-w-4xl mx-auto overflow-hidden">
    <div class="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <FileText class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-2xl font-bold">学习报告</h2>
            <div class="flex items-center gap-2 text-white/80 text-sm">
              <Calendar class="w-4 h-4" />
              <span>{{ formattedDate }}</span>
            </div>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <XCircle class="w-6 h-6" />
        </button>
      </div>
    </div>

    <div class="p-6">
      <div class="bg-gradient-to-br from-stone-50 to-amber-50 rounded-xl p-6 mb-6 border border-amber-100">
        <div class="flex items-start gap-4">
          <div
            :class="[
              'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold',
              overallGrade.bg,
              overallGrade.color,
            ]"
          >
            {{ overallGrade.grade }}
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-lg text-stone-800 mb-2">总体评价</h3>
            <p class="text-stone-600 leading-relaxed">{{ report.overallAssessment }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 class="w-5 h-5 text-green-600" />
            </div>
            <h4 class="font-semibold text-green-800">优势</h4>
          </div>
          <ul v-if="report.strengths.length > 0" class="space-y-2">
            <li
              v-for="(strength, idx) in report.strengths"
              :key="idx"
              class="text-sm text-green-700 flex items-start gap-2"
            >
              <span class="text-green-500 mt-0.5">✓</span>
              {{ strength }}
            </li>
          </ul>
          <p v-else class="text-sm text-stone-500">继续努力，发现你的闪光点！</p>
        </div>

        <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle class="w-5 h-5 text-amber-600" />
            </div>
            <h4 class="font-semibold text-amber-800">不足</h4>
          </div>
          <ul v-if="report.weaknesses.length > 0" class="space-y-2">
            <li
              v-for="(weakness, idx) in report.weaknesses"
              :key="idx"
              class="text-sm text-amber-700 flex items-start gap-2"
            >
              <span class="text-amber-500 mt-0.5">!</span>
              {{ weakness }}
            </li>
          </ul>
          <p v-else class="text-sm text-stone-500">表现优秀，没有明显不足！</p>
        </div>

        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Lightbulb class="w-5 h-5 text-blue-600" />
            </div>
            <h4 class="font-semibold text-blue-800">改进建议</h4>
          </div>
          <ul v-if="report.improvements.length > 0" class="space-y-2">
            <li
              v-for="(improvement, idx) in report.improvements.slice(0, 4)"
              :key="idx"
              class="text-sm text-blue-700 flex items-start gap-2"
            >
              <span class="text-blue-500 mt-0.5">💡</span>
              {{ improvement }}
            </li>
          </ul>
          <p v-else class="text-sm text-stone-500">继续保持当前的学习状态！</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-stone-200 overflow-hidden mb-6">
        <div class="px-5 py-4 bg-stone-50 border-b border-stone-200">
          <h4 class="font-semibold text-stone-800 flex items-center gap-2">
            <Target class="w-5 h-5 text-amber-500" />
            能力维度分析
          </h4>
        </div>
        <div class="p-5">
          <div class="space-y-4">
            <div
              v-for="item in report.scoreBreakdown"
              :key="item.category"
              class="flex items-center gap-4"
            >
              <div class="w-28 text-sm font-medium text-stone-700">{{ item.category }}</div>
              <div class="flex-1">
                <div class="h-3 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                    :style="{ width: `${item.maxScore > 0 ? (item.score / item.maxScore) * 100 : 0}%` }"
                  ></div>
                </div>
              </div>
              <div class="w-20 text-right">
                <span class="font-bold text-stone-800">{{ item.score }}</span>
                <span class="text-stone-400">/{{ item.maxScore }}</span>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-stone-100">
            <p class="text-sm text-stone-600">
              {{
                report.scoreBreakdown.length > 0
                  ? report.scoreBreakdown[0].description
                  : '暂无数据'
              }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="report.commonMistakesSummary.length > 0" class="mb-6">
        <div class="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div class="px-5 py-4 bg-stone-50 border-b border-stone-200">
            <h4 class="font-semibold text-stone-800 flex items-center gap-2">
              <AlertTriangle class="w-5 h-5 text-red-500" />
              常见问题汇总
            </h4>
          </div>
          <div class="divide-y divide-stone-100">
            <div
              v-for="(mistake, idx) in report.commonMistakesSummary"
              :key="idx"
              class="p-4 flex items-start gap-4 hover:bg-stone-50 transition-colors"
            >
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="
                  mistake.count > 2
                    ? 'bg-red-100 text-red-600'
                    : mistake.count > 1
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-stone-100 text-stone-600'
                "
              >
                <span class="font-bold">{{ mistake.count }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-stone-800">{{ mistake.mistakeType }}</p>
                <p class="text-sm text-stone-500 mt-1">
                  <span class="text-green-600">建议：</span>{{ mistake.suggestion }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100 mb-6">
        <h4 class="font-semibold text-purple-800 mb-4 flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-purple-600" />
          下一步学习计划
        </h4>
        <ul class="space-y-3">
          <li
            v-for="(step, idx) in report.suggestedNextSteps"
            :key="idx"
            class="text-sm text-purple-700 flex items-start gap-3"
          >
            <span class="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">
              {{ idx + 1 }}
            </span>
            {{ step }}
          </li>
        </ul>
      </div>

      <div v-if="report.recommendedTemplates.length > 0" class="mb-6">
        <div class="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div class="px-5 py-4 bg-stone-50 border-b border-stone-200">
            <h4 class="font-semibold text-stone-800 flex items-center gap-2">
              <BookOpen class="w-5 h-5 text-amber-500" />
              推荐课程
            </h4>
          </div>
          <div class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              v-for="templateId in report.recommendedTemplates"
              :key="templateId"
              @click="emit('selectTemplate', templateId)"
              class="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all group"
            >
              <div class="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-lg">
                📚
              </div>
              <div class="flex-1 text-left">
                <p class="font-medium text-stone-800 group-hover:text-amber-700 transition-colors">
                  {{ getTemplateName(templateId) }}
                </p>
              </div>
              <ArrowRight class="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div class="bg-gradient-to-r from-stone-800 to-stone-900 rounded-xl p-6 text-white">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <Award class="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h4 class="font-bold text-lg">学习进度</h4>
              <p class="text-stone-400 text-sm">持续学习，不断进步</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-amber-400">{{ stats.totalPractices }}</div>
              <div class="text-xs text-stone-400">完成练习</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-400">{{ stats.masteredTemplates.length }}</div>
              <div class="text-xs text-stone-400">精通课程</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-400">{{ stats.averageScore }}</div>
              <div class="text-xs text-stone-400">平均分数</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
