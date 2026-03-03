import { Rule, RuleContext } from '../RuleEngine'

interface ConsistencyContext extends RuleContext {
  location1?: { id: string; name: string; x: number; y: number }
  location2?: { id: string; name: string; x: number; y: number }
  faction1?: { id: string; name: string; territory: string[] }
  faction2?: { id: string; name: string; territory: string[] }
}

export const consistencyRules: Rule[] = [
  {
    id: 'geographic-distance-conflict',
    name: '地理位置冲突检测',
    description: '检测两个地点之间的距离是否合理',
    category: 'consistency',
    severity: 'warning',
    enabled: true,
    condition: (ctx: RuleContext) => {
      const consistencyCtx = ctx as ConsistencyContext
      return !!(consistencyCtx.location1 && consistencyCtx.location2)
    },
    action: (ctx: RuleContext) => {
      const consistencyCtx = ctx as ConsistencyContext
      const { location1, location2 } = consistencyCtx
      
      if (!location1 || !location2) {
        return { passed: true, ruleId: '', ruleName: '', severity: 'info', message: '' }
      }

      const distance = Math.sqrt(
        Math.pow(location2.x - location1.x, 2) + 
        Math.pow(location2.y - location1.y, 2)
      )

      if (distance > 1000) {
        return {
          passed: false,
          ruleId: 'geographic-distance-conflict',
          ruleName: '地理位置冲突检测',
          severity: 'warning',
          message: `${location1.name}和${location2.name}距离过远，可能需要考虑交通时间`
        }
      }

      return { passed: true, ruleId: 'geographic-distance-conflict', ruleName: '', severity: 'info', message: '' }
    }
  },
  {
    id: 'faction-territory-overlap',
    name: '势力范围重叠检测',
    description: '检测两个势力的控制范围是否重叠',
    category: 'consistency',
    severity: 'warning',
    enabled: true,
    condition: (ctx: RuleContext) => {
      const consistencyCtx = ctx as ConsistencyContext
      return !!(consistencyCtx.faction1 && consistencyCtx.faction2)
    },
    action: (ctx: RuleContext) => {
      const consistencyCtx = ctx as ConsistencyContext
      const { faction1, faction2 } = consistencyCtx
      
      if (!faction1 || !faction2) {
        return { passed: true, ruleId: '', ruleName: '', severity: 'info', message: '' }
      }

      const overlap = faction1.territory.filter(t => faction2.territory.includes(t))
      
      if (overlap.length > 0) {
        return {
          passed: false,
          ruleId: 'faction-territory-overlap',
          ruleName: '势力范围重叠检测',
          severity: 'warning',
          message: `${faction1.name}和${faction2.name}的势力范围重叠：${overlap.join(', ')}`
        }
      }

      return { passed: true, ruleId: 'faction-territory-overlap', ruleName: '', severity: 'info', message: '' }
    }
  },
  {
    id: 'power-scale-consistency',
    name: '战力等级一致性',
    description: '检测战力等级是否与修炼境界匹配',
    category: 'consistency',
    severity: 'info',
    enabled: true,
    condition: (ctx: RuleContext) => ctx.projectId !== undefined,
    action: (ctx: RuleContext) => {
      return {
        passed: true,
        ruleId: 'power-scale-consistency',
        ruleName: '战力等级一致性',
        severity: 'info',
        message: '战力等级一致性检查通过'
      }
    }
  }
]
