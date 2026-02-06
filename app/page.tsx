'use client'

import { useState, useEffect } from 'react'
import { callAIAgent, type AIAgentResponse, type NormalizedAgentResponse } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, XCircle, TrendingUp, Clock, Search, Plus, ArrowRight, Shield, Target, Brain } from 'lucide-react'

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
  counterargument: string
}

interface AlternativeExplanation {
  explanation_id: string
  alternative_hypothesis: string
  supporting_evidence: string
  plausibility: string
  implications: string
}

interface StressTestResult {
  test_scenario: string
  reasoning_holds: boolean
  weakness_identified: string
}

interface StrengthenedReasoning {
  revised_conclusions: string[]
  additional_evidence_needed: string[]
  confidence_adjustment: string
}

interface ReasoningChallengerResult {
  challenge_summary: string
  challenged_claims: ChallengedClaim[]
  alternative_explanations: AlternativeExplanation[]
  stress_test_results: StressTestResult[]
  strengthened_reasoning: StrengthenedReasoning
}

interface AnalysisHistory {
  id: string
  problem: string
  date: string
  confidence: number
  status: 'completed' | 'in-progress' | 'failed'
  causalAnalysis?: CausalAnalysisResult
  validation?: CommonSenseValidationResult
  uncertainty?: UncertaintyQuantifierResult
}

