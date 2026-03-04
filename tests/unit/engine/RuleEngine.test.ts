import { describe, it, expect, beforeEach } from '@jest/globals'
import { RuleEngine, Rule, RuleContext, RuleResult } from '../../../src/main/engine/RuleEngine'
import { combatRules } from '../../../src/main/engine/rules/CombatRules'
import { writingTechniqueRules } from '../../../src/main/engine/rules/WritingTechniqueRules'
import { timelineRules, foreshadowingRules } from '../../../src/main/engine/rules/TimelineRules'

describe('RuleEngine', () => {
  let engine: RuleEngine

  beforeEach(() => {
    engine = new RuleEngine()
  })

  describe('Basic Operations', () => {
    it('should register a single rule', () => {
      const rule: Rule = {
        id: 'test-rule',
        name: 'Test Rule',
        description: 'A test rule',
        category: 'combat',
        severity: 'warning',
        enabled: true,
        condition: () => true,
        action: () => ({ passed: true, ruleId: 'test-rule', ruleName: '', severity: 'info', message: '' })
      }

      engine.registerRule(rule)
      expect(engine.getRule('test-rule')).toBeDefined()
    })

    it('should register multiple rules', () => {
      engine.registerRules(combatRules)
      expect(engine.getRules().length).toBeGreaterThan(0)
    })

    it('should enable/disable rules', () => {
      const rule: Rule = {
        id: 'toggle-test',
        name: 'Toggle Test',
        description: 'Test toggle',
        category: 'combat',
        severity: 'info',
        enabled: true,
        condition: () => true,
        action: () => ({ passed: true, ruleId: 'toggle-test', ruleName: '', severity: 'info', message: '' })
      }

      engine.registerRule(rule)
      engine.disableRule('toggle-test')
      expect(engine.getRule('toggle-test')?.enabled).toBe(false)

      engine.enableRule('toggle-test')
      expect(engine.getRule('toggle-test')?.enabled).toBe(true)
    })

    it('should get rules by category', () => {
      engine.registerRules(combatRules)
      engine.registerRules(writingTechniqueRules)

      const combatRulesList = engine.getRulesByCategory('combat')
      expect(combatRulesList.length).toBeGreaterThan(0)

      const writingRulesList = engine.getRulesByCategory('writing-technique')
      expect(writingRulesList.length).toBeGreaterThan(0)
    })
  })

  describe('Validation', () => {
    it('should validate context against all rules', () => {
      engine.registerRules(combatRules)
      engine.registerRules(writingTechniqueRules)

      const context: RuleContext = {
        projectId: 'test-project',
        chapterId: 'test-chapter',
        content: '这是一个测试章节内容。主角突然发现了一个秘密。'
      }

      const results = engine.validate(context)
      expect(Array.isArray(results)).toBe(true)
    })

    it('should validate context against specific category', () => {
      engine.registerRules(combatRules)
      engine.registerRules(writingTechniqueRules)

      const context: RuleContext = {
        projectId: 'test-project',
        content: '测试内容'
      }

      const results = engine.validateByCategory('writing-technique', context)
      results.forEach(result => {
        expect(result.ruleId).toBeDefined()
      })
    })

    it('should skip disabled rules during validation', () => {
      const disabledRule: Rule = {
        id: 'should-skip',
        name: 'Should Skip',
        description: 'This should be skipped',
        category: 'combat',
        severity: 'warning',
        enabled: false,
        condition: () => true,
        action: () => ({ passed: false, ruleId: 'should-skip', ruleName: '', severity: 'warning', message: 'Should not see this' })
      }

      engine.registerRule(disabledRule)

      const results = engine.validate({ projectId: 'test' })
      const found = results.find(r => r.ruleId === 'should-skip')
      expect(found).toBeUndefined()
    })
  })

  describe('Get Enabled/Disabled Rules', () => {
    it('should return only enabled rules', () => {
      const enabledRule: Rule = {
        id: 'enabled-rule',
        name: 'Enabled',
        description: '',
        category: 'combat',
        severity: 'info',
        enabled: true,
        condition: () => false,
        action: () => ({ passed: true, ruleId: '', ruleName: '', severity: 'info', message: '' })
      }

      const disabledRule: Rule = {
        id: 'disabled-rule',
        name: 'Disabled',
        description: '',
        category: 'combat',
        severity: 'info',
        enabled: false,
        condition: () => false,
        action: () => ({ passed: true, ruleId: '', ruleName: '', severity: 'info', message: '' })
      }

      engine.registerRule(enabledRule)
      engine.registerRule(disabledRule)

      const enabled = engine.getEnabledRules()
      expect(enabled.length).toBe(1)
      expect(enabled[0].id).toBe('enabled-rule')

      const disabled = engine.getDisabledRules()
      expect(disabled.length).toBe(1)
      expect(disabled[0].id).toBe('disabled-rule')
    })
  })
})
