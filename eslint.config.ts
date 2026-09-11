import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'
import type { Rule } from 'eslint'

const isFunctionStatement = (node: Rule.Node): boolean => {
  if (node.type === 'FunctionDeclaration') return true
  if (node.type !== 'VariableDeclaration') return false

  return node.declarations.every(
    (declaration) =>
      declaration.init?.type === 'ArrowFunctionExpression' || declaration.init?.type === 'FunctionExpression',
  )
}

const blankLineBetweenFunctions: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: { description: 'require a blank line between adjacent function statements' },
    fixable: 'whitespace',
    schema: [],
    messages: { missingBlankLine: '相邻函数之间需要保留一个空行。' },
  },
  create(context) {
    const sourceCode = context.sourceCode

    const checkBody = (body: Rule.Node[]) => {
      for (let index = 1; index < body.length; index += 1) {
        const previous = body[index - 1]
        const current = body[index]
        if (!previous || !current || !isFunctionStatement(previous) || !isFunctionStatement(current)) continue

        const leadingComments = sourceCode.getCommentsBefore(current)
        const insertionTarget = leadingComments[0] ?? current
        const previousEndLine = previous.loc?.end.line
        const currentStartLine = insertionTarget.loc?.start.line
        if (!previousEndLine || !currentStartLine || currentStartLine - previousEndLine > 1) continue

        context.report({
          node: current,
          messageId: 'missingBlankLine',
          fix: (fixer) => fixer.insertTextBefore(insertionTarget, '\n'),
        })
      }
    }

    return {
      Program: (node) => checkBody(node.body as Rule.Node[]),
      BlockStatement: (node) => checkBody(node.body as Rule.Node[]),
    }
  },
}

const localStylePlugin = {
  rules: {
    'blank-line-between-functions': blankLineBetweenFunctions,
  },
}

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    name: 'app/code-style',
    plugins: { local: localStylePlugin },
    rules: {
      'eol-last': ['error', 'always'],
      'local/blank-line-between-functions': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
      'padded-blocks': ['error', 'never'],
      // 页面按目录组织并普遍命名为 index.vue，目录名已经提供完整语义。
      'vue/multi-word-component-names': 'off',
    },
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  skipFormatting,
)
