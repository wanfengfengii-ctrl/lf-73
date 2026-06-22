import type { TeachingTemplate } from '@/types/incense'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export const TEACHING_TEMPLATES: TeachingTemplate[] = [
  {
    id: 'beginner_basic',
    name: '香篆入门·基础班',
    difficulty: 'beginner',
    description: '从零基础开始，学习香篆制作的基本步骤和核心技巧',
    icon: '🌸',
    prerequisites: [],
    learningObjectives: [
      '掌握香粉配方的基本配比原则',
      '学会正确的灰床处理方法',
      '能够绘制简单的香线路径',
      '掌握正确的点燃和观察方法',
    ],
    targetRecipe: [
      { name: '沉香粉', ratio: 50, burnRateFactor: 0.9, stabilityFactor: 1.1 },
      { name: '檀香粉', ratio: 35, burnRateFactor: 1.0, stabilityFactor: 1.0 },
      { name: '楠木粘粉', ratio: 15, burnRateFactor: 0.7, stabilityFactor: 1.3 },
    ],
    targetEnvironment: {
      humidity: 50,
      temperature: 22,
      airflow: 1,
      ashBedThickness: 5,
    },
    steps: [
      {
        id: 'step_recipe_1',
        type: 'recipe',
        order: 1,
        title: '认识香粉原料',
        description: '了解香篆所用的基本香粉种类和特性',
        instructions: [
          '准备好沉香粉、檀香粉和楠木粘粉',
          '了解每种香粉的燃烧特性和香气特点',
          '沉香粉：燃烧稳定，香气醇厚',
          '檀香粉：香气清雅，燃烧速度适中',
          '楠木粘粉：粘合剂，帮助香粉成型',
        ],
        tips: [
          '选择质量好的天然香粉，避免化学添加剂',
          '香粉应保持干燥，存放在密封容器中',
          '不同产地的香粉特性略有差异',
        ],
        commonMistakes: [
          '使用受潮的香粉',
          '香粉颗粒过粗或过细',
          '混淆不同种类的香粉',
        ],
        requiredChecks: [
          { id: 'check_1', label: '已准备三种香粉', description: '确认沉香粉、檀香粉和楠木粘粉都已准备好', validatorType: 'manual' },
          { id: 'check_2', label: '了解香粉特性', description: '能够说出每种香粉的基本特性', validatorType: 'manual' },
        ],
        estimatedTime: 3,
      },
      {
        id: 'step_recipe_2',
        type: 'recipe',
        order: 2,
        title: '调配基础配方',
        description: '学习经典的50:35:15香篆配方比例',
        instructions: [
          '按照50%沉香粉、35%檀香粉、15%楠木粘粉的比例称量',
          '先将沉香粉倒入混合容器',
          '加入檀香粉，轻轻搅拌均匀',
          '最后加入楠木粘粉，充分混合',
          '过筛2-3次，确保香粉细腻均匀',
        ],
        tips: [
          '使用精确的电子秤称量，误差控制在±0.1g',
          '混合时动作要轻，避免香粉飞扬',
          '过筛可以去除结块，使香粉更加细腻',
          '建议每次调配10-20g的量',
        ],
        commonMistakes: [
          '比例不准确，粘粉过多或过少',
          '混合不均匀，局部粘粉集中',
          '省略过筛步骤，香粉有结块',
        ],
        requiredChecks: [
          { id: 'check_ratio_total', label: '配方比例总和100%', description: '确保所有原料比例加起来等于100%', validatorType: 'param', parameter: 'totalRatio', targetValue: 100, tolerance: 1 },
          { id: 'check_binder_ratio', label: '粘粉比例12-18%', description: '楠木粘粉比例应在12%到18%之间', validatorType: 'param', parameter: 'binderRatio', targetValue: 15, tolerance: 3 },
          { id: 'check_mixed', label: '香粉已充分混合', description: '确认香粉已经均匀混合并过筛', validatorType: 'manual' },
        ],
        estimatedTime: 5,
      },
      {
        id: 'step_ashbed_1',
        type: 'ashbed',
        order: 3,
        title: '准备灰床基底',
        description: '学习如何铺制平整均匀的香灰床',
        instructions: [
          '在香炉中倒入适量香灰',
          '使用灰押轻轻压平表面',
          '从中心向外圈螺旋式压平',
          '确保灰床厚度约5mm',
          '表面平整光滑，无明显凹凸',
        ],
        tips: [
          '香灰应使用燃烧过的旧灰，保温效果更好',
          '压灰时力度要均匀，避免一边实一边虚',
          '灰床太厚会缺氧，太薄会断火',
          '可以用灰押背面轻轻敲击炉壁震实',
        ],
        commonMistakes: [
          '灰床厚度不足3mm或超过8mm',
          '表面不平整，有明显凸起或凹陷',
          '灰床压实不均，局部过松或过紧',
          '使用新灰，保温效果差',
        ],
        requiredChecks: [
          { id: 'check_thickness', label: '灰床厚度4-6mm', description: '灰床厚度应在4-6mm之间', validatorType: 'param', parameter: 'ashBedThickness', targetValue: 5, tolerance: 1 },
          { id: 'check_surface', label: '表面平整光滑', description: '确认灰床表面平整，无明显凹凸', validatorType: 'manual' },
        ],
        estimatedTime: 4,
      },
      {
        id: 'step_path_1',
        type: 'path',
        order: 4,
        title: '绘制简单圆篆',
        description: '学习绘制最简单的圆形香线路径',
        instructions: [
          '选择画笔工具，设置线宽为4像素',
          '从画布左侧开始，绘制一个完整的圆形',
          '确保路径连续，没有断点',
          '在路径的起点设置起燃点',
          '检查路径是否闭合且连续',
        ],
        tips: [
          '绘制时手腕要稳，速度均匀',
          '一气呵成，不要断断续续',
          '圆形大小适中，不要太大或太小',
          '如果画错了可以使用撤销功能',
        ],
        commonMistakes: [
          '路径有断点，不连续',
          '线条粗细不均',
          '起燃点不在路径上',
          '圆形不规整，变形严重',
        ],
        requiredChecks: [
          { id: 'check_continuous', label: '路径连续无断点', description: '香线路径必须是一条连续的线', validatorType: 'auto' },
          { id: 'check_ignition', label: '已设置起燃点', description: '必须在路径上设置起燃点', validatorType: 'auto' },
          { id: 'check_linewidth', label: '线宽3-6像素', description: '线宽应在3-6像素之间', validatorType: 'param', parameter: 'lineWidth', targetValue: 4, tolerance: 2 },
        ],
        estimatedTime: 8,
      },
      {
        id: 'step_ignition_1',
        type: 'ignition',
        order: 5,
        title: '正确点燃方法',
        description: '掌握香篆的正确点燃技巧',
        instructions: [
          '将香粉轻轻填入篆模中',
          '轻轻压实，确保香粉均匀',
          '垂直平稳地提起篆模',
          '用打火机或线香在起燃点处点燃',
          '观察火焰是否稳定燃烧',
        ],
        tips: [
          '填粉时要轻，不要用力过猛',
          '起模要快、稳、直，不要晃动',
          '点燃时用外焰，不要烧到香粉',
          '如果有断火，可以用线香接引',
        ],
        commonMistakes: [
          '填粉不实，起模时坍塌',
          '起模时晃动，破坏香线形状',
          '点燃时火焰太大，烧糊香粉',
          '点燃后用力吹气，导致断火',
        ],
        requiredChecks: [
          { id: 'check_filled', label: '香粉填充紧实', description: '确认香粉已经均匀填实', validatorType: 'manual' },
          { id: 'check_ignited', label: '成功点燃', description: '香线已经成功点燃并稳定燃烧', validatorType: 'manual' },
        ],
        estimatedTime: 5,
      },
      {
        id: 'step_recording_1',
        type: 'recording',
        order: 6,
        title: '观察与记录',
        description: '学会观察燃烧过程并做好记录',
        instructions: [
          '记录开始燃烧的时间',
          '观察燃烧是否平稳，有无断火',
          '注意灰线成型情况',
          '记录实际燃烧时长',
          '为燃烧后的灰线拍照留存',
          '为灰线质量评分（满分100）',
        ],
        tips: [
          '使用计时器准确记录燃烧时间',
          '在无风的环境中观察，避免干扰',
          '灰线照片要清晰，光线充足',
          '如实记录，不要刻意美化',
        ],
        commonMistakes: [
          '忘记记录燃烧时间',
          '记录数据不准确',
          '没有拍摄灰线照片',
          '灰线评分不客观',
        ],
        requiredChecks: [
          { id: 'check_time', label: '已记录燃烧时长', description: '实际燃烧时间已记录', validatorType: 'auto' },
          { id: 'check_photo', label: '已拍摄灰线照片', description: '已为燃烧后的灰线拍照', validatorType: 'manual' },
          { id: 'check_score', label: '已完成灰线评分', description: '已为灰线质量给出评分', validatorType: 'auto' },
        ],
        estimatedTime: 15,
      },
    ],
  },
  {
    id: 'beginner_cloud',
    name: '祥云篆·入门进阶',
    difficulty: 'beginner',
    description: '学习绘制经典的祥云图案，掌握曲线绘制技巧',
    icon: '☁️',
    prerequisites: ['香篆入门·基础班'],
    learningObjectives: [
      '掌握曲线绘制技巧',
      '学会绘制对称图案',
      '提升路径流畅度',
    ],
    targetRecipe: [
      { name: '沉香粉', ratio: 55, burnRateFactor: 0.9, stabilityFactor: 1.1 },
      { name: '檀香粉', ratio: 30, burnRateFactor: 1.0, stabilityFactor: 1.0 },
      { name: '楠木粘粉', ratio: 15, burnRateFactor: 0.7, stabilityFactor: 1.3 },
    ],
    targetEnvironment: {
      humidity: 45,
      temperature: 23,
      airflow: 0,
      ashBedThickness: 6,
    },
    steps: [
      {
        id: 'cloud_step_1',
        type: 'recipe',
        order: 1,
        title: '调整配方',
        description: '根据图案复杂度调整香粉配方',
        instructions: [
          '增加沉香粉比例到55%',
          '减少檀香粉到30%',
          '保持楠木粘粉15%不变',
          '充分混合过筛',
        ],
        tips: [
          '复杂图案需要更好的燃烧稳定性',
          '沉香粉比例高有助于持续燃烧',
        ],
        commonMistakes: ['粘粉比例不足导致成型困难'],
        requiredChecks: [
          { id: 'check_ratio', label: '配方比例正确', description: '沉香55%、檀香30%、粘粉15%', validatorType: 'param', parameter: 'totalRatio', targetValue: 100, tolerance: 1 },
        ],
        estimatedTime: 3,
      },
      {
        id: 'cloud_step_2',
        type: 'ashbed',
        order: 2,
        title: '加厚灰床',
        description: '为复杂图案准备更厚实的灰床',
        instructions: [
          '将灰床厚度增加到6mm',
          '确保表面更加平整',
          '边缘略高于中心',
        ],
        tips: [
          '复杂图案燃烧时间长，需要更好的保温',
          '边缘略高可以防止香粉溢出',
        ],
        commonMistakes: ['灰床不平整导致图案变形'],
        requiredChecks: [
          { id: 'check_thickness', label: '灰床厚度5-7mm', description: '灰床厚度应在5-7mm之间', validatorType: 'param', parameter: 'ashBedThickness', targetValue: 6, tolerance: 1 },
        ],
        estimatedTime: 3,
      },
      {
        id: 'cloud_step_3',
        type: 'path',
        order: 3,
        title: '临摹祥云图案',
        description: '在临摹模式下绘制经典祥云图案',
        instructions: [
          '选择临摹练习模式',
          '参考模板路径绘制祥云',
          '注意曲线的流畅过渡',
          '保持图案对称',
          '在内侧端点设置起燃点',
        ],
        tips: [
          '先观察模板路径的走向',
          '绘制曲线时转动手腕而非手指',
          '保持速度均匀，不要停顿',
        ],
        commonMistakes: [
          '曲线生硬不流畅',
          '左右不对称',
          '断点过多',
        ],
        requiredChecks: [
          { id: 'check_continuous', label: '路径连续', description: '路径无断点', validatorType: 'auto' },
          { id: 'check_similarity', label: '相似度≥70%', description: '与模板路径相似度达到70%以上', validatorType: 'auto' },
          { id: 'check_ignition', label: '起燃点正确', description: '起燃点在内侧端点', validatorType: 'manual' },
        ],
        estimatedTime: 12,
      },
      {
        id: 'cloud_step_4',
        type: 'ignition',
        order: 4,
        title: '精细填粉与点燃',
        description: '学习复杂图案的填粉技巧',
        instructions: [
          '用小勺子将香粉填入凹槽',
          '细小处用毛刷辅助填实',
          '轻轻敲击震动使香粉紧实',
          '垂直平稳起模',
          '从内侧端点开始点燃',
        ],
        tips: [
          '细小的地方要耐心填粉',
          '可以分多次填粉，每次少量',
          '起模时要特别稳',
        ],
        commonMistakes: ['填粉不实导致细节丢失', '起模时碰坏细小部分'],
        requiredChecks: [
          { id: 'check_filled', label: '填粉完整', description: '所有细节都已填实', validatorType: 'manual' },
        ],
        estimatedTime: 6,
      },
      {
        id: 'cloud_step_5',
        type: 'recording',
        order: 5,
        title: '完整记录',
        description: '完整记录整个燃烧过程',
        instructions: [
          '记录点燃时间',
          '观察燃烧过程中的断火情况',
          '记录每次断火的位置',
          '记录总燃烧时长',
          '拍摄灰线照片',
          '综合评分',
        ],
        tips: [
          '复杂图案容易断火，要仔细观察',
          '记录断火位置有助于改进',
        ],
        commonMistakes: ['漏记断火次数和位置'],
        requiredChecks: [
          { id: 'check_complete', label: '记录完整', description: '所有数据都已记录', validatorType: 'manual' },
        ],
        estimatedTime: 20,
      },
    ],
  },
  {
    id: 'intermediate_lotus',
    name: '莲花篆·进阶班',
    difficulty: 'intermediate',
    description: '挑战更复杂的莲花图案，提升精准控制能力',
    icon: '🪷',
    prerequisites: ['祥云篆·入门进阶'],
    learningObjectives: [
      '掌握多层嵌套图案绘制',
      '提升精细操作能力',
      '学会处理复杂路径连接',
    ],
    targetRecipe: [
      { name: '沉香粉', ratio: 40, burnRateFactor: 0.9, stabilityFactor: 1.1 },
      { name: '檀香粉', ratio: 20, burnRateFactor: 1.0, stabilityFactor: 1.0 },
      { name: '崖柏粉', ratio: 25, burnRateFactor: 1.2, stabilityFactor: 0.9 },
      { name: '楠木粘粉', ratio: 15, burnRateFactor: 0.7, stabilityFactor: 1.3 },
    ],
    targetEnvironment: {
      humidity: 40,
      temperature: 24,
      airflow: 0,
      ashBedThickness: 7,
    },
    steps: [
      {
        id: 'lotus_step_1',
        type: 'recipe',
        order: 1,
        title: '四料配方调配',
        description: '学习使用四种香粉的进阶配方',
        instructions: [
          '沉香40%、檀香20%、崖柏25%、楠木粘粉15%',
          '按比例准确称量',
          '分批次混合确保均匀',
          '过筛3次以上',
        ],
        tips: [
          '崖柏粉燃烧较快，适合需要层次感的图案',
          '多种香粉混合要更加耐心',
        ],
        commonMistakes: ['混合顺序错误导致不均', '过筛不充分有结块'],
        requiredChecks: [
          { id: 'check_4ingredients', label: '四种原料齐备', description: '确认四种香粉都已准备', validatorType: 'manual' },
          { id: 'check_ratio', label: '比例总和100%', description: '配方比例正确', validatorType: 'param', parameter: 'totalRatio', targetValue: 100, tolerance: 1 },
        ],
        estimatedTime: 6,
      },
      {
        id: 'lotus_step_2',
        type: 'ashbed',
        order: 2,
        title: '高标准灰床',
        description: '为莲花图案准备高质量灰床',
        instructions: [
          '灰床厚度7mm',
          '使用灰押精细压平',
          '表面如镜面般光滑',
          '边缘整齐圆润',
        ],
        tips: [
          '莲花图案对灰床平整度要求很高',
          '可以先用粗灰押压平，再用细灰押精修',
        ],
        commonMistakes: ['表面有细微颗粒', '边缘不整齐'],
        requiredChecks: [
          { id: 'check_thickness', label: '灰床厚度6-8mm', description: '灰床厚度应在6-8mm之间', validatorType: 'param', parameter: 'ashBedThickness', targetValue: 7, tolerance: 1 },
          { id: 'check_smooth', label: '表面光滑', description: '灰床表面光滑无颗粒', validatorType: 'manual' },
        ],
        estimatedTime: 5,
      },
      {
        id: 'lotus_step_3',
        type: 'path',
        order: 3,
        title: '绘制莲花图案',
        description: '在自由模式下绘制双层莲花',
        instructions: [
          '先画内层的小莲花',
          '再画外层的大莲花花瓣',
          '确保每层花瓣均匀分布',
          '保持图案居中对称',
          '在花心处设置起燃点',
        ],
        tips: [
          '可以先画辅助线定位',
          '花瓣数量要均匀，大小一致',
          '内层和外层要协调',
        ],
        commonMistakes: [
          '花瓣大小不一',
          '分布不均匀',
          '内外层比例失调',
        ],
        requiredChecks: [
          { id: 'check_symmetry', label: '图案对称', description: '左右对称度良好', validatorType: 'manual' },
          { id: 'check_continuous', label: '路径连续', description: '路径无断点', validatorType: 'auto' },
          { id: 'check_petals', label: '花瓣均匀', description: '花瓣大小和分布均匀', validatorType: 'manual' },
        ],
        estimatedTime: 15,
      },
      {
        id: 'lotus_step_4',
        type: 'ignition',
        order: 4,
        title: '精细操作',
        description: '掌握复杂图案的填粉和起模',
        instructions: [
          '用极细的工具填粉',
          '花瓣尖端要特别小心',
          '分三次填粉压实',
          '起模时屏住呼吸，一气呵成',
          '从花心处点燃，观察火头是否顺畅走到每个花瓣',
        ],
        tips: [
          '可以用放大镜辅助观察细节',
          '起模速度要适中，太快太慢都不好',
        ],
        commonMistakes: ['花瓣尖端填粉不实', '起模时碰断花瓣'],
        requiredChecks: [
          { id: 'check_detail', label: '细节完整', description: '所有花瓣尖端都完整', validatorType: 'manual' },
        ],
        estimatedTime: 8,
      },
      {
        id: 'lotus_step_5',
        type: 'recording',
        order: 5,
        title: '专业记录',
        description: '以专业标准记录实验数据',
        instructions: [
          '制作详细的观察记录表',
          '记录每个花瓣的燃烧情况',
          '标注最先断火的位置',
          '拍摄燃烧过程延时摄影',
          '从造型、灰线、燃烧三个维度评分',
        ],
        tips: [
          '分维度评分更客观',
          '延时摄影可以事后慢速分析',
        ],
        commonMistakes: ['评分维度单一，不够全面'],
        requiredChecks: [
          { id: 'check_detailed', label: '记录详细', description: '多维度记录完整', validatorType: 'manual' },
        ],
        estimatedTime: 25,
      },
    ],
  },
  {
    id: 'advanced_dragon',
    name: '龙篆·大师挑战',
    difficulty: 'advanced',
    description: '最高难度的龙形图案，挑战你的极限技巧',
    icon: '🐉',
    prerequisites: ['莲花篆·进阶班'],
    learningObjectives: [
      '掌握超复杂路径绘制',
      '提升极速反应和控制能力',
      '学会处理大量细节',
    ],
    targetRecipe: [
      { name: '沉香粉', ratio: 30, burnRateFactor: 0.9, stabilityFactor: 1.1 },
      { name: '檀香粉', ratio: 20, burnRateFactor: 1.0, stabilityFactor: 1.0 },
      { name: '崖柏粉', ratio: 15, burnRateFactor: 1.2, stabilityFactor: 0.9 },
      { name: '丁香粉', ratio: 20, burnRateFactor: 1.1, stabilityFactor: 0.85 },
      { name: '楠木粘粉', ratio: 15, burnRateFactor: 0.7, stabilityFactor: 1.3 },
    ],
    targetEnvironment: {
      humidity: 35,
      temperature: 22,
      airflow: 0,
      ashBedThickness: 8,
    },
    steps: [
      {
        id: 'dragon_step_1',
        type: 'recipe',
        order: 1,
        title: '五料精配',
        description: '使用五种香粉的大师级配方',
        instructions: [
          '沉香30%、檀香20%、崖柏15%、丁香20%、楠木粘粉15%',
          '精确称量到0.01g',
          '采用分层混合法',
          '过筛5次以上',
        ],
        tips: [
          '丁香粉增加香气层次感',
          '多种香粉对混合技术要求更高',
        ],
        commonMistakes: ['称量精度不够', '混合不均导致局部燃烧异常'],
        requiredChecks: [
          { id: 'check_5ingredients', label: '五种原料齐备', description: '确认五种香粉都已准备', validatorType: 'manual' },
          { id: 'check_precision', label: '称量精确', description: '称量精度达到0.01g', validatorType: 'manual' },
        ],
        estimatedTime: 8,
      },
      {
        id: 'dragon_step_2',
        type: 'ashbed',
        order: 2,
        title: '大师级灰床',
        description: '制作完美的灰床基底',
        instructions: [
          '灰床厚度8mm',
          '分三层铺灰，每层单独压实',
          '使用玛瑙压打磨表面',
          '表面达到反光级平整',
        ],
        tips: [
          '分层铺灰可以获得最佳的密度均匀性',
          '玛瑙压可以获得镜面般的光滑表面',
        ],
        commonMistakes: ['密度不均导致燃烧异常', '表面不够平整影响图案成型'],
        requiredChecks: [
          { id: 'check_8mm', label: '灰床厚度8mm', description: '灰床厚度精确8mm', validatorType: 'param', parameter: 'ashBedThickness', targetValue: 8, tolerance: 0.5 },
          { id: 'check_mirror', label: '镜面效果', description: '灰床表面光滑如镜', validatorType: 'manual' },
        ],
        estimatedTime: 8,
      },
      {
        id: 'dragon_step_3',
        type: 'path',
        order: 3,
        title: '绘制龙形图案',
        description: '在挑战模式下绘制复杂龙形',
        instructions: [
          '从头开始绘制，注意龙的姿态',
          '龙身要有动感和力量感',
          '龙鳞、龙爪等细节要清晰',
          '龙须要流畅飘逸',
          '在龙嘴处设置起燃点',
        ],
        tips: [
          '绘制前在脑中构思完整的龙形',
          '龙身的曲线要有变化，不要僵直',
          '细节要疏密有致',
        ],
        commonMistakes: [
          '龙身僵直无动感',
          '细节过多显得杂乱',
          '比例失调',
        ],
        requiredChecks: [
          { id: 'check_dynamic', label: '造型生动', description: '龙形有动感和力量感', validatorType: 'manual' },
          { id: 'check_detail_clear', label: '细节清晰', description: '龙鳞、龙爪等细节清晰可辨', validatorType: 'manual' },
          { id: 'check_continuous', label: '路径连续', description: '整条龙身连续无断点', validatorType: 'auto' },
        ],
        estimatedTime: 25,
      },
      {
        id: 'dragon_step_4',
        type: 'ignition',
        order: 4,
        title: '极致操作',
        description: '以大师水准完成填粉和点燃',
        instructions: [
          '使用特制工具填粉',
          '每一个鳞片都要填实',
          '龙须等极细处要格外小心',
          '起模是关键，需要绝对稳定',
          '从龙嘴点燃，观察火行是否顺畅',
        ],
        tips: [
          '可以在起模前默念静心',
          '环境要绝对安静无风',
        ],
        commonMistakes: ['极细部分填粉不实', '起模时轻微晃动导致失败'],
        requiredChecks: [
          { id: 'check_all_details', label: '全部细节完整', description: '包括龙须在内的所有细节都完整', validatorType: 'manual' },
        ],
        estimatedTime: 12,
      },
      {
        id: 'dragon_step_5',
        type: 'recording',
        order: 5,
        title: '完整复盘',
        description: '进行全面的实验复盘和总结',
        instructions: [
          '全程拍摄制作过程',
          '记录每一步的时间',
          '标注最困难的环节',
          '详细分析成功或失败的原因',
          '撰写心得体会',
        ],
        tips: [
          '录像可以帮助发现自己的操作问题',
          '复盘是提升最快的方法',
        ],
        commonMistakes: ['总结流于表面，没有深入分析'],
        requiredChecks: [
          { id: 'check_video', label: '有全程录像', description: '已录制完整的制作过程', validatorType: 'manual' },
          { id: 'check_summary', label: '总结深入', description: '复盘分析深入具体', validatorType: 'manual' },
        ],
        estimatedTime: 30,
      },
    ],
  },
]

