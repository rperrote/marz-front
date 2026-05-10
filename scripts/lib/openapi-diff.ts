type AnyObj = Record<string, unknown>

const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
] as const

type Method = (typeof HTTP_METHODS)[number]

interface Operation {
  method: Method
  path: string
  operationId?: string
  summary?: string
  requestBodyHash?: string
  responsesHash?: string
}

function isObj(v: unknown): v is AnyObj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value))
    return '[' + value.map(stableStringify).join(',') + ']'
  const obj = value as AnyObj
  const keys = Object.keys(obj).sort()
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k]))
      .join(',') +
    '}'
  )
}

function hash(value: unknown): string {
  // short, stable, deterministic — collisions don't matter, we only compare equality
  return stableStringify(value)
}

function extractOperations(spec: unknown): Map<string, Operation> {
  const out = new Map<string, Operation>()
  if (!isObj(spec)) return out
  const paths = spec.paths
  if (!isObj(paths)) return out
  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isObj(pathItem)) continue
    for (const method of HTTP_METHODS) {
      const op = pathItem[method]
      if (!isObj(op)) continue
      const operationId =
        typeof op.operationId === 'string' ? op.operationId : undefined
      const key = operationId ?? `${method.toUpperCase()} ${path}`
      out.set(key, {
        method,
        path,
        operationId,
        summary: typeof op.summary === 'string' ? op.summary : undefined,
        requestBodyHash: op.requestBody ? hash(op.requestBody) : undefined,
        responsesHash: op.responses ? hash(op.responses) : undefined,
      })
    }
  }
  return out
}

function extractSchemas(spec: unknown): Map<string, AnyObj> {
  const out = new Map<string, AnyObj>()
  if (!isObj(spec)) return out
  const components = spec.components
  if (!isObj(components)) return out
  const schemas = components.schemas
  if (!isObj(schemas)) return out
  for (const [name, schema] of Object.entries(schemas)) {
    if (isObj(schema)) out.set(name, schema)
  }
  return out
}

function describeType(schema: unknown): string {
  if (!isObj(schema)) return 'unknown'
  if (typeof schema.$ref === 'string') {
    const ref = schema.$ref
    const last = ref.split('/').pop() ?? ref
    return last
  }
  const parts: string[] = []
  if (typeof schema.type === 'string') {
    if (schema.type === 'array') {
      parts.push(`array<${describeType(schema.items)}>`)
    } else {
      parts.push(schema.type)
    }
  } else if (Array.isArray(schema.oneOf)) {
    parts.push('oneOf(' + schema.oneOf.map(describeType).join(' | ') + ')')
  } else if (Array.isArray(schema.anyOf)) {
    parts.push('anyOf(' + schema.anyOf.map(describeType).join(' | ') + ')')
  } else if (Array.isArray(schema.allOf)) {
    parts.push('allOf(' + schema.allOf.map(describeType).join(' & ') + ')')
  } else {
    parts.push('object')
  }
  if (typeof schema.format === 'string') parts.push(`(${schema.format})`)
  if (Array.isArray(schema.enum))
    parts.push(`enum[${schema.enum.map((v) => JSON.stringify(v)).join(', ')}]`)
  if (schema.nullable === true) parts.push('nullable')
  return parts.join(' ')
}

interface SchemaFieldDiff {
  added: { name: string; type: string; required: boolean }[]
  removed: { name: string; type: string; required: boolean }[]
  changed: { name: string; reasons: string[] }[]
  rootReasons: string[]
}

function diffSchema(oldSchema: AnyObj, newSchema: AnyObj): SchemaFieldDiff {
  const oldProps = isObj(oldSchema.properties) ? oldSchema.properties : {}
  const newProps = isObj(newSchema.properties) ? newSchema.properties : {}
  const oldRequired = new Set(
    Array.isArray(oldSchema.required) ? (oldSchema.required as string[]) : [],
  )
  const newRequired = new Set(
    Array.isArray(newSchema.required) ? (newSchema.required as string[]) : [],
  )

  const added: SchemaFieldDiff['added'] = []
  const removed: SchemaFieldDiff['removed'] = []
  const changed: SchemaFieldDiff['changed'] = []

  for (const [name, schema] of Object.entries(newProps)) {
    if (!(name in oldProps)) {
      added.push({
        name,
        type: describeType(schema),
        required: newRequired.has(name),
      })
      continue
    }
    const prev = oldProps[name]
    const reasons: string[] = []
    const prevType = describeType(prev)
    const nextType = describeType(schema)
    if (prevType !== nextType) reasons.push(`type ${prevType} → ${nextType}`)
    else if (hash(prev) !== hash(schema)) reasons.push('shape changed')
    const wasReq = oldRequired.has(name)
    const isReq = newRequired.has(name)
    if (wasReq !== isReq) reasons.push(isReq ? 'now required' : 'now optional')
    if (reasons.length > 0) changed.push({ name, reasons })
  }
  for (const [name, schema] of Object.entries(oldProps)) {
    if (!(name in newProps)) {
      removed.push({
        name,
        type: describeType(schema),
        required: oldRequired.has(name),
      })
    }
  }

  const rootReasons: string[] = []
  const oldType =
    typeof oldSchema.type === 'string' ? oldSchema.type : undefined
  const newType =
    typeof newSchema.type === 'string' ? newSchema.type : undefined
  if (oldType !== newType)
    rootReasons.push(`type ${String(oldType)} → ${String(newType)}`)
  if (Array.isArray(oldSchema.enum) || Array.isArray(newSchema.enum)) {
    const a = JSON.stringify(oldSchema.enum ?? [])
    const b = JSON.stringify(newSchema.enum ?? [])
    if (a !== b) rootReasons.push(`enum ${a} → ${b}`)
  }
  return { added, removed, changed, rootReasons }
}

