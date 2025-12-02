import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Case {
  id: number
  caseNumber: string
  internalNumber: string
  caseType: string
  caseCause: string
  court: string
  targetAmount: number
  filingDate: string
  status: string
  caseResult?: string
  createdAt?: string
  updatedAt?: string
}

export interface CaseFilters {
  caseType?: string
  status?: string
  searchKeyword?: string
  dateRange?: [string, string]
}

export const useCaseStore = defineStore('case', () => {
  // State
  const cases = ref<Case[]>([])
  const currentCase = ref<Case | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const filters = ref<CaseFilters>({})
  const pagination = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0
  })

  // Getters
  const filteredCases = computed(() => {
    let result = [...cases.value]

    if (filters.value.caseType) {
      result = result.filter(c => c.caseType === filters.value.caseType)
    }

    if (filters.value.status) {
      result = result.filter(c => c.status === filters.value.status)
    }

    if (filters.value.searchKeyword) {
      const keyword = filters.value.searchKeyword.toLowerCase()
      result = result.filter(c => 
        c.caseNumber.toLowerCase().includes(keyword) ||
        c.caseCause.toLowerCase().includes(keyword) ||
        c.court.toLowerCase().includes(keyword)
      )
    }

    return result
  })

  const totalCases = computed(() => cases.value.length)
  
  const casesByStatus = computed(() => {
    const statusMap: Record<string, number> = {}
    cases.value.forEach(c => {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1
    })
    return statusMap
  })

  const casesByType = computed(() => {
    const typeMap: Record<string, number> = {}
    cases.value.forEach(c => {
      typeMap[c.caseType] = (typeMap[c.caseType] || 0) + 1
    })
    return typeMap
  })

  const totalTargetAmount = computed(() => {
    return cases.value.reduce((sum, c) => sum + (c.targetAmount || 0), 0)
  })

  // Actions
  const setCases = (caseList: Case[]) => {
    cases.value = caseList
    error.value = null
  }

  const setCurrentCase = (caseData: Case | null) => {
    currentCase.value = caseData
  }

  const addCase = (caseData: Case) => {
    cases.value.unshift(caseData)
    pagination.value.total += 1
  }

  const updateCase = (id: number, caseData: Partial<Case>) => {
    const index = cases.value.findIndex(c => c.id === id)
    if (index !== -1) {
      cases.value[index] = { ...cases.value[index], ...caseData }
      
      // Update current case if it's the same
      if (currentCase.value?.id === id) {
        currentCase.value = { ...currentCase.value, ...caseData }
      }
    }
  }

  const removeCase = (id: number) => {
    cases.value = cases.value.filter(c => c.id !== id)
    pagination.value.total -= 1
    
    // Clear current case if it's the deleted one
    if (currentCase.value?.id === id) {
      currentCase.value = null
    }
  }

  const getCaseById = (id: number): Case | undefined => {
    return cases.value.find(c => c.id === id)
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage
  }

  const setFilters = (newFilters: CaseFilters) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {}
  }

  const setPagination = (page: number, pageSize: number, total: number) => {
    pagination.value = { currentPage: page, pageSize, total }
  }

  const resetStore = () => {
    cases.value = []
    currentCase.value = null
    isLoading.value = false
    error.value = null
    filters.value = {}
    pagination.value = { currentPage: 1, pageSize: 10, total: 0 }
  }

  return {
    // State
    cases,
    currentCase,
    isLoading,
    error,
    filters,
    pagination,
    // Getters
    filteredCases,
    totalCases,
    casesByStatus,
    casesByType,
    totalTargetAmount,
    // Actions
    setCases,
    setCurrentCase,
    addCase,
    updateCase,
    removeCase,
    getCaseById,
    setLoading,
    setError,
    setFilters,
    clearFilters,
    setPagination,
    resetStore
  }
})
