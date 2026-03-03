export type RuleCategory = 'combat' | 'timeline' | 'foreshadowing' | 'consistency' | 'writing-technique'
export type RuleSeverity = 'info' | 'warning' | 'error'

export interface Rule {
  id: string
  name: string
  description: string
  category: RuleCategory
  severity: RuleSeverity
  enabled: boolean
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

export interface ValidationContext {
  projectId: string
  chapterId?: string
  content?: string
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

export const ruleApi = {
  // Get all rules
  getRules: () =>
    window.api.invoke<Rule[]>('rule:list'),
  
  getRulesByCategory: (category: RuleCategory) =>
    window.api.invoke<Rule[]>('rule:listByCategory', category),

  // Rule management
  enableRule: (ruleId: string) =>
    window.api.invoke<void>('rule:enable', ruleId),
  
  disableRule: (ruleId: string) =>
    window.api.invoke<void>('rule:disable', ruleId),

  // Validation
  validate: (context: ValidationContext) =>
    window.api.invoke<RuleResult[]>('rule:validate', context),
  
  validateCombat: (context: ValidationContext) =>
    window.api.invoke<RuleResult[]>('rule:validateCombat', context),
  
  validateWriting: (context: ValidationContext) =>
    window.api.invoke<RuleResult[]>('rule:validateWriting', context),
  
  validateTimeline: (context: ValidationContext) =>
    window.api.invoke<RuleResult[]>('rule:validateTimeline', context),

  // Quick check for content
  validateContent: (projectId: string, content: string) =>
    window.api.invoke<RuleResult[]>('rule:validateContent', { projectId, content }),
}