// Agent IDs
const AGENT_IDS = {
  orchestrator: '69858540b90162af337b1e2d',
  causalAnalysis: '698584ddc613a65b3c4193c4',
  commonSenseValidator: '698584fc49f279d47448a5b9',
  uncertaintyQuantifier: '69858517ab4bf65a66ad0765',
  reasoningChallenger: '69858572ab4bf65a66ad076c',
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ReasonForge() {
  const [view, setView] = useState<'dashboard' | 'analysis'>('dashboard')
  const [history, setHistory] = useState<AnalysisHistory[]>([])
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisHistory | null>(null)
  const [problemInput, setProblemInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [challengeModal, setChallengeModal] = useState<{
    isOpen: boolean
    claim: string
    response: ReasoningChallengerResult | null
  }>({ isOpen: false, claim: '', response: null })
  const [challengeLoading, setChallengeLoading] = useState(false)

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('reasonforge-history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load history:', e)
      }
    }
  }, [])

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('reasonforge-history', JSON.stringify(history))
  }, [history])

  // Parse JSON response with markdown wrapper handling
  const parseAgentResponse = (response: NormalizedAgentResponse): any => {
    try {
      if (response.result) {
        return response.result
      }
      return null
    } catch (e) {
      console.error('Failed to parse agent response:', e)
      return null
    }
  }

  // Start new analysis
  const startNewAnalysis = () => {
    setProblemInput('')
    setCurrentAnalysis(null)
    setView('analysis')
  }

  // Run complete analysis
  const runAnalysis = async () => {
    if (!problemInput.trim()) return

    setIsAnalyzing(true)
    const newAnalysis: AnalysisHistory = {
      id: Date.now().toString(),
      problem: problemInput,
      date: new Date().toISOString(),
      confidence: 0,
      status: 'in-progress',
    }

    try {
      // Step 1: Causal Analysis
      setAnalysisStep('Analyzing causal relationships...')
      const causalResponse = await callAIAgent(
        `Analyze the causal relationships in this problem: ${problemInput}`,
        AGENT_IDS.causalAnalysis
      )

      if (causalResponse.success) {
        const causalData = parseAgentResponse(causalResponse.response)
        newAnalysis.causalAnalysis = causalData
      }

      // Step 2: Common Sense Validation
      setAnalysisStep('Validating logical consistency...')
      const validationResponse = await callAIAgent(
        `Validate the reasoning in this problem: ${problemInput}`,
        AGENT_IDS.commonSenseValidator
      )

      if (validationResponse.success) {
        const validationData = parseAgentResponse(validationResponse.response)
        newAnalysis.validation = validationData
      }

      // Step 3: Uncertainty Quantification
      setAnalysisStep('Quantifying uncertainty...')
      const uncertaintyResponse = await callAIAgent(
        `Quantify the uncertainty in this analysis: ${problemInput}`,
        AGENT_IDS.uncertaintyQuantifier
      )

      if (uncertaintyResponse.success) {
        const uncertaintyData = parseAgentResponse(uncertaintyResponse.response)
        newAnalysis.uncertainty = uncertaintyData
        newAnalysis.confidence = uncertaintyData.overall_confidence || 0
      }

      newAnalysis.status = 'completed'
      setCurrentAnalysis(newAnalysis)
      setHistory(prev => [newAnalysis, ...prev])
    } catch (error) {
      console.error('Analysis failed:', error)
      newAnalysis.status = 'failed'
      setCurrentAnalysis(newAnalysis)
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep('')
    }
  }

  // Challenge a claim
  const challengeClaim = async (claim: string) => {
    setChallengeLoading(true)
    setChallengeModal({ isOpen: true, claim, response: null })

    try {
      const response = await callAIAgent(
        `Challenge this claim and provide alternative explanations: ${claim}`,
        AGENT_IDS.reasoningChallenger
      )

      if (response.success) {
        const challengeData = parseAgentResponse(response.response)
        setChallengeModal(prev => ({ ...prev, response: challengeData }))
      }
    } catch (error) {
      console.error('Challenge failed:', error)
    } finally {
      setChallengeLoading(false)
    }
  }

  // View saved analysis
  const viewAnalysis = (analysis: AnalysisHistory) => {
    setCurrentAnalysis(analysis)
    setView('analysis')
    setProblemInput(analysis.problem)
  }

  // Filter history
  const filteredHistory = history.filter(item =>
    item.problem.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ============================================================================
  // DASHBOARD VIEW
  // ============================================================================

  if (view === 'dashboard') {
    const totalAnalyses = history.length
    const avgConfidence = history.length > 0
      ? Math.round(history.reduce((sum, a) => sum + a.confidence, 0) / history.length)
      : 0
    const completedCount = history.filter(a => a.status === 'completed').length

    return (
      <div className="min-h-screen bg-white">
        {/* Sidebar */}
        <div className="fixed left-0 top-0 h-full w-64 bg-[#1a1f36] text-white p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">ReasonForge</h1>
            <p className="text-sm text-gray-400">Causal Reasoning Platform</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setView('dashboard')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#3b82f6] text-white"
            >
              <TrendingUp size={20} />
              <span>Dashboard</span>
            </button>
            <button
              onClick={startNewAnalysis}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Plus size={20} />
              <span>New Analysis</span>
            </button>
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield size={16} />
              <span>5 AI Agents Active</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 p-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#1a1f36] mb-2">Dashboard</h2>
              <p className="text-gray-600">Overview of your causal analyses</p>
            </div>
            <Button onClick={startNewAnalysis} className="bg-[#3b82f6] hover:bg-[#2563eb]">
              <Plus size={20} className="mr-2" />
              New Analysis
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1a1f36]">{totalAnalyses}</div>
                <p className="text-xs text-gray-500 mt-1">{completedCount} completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Average Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#1a1f36]">{avgConfidence}%</div>
                <p className="text-xs text-gray-500 mt-1">Across all analyses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Most Common Topic</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-[#1a1f36]">General Reasoning</div>
                <p className="text-xs text-gray-500 mt-1">Primary focus area</p>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search analyses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* History Cards Grid */}
          <div className="grid grid-cols-2 gap-6">
            {filteredHistory.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <Brain size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No analyses yet</h3>
                <p className="text-gray-500 mb-4">Start your first causal reasoning analysis</p>
                <Button onClick={startNewAnalysis} className="bg-[#3b82f6] hover:bg-[#2563eb]">
                  <Plus size={20} className="mr-2" />
                  Create New Analysis
                </Button>
              </div>
            ) : (
              filteredHistory.map(item => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
                  style={{
                    borderLeftColor: item.status === 'completed' ? '#3b82f6' : item.status === 'failed' ? '#ef4444' : '#f59e0b'
                  }}
                  onClick={() => viewAnalysis(item)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={item.status === 'completed' ? 'default' : item.status === 'failed' ? 'destructive' : 'secondary'}>
                        {item.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock size={14} />
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{item.problem}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-600">Confidence:</div>
                        <div className="flex items-center gap-1">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#3b82f6]"
                              style={{ width: `${item.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{item.confidence}%</span>
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-[#3b82f6]" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // ANALYSIS WORKSPACE VIEW
  // ============================================================================

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-[#1a1f36] text-white p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">ReasonForge</h1>
          <p className="text-sm text-gray-400">Causal Reasoning Platform</p>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setView('dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <TrendingUp size={20} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={startNewAnalysis}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#3b82f6] text-white"
          >
            <Plus size={20} />
            <span>New Analysis</span>
          </button>
        </nav>

        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Shield size={16} />
            <span>5 AI Agents Active</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex">
        {/* Left Panel - Input */}
        <div className="w-[400px] border-r border-gray-200 p-6 bg-gray-50">
          <h3 className="text-xl font-bold text-[#1a1f36] mb-4">Problem Statement</h3>

          <Textarea
            placeholder="Enter your reasoning problem or question here... (minimum 50 characters recommended for best results)&#10;&#10;Example: Why might increasing social media usage correlate with decreased attention span in teenagers?"
            value={problemInput}
            onChange={(e) => setProblemInput(e.target.value)}
            className="min-h-[300px] mb-4 resize-none"
            disabled={isAnalyzing}
          />

          <div className="mb-4 text-sm text-gray-600">
            Characters: {problemInput.length} {problemInput.length < 50 && '(50+ recommended)'}
          </div>

          <Button
            onClick={runAnalysis}
            disabled={isAnalyzing || problemInput.trim().length === 0}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb]"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={20} />
                Analyzing...
              </>
            ) : (
              <>
                <Target size={20} className="mr-2" />
                Analyze Problem
              </>
            )}
          </Button>

          {isAnalyzing && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="animate-spin text-[#3b82f6]" size={16} />
                <span className="text-sm font-medium text-gray-700">{analysisStep}</span>
              </div>
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#3b82f6] animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className="flex-1 p-8 overflow-y-auto" style={{ maxHeight: '100vh' }}>
          {!currentAnalysis ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Brain size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-2xl font-bold text-gray-600 mb-2">Ready to Analyze</h3>
                <p className="text-gray-500">Enter a problem statement and click Analyze to begin</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-3xl font-bold text-[#1a1f36] mb-2">Analysis Results</h2>
                <p className="text-gray-600">{new Date(currentAnalysis.date).toLocaleString()}</p>
              </div>

              {/* Confidence Meter */}
              {currentAnalysis.uncertainty && (
                <Card className="border-l-4 border-[#3b82f6]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="text-[#3b82f6]" />
                      Overall Confidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-4xl font-bold text-[#1a1f36]">
                          {currentAnalysis.uncertainty.overall_confidence}%
                        </span>
                        <Badge variant="secondary" className="text-sm">
                          {currentAnalysis.uncertainty.overall_confidence >= 75 ? 'High' :
                           currentAnalysis.uncertainty.overall_confidence >= 50 ? 'Medium' : 'Low'}
                        </Badge>
                      </div>
                      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] transition-all"
                          style={{ width: `${currentAnalysis.uncertainty.overall_confidence}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 mb-1">Epistemic</div>
                        <div className="font-medium">
                          {Math.round(currentAnalysis.uncertainty.uncertainty_metrics.epistemic_uncertainty * 100)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Aleatory</div>
                        <div className="font-medium">
                          {Math.round(currentAnalysis.uncertainty.uncertainty_metrics.aleatory_uncertainty * 100)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Total</div>
                        <div className="font-medium">
                          {Math.round(currentAnalysis.uncertainty.uncertainty_metrics.total_uncertainty * 100)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Causal Chains */}
              {currentAnalysis.causalAnalysis?.causal_chains && currentAnalysis.causalAnalysis.causal_chains.length > 0 && (
                <CausalChainsSection
                  chains={currentAnalysis.causalAnalysis.causal_chains}
                  onChallenge={challengeClaim}
                />
              )}

              {/* Validation Results */}
              {currentAnalysis.validation && (
                <ValidationSection
                  validation={currentAnalysis.validation}
                />
              )}

              {/* Confidence Breakdown */}
              {currentAnalysis.uncertainty?.confidence_breakdown && (
                <ConfidenceBreakdownSection
                  breakdown={currentAnalysis.uncertainty.confidence_breakdown}
                  onChallenge={challengeClaim}
                />
              )}

              {/* Knowledge Gaps */}
              {currentAnalysis.uncertainty?.knowledge_gaps && currentAnalysis.uncertainty.knowledge_gaps.length > 0 && (
                <KnowledgeGapsSection gaps={currentAnalysis.uncertainty.knowledge_gaps} />
              )}

              {/* Critical Assumptions */}
              {currentAnalysis.uncertainty?.critical_assumptions && currentAnalysis.uncertainty.critical_assumptions.length > 0 && (
                <CriticalAssumptionsSection assumptions={currentAnalysis.uncertainty.critical_assumptions} />
              )}

              {/* Confounders */}
              {currentAnalysis.causalAnalysis?.confounders && currentAnalysis.causalAnalysis.confounders.length > 0 && (
                <ConfoundersSection confounders={currentAnalysis.causalAnalysis.confounders} />
              )}

              {/* Feedback Loops */}
              {currentAnalysis.causalAnalysis?.feedback_loops && currentAnalysis.causalAnalysis.feedback_loops.length > 0 && (
                <FeedbackLoopsSection loops={currentAnalysis.causalAnalysis.feedback_loops} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Challenge Modal */}
      {challengeModal.isOpen && (
        <ChallengeDialog
          claim={challengeModal.claim}
          response={challengeModal.response}
          loading={challengeLoading}
          onClose={() => setChallengeModal({ isOpen: false, claim: '', response: null })}
        />
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function CausalChainsSection({ chains, onChallenge }: { chains: CausalChain[], onChallenge: (claim: string) => void }) {
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set())

  const toggleChain = (id: string) => {
    const newExpanded = new Set(expandedChains)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedChains(newExpanded)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="text-[#3b82f6]" />
          Causal Chains
        </CardTitle>
        <CardDescription>Identified cause-effect relationships</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {chains.map((chain) => {
          const isExpanded = expandedChains.has(chain.chain_id)
          return (
            <div key={chain.chain_id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{chain.chain_id}</Badge>
                    <Badge
                      variant={chain.strength === 'strong' ? 'default' : 'secondary'}
                      className={chain.strength === 'strong' ? 'bg-[#3b82f6]' : ''}
                    >
                      {chain.strength}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-[#3b82f6] min-w-[80px]">Cause:</span>
                      <span className="text-gray-700">{chain.cause}</span>
                    </div>
                    <div className="flex items-center justify-center py-2">
                      <ArrowRight className="text-[#3b82f6]" size={24} />
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-semibold text-[#3b82f6] min-w-[80px]">Effect:</span>
                      <span className="text-gray-700">{chain.effect}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChallenge(`${chain.cause} causes ${chain.effect}`)}
                  className="ml-4"
                >
                  Challenge
                </Button>
              </div>

              <button
                onClick={() => toggleChain(chain.chain_id)}
                className="flex items-center gap-2 text-sm text-[#3b82f6] hover:text-[#2563eb] font-medium mt-2"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                {isExpanded ? 'Hide' : 'Show'} mechanism & steps
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-3 pl-4 border-l-2 border-[#3b82f6]">
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-1">Mechanism:</div>
                    <div className="text-sm text-gray-600">{chain.mechanism}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Intermediary Steps:</div>
                    <ol className="space-y-1">
                      {chain.intermediary_steps.map((step, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex gap-2">
                          <span className="font-medium text-[#3b82f6]">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ValidationSection({ validation }: { validation: CommonSenseValidationResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="text-green-600" />
          Validation Results
        </CardTitle>
        <CardDescription>Logical consistency and common sense checks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Logical Consistency</div>
            <div className="text-2xl font-bold text-[#1a1f36]">
              {Math.round(validation.logical_consistency_score * 100)}%
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Real-World Grounding</div>
            <div className="text-2xl font-bold text-[#1a1f36]">
              {Math.round(validation.real_world_grounding_score * 100)}%
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {validation.validation_checks.map((check) => (
            <div key={check.check_id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {check.result === 'pass' ? (
                <CheckCircle2 className="text-green-600 mt-0.5" size={20} />
              ) : check.result === 'fail' ? (
                <XCircle className="text-red-600 mt-0.5" size={20} />
              ) : (
                <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
              )}
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">{check.aspect_validated}</div>
                <div className="text-sm text-gray-600">{check.explanation}</div>
              </div>
              <Badge variant={check.severity === 'minor' ? 'secondary' : 'default'}>
                {check.severity}
              </Badge>
            </div>
          ))}
        </div>

        {validation.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="font-semibold text-[#1a1f36] mb-2">Recommendations:</div>
            <ul className="space-y-1">
              {validation.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-[#3b82f6]">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ConfidenceBreakdownSection({ breakdown, onChallenge }: { breakdown: ConfidenceBreakdown[], onChallenge: (claim: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="text-[#3b82f6]" />
          Confidence Breakdown
        </CardTitle>
        <CardDescription>Confidence levels for individual claims</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {breakdown.map((item, idx) => (
          <div key={idx} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-2">{item.claim}</div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                    <div
                      className="h-full bg-[#3b82f6]"
                      style={{ width: `${item.confidence_percentage}%` }}
                    />
                  </div>
                  <span className="font-bold text-[#1a1f36] min-w-[50px]">{item.confidence_percentage}%</span>
                </div>
                <Badge variant="outline" className="mb-2">{item.uncertainty_type}</Badge>
                <div className="text-sm text-gray-600 mt-2">{item.reasoning}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChallenge(item.claim)}
                className="ml-4"
              >
                Challenge
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function KnowledgeGapsSection({ gaps }: { gaps: KnowledgeGap[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="text-yellow-600" />
          Knowledge Gaps
        </CardTitle>
        <CardDescription>Areas where more information is needed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {gaps.map((gap) => (
          <div key={gap.gap_id} className="border-l-4 border-yellow-500 p-4 bg-yellow-50 rounded-r-lg">
            <div className="flex items-start justify-between mb-2">
              <Badge variant="outline">{gap.gap_id}</Badge>
              <Badge variant={gap.impact_on_conclusions === 'high' ? 'destructive' : gap.impact_on_conclusions === 'medium' ? 'default' : 'secondary'}>
                {gap.impact_on_conclusions} impact
              </Badge>
            </div>
            <div className="text-gray-900 font-medium mb-2">{gap.description}</div>
            <div className="text-sm text-gray-700 bg-white p-3 rounded border border-yellow-200">
              <span className="font-semibold">Resolution: </span>
              {gap.potential_resolution}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function CriticalAssumptionsSection({ assumptions }: { assumptions: CriticalAssumption[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="text-[#3b82f6]" />
          Critical Assumptions
        </CardTitle>
        <CardDescription>Key assumptions underlying the analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assumptions.map((assumption, idx) => (
          <div key={idx} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-start justify-between mb-3">
              <div className="font-medium text-gray-900 flex-1">{assumption.assumption}</div>
              <Badge
                variant={
                  assumption.verifiability === 'verifiable' ? 'default' :
                  assumption.verifiability === 'partially_verifiable' ? 'secondary' :
                  'outline'
                }
              >
                {assumption.verifiability.replace('_', ' ')}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Justification: </span>
                <span className="text-gray-600">{assumption.justification}</span>
              </div>
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <span className="font-semibold text-red-900">Risk if violated: </span>
                <span className="text-red-800">{assumption.risk_if_violated}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ConfoundersSection({ confounders }: { confounders: Confounder[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="text-orange-600" />
          Confounding Variables
        </CardTitle>
        <CardDescription>Variables that may affect multiple factors</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {confounders.map((confounder, idx) => (
          <div key={idx} className="border-l-4 border-orange-500 p-4 bg-orange-50 rounded-r-lg">
            <div className="font-medium text-gray-900 mb-2">{confounder.variable}</div>
            <div className="text-sm text-gray-700 mb-2">
              <span className="font-semibold">Affects: </span>
              {confounder.affects.join(', ')}
            </div>
            <div className="text-sm text-gray-600 bg-white p-3 rounded border border-orange-200">
              {confounder.impact}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function FeedbackLoopsSection({ loops }: { loops: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="text-[#3b82f6]" />
          Feedback Loops
        </CardTitle>
        <CardDescription>Cyclical causal relationships</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loops.map((loop, idx) => (
          <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-gray-800">
              <RefreshCw size={16} className="text-[#3b82f6]" />
              <span>{loop}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ChallengeDialog({
  claim,
  response,
  loading,
  onClose
}: {
  claim: string
  response: ReasoningChallengerResult | null
  loading: boolean
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-[#1a1f36] mb-2">Challenge Analysis</h3>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
                <span className="font-semibold">Original Claim: </span>
                {claim}
              </div>
            </div>
            <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
              <XCircle size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#3b82f6] mb-4" size={48} />
              <p className="text-gray-600">Analyzing claim and generating challenges...</p>
            </div>
          ) : response ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-semibold text-[#1a1f36] mb-2">Summary:</div>
                <div className="text-gray-700">{response.challenge_summary}</div>
              </div>

              {/* Challenged Claims */}
              {response.challenged_claims.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-[#1a1f36] mb-3">Challenges</h4>
                  <div className="space-y-4">
                    {response.challenged_claims.map((challenged, idx) => (
                      <div key={idx} className="border-l-4 border-red-500 p-4 bg-red-50 rounded-r-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-900">{challenged.original_claim}</div>
                          <Badge variant="destructive">{challenged.severity}</Badge>
                        </div>
                        <div className="text-sm space-y-2">
                          <div>
                            <span className="font-semibold text-red-900">Challenge: </span>
                            <span className="text-red-800">{challenged.challenge}</span>
                          </div>
                          <div className="bg-white p-3 rounded border border-red-200">
                            <span className="font-semibold text-gray-900">Counterargument: </span>
                            <span className="text-gray-700">{challenged.counterargument}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Explanations */}
              {response.alternative_explanations.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-[#1a1f36] mb-3">Alternative Explanations</h4>
                  <div className="space-y-4">
                    {response.alternative_explanations.map((alt) => (
                      <div key={alt.explanation_id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">{alt.explanation_id}</Badge>
                          <Badge variant={alt.plausibility === 'high' ? 'default' : 'secondary'}>
                            {alt.plausibility} plausibility
                          </Badge>
                        </div>
                        <div className="font-medium text-gray-900 mb-2">{alt.alternative_hypothesis}</div>
                        <div className="text-sm space-y-2">
                          <div>
                            <span className="font-semibold text-gray-700">Evidence: </span>
                            <span className="text-gray-600">{alt.supporting_evidence}</span>
                          </div>
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <span className="font-semibold text-blue-900">Implications: </span>
                            <span className="text-blue-800">{alt.implications}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stress Test Results */}
              {response.stress_test_results.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-[#1a1f36] mb-3">Stress Tests</h4>
                  <div className="space-y-3">
                    {response.stress_test_results.map((test, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        {test.reasoning_holds ? (
                          <CheckCircle2 className="text-green-600 mt-0.5" size={20} />
                        ) : (
                          <XCircle className="text-red-600 mt-0.5" size={20} />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 mb-1">{test.test_scenario}</div>
                          {test.weakness_identified && (
                            <div className="text-sm text-gray-600">{test.weakness_identified}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengthened Reasoning */}
              {response.strengthened_reasoning && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-lg font-bold text-green-900 mb-3">Strengthened Reasoning</h4>

                  {response.strengthened_reasoning.revised_conclusions.length > 0 && (
                    <div className="mb-4">
                      <div className="font-semibold text-green-900 mb-2">Revised Conclusions:</div>
                      <ul className="space-y-1">
                        {response.strengthened_reasoning.revised_conclusions.map((conclusion, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex gap-2">
                            <CheckCircle2 size={16} className="text-green-600 mt-0.5" />
                            <span>{conclusion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {response.strengthened_reasoning.additional_evidence_needed.length > 0 && (
                    <div className="mb-4">
                      <div className="font-semibold text-green-900 mb-2">Additional Evidence Needed:</div>
                      <ul className="space-y-1">
                        {response.strengthened_reasoning.additional_evidence_needed.map((evidence, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex gap-2">
                            <span className="text-green-600">•</span>
                            <span>{evidence}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-white p-3 rounded border border-green-300">
                    <span className="font-semibold text-gray-900">Confidence Adjustment: </span>
                    <span className="text-gray-700">{response.strengthened_reasoning.confidence_adjustment}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No challenge data available
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Missing import
import { RefreshCw } from 'lucide-react'
