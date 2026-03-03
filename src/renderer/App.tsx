import { Routes, Route, Navigate } from 'react-router-dom'
import ProjectList from './views/ProjectList/ProjectList'
import Workspace from './views/Workspace/Workspace'
import OutlineEditor from './views/OutlineEditor/OutlineEditor'
import CharacterEditor from './views/CharacterEditor/CharacterEditor'
import WorldEditor from './views/WorldEditor/WorldEditor'
import WritingEditor from './views/WritingEditor/WritingEditor'
import Analysis from './views/Analysis/Analysis'
import Stats from './views/Stats/Stats'
import Settings from './views/Settings/Settings'
import InspirationManager from './views/Inspiration/InspirationManager'
import AIAssistant from './views/AIAssistant/AIAssistant'
import AICreator from './views/AICreator/AICreator'
import TagManager from './views/TagManager/TagManager'
import KnowledgeBase from './views/KnowledgeBase/KnowledgeBase'
import DraftEditor from './views/DraftEditor/DraftEditor'
import PublishPage from './views/PublishPage/PublishPage'
import { useProjectStore } from './stores/projectStore'

function App(): JSX.Element {
  const currentProject = useProjectStore((state) => state.currentProject)

  return (
    <Routes>
      <Route path="/" element={<ProjectList />} />
      <Route
        path="/workspace/:projectId"
        element={currentProject ? <Workspace /> : <Navigate to="/" />}
      >
        <Route index element={<OutlineEditor />} />
        <Route path="outline" element={<OutlineEditor />} />
        <Route path="characters" element={<CharacterEditor />} />
        <Route path="world" element={<WorldEditor />} />
        <Route path="writing" element={<WritingEditor />} />
        <Route path="inspiration" element={<InspirationManager />} />
        <Route path="tags" element={<TagManager />} />
        <Route path="ai" element={<AIAssistant />} />
        <Route path="ai-creator" element={<AICreator />} />
        <Route path="analysis" element={<Analysis />} />
        <Route path="stats" element={<Stats />} />
        <Route path="knowledge-base" element={<KnowledgeBase />} />
        <Route path="drafts" element={<DraftEditor />} />
        <Route path="publish" element={<PublishPage />} />
      </Route>
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}

export default App
