import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { ProjectService } from './ProjectService'
import log from 'electron-log'

/**
 * @service CharacterService
 * @description 角色管理服务 - 负责小说的角色创建、编辑、关系管理
 * 
 * 主要功能：
 * - 角色的CRUD操作
 * - 角色关系图构建
 * - 角色数据导入导出
 * 
 * @example
 * // 创建主角
 * const protagonist = await characterService.saveCharacter(projectId, {
 *   name: "林逸",
 *   role: "protagonist",
 *   realm: "筑基初期",
 *   abilities: "御剑术,火球术"
 * });
 * 
 * // 构建关系图
 * const graph = await characterService.buildRelationshipGraph(projectId);
 * console.log(graph.nodes); // 角色节点
 * console.log(graph.edges); // 关系边
 */

export interface Character {
  id: string
  name: string
  nickname?: string
  gender?: string
  age?: string
  appearance: string
  personality: string
  background: string
  abilities: string
  role: string
  status: string
}

export interface CharacterRelationship {
  sourceId: string
  targetId: string
  type: string
  description: string
}

export interface RelationshipData {
  characters: Character[]
  relationships: CharacterRelationship[]
}

export class CharacterService {
  private projectService = new ProjectService()

  /**
   * 获取项目中的所有角色列表
   * @param {string} projectId - 项目ID
   * @returns {Character[]} 角色数组
   * @example
   * const characters = characterService.listCharacters(projectId);
   * characters.forEach(char => console.log(char.name));
   */
  listCharacters(projectId: string): Character[] {
    const projectPath = this.projectService.getProjectPath(projectId)
    const charsPath = join(projectPath, 'characters', 'characters.json')

    if (!existsSync(charsPath)) {
      return []
    }

    try {
      const data = JSON.parse(readFileSync(charsPath, 'utf-8'))
      return data.characters || []
    } catch (error) {
      log.error('Failed to load characters:', error)
      return []
    }
  }

  /**
   * 保存角色列表到项目
   * @param {string} projectId - 项目ID
   * @param {Character[]} characters - 角色数组
   * @example
   * await characterService.saveCharacters(projectId, [char1, char2]);
   */
  saveCharacters(projectId: string, characters: Character[]): void {
    const projectPath = this.projectService.getProjectPath(projectId)
    const charsDir = join(projectPath, 'characters')

    if (!existsSync(charsDir)) {
      mkdirSync(charsDir, { recursive: true })
    }

    writeFileSync(join(charsDir, 'characters.json'), JSON.stringify({ characters }, null, 2))
    log.info(`Characters saved for project: ${projectId}`)
  }

  /**
   * 获取角色的关系数据
   * @param {string} projectId - 项目ID
   * @returns {RelationshipData} 包含角色和关系的对象
   * @example
   * const { characters, relationships } = characterService.getRelationships(projectId);
   */
  getRelationships(projectId: string): RelationshipData {
    const projectPath = this.projectService.getProjectPath(projectId)
    const charsPath = join(projectPath, 'characters', 'characters.json')
    const relsPath = join(projectPath, 'characters', 'relationships.json')

    let characters: Character[] = []
    let relationships: CharacterRelationship[] = []

    if (existsSync(charsPath)) {
      try {
        const data = JSON.parse(readFileSync(charsPath, 'utf-8'))
        characters = data.characters || []
      } catch (error) {
        log.error('Failed to load characters:', error)
      }
    }

    if (existsSync(relsPath)) {
      try {
        const data = JSON.parse(readFileSync(relsPath, 'utf-8'))
        relationships = data.relationships || []
      } catch (error) {
        log.error('Failed to load relationships:', error)
      }
    }

    return { characters, relationships }
  }

  /**
   * 保存角色关系数据
   * @param {string} projectId - 项目ID
   * @param {RelationshipData} data - 角色和关系数据
   * @example
   * await characterService.saveRelationships(projectId, {
   *   characters: [char1, char2],
   *   relationships: [{ sourceId: '1', targetId: '2', type: '师徒' }]
   * });
   */
  saveRelationships(projectId: string, data: RelationshipData): void {
    const projectPath = this.projectService.getProjectPath(projectId)
    const charsDir = join(projectPath, 'characters')

    if (!existsSync(charsDir)) {
      mkdirSync(charsDir, { recursive: true })
    }

    writeFileSync(join(charsDir, 'characters.json'), JSON.stringify({ characters: data.characters }, null, 2))
    writeFileSync(join(charsDir, 'relationships.json'), JSON.stringify({ relationships: data.relationships }, null, 2))
    log.info(`Relationships saved for project: ${projectId}`)
  }
}
