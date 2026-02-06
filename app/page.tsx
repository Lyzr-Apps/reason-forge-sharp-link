'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Float, MeshDistortMaterial, Sphere, Box, RoundedBox, Cylinder, Environment, PerspectiveCamera, useTexture, Html, Center, Trail } from '@react-three/drei'
import * as THREE from 'three'
import { callAIAgent, type AIAgentResponse, type NormalizedAgentResponse } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, XCircle, TrendingUp, Clock, Search, Plus, ArrowRight, Shield, Target, Brain, X, Zap, Activity, GitBranch } from 'lucide-react'

// ============================================================================
// TYPES - Based on actual response schemas
// ============================================================================

interface CausalChain {
  chain_id: string
  cause: string
  effect: string
  mechanism: string
  strength: string
  intermediary_steps: string[]
}

interface Confounder {
  variable: string
  affects: string[]
  impact: string
}

interface Dependency {
  variable_a: string
  variable_b: string
  relationship_type: string
  direction: string
}

interface CausalAnalysisResult {
  causal_chains: CausalChain[]
  confounders: Confounder[]
  dependencies: Dependency[]
  feedback_loops: string[]
}

interface ValidationCheck {
  check_id: string
  aspect_validated: string
  result: string
  explanation: string
  severity: string
}

interface CommonSenseValidationResult {
  validation_checks: ValidationCheck[]
  implausible_conclusions: any[]
  logical_consistency_score: number
  real_world_grounding_score: number
  overall_validity: string
  recommendations: string[]
}

interface ConfidenceBreakdown {
  claim: string
  confidence_percentage: number
  uncertainty_type: string
  reasoning: string
}

interface KnowledgeGap {
  gap_id: string
  description: string
  impact_on_conclusions: string
  potential_resolution: string
}

interface CriticalAssumption {
  assumption: string
  justification: string
  risk_if_violated: string
  verifiability: string
}

interface UncertaintyMetrics {
  epistemic_uncertainty: number
  aleatory_uncertainty: number
  total_uncertainty: number
}

interface UncertaintyQuantifierResult {
  overall_confidence: number
  confidence_breakdown: ConfidenceBreakdown[]
  knowledge_gaps: KnowledgeGap[]
  critical_assumptions: CriticalAssumption[]
  uncertainty_metrics: UncertaintyMetrics
}

interface ChallengedClaim {
  original_claim: string
  challenge: string
  severity: string
}

interface AlternativeExplanation {
  explanation: string
  plausibility_score: number
  supporting_evidence: string[]
  key_differences: string[]
}

interface StressTestResult {
  test_name: string
  outcome: string
  findings: string
}

interface ReasoningChallengerResult {
  challenge_summary: string
  challenged_claims: ChallengedClaim[]
  alternative_explanations: AlternativeExplanation[]
  stress_test_results: StressTestResult[]
  strengthened_reasoning: string[]
  revised_conclusion: string
  evidence_needed: string[]
}

interface ReasoningOrchestratorResult {
  problem_summary: string
  causal_analysis: CausalAnalysisResult
  validation_results: CommonSenseValidationResult
  uncertainty_assessment: UncertaintyQuantifierResult
  synthesis: {
    key_insights: string[]
    confidence_level: string
    recommended_actions: string[]
    caveats: string[]
  }
}

interface AnalysisItem {
  id: string
  problem: string
  timestamp: number
  confidence: number
  status: 'completed' | 'in_progress' | 'failed'
  result?: ReasoningOrchestratorResult
  topic?: string
}

// ============================================================================
// 3D COMPONENTS
// ============================================================================

// Animated Background Particles
function BackgroundParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  const count = 500

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 50
    positions[i + 1] = (Math.random() - 0.5) * 50
    positions[i + 2] = (Math.random() - 0.5) * 50

    // Deep navy to electric blue gradient
    const t = Math.random()
    colors[i] = 0.1 + t * 0.13     // R
    colors[i + 1] = 0.12 + t * 0.39  // G
    colors[i + 2] = 0.21 + t * 0.75  // B
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.6} />
    </points>
  )
}

