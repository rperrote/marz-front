import { describe, it, expect, beforeEach } from 'vitest'
import { useBriefBuilderStore } from './store'

describe('useBriefBuilderStore', () => {
  beforeEach(() => {
    useBriefBuilderStore.getState().reset()
  })

  it('starts at phase 1', () => {
    expect(useBriefBuilderStore.getState().currentPhase).toBe(1)
  })

  it('goTo navigates to a valid phase', () => {
    useBriefBuilderStore.getState().goTo(3)
    expect(useBriefBuilderStore.getState().currentPhase).toBe(3)
  })

  it('goTo clamps below 1', () => {
    useBriefBuilderStore.getState().goTo(0 as never)
    expect(useBriefBuilderStore.getState().currentPhase).toBe(1)
  })

  it('goTo clamps above max phases', () => {
    useBriefBuilderStore.getState().goTo(99 as never)
    expect(useBriefBuilderStore.getState().currentPhase).toBe(4)
  })

  it('setField updates a top-level field', () => {
    useBriefBuilderStore.getState().setField('processingToken', 'abc-123')
    expect(useBriefBuilderStore.getState().processingToken).toBe('abc-123')
  })

  it('setField updates formInput', () => {
    const newInput = {
      websiteUrl: 'https://example.com',
      descriptionText: 'test',
      pdfMeta: null,
    }
    useBriefBuilderStore.getState().setField('formInput', newInput)
    expect(useBriefBuilderStore.getState().formInput).toEqual(newInput)
  })

  it('setField updates campaignId', () => {
    useBriefBuilderStore.getState().setField('campaignId', 'camp-42')
    expect(useBriefBuilderStore.getState().campaignId).toBe('camp-42')
  })

  it('reset clears all state to initial values', () => {
    useBriefBuilderStore.getState().goTo(3)
    useBriefBuilderStore.getState().setField('processingToken', 'token')
    useBriefBuilderStore.getState().setField('campaignId', 'camp-1')
    useBriefBuilderStore.getState().setField('formInput', {
      websiteUrl: 'https://test.com',
      descriptionText: 'desc',
      pdfMeta: { fileName: 'f.pdf', sizeBytes: 100, pageCount: 1 },
    })

    useBriefBuilderStore.getState().reset()

    const state = useBriefBuilderStore.getState()
    expect(state.currentPhase).toBe(1)
    expect(state.processingToken).toBeNull()
    expect(state.campaignId).toBeNull()
    expect(state.briefDraft).toBeNull()
    expect(state.formInput).toEqual({
      websiteUrl: '',
      descriptionText: '',
      pdfMeta: null,
    })
  })
})
