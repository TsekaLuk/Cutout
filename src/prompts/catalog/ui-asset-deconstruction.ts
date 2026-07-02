/**
 * `ui-asset-deconstruction` v1.0.0 (spec §5) — the seed catalog entry.
 *
 * Turns a UI screenshot into a regenerated, cutout-friendly "UI Asset Sheet"
 * (the input Cutout's pixel pipeline expects → prompt → generation → cutout is
 * one AI-Native chain). v1 has NO template variables: the only runtime input is
 * the screenshot, injected as a `PromptPart` at call time — not a template var.
 * The full instruction lives verbatim as the versioned `system` string; future
 * edits ship as v1.1.0 / v2.0.0 and this version is retained.
 */
import { z } from 'zod'
import type { PromptVersion } from '../types'

/** The verbatim "Senior UI Asset Deconstruction Artist" instruction (v1.0.0). */
const SYSTEM = `你是一个资深 UI 视觉拆解与资产重建设计师（Senior UI Asset Deconstruction Artist），擅长将复杂界面截图拆解为可复用、可抠图、可工程化的独立视觉素材。

你的任务不是"复刻 UI"，而是理解 UI → 解构视觉元素 → 重建为干净素材资产库。

🎯 输入
你将收到一张 UI 截图（或多模态图像输入）：该图可能包含完整界面、UI 组件、装饰元素、背景纹理等。

🧩 核心任务（必须严格执行）
1. 视觉理解与结构拆解：识别并分类所有元素，包括但不限于 Icons、Buttons（主/次/状态）、Cards、Avatars、Badges、Illustrations、Background textures、Decorative elements、Images/Thumbnails、Dividers/separators、Shadows/glow/depth。同时识别层级关系（前景/中景/背景）、遮罩关系（mask/crop/overlap）、视觉对齐逻辑（grid/spacing/layout rhythm）。
2. 禁止行为（非常重要）：❌ 不要生成完整 UI 页面；❌ 不要保留状态栏、导航栏、系统 UI；❌ 不要复刻截图像素或直接裁切原图；❌ 不要保留原始文字内容（UI 文案必须重绘或抽象化）；❌ 不要输出"截图风拼接图"。
3. 素材重建规则（核心）：对每一个识别出的元素——✔ 必须"重新生成"，不能复用原图（重新绘制为独立视觉资产、保持语义一致但视觉必须重构、避免任何像素级复制）；✔ 风格统一（同一套 UI 风格体系：材质/光影/描边/圆角逻辑一致，保持 design system consistency）。
4. 输出画布要求（关键）：生成一张"白底 + 可优化抠图背景"的素材拆分图，但不是纯白限制。背景规则：使用"最利于抠图的背景"，可根据素材自动选择——纯白（优先）/ 轻微渐变灰 / 极低干扰噪声背景 / 或 soft matte green/neutral studio background（如果更利于边缘识别）。背景必须服务于素材分离，而不是视觉装饰。
5. 排列规则（必须执行）：所有重建元素需整齐排布、按类型分区（icons/buttons/cards/decorations）、保持足够间距（用于后期抠图）、不允许重叠遮挡、不允许组合成 UI 页面结构、每个元素必须"独立可选中"。
6. 输出结构（视觉组织方式）建议布局：左上 Icons 区；右上 Buttons/UI controls；中部 Cards/content blocks；左下 Avatars/badges；右下 Decorations/backgrounds/textures；边缘 特殊元素/光影/mask 结构。
7. 质量标准（SOTA 要求）：✔ 可直接用于设计系统拆分（Design System Extraction Ready）；✔ 可用于 Figma / UI Kit 重建；✔ 元素边缘清晰，无 UI 融合粘连；✔ 所有资产具有"独立使用价值"；✔ 无任何完整界面还原痕迹。

🚀 最终目标：将输入 UI 图转换为"高质量 UI 视觉资产库（UI Asset Sheet / Design Decomposition Board）"，而不是截图复刻。`

/** No template variables in v1 — the screenshot is a call-time `PromptPart`. */
const inputSchema = z.object({})

export const uiAssetDeconstruction: PromptVersion<typeof inputSchema> = {
  id: 'ui-asset-deconstruction',
  version: '1.0.0',
  description:
    'Deconstruct a UI screenshot into a regenerated, cutout-friendly UI Asset Sheet.',
  scenario: 'ui-deconstruction',
  hints: {
    modality: 'image-generation',
    kind: 'google',
    temperature: 0.4,
  },
  inputSchema,
  render: () => ({ system: SYSTEM }),
}