export interface SpecDiff {
  addedOps: Operation[]
  removedOps: Operation[]
  changedOps: { op: Operation; reasons: string[] }[]
  addedSchemas: string[]
  removedSchemas: string[]
  changedSchemas: { name: string; fields: SchemaFieldDiff }[]
}

export function diffSpecs(oldSpec: unknown, newSpec: unknown): SpecDiff {
  const oldOps = extractOperations(oldSpec)
  const newOps = extractOperations(newSpec)
  const oldSchemas = extractSchemas(oldSpec)
  const newSchemas = extractSchemas(newSpec)

  const addedOps: Operation[] = []
  const removedOps: Operation[] = []
  const changedOps: { op: Operation; reasons: string[] }[] = []

  for (const [key, op] of newOps) {
    const prev = oldOps.get(key)
    if (!prev) {
      addedOps.push(op)
      continue
    }
    const reasons: string[] = []
    if (prev.path !== op.path) reasons.push(`path ${prev.path} → ${op.path}`)
    if (prev.method !== op.method)
      reasons.push(`method ${prev.method} → ${op.method}`)
    if (prev.requestBodyHash !== op.requestBodyHash)
      reasons.push('requestBody changed')
    if (prev.responsesHash !== op.responsesHash)
      reasons.push('responses changed')
    if (reasons.length > 0) changedOps.push({ op, reasons })
  }
  for (const [key, op] of oldOps) {
    if (!newOps.has(key)) removedOps.push(op)
  }

  const addedSchemas: string[] = []
  const removedSchemas: string[] = []
  const changedSchemas: { name: string; fields: SchemaFieldDiff }[] = []
  for (const [name, schema] of newSchemas) {
    const prev = oldSchemas.get(name)
    if (prev === undefined) {
      addedSchemas.push(name)
      continue
    }
    if (hash(prev) === hash(schema)) continue
    const fields = diffSchema(prev, schema)
    changedSchemas.push({ name, fields })
  }
  for (const name of oldSchemas.keys()) {
    if (!newSchemas.has(name)) removedSchemas.push(name)
  }

  return {
    addedOps,
    removedOps,
    changedOps,
    addedSchemas,
    removedSchemas,
    changedSchemas,
  }
}

export function isEmptyDiff(d: SpecDiff): boolean {
  return (
    d.addedOps.length === 0 &&
    d.removedOps.length === 0 &&
    d.changedOps.length === 0 &&
    d.addedSchemas.length === 0 &&
    d.removedSchemas.length === 0 &&
    d.changedSchemas.length === 0
  )
}

function fmtOp(op: Operation): string {
  const id = op.operationId ? ` \`${op.operationId}\`` : ''
  return `${op.method.toUpperCase()} ${op.path}${id}`
}

export function renderChangelogEntry(
  label: string,
  timestamp: string,
  diff: SpecDiff,
): string {
  const lines: string[] = []
  lines.push(`## ${timestamp} — ${label}`, '')

  if (diff.addedOps.length > 0) {
    lines.push('### Added endpoints')
    for (const op of diff.addedOps) lines.push(`- ${fmtOp(op)}`)
    lines.push('')
  }
  if (diff.removedOps.length > 0) {
    lines.push('### Removed endpoints')
    for (const op of diff.removedOps) lines.push(`- ${fmtOp(op)}`)
    lines.push('')
  }
  if (diff.changedOps.length > 0) {
    lines.push('### Changed endpoints')
    for (const { op, reasons } of diff.changedOps)
      lines.push(`- ${fmtOp(op)} — ${reasons.join('; ')}`)
    lines.push('')
  }
  if (diff.addedSchemas.length > 0) {
    lines.push('### Added schemas')
    for (const n of diff.addedSchemas) lines.push(`- \`${n}\``)
    lines.push('')
  }
  if (diff.removedSchemas.length > 0) {
    lines.push('### Removed schemas')
    for (const n of diff.removedSchemas) lines.push(`- \`${n}\``)
    lines.push('')
  }
  if (diff.changedSchemas.length > 0) {
    lines.push('### Changed schemas')
    for (const { name, fields } of diff.changedSchemas) {
      lines.push(`- \`${name}\``)
      for (const r of fields.rootReasons) lines.push(`  - ${r}`)
      for (const f of fields.added)
        lines.push(
          `  - + \`${f.name}\`: ${f.type}${f.required ? ' (required)' : ''}`,
        )
      for (const f of fields.removed)
        lines.push(
          `  - - \`${f.name}\`: ${f.type}${f.required ? ' (was required)' : ''}`,
        )
      for (const c of fields.changed)
        lines.push(`  - ~ \`${c.name}\`: ${c.reasons.join('; ')}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
