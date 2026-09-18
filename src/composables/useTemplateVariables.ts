import { computed, toValue, type MaybeRefOrGetter } from 'vue'

const VARIABLE_PATTERN = /\{\{\s*([A-Za-z0-9_]+)\s*}}/g

export function extractTemplateVariables(...templates: Array<string | null | undefined>): string[] {
  const names = new Set<string>()
  for (const template of templates) {
    if (!template) continue
    for (const match of template.matchAll(VARIABLE_PATTERN)) {
      if (match[1]) names.add(match[1])
    }
  }
  return [...names]
}

export function useTemplateVariables(
  titleTemplate: MaybeRefOrGetter<string | undefined>,
  contentTemplate: MaybeRefOrGetter<string | undefined>,
) {
  return computed(() => extractTemplateVariables(toValue(titleTemplate), toValue(contentTemplate)))
}
