import { LaboratoryLayout } from './components/layout/LaboratoryLayout'
import { useSimulation } from './hooks/useSimulation'
import './styles/laboratory.css'

export default function App() {
  const { snapshot, controller } = useSimulation()
  return <LaboratoryLayout snapshot={snapshot} controller={controller} />
}
