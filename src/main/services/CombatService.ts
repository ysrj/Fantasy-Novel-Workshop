import { ProjectService } from './ProjectService'
import log from 'electron-log'

export interface PowerLevel {
  id: string
  name: string
  realm: string
  stage?: string
  value: number
  combatPower: number
  description?: string
}

export interface PowerScale {
  levels: PowerLevel[]
  baseMultiplier: number
  realmMultiplier: Record<string, number>
}

export interface Battle {
  id: string
  chapterId?: string
  attackerId: string
  attackerRealm: string
  defenderId: string
  defenderRealm: string
  result: 'win' | 'lose' | 'draw'
  description?: string
}

export interface BattleValidation {
  id: string
  battleId: string
  type: 'realm_cross' | 'power_gap' | '合理性'
  characterId: string
  realm: string
  powerLevel: number
  powerDifference: number
  isReasonable: boolean
  autoApproved: boolean
  details: string
}

export interface CombatWarning {
  id: string
  type: '越级挑战' | '战力崩盘' | '境界冲突'
  severity: 'low' | 'medium' | 'high'
  message: string
  relatedEntities: string[]
}

export interface CombatData {
  powerScale: PowerScale
  battleRecords: Battle[]
  warnings: CombatWarning[]
  validations: BattleValidation[]
}

const DEFAULT_COMBAT_DATA: CombatData = {
  powerScale: {
    levels: [
      { id: 'realm-1', name: '炼气期', realm: '炼气期', value: 1, combatPower: 100, description: '修炼入门' },
      { id: 'realm-2', name: '筑基期', realm: '筑基期', value: 2, combatPower: 1000, description: '奠定仙基' },
      { id: 'realm-3', name: '金丹期', realm: '金丹期', value: 3, combatPower: 10000, description: '结成金丹' },
      { id: 'realm-4', name: '元婴期', realm: '元婴期', value: 4, combatPower: 100000, description: '婴儿出窍' },
      { id: 'realm-5', name: '化神期', realm: '化神期', value: 5, combatPower: 1000000, description: '化神返虚' }
    ],
    baseMultiplier: 1,
    realmMultiplier: {}
  },
  battleRecords: [],
  warnings: [],
  validations: []
}

export class CombatService {
  private projectService = new ProjectService()

  loadCombatData(projectId: string): CombatData {
    const projectPath = this.projectService.getProjectPath(projectId)
    const worldPath = require('path').join(projectPath, 'world', 'world_data.json')
    
    try {
      if (require('fs').existsSync(worldPath)) {
        const worldData = JSON.parse(require('fs').readFileSync(worldPath, 'utf-8'))
        return worldData.combat || DEFAULT_COMBAT_DATA
      }
    } catch (error) {
      log.error('Failed to load combat data:', error)
    }
    
    return DEFAULT_COMBAT_DATA
  }

  saveCombatData(projectId: string, combatData: CombatData): void {
    const projectPath = this.projectService.getProjectPath(projectId)
    const worldPath = require('path').join(projectPath, 'world', 'world_data.json')
    
    try {
      let worldData: any = {}
      if (require('fs').existsSync(worldPath)) {
        worldData = JSON.parse(require('fs').readFileSync(worldPath, 'utf-8'))
      }
      
      worldData.combat = combatData
      require('fs').writeFileSync(worldPath, JSON.stringify(worldData, null, 2))
      log.info(`Combat data saved for project: ${projectId}`)
    } catch (error) {
      log.error('Failed to save combat data:', error)
      throw error
    }
  }

  calculateCombatPower(realm: string, basePower: number, powerScale: PowerScale): number {
    const realmLevel = powerScale.levels.find(l => l.realm === realm)
    if (!realmLevel) return basePower
    
    const multiplier = powerScale.realmMultiplier[realm] || powerScale.baseMultiplier
    return Math.floor(realmLevel.combatPower * multiplier * (basePower / 100))
  }