// Floating 3D Brain Icon
function BrainSphere({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh position={position}>
        <Sphere args={[0.8, 32, 32]}>
          <MeshDistortMaterial
            color="#3b82f6"
            attach="material"
            distort={0.3}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </mesh>
    </Float>
  )
}

// 3D Confidence Meter
function Confidence3DMeter({ confidence, position }: { confidence: number; position: [number, number, number] }) {
  const barRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (barRef.current) {
      const targetScale = confidence / 100
      barRef.current.scale.x = THREE.MathUtils.lerp(barRef.current.scale.x, targetScale, 0.1)
    }
  })

  const color = confidence >= 75 ? '#10b981' : confidence >= 50 ? '#3b82f6' : '#f59e0b'

  return (
    <group position={position}>
      <RoundedBox args={[3, 0.3, 0.1]} radius={0.05} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1f36" opacity={0.3} transparent />
      </RoundedBox>
      <mesh ref={barRef} position={[-1.5, 0, 0.05]} scale={[1, 1, 1]}>
        <boxGeometry args={[3, 0.3, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.2}
        color="#3b82f6"
        anchorX="center"
        anchorY="middle"
      >
        {confidence.toFixed(0)}% Confidence
      </Text>
    </group>
  )
}

// 3D Causal Chain Node
function CausalNode({ label, position, color = "#3b82f6" }: { label: string; position: [number, number, number]; color?: string }) {
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
      <group position={position}>
        <RoundedBox args={[1.2, 0.6, 0.3]} radius={0.1}>
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            metalness={0.5}
            roughness={0.3}
          />
        </RoundedBox>
        <Text
          position={[0, 0, 0.16]}
          fontSize={0.12}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={1}
        >
          {label.substring(0, 30)}...
        </Text>
      </group>
    </Float>
  )
}

