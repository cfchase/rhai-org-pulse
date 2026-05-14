import { ref } from 'vue'
import { apiRequest } from '@shared/client/services/api.js'

export function useAIReview() {
  const aiReview = ref(null)         // Feature review data (RHAISTRAT)
  const rfeAssessment = ref(null)    // Linked RFE assessment (RHAIRFE)
  const aiReviewLoading = ref(false)
  const aiReviewError = ref(null)

  async function loadAIReview(featureKey) {
    aiReviewLoading.value = true
    aiReviewError.value = null
    aiReview.value = null
    rfeAssessment.value = null

    try {
      // 1. Fetch AI Impact feature review
      const featureData = await apiRequest(
        `/modules/ai-impact/features/${encodeURIComponent(featureKey)}`
      )
      aiReview.value = featureData

      // 2. If it has a linked RFE, fetch the RFE assessment
      const sourceRfe = featureData?.latest?.sourceRfe
      if (sourceRfe) {
        try {
          rfeAssessment.value = await apiRequest(
            `/modules/ai-impact/assessments/${encodeURIComponent(sourceRfe)}`
          )
        } catch {
          // 404 expected if RFE hasn't been assessed yet
        }
      }
    } catch (e) {
      // 404 = no AI Impact data for this feature (expected).
      // Also handles the case where the AI Impact module is disabled —
      // when disabled, its routes are not mounted (module-loader.js:194)
      // and Express returns a default 404. apiRequest sets e.status on
      // the Error object in both cases.
      if (e.status !== 404) {
        aiReviewError.value = e.message
      }
    } finally {
      aiReviewLoading.value = false
    }
  }

  return { aiReview, rfeAssessment, aiReviewLoading, aiReviewError, loadAIReview }
}
