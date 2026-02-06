'use client'

import { useState, useEffect } from 'react'
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
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent"></div>
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

        {/* Loading Visualization when analyzing */}
        {isAnalyzing && (
          <Card className="bg-[#1a1f36]/60 backdrop-blur-md border-white/10">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 border-4 border-[#3b82f6]/30 rounded-full"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center animate-spin">
                    <div className="w-24 h-24 border-4 border-transparent border-t-[#3b82f6] rounded-full"></div>
                  </div>
                  <div className="w-24 h-24 flex items-center justify-center">
                    <Brain className="w-12 h-12 text-[#3b82f6]" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold text-white">Reasoning in progress...</p>
                  <p className="text-sm text-gray-400">Analyzing causal relationships</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Panel */}
      <div className="space-y-6">
        {currentAnalysis ? (
          <>
            {/* Overall Confidence */}
            {currentAnalysis.uncertainty_assessment && (
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
                      {currentAnalysis.uncertainty_assessment?.overall_confidence?.toFixed(0) ?? 'N/A'}%
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#3b82f6] to-[#10b981] transition-all duration-1000"
                        style={{ width: `${currentAnalysis.uncertainty_assessment?.overall_confidence ?? 0}%` }}
                      />
                    </div>
                    {currentAnalysis.uncertainty_assessment?.uncertainty_metrics && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Epistemic</p>
                          <p className="font-semibold">{currentAnalysis.uncertainty_assessment.uncertainty_metrics?.epistemic_uncertainty?.toFixed(1) ?? 'N/A'}%</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Aleatory</p>
                          <p className="font-semibold">{currentAnalysis.uncertainty_assessment.uncertainty_metrics?.aleatory_uncertainty?.toFixed(1) ?? 'N/A'}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Causal Chains */}
            {currentAnalysis.causal_analysis?.causal_chains && (
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
            )}

            {/* Validation Results */}
            {currentAnalysis.validation_results && (
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
                          {currentAnalysis.validation_results?.logical_consistency_score?.toFixed(0) ?? 'N/A'}%
                        </p>
                      </div>
                      <div className="p-3 bg-[#0a0f1e]/50 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Real-World Grounding</p>
                        <p className="text-2xl font-bold text-[#3b82f6]">
                          {currentAnalysis.validation_results?.real_world_grounding_score?.toFixed(0) ?? 'N/A'}%
                        </p>
                      </div>
                    </div>
                    {currentAnalysis.validation_results?.validation_checks && (
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
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Key Insights */}
            {currentAnalysis.synthesis?.key_insights && (
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
            )}

            {/* Knowledge Gaps */}
            {currentAnalysis.uncertainty_assessment?.knowledge_gaps && currentAnalysis.uncertainty_assessment.knowledge_gaps.length > 0 && (
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
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 border-4 border-[#3b82f6]/30 rounded-full"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center animate-spin">
                    <div className="w-24 h-24 border-4 border-transparent border-t-[#3b82f6] rounded-full"></div>
                  </div>
                  <div className="w-24 h-24 flex items-center justify-center">
                    <Shield className="w-12 h-12 text-[#3b82f6]" />
                  </div>
                </div>
                <p className="text-lg font-semibold">Challenging reasoning...</p>
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