// 3D Arrow Connection
function Arrow3D({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const direction = new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2])
  const length = direction.length()
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2
  ]

  direction.normalize()
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)

  return (
    <group position={midpoint} quaternion={quaternion}>
      <Cylinder args={[0.02, 0.02, length, 8]}>
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
      </Cylinder>
      <mesh position={[0, length / 2, 0]}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

// Loading Animation 3D
function LoadingAnimation3D() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime
    }
  })

  return (
    <group ref={groupRef}>
      <BrainSphere position={[0, 0, 0]} />
      <Trail width={2} length={6} color="#3b82f6" attenuation={(t) => t * t}>
        <mesh position={[2, 0, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1} />
        </mesh>
      </Trail>
      <Trail width={2} length={6} color="#10b981" attenuation={(t) => t * t}>
        <mesh position={[-2, 0, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1} />
        </mesh>
      </Trail>
      <Trail width={2} length={6} color="#f59e0b" attenuation={(t) => t * t}>
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1} />
        </mesh>
      </Trail>
    </group>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ReasonForgeAI() {
  const [view, setView] = useState<'dashboard' | 'workspace'>('dashboard')
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisItem[]>([])
  const [currentProblem, setCurrentProblem] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<ReasoningOrchestratorResult | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [challengeResult, setChallengeResult] = useState<ReasoningChallengerResult | null>(null)
  const [selectedConclusion, setSelectedConclusion] = useState('')
  const [isChallengng, setIsChallenging] = useState(false)

  // Agent IDs
  const REASONING_ORCHESTRATOR_ID = '69858540b90162af337b1e2d'
  const REASONING_CHALLENGER_ID = '69858572ab4bf65a66ad076c'

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('reasonforge_history')
    if (saved) {
      try {
        setAnalysisHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load history:', e)
      }
    }
  }, [])

  // Save history to localStorage
  useEffect(() => {
    if (analysisHistory.length > 0) {
      localStorage.setItem('reasonforge_history', JSON.stringify(analysisHistory))
    }
  }, [analysisHistory])

  // Handle analysis
  const handleAnalyze = async () => {
    if (!currentProblem.trim() || currentProblem.length < 10) {
      alert('Please enter a problem statement (minimum 10 characters)')
      return
    }

    setIsAnalyzing(true)
    setCurrentAnalysis(null)

    const analysisId = Date.now().toString()
    const newAnalysis: AnalysisItem = {
      id: analysisId,
      problem: currentProblem,
      timestamp: Date.now(),
      confidence: 0,
      status: 'in_progress',
      topic: extractTopic(currentProblem)
    }

    setAnalysisHistory(prev => [newAnalysis, ...prev])

    try {
      const response = await callAIAgent(REASONING_ORCHESTRATOR_ID, currentProblem, [])

      // Parse response
      let parsedResult: ReasoningOrchestratorResult

      if (typeof response === 'string') {
        // Handle markdown-wrapped JSON
        const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        parsedResult = JSON.parse(cleanJson)
      } else {
        parsedResult = response as ReasoningOrchestratorResult
      }

      const confidence = parsedResult.uncertainty_assessment?.overall_confidence || 0

      setCurrentAnalysis(parsedResult)

      // Update history
      setAnalysisHistory(prev => prev.map(item =>
        item.id === analysisId
          ? { ...item, result: parsedResult, confidence, status: 'completed' as const }
          : item
      ))

    } catch (error) {
      console.error('Analysis failed:', error)
      setAnalysisHistory(prev => prev.map(item =>
        item.id === analysisId
          ? { ...item, status: 'failed' as const }
          : item
      ))
      alert('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Handle challenge
  const handleChallenge = async (conclusion: string) => {
    setSelectedConclusion(conclusion)
    setShowChallengeModal(true)
    setIsChallenging(true)
    setChallengeResult(null)

    try {
      const challengePrompt = `Challenge this conclusion: "${conclusion}"\n\nOriginal problem: ${currentProblem}`
      const response = await callAIAgent(REASONING_CHALLENGER_ID, challengePrompt, [])

      let parsedResult: ReasoningChallengerResult

      if (typeof response === 'string') {
        const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        parsedResult = JSON.parse(cleanJson)
      } else {
        parsedResult = response as ReasoningChallengerResult
      }

      setChallengeResult(parsedResult)
    } catch (error) {
      console.error('Challenge failed:', error)
      alert('Challenge failed. Please try again.')
    } finally {
      setIsChallenging(false)
    }
  }

  // Extract topic from problem
  const extractTopic = (problem: string): string => {
    const words = problem.toLowerCase().split(' ')
    const keywords = ['employee', 'student', 'climate', 'business', 'health', 'technology', 'education']
    for (const keyword of keywords) {
      if (words.some(w => w.includes(keyword))) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1)
      }
    }
    return 'General'
  }

  // Filter history
  const filteredHistory = analysisHistory.filter(item =>
    item.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Stats
  const totalAnalyses = analysisHistory.length
  const avgConfidence = analysisHistory.length > 0
    ? analysisHistory.filter(a => a.confidence > 0).reduce((sum, a) => sum + a.confidence, 0) / analysisHistory.filter(a => a.confidence > 0).length
    : 0
  const topTopics = Array.from(new Set(analysisHistory.map(a => a.topic).filter(Boolean))).slice(0, 3)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#1a1f36] to-[#0a0f1e] text-white">
      {/* 3D Background Canvas */}
      <div className="fixed inset-0 z-0">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} />
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
          <Suspense fallback={null}>
            <BackgroundParticles />
            <Environment preset="night" />
          </Suspense>
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
        </Canvas>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-[#1a1f36]/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#3b82f6] to-[#10b981] rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#10b981] bg-clip-text text-transparent">
                ReasonForge AI
              </h1>
              <p className="text-xs text-gray-400">Causal Reasoning & Explainability Platform</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant={view === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setView('dashboard')}
              className={view === 'dashboard' ? 'bg-[#3b82f6] hover:bg-[#3b82f6]/90' : 'border-white/20 hover:bg-white/10'}
            >
              <Target className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={view === 'workspace' ? 'default' : 'outline'}
              onClick={() => setView('workspace')}
              className={view === 'workspace' ? 'bg-[#3b82f6] hover:bg-[#3b82f6]/90' : 'border-white/20 hover:bg-white/10'}
            >
              <Brain className="w-4 h-4 mr-2" />
              Workspace
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-8">
        {view === 'dashboard' ? (
          <DashboardView
            totalAnalyses={totalAnalyses}
            avgConfidence={avgConfidence}
            topTopics={topTopics}
            filteredHistory={filteredHistory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setView={setView}
            setCurrentProblem={setCurrentProblem}
            setCurrentAnalysis={setCurrentAnalysis}
          />
        ) : (
          <WorkspaceView
            currentProblem={currentProblem}
            setCurrentProblem={setCurrentProblem}
            isAnalyzing={isAnalyzing}
            handleAnalyze={handleAnalyze}
            currentAnalysis={currentAnalysis}
            handleChallenge={handleChallenge}
          />
        )}
      </main>

      {/* Challenge Modal */}
      {showChallengeModal && (
        <ChallengeModal
          selectedConclusion={selectedConclusion}
          isChallenging={isChallenging}
          challengeResult={challengeResult}
          onClose={() => {
            setShowChallengeModal(false)
            setChallengeResult(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// DASHBOARD VIEW
// ============================================================================

function DashboardView({
  totalAnalyses,
  avgConfidence,
  topTopics,
  filteredHistory,
  searchQuery,
  setSearchQuery,
  setView,
  setCurrentProblem,
  setCurrentAnalysis
}: {
  totalAnalyses: number
  avgConfidence: number
  topTopics: (string | undefined)[]
  filteredHistory: AnalysisItem[]
  searchQuery: string
  setSearchQuery: (q: string) => void
  setView: (v: 'dashboard' | 'workspace') => void
  setCurrentProblem: (p: string) => void
  setCurrentAnalysis: (a: ReasoningOrchestratorResult | null) => void
}) {
  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10 hover:border-[#3b82f6]/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#3b82f6]">{totalAnalyses}</div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10 hover:border-[#10b981]/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[#10b981]">
              {avgConfidence > 0 ? `${avgConfidence.toFixed(0)}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10 hover:border-[#f59e0b]/50 transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Top Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topTopics.length > 0 ? (
                topTopics.map((topic, idx) => (
                  <Badge key={idx} variant="outline" className="border-[#f59e0b] text-[#f59e0b]">
                    {topic}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">No topics yet</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and New Analysis */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search analyses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1a1f36]/60 border-white/10 focus:border-[#3b82f6] text-white placeholder:text-gray-500"
          />
        </div>
        <Button
          onClick={() => setView('workspace')}
          className="bg-gradient-to-r from-[#3b82f6] to-[#10b981] hover:from-[#3b82f6]/90 hover:to-[#10b981]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      </div>

      {/* History Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Analysis History</h2>
        {filteredHistory.length === 0 ? (
          <Card className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10">
            <CardContent className="py-16 text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold mb-2">No analyses yet</h3>
              <p className="text-gray-400 mb-6">Start your first causal reasoning analysis</p>
              <Button
                onClick={() => setView('workspace')}
                className="bg-[#3b82f6] hover:bg-[#3b82f6]/90"
              >
                Start Analysis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHistory.map((analysis) => (
              <Card
                key={analysis.id}
                className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10 hover:border-[#3b82f6]/50 transition-all cursor-pointer group"
                onClick={() => {
                  if (analysis.result) {
                    setCurrentProblem(analysis.problem)
                    setCurrentAnalysis(analysis.result)
                    setView('workspace')
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium line-clamp-2 group-hover:text-[#3b82f6] transition-colors">
                      {analysis.problem}
                    </CardTitle>
                    {analysis.status === 'completed' && (
                      <CheckCircle2 className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                    )}
                    {analysis.status === 'in_progress' && (
                      <Loader2 className="w-5 h-5 text-[#3b82f6] animate-spin flex-shrink-0" />
                    )}
                    {analysis.status === 'failed' && (
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3" />
                    {new Date(analysis.timestamp).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.topic && (
                      <Badge variant="outline" className="border-[#3b82f6] text-[#3b82f6]">
                        {analysis.topic}
                      </Badge>
                    )}
                    {analysis.confidence > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Confidence</span>
                          <span className="font-medium text-[#10b981]">{analysis.confidence.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#3b82f6] to-[#10b981] transition-all duration-500"
                            style={{ width: `${analysis.confidence}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// WORKSPACE VIEW
// ============================================================================

function WorkspaceView({
  currentProblem,
  setCurrentProblem,
  isAnalyzing,
  handleAnalyze,
  currentAnalysis,
  handleChallenge
}: {
  currentProblem: string
  setCurrentProblem: (p: string) => void
  isAnalyzing: boolean
  handleAnalyze: () => void
  currentAnalysis: ReasoningOrchestratorResult | null
  handleChallenge: (c: string) => void
}) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Panel */}
      <div className="space-y-6">
        <Card className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#3b82f6]" />
              Problem Statement
            </CardTitle>
            <CardDescription>
              Enter a complex problem for causal reasoning analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Why do employees leave companies? What are the causal relationships and key factors?"
              value={currentProblem}
              onChange={(e) => setCurrentProblem(e.target.value)}
              className="min-h-[200px] bg-[#0a0f1e]/50 border-white/10 focus:border-[#3b82f6] text-white placeholder:text-gray-500 resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {currentProblem.length} characters
              </span>
              {currentProblem.length < 10 && currentProblem.length > 0 && (
                <span className="text-sm text-red-400">Minimum 10 characters required</span>
              )}
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || currentProblem.length < 10}
              className="w-full bg-gradient-to-r from-[#3b82f6] to-[#10b981] hover:from-[#3b82f6]/90 hover:to-[#10b981]/90 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analyze Problem
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 3D Visualization when analyzing */}
        {isAnalyzing && (
          <div className="h-[400px] rounded-lg overflow-hidden border border-white/10 bg-[#0a0f1e]/50">
            <Canvas>
              <PerspectiveCamera makeDefault position={[0, 0, 8]} />
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
              <Suspense fallback={null}>
                <LoadingAnimation3D />
                <Environment preset="night" />
              </Suspense>
              <OrbitControls enableZoom={false} />
            </Canvas>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-lg font-semibold text-white mb-2">Reasoning in progress...</p>
                <p className="text-sm text-gray-400">Analyzing causal relationships</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Panel */}
      <div className="space-y-6">
        {currentAnalysis ? (
          <>
            {/* Overall Confidence */}
            <Card className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-[#10b981]" />
                  Overall Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-5xl font-bold text-[#10b981]">
                    {currentAnalysis.uncertainty_assessment.overall_confidence.toFixed(0)}%
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#3b82f6] to-[#10b981] transition-all duration-1000"
                      style={{ width: `${currentAnalysis.uncertainty_assessment.overall_confidence}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Epistemic</p>
                      <p className="font-semibold">{currentAnalysis.uncertainty_assessment.uncertainty_metrics.epistemic_uncertainty.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Aleatory</p>
                      <p className="font-semibold">{currentAnalysis.uncertainty_assessment.uncertainty_metrics.aleatory_uncertainty.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Causal Chains */}
            <Card className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10">
              <CardHeader
                className="cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleSection('causal')}
              >
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-[#3b82f6]" />
                    Causal Chains ({currentAnalysis.causal_analysis.causal_chains.length})
                  </span>
                  {expandedSections['causal'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </CardTitle>
              </CardHeader>
              {expandedSections['causal'] && (
                <CardContent className="space-y-4">
                  {currentAnalysis.causal_analysis.causal_chains.map((chain, idx) => (
                    <div key={chain.chain_id} className="p-4 bg-[#0a0f1e]/50 rounded-lg border border-white/10 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-[#3b82f6]">{chain.cause}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="font-semibold text-[#10b981]">{chain.effect}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        <p><span className="font-medium text-white">Mechanism:</span> {chain.mechanism}</p>
                        <p><span className="font-medium text-white">Strength:</span> {chain.strength}</p>
                      </div>
                      {chain.intermediary_steps.length > 0 && (
                        <div className="text-sm">
                          <p className="font-medium text-white mb-2">Steps:</p>
                          <ol className="list-decimal list-inside space-y-1 text-gray-400">
                            {chain.intermediary_steps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChallenge(chain.effect)}
                        className="border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Challenge This
                      </Button>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>

            {/* Validation Results */}
            <Card className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10">
              <CardHeader
                className="cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleSection('validation')}
              >
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                    Validation Results
                  </span>
                  {expandedSections['validation'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </CardTitle>
              </CardHeader>
              {expandedSections['validation'] && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[#0a0f1e]/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Logical Consistency</p>
                      <p className="text-2xl font-bold text-[#10b981]">
                        {currentAnalysis.validation_results.logical_consistency_score.toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-3 bg-[#0a0f1e]/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Real-World Grounding</p>
                      <p className="text-2xl font-bold text-[#3b82f6]">
                        {currentAnalysis.validation_results.real_world_grounding_score.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {currentAnalysis.validation_results.validation_checks.map((check) => (
                      <div key={check.check_id} className="flex items-start gap-3 p-3 bg-[#0a0f1e]/50 rounded-lg">
                        {check.result === 'pass' ? (
                          <CheckCircle2 className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                        ) : check.result === 'warning' ? (
                          <AlertTriangle className="w-5 h-5 text-[#f59e0b] mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{check.aspect_validated}</p>
                          <p className="text-xs text-gray-400 mt-1">{check.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Key Insights */}
            <Card className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10">
              <CardHeader
                className="cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleSection('insights')}
              >
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-[#f59e0b]" />
                    Key Insights
                  </span>
                  {expandedSections['insights'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </CardTitle>
              </CardHeader>
              {expandedSections['insights'] && (
                <CardContent>
                  <ul className="space-y-2">
                    {currentAnalysis.synthesis.key_insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <span className="w-6 h-6 flex items-center justify-center bg-[#3b82f6] text-white rounded-full flex-shrink-0 text-xs font-semibold">
                          {idx + 1}
                        </span>
                        <span className="flex-1 pt-0.5">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>

            {/* Knowledge Gaps */}
            {currentAnalysis.uncertainty_assessment.knowledge_gaps.length > 0 && (
              <Card className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10">
                <CardHeader
                  className="cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleSection('gaps')}
                >
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
                      Knowledge Gaps ({currentAnalysis.uncertainty_assessment.knowledge_gaps.length})
                    </span>
                    {expandedSections['gaps'] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </CardTitle>
                </CardHeader>
                {expandedSections['gaps'] && (
                  <CardContent className="space-y-3">
                    {currentAnalysis.uncertainty_assessment.knowledge_gaps.map((gap) => (
                      <div key={gap.gap_id} className="p-3 bg-[#0a0f1e]/50 rounded-lg border border-[#f59e0b]/30">
                        <p className="font-medium text-sm mb-2">{gap.description}</p>
                        <div className="text-xs text-gray-400 space-y-1">
                          <p><span className="font-medium text-white">Impact:</span> {gap.impact_on_conclusions}</p>
                          <p><span className="font-medium text-white">Resolution:</span> {gap.potential_resolution}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            )}
          </>
        ) : !isAnalyzing ? (
          <Card className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10">
            <CardContent className="py-16 text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold mb-2">No analysis yet</h3>
              <p className="text-gray-400">Enter a problem and click Analyze to begin</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

// ============================================================================
// CHALLENGE MODAL
// ============================================================================

function ChallengeModal({
  selectedConclusion,
  isChallenging,
  challengeResult,
  onClose
}: {
  selectedConclusion: string
  isChallenging: boolean
  challengeResult: ReasoningChallengerResult | null
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1f36] rounded-lg border border-white/10">
        <div className="sticky top-0 bg-[#1a1f36] border-b border-white/10 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#3b82f6]" />
              Challenge Analysis
            </h2>
            <p className="text-sm text-gray-400 mt-1">Dialectical examination of conclusion</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Original Conclusion */}
          <Card className="bg-[#0a0f1e]/50 border-[#3b82f6]">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-400">Original Conclusion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{selectedConclusion}</p>
            </CardContent>
          </Card>

          {isChallenging ? (
            <div className="py-16 text-center">
              <div className="h-[300px] rounded-lg overflow-hidden border border-white/10 bg-[#0a0f1e]/50 relative">
                <Canvas>
                  <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} intensity={1} />
                  <Suspense fallback={null}>
                    <LoadingAnimation3D />
                    <Environment preset="night" />
                  </Suspense>
                  <OrbitControls enableZoom={false} />
                </Canvas>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-[#3b82f6]" />
                    <p className="text-lg font-semibold">Challenging reasoning...</p>
                  </div>
                </div>
              </div>
            </div>
          ) : challengeResult ? (
            <>
              {/* Challenge Summary */}
              <Card className="bg-[#0a0f1e]/50 border-white/10">
                <CardHeader>
                  <CardTitle>Challenge Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{challengeResult.challenge_summary}</p>
                </CardContent>
              </Card>

              {/* Alternative Explanations */}
              {challengeResult.alternative_explanations.length > 0 && (
                <Card className="bg-[#0a0f1e]/50 border-white/10">
                  <CardHeader>
                    <CardTitle>Alternative Explanations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {challengeResult.alternative_explanations.map((alt, idx) => (
                      <div key={idx} className="p-4 bg-[#1a1f36]/50 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">Alternative {idx + 1}</h4>
                          <Badge variant="outline" className="border-[#3b82f6] text-[#3b82f6]">
                            {alt.plausibility_score}% Plausible
                          </Badge>
                        </div>
                        <p className="text-sm mb-3">{alt.explanation}</p>
                        <div className="text-xs space-y-2">
                          <div>
                            <p className="font-medium text-gray-400 mb-1">Supporting Evidence:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                              {alt.supporting_evidence.map((ev, i) => (
                                <li key={i}>{ev}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-gray-400 mb-1">Key Differences:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                              {alt.key_differences.map((diff, i) => (
                                <li key={i}>{diff}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Stress Test Results */}
              {challengeResult.stress_test_results.length > 0 && (
                <Card className="bg-[#0a0f1e]/50 border-white/10">
                  <CardHeader>
                    <CardTitle>Stress Test Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {challengeResult.stress_test_results.map((test, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-[#1a1f36]/50 rounded-lg">
                        {test.outcome === 'pass' ? (
                          <CheckCircle2 className="w-5 h-5 text-[#10b981] mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{test.test_name}</p>
                          <p className="text-xs text-gray-400 mt-1">{test.findings}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Revised Conclusion */}
              <Card className="bg-[#0a0f1e]/50 border-[#10b981]">
                <CardHeader>
                  <CardTitle className="text-[#10b981]">Revised Conclusion</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{challengeResult.revised_conclusion}</p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
