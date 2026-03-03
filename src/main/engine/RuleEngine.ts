import log from 'electron-log'

export type RuleCategory = 'combat' | 'timeline' | 'foreshadowing' | 'consistency' | 'writing-technique'
export type RuleSeverity = 'info' | 'warning' | 'error'

export interface RuleContext {
  projectId: string
  chapterId?: string
  [key: string]: unknown
}

export interface RuleResult {
  passed: boolean
  ruleId: string
  ruleName: string
  severity: RuleSeverity
  message: string
  suggestions?: string[]
  location?: string
}

export interface Rule {
  id: string
  name: string
  description: string
  category: RuleCategory
  severity: RuleSeverity
  enabled: boolean
  condition: (context: RuleContext) => boolean
  action: (context: RuleContext) => RuleResult
}

export class RuleEngine {
  private rules: Map<string, Rule> = new Map()
  private rulesByCategory: Map<RuleCategory, Rule[]> = new Map()

  registerRule(rule: Rule): void {
    this.rules.set(rule.id, rule)
    
    if (!this.rulesByCategory.has(rule.category)) {
      this.rulesByCategory.set(rule.category, [])
    }
    this.rulesByCategory.get(rule.category)!.push(rule)
    
    log.info(`[RuleEngine] Registered rule: ${rule.id} (${rule.category})`)
  }

  registerRules(rules: Rule[]): void {
    rules.forEach(rule => this.registerRule(rule))
  }

  unregisterRule(ruleId: string): void {
    const rule = this.rules.get(ruleId)
    if (rule) {
      this.rules.delete(ruleId)
      const categoryRules = this.rulesByCategory.get(rule.category)
      if (categoryRules) {
        const index = categoryRules.findIndex(r => r.id === ruleId)
        if (index !== -1) {
          categoryRules.splice(index, 1)
        }
      }
      log.info(`[RuleEngine] Unregistered rule: ${ruleId}`)
    }
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId)
    if (rule) {
      rule.enabled = true
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId)
    if (rule) {
      rule.enabled = false
    }
  }

  validate(context: RuleContext): RuleResult[] {
    const results: RuleResult[] = []

    this.rules.forEach(rule => {
      if (!rule.enabled) {
        return
      }

      try {
        const shouldCheck = rule.condition(context)
        if (shouldCheck) {
          const result = rule.action(context)
          results.push(result)
          
          if (!result.passed) {
            log.debug(`[RuleEngine] Rule ${rule.id} failed: ${result.message}`)
          }
        }
      } catch (error) {
        log.error(`[RuleEngine] Rule ${rule.id} error:`, error)
      }
    })

    return results
  }

  validateByCategory(category: RuleCategory, context: RuleContext): RuleResult[] {
    const results: RuleResult[] = []
    const categoryRules = this.rulesByCategory.get(category) || []

    categoryRules.forEach(rule => {
      if (!rule.enabled) {
        return
      }

      try {
        const shouldCheck = rule.condition(context)
        if (shouldCheck) {
          const result = rule.action(context)
          results.push(result)
        }
      } catch (error) {
        log.error(`[RuleEngine] Rule ${rule.id} error:`, error)
      }
    })

    return results
  }

  getRules(): Rule[] {
    return Array.from(this.rules.values())
  }

  getRulesByCategory(category: RuleCategory): Rule[] {
    return this.rulesByCategory.get(category) || []
  }

  getRule(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId)
  }

  getEnabledRules(): Rule[] {
    return this.getRules().filter(r => r.enabled)
  }

  getDisabledRules(): Rule[] {
    return this.getRules().filter(r => !r.enabled)
  }
}

export const ruleEngine = new RuleEngine()
