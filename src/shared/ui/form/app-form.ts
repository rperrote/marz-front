import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext } from './contexts'
import { TextField } from './fields/TextField'
import { TextareaField } from './fields/TextareaField'
import { NumberField } from './fields/NumberField'
import { SwitchField } from './fields/SwitchField'
import { SelectField } from './fields/SelectField'
import { SubmitButton } from './components/SubmitButton'
import { FormError } from './components/FormError'

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    NumberField,
    SwitchField,
    SelectField,
  },
  formComponents: {
    SubmitButton,
    FormError,
  },
})
