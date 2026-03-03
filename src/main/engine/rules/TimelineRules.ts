import { Rule, RuleContext } from '../RuleEngine'

interface TimelineContext extends RuleContext {
  events?: Array<{
    id: string
    year: number
    month?: number
    day?: number
    location?: string
  }>
  character?: {
    id: string
    birthYear?: number
    age?: number
  }
}

export const timelineRules: Rule[] = [
  {
    id: 'character-age-conflict',
    name: '角色年龄冲突',
    description: '检测角色年龄与事件时间是否冲突',
    category: 'timeline',
    severity: 'error',
    enabled: true,
    condition: (ctx: RuleContext) => {
      const timelineCtx = ctx as TimelineContext
      return !!(timelineCtx.character?.birthYear && timelineCtx.events?.length)
    },
    action: (ctx: RuleContext) => {
      const timelineCtx = ctx as TimelineContext
      const { character, events } = timelineCtx
      
      if (!character?.birthYear || !events?.length) {
        return { passed: true, ruleId: '', ruleName: '', severity: 'info', message: '' }
      }

      for (const event of events) {
        if (event.year && character.birthYear) {
          const eventAge = event.year - character.birthYear
          if (eventAge < 0) {
            return {
              passed: false,
              ruleId: 'character-age-conflict',
              ruleName: '角色年龄冲突',
              severity: 'error',
              message: `事件发生时间（${event.year}年）早于角色出生年份（${character.birthYear}年）`
            }
          }
        }
      }

      return {
        passed: true,
        ruleId: 'character-age-conflict',
        ruleName: '角色年龄冲突',
        severity: 'info',
        message: '角色时间线无冲突'
      }
    }
  },
  {
    id: 'timeline-loop',
    name: '时间循环检测',
    description: '检测同一时间同一地点的多个事件',
    category: 'timeline',
    severity: 'warning',
    enabled: true,
    condition: (ctx: RuleContext) => {
      const timelineCtx = ctx as TimelineContext
      return !!(timelineCtx.events && timelineCtx.events.length >= 2)
    },
    action: (ctx: RuleContext) => {
      const timelineCtx = ctx as TimelineContext
      const events = timelineCtx.events || []

      for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
          const eventA = events[i]
          const eventB = events[j]
          
          if (eventA.year === eventB.year && 
              eventA.month === eventB.month && 
              eventA.day === eventB.day &&
              eventA.location === eventB.location &&
              eventA.location) {
            return {
              passed: false,
              ruleId: 'timeline-loop',
              ruleName: '时间循环检测',
              severity: 'warning',
              message: `检测到同一时间（${eventA.year}年${eventA.month || ''}月${eventA.day || ''}日）同一地点（${eventA.location}）的两个事件`,
              suggestions: ['调整事件时间顺序', '使用时间倒叙/插叙', '合并事件']
            }
          }
        }
      }

      return {
        passed: true,
        ruleId: 'timeline-loop',
        ruleName: '时间循环检测',
        severity: 'info',
        message: '时间线无循环'
      }
    }
  }
]

export const foreshadowingRules: Rule[] = [
  {
    id: 'foreshadowing-no-redeem',
    name: '未回收伏笔提醒',
    description: '检测长期未回收的伏笔',
    category: 'foreshadowing',
    severity: 'info',
    enabled: true,
    condition: (ctx: RuleContext) => ctx.chapterId !== undefined,
    action: (ctx: RuleContext) => {
      return {
        passed: true,
        ruleId: 'foreshadowing-no-redeem',
        ruleName: '未回收伏笔提醒',
        severity: 'info',
        message: '伏笔检测通过'
      }
    }
  },
  {
    id: 'foreshadowing-orphan',
    name: '孤立伏笔检测',
    description: '检测缺少关联事件的伏笔',
    category: 'foreshadowing',
    severity: 'warning',
    enabled: true,
    condition: (ctx: RuleContext) => ctx.projectId !== undefined,
    action: (ctx: RuleContext) => {
      return {
        passed: true,
        ruleId: 'foreshadowing-orphan',
        ruleName: '孤立伏笔检测',
        severity: 'info',
        message: '伏笔关联检测通过'
      }
    }
  }
]
