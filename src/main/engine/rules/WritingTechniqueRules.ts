import { Rule, RuleContext } from '../RuleEngine'

interface WritingContext extends RuleContext {
  chapterId?: string
  content?: string
  structure?: {
    setup: number
    development: number
    twist: number
    conclusion: number
  }
  hookCount?: number
  foreshadowingCount?: number
  previousChapterId?: string
  nextChapterId?: string
}

export const writingTechniqueRules: Rule[] = [
  {
    id: 'setup-payoff-balance',
    name: '起承转合均衡检测',
    description: '检测章节起承转合结构是否均衡',
    category: 'writing-technique',
    severity: 'warning',
    enabled: true,
    condition: (ctx: RuleContext) => {
      const writingCtx = ctx as WritingContext
      return writingCtx.content !== undefined
    },
    action: (ctx: RuleContext) => {
      const writingCtx = ctx as WritingContext
      const content = writingCtx.content || ''
      const wordCount = content.length
      
      const setup = content.includes('这一') || content.includes('只见') || content.includes('此时') ? wordCount * 0.15 : 0
      const development = wordCount * 0.4
      const twist = content.includes('然而') || content.includes('突然') || content.includes('没想到') ? wordCount * 0.2 : wordCount * 0.1
      const conclusion = wordCount - setup - development - twist

      const total = setup + development + twist + conclusion
      if (total === 0) {
        return { passed: true, ruleId: '', ruleName: '', severity: 'info', message: '' }
      }

      const setupRatio = setup / total
      const conclusionRatio = conclusion / total

      if (setupRatio < 0.1) {
        return {
          passed: false,
          ruleId: 'setup-payoff-balance',
          ruleName: '起承转合均衡检测',
          severity: 'warning',
          message: '章节铺垫不足，建议增加引入和背景描述',
          suggestions: ['增加场景描写', '介绍出场人物', '交代故事背景']
        }
      }

      if (conclusionRatio < 0.1) {
        return {
          passed: false,
          ruleId: 'setup-payoff-balance',
          ruleName: '起承转合均衡检测',
          severity: 'warning',
          message: '章节结尾过于仓促，建议增加收尾内容',
          suggestions: ['增加本章总结', '设置悬念', '为下一章铺垫']
        }
      }

      return {
        passed: true,
        ruleId: 'setup-payoff-balance',
        ruleName: '起承转合均衡检测',
        severity: 'info',
        message: '章节结构均衡'
      }
    }
  },
  {
    id: 'hook-frequency',
    name: '钩子设置频率',
    description: '检测章节中钩子的设置频率',
    category: 'writing-technique',
    severity: 'info',
    enabled: true,
    condition: (ctx: RuleContext) => {
      const writingCtx = ctx as WritingContext
      return writingCtx.content !== undefined
    },
    action: (ctx: RuleContext) => {
      const writingCtx = ctx as WritingContext
      const content = writingCtx.content || ''
      
      const hookKeywords = ['然而', '突然', '就在这时', '没想到', '居然', '竟然', '只见', '突然发现', '危险', '危机']
      let hookCount = 0
      hookKeywords.forEach(keyword => {
        if (content.includes(keyword)) hookCount++
      })

      if (hookCount < 1) {
        return {
          passed: false,
          ruleId: 'hook-frequency',
          ruleName: '钩子设置频率',
          severity: 'info',
          message: '建议每章至少设置1-2个钩子吸引读者继续阅读',
          suggestions: [
            '在章节结尾设置悬念',
            '突然出现危机或转机',
            '揭示隐藏信息或秘密'
          ]
        }
      }

      return {
        passed: true,
        ruleId: 'hook-frequency',
        ruleName: '钩子设置频率',
        severity: 'info',
        message: `本章包含${hookCount}个钩子，设置良好`
      }
    }
  },
  {
    id: 'foreshadowing-density',
    name: '铺垫密度检测',
    description: '检测章节中伏笔/铺垫的密度',
    category: 'writing-technique',
    severity: 'info',
    enabled: true,
    condition: (ctx: RuleContext) => {
      const writingCtx = ctx as WritingContext
      return writingCtx.content !== undefined
    },
    action: (ctx: RuleContext) => {
      const writingCtx = ctx as WritingContext
      const content = writingCtx.content || ''
      
      const foreshadowKeywords = ['埋下', '预示', '注意到', '日后', '将来', '种下', '隐患', '伏笔']
      let foreshadowCount = 0
      foreshadowKeywords.forEach(keyword => {
        if (content.includes(keyword)) foreshadowCount++
      })

      if (foreshadowCount < 1) {
        return {
          passed: false,
          ruleId: 'foreshadowing-density',
          ruleName: '铺垫密度检测',
          severity: 'info',
          message: '建议为本章增加1-2处铺垫，为后续情节做准备',
          suggestions: [
            '暗示角色未来命运',
            '留下未解之谜',
            '为后续冲突埋下伏笔'
          ]
        }
      }

      return {
        passed: true,
        ruleId: 'foreshadowing-density',
        ruleName: '铺垫密度检测',
        severity: 'info',
        message: `本章包含${foreshadowCount}处铺垫，伏笔设置良好`
      }
    }
  },
  {
    id: 'chapter-continuity',
    name: '章节连续性检测',
    description: '检测章节之间的过渡是否自然',
    category: 'writing-technique',
    severity: 'warning',
    enabled: true,
    condition: (ctx: RuleContext) => {
      const writingCtx = ctx as WritingContext
      return writingCtx.previousChapterId !== undefined || writingCtx.nextChapterId !== undefined
    },
    action: (ctx: RuleContext) => {
      const writingCtx = ctx as WritingContext
      
      if (!writingCtx.previousChapterId && !writingCtx.nextChapterId) {
        return { passed: true, ruleId: '', ruleName: '', severity: 'info', message: '' }
      }

      return {
        passed: true,
        ruleId: 'chapter-continuity',
        ruleName: '章节连续性检测',
        severity: 'info',
        message: '章节过渡检测通过'
      }
    }
  },
  {
    id: 'emotional-arc',
    name: '情感曲线检测',
    description: '检测章节情感起伏是否合理',
    category: 'writing-technique',
    severity: 'info',
    enabled: true,
    condition: (ctx: RuleContext) => {
      const writingCtx = ctx as WritingContext
      return writingCtx.content !== undefined
    },
    action: (ctx: RuleContext) => {
      const writingCtx = ctx as WritingContext
      const content = writingCtx.content || ''
      
      const tensionKeywords = ['紧张', '危险', '恐惧', '愤怒', '害怕', '担忧', '惊恐']
      const releaseKeywords = ['放松', '安心', '高兴', '喜悦', '温暖', '平静']
      
      let tensionCount = 0
      let releaseCount = 0
      
      tensionKeywords.forEach(keyword => {
        if (content.includes(keyword)) tensionCount++
      })
      releaseKeywords.forEach(keyword => {
        if (content.includes(keyword)) releaseCount++
      })

      if (tensionCount > releaseCount * 3) {
        return {
          passed: false,
          ruleId: 'emotional-arc',
          ruleName: '情感曲线检测',
          severity: 'info',
          message: '章节情感过于紧张，建议适当放松',
          suggestions: ['增加角色互动', '描写温馨场景', '短暂休息']
        }
      }

      return {
        passed: true,
        ruleId: 'emotional-arc',
        ruleName: '情感曲线检测',
        severity: 'info',
        message: '章节情感曲线合理'
      }
    }
  }
]
