import { useCallback, useEffect, useRef } from 'react'
import { useStore } from '@tanstack/react-form'
import { useAppForm } from '#/shared/ui/form'
import { WizardSectionTitle } from '#/shared/ui/wizard'
import { useBriefBuilderStore } from '../store'
import type { BriefDraft } from '../store'
import { briefDraftSchema } from '../schemas'
import { useRegisterStepValidator } from '../validation'

const EMPTY_DRAFT: BriefDraft = {
  title: '',
  objective: '',
  targetAudience: '',
  deliverables: [],
  budget: '',
  timeline: '',
}

function draftToFormValues(draft: BriefDraft) {
  return {
    title: draft.title,
    objective: draft.objective,
    targetAudience: draft.targetAudience,
    deliverablesText: draft.deliverables.join('\n'),
    budget: draft.budget,
    timeline: draft.timeline,
  }
}

function formValuesToDraft(
  values: ReturnType<typeof draftToFormValues>,
): BriefDraft {
  return {
    title: values.title,
    objective: values.objective,
    targetAudience: values.targetAudience,
    deliverables: values.deliverablesText
      .split('\n')
      .filter((l) => l.trim().length > 0),
    budget: values.budget,
    timeline: values.timeline,
  }
}

export function P3Review() {
  const store = useBriefBuilderStore()
  const draft = store.briefDraft ?? EMPTY_DRAFT

  const form = useAppForm({
    defaultValues: draftToFormValues(draft),
    validators: {
      onSubmit: briefDraftSchema,
    },
    onSubmit: () => {},
  })

  const values = useStore(form.store, (s) => s.values)
  const prevRef = useRef(values)

  useEffect(() => {
    if (prevRef.current === values) return
    prevRef.current = values
    useBriefBuilderStore.setState({
      briefDraft: formValuesToDraft(values),
    })
  }, [values])

  useRegisterStepValidator(
    useCallback(async () => {
      await form.handleSubmit()
      return form.state.isValid
    }, [form]),
  )

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <WizardSectionTitle
        title="Revisá tu brief"
        subtitle="Editá lo que necesites antes de confirmar la campaña."
      />
      <div className="flex w-full max-w-[560px] flex-col gap-6">
        <form.AppField name="title">
          {(field) => (
            <field.TextField
              label="Título de la campaña"
              placeholder="Ej: Lanzamiento verano 2026"
              maxLength={200}
            />
          )}
        </form.AppField>
        <form.AppField name="objective">
          {(field) => (
            <field.TextareaField
              label="Objetivo"
              placeholder="¿Qué querés lograr con esta campaña?"
              maxLength={1000}
              rows={3}
            />
          )}
        </form.AppField>
        <form.AppField name="targetAudience">
          {(field) => (
            <field.TextareaField
              label="Audiencia objetivo"
              placeholder="Descripción de tu público ideal"
              maxLength={1000}
              rows={3}
            />
          )}
        </form.AppField>
        <form.AppField name="deliverablesText">
          {(field) => (
            <field.TextareaField
              label="Entregables"
              placeholder="Un entregable por línea"
              rows={3}
            />
          )}
        </form.AppField>
        <div className="grid grid-cols-2 gap-4">
          <form.AppField name="budget">
            {(field) => (
              <field.TextField
                label="Presupuesto"
                placeholder="Ej: USD 5,000"
                maxLength={100}
              />
            )}
          </form.AppField>
          <form.AppField name="timeline">
            {(field) => (
              <field.TextField
                label="Timeline"
                placeholder="Ej: 4 semanas"
                maxLength={100}
              />
            )}
          </form.AppField>
        </div>
      </div>
    </div>
  )
}