export function getTemplateById(id: string): TeachingTemplate | undefined {
  return TEACHING_TEMPLATES.find((t) => t.id === id)
}

export function getTemplatesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): TeachingTemplate[] {
  return TEACHING_TEMPLATES.filter((t) => t.difficulty === difficulty)
}

export function getNextTemplateId(currentId: string): string | null {
  const currentIndex = TEACHING_TEMPLATES.findIndex((t) => t.id === currentId)
  if (currentIndex < TEACHING_TEMPLATES.length - 1) {
    return TEACHING_TEMPLATES[currentIndex + 1].id
  }
  return null
}

export function generateSimpleCircleTemplate(): TeachingTemplate {
  const id = 'generated_circle_' + generateId()
  return {
    id,
    name: '自定义圆篆练习',
    difficulty: 'beginner',
    description: '练习绘制圆形香篆',
    icon: '⭕',
    prerequisites: [],
    learningObjectives: ['掌握圆形绘制技巧'],
    targetRecipe: [
      { name: '沉香粉', ratio: 50, burnRateFactor: 0.9, stabilityFactor: 1.1 },
      { name: '檀香粉', ratio: 35, burnRateFactor: 1.0, stabilityFactor: 1.0 },
      { name: '楠木粘粉', ratio: 15, burnRateFactor: 0.7, stabilityFactor: 1.3 },
    ],
    targetEnvironment: {
      humidity: 50,
      temperature: 22,
      airflow: 1,
      ashBedThickness: 5,
    },
    steps: TEACHING_TEMPLATES[0].steps,
  }
}
