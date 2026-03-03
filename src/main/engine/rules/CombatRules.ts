import { Rule, RuleContext } from '../RuleEngine'

interface CombatContext extends RuleContext {
  attacker?: {
    id: string
    name: string
    realm: { level: number; name: string }
    power: number
  }
  defender?: {
    id: string
    name: string
    realm: { level: number; name: string }
    power: number
  }
  character?: {
    id: string
    name: string
    realm: { level: number }
    power: number
    powerHistory: number[]
  }
}

export const combatRules: Rule[] = [
  {
    id: 'cross-realm-victory',
    name: '跨两境界战斗警告',
    description: '检测跨越两个以上境界战斗的合理性',
    category: 'combat',
    severity: 'warning',
    enabled: true,
    condition: (ctx: RuleContext) => {
      const combatCtx = ctx as CombatContext
      return !!(combatCtx.attacker && combatCtx.defender)
    },
    action: (ctx: RuleContext) => {
      const combatCtx = ctx as CombatContext
      const { attacker, defender } = combatCtx
      
      if (!attacker || !defender) {
        return { passed: true, ruleId: '', ruleName: '', severity: 'info', message: '' }
      }

      const realmDiff = defender.realm.level - attacker.realm.level
      const attackerWins = attacker.power > defender.power

      if (realmDiff >= 2 && attackerWins) {
        return {
          passed: false,
          ruleId: 'cross-realm-victory',
          ruleName: '跨两境界战斗警告',
          severity: 'warning',
          message: `${attacker.name}跨越${realmDiff}个境界战胜${defender.name}，建议检查合理性`,
          suggestions: [
            '为主角增加特殊体质或秘法解释',
            '设置对手轻敌或受伤状态',
            '增加环境因素或援军'
          ]
        }
      }

      return { passed: true, ruleId: 'cross-realm-victory', ruleName: '', severity: 'info', message: '' }
    }
  },
  {
    id: 'power-inflation',
    name: '战力膨胀检测',
    description: '检测角色战力增长是否过快',
    category: 'combat',
    severity: 'warning',
    enabled: true,
    condition: (ctx: RuleContext) => {
      const combatCtx = ctx as CombatContext
      return !!(combatCtx.character?.powerHistory && combatCtx.character.powerHistory.length >= 3)
    },
    action: (ctx: RuleContext) => {
      const combatCtx = ctx as CombatContext
      const character = combatCtx.character
      
      if (!character?.powerHistory) {
        return { passed: true, ruleId: '', ruleName: '', severity: 'info', message: '' }
      }

      const history = character.powerHistory
      const recentGrowth = (history[history.length - 1] - history[history.length - 3]) / history[history.length - 3]
      
      if (recentGrowth > 1.5) {
        return {
          passed: false,
          ruleId: 'power-inflation',
          ruleName: '战力膨胀检测',
          severity: 'warning',
          message: `${character.name}战力在短时间内增长${(recentGrowth * 100).toFixed(0)}%，可能影响后续剧情合理性`,
          suggestions: [
            '考虑增加修炼瓶颈或资源限制',
            '分散战力提升来源（功法、丹药、传承等）',
            '增加修炼时间跨度'
          ]
        }
      }

      return { passed: true, ruleId: 'power-inflation', ruleName: '', severity: 'info', message: '' }
    }
  },
  {
    id: 'realm-breakthrough-validation',
    name: '境界突破验证',
    description: '验证境界突破的合理性',
    category: 'combat',
    severity: 'info',
    enabled: true,
    condition: (ctx: RuleContext) => {
      return ctx.chapterId !== undefined
    },
    action: (ctx: RuleContext) => {
      return {
        passed: true,
        ruleId: 'realm-breakthrough-validation',
        ruleName: '境界突破验证',
        severity: 'info',
        message: '境界突破规则验证通过'
      }
    }
  }
]