  validateBattle(
    battle: Battle,
    powerScale: PowerScale,
    realmOrder: Record<string, number>
  ): BattleValidation {
    const attackerLevel = powerScale.levels.find(l => l.realm === battle.attackerRealm)
    const defenderLevel = powerScale.levels.find(l => l.realm === battle.defenderRealm)
    
    if (!attackerLevel || !defenderLevel) {
      return {
        id: `validation-${Date.now()}`,
        battleId: battle.id,
        type: '合理性',
        characterId: battle.attackerId,
        realm: battle.attackerRealm,
        powerLevel: attackerLevel?.value || 0,
        powerDifference: 0,
        isReasonable: false,
        autoApproved: false,
        details: '境界未定义'
      }
    }
    
    const attackerOrder = realmOrder[battle.attackerRealm] || 0
    const defenderOrder = realmOrder[battle.defenderRealm] || 0
    const powerDiff = attackerLevel.combatPower - defenderLevel.combatPower
    
    const isReasonable = battle.result === 'win' 
      ? attackerLevel.combatPower >= defenderLevel.combatPower || powerDiff > -5000
      : true
    
    const autoApproved = Math.abs(powerDiff) > 50000
    
    let type: BattleValidation['type'] = '合理性'
    if (Math.abs(attackerOrder - defenderOrder) > 1) {
      type = 'realm_cross'
    } else if (Math.abs(powerDiff) > 100000) {
      type = 'power_gap'
    }
    
    return {
      id: `validation-${Date.now()}`,
      battleId: battle.id,
      type,
      characterId: battle.attackerId,
      realm: battle.attackerRealm,
      powerLevel: attackerLevel.value,
      powerDifference: Math.abs(powerDiff),
      isReasonable,
      autoApproved,
      details: `${battle.attackerRealm}的${battle.attackerId}vs${battle.defenderRealm}的${battle.defenderId}，战力差${powerDiff}`
    }
  }

  validateAllBattles(
    battleRecords: Battle[],
    powerScale: PowerScale,
    realms: PowerLevel[]
  ): { warnings: CombatWarning[]; validations: BattleValidation[] } {
    const warnings: CombatWarning[] = []
    const validations: BattleValidation[] = []
    
    const realmOrder: Record<string, number> = {}
    realms.forEach(r => { realmOrder[r.realm] = r.value })
    
    battleRecords.forEach(battle => {
      const validation = this.validateBattle(battle, powerScale, realmOrder)
      validations.push(validation)
      
      if (!validation.isReasonable && !validation.autoApproved) {
        warnings.push({
          id: `warning-${battle.id}`,
          type: '战力崩盘',
          severity: 'high',
          message: validation.details,
          relatedEntities: [battle.attackerId, battle.defenderId]
        })
      }
      
      const attackerOrder = realmOrder[battle.attackerRealm] || 0
      const defenderOrder = realmOrder[battle.defenderRealm] || 0
      
      if (Math.abs(attackerOrder - defenderOrder) > 1) {
        warnings.push({
          id: `warning-cross-${battle.id}`,
          type: '越级挑战',
          severity: Math.abs(attackerOrder - defenderOrder) > 2 ? 'high' : 'medium',
          message: `${battle.attackerRealm}跨越${Math.abs(attackerOrder - defenderOrder)}个境界挑战${battle.defenderRealm}`,
          relatedEntities: [battle.attackerId, battle.defenderId]
        })
      }
    })
    
    return { warnings, validations }
  }

  addPowerLevel(projectId: string, powerLevel: PowerLevel): void {
    const data = this.loadCombatData(projectId)
    const exists = data.powerScale.levels.find(l => l.id === powerLevel.id)
    
    if (!exists) {
      data.powerScale.levels.push(powerLevel)
      data.powerScale.levels.sort((a, b) => a.value - b.value)
      this.saveCombatData(projectId, data)
    }
  }

  addBattleRecord(projectId: string, battle: Battle): void {
    const data = this.loadCombatData(projectId)
    data.battleRecords.push(battle)
    
    const realmOrder: Record<string, number> = {}
    data.powerScale.levels.forEach(l => { realmOrder[l.realm] = l.value })
    
    const { warnings, validations } = this.validateAllBattles(
      data.battleRecords,
      data.powerScale,
      data.powerScale.levels
    )
    
    data.warnings = warnings
    data.validations = validations
    
    this.saveCombatData(projectId, data)
  }

  getPowerComparison(realm1: string, realm2: string, powerScale: PowerScale): { ratio: number; advantage: string } {
    const level1 = powerScale.levels.find(l => l.realm === realm1)
    const level2 = powerScale.levels.find(l => l.realm === realm2)
    
    if (!level1 || !level2) {
      return { ratio: 1, advantage: 'unknown' }
    }
    
    const ratio = level1.combatPower / level2.combatPower
    const advantage = ratio > 1 ? realm1 : ratio < 1 ? realm2 : 'equal'
    
    return { ratio, advantage }
  }
}

export const combatService = new CombatService()
