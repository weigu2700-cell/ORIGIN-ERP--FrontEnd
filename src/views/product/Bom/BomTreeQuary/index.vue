<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getBomExplosion, getPageBom } from '@/api/product/Bom'
import ProTable, { type ProColumn } from '@/components/ProTable.vue'
import ProTree from '@/components/ProTree.vue'
import type { BomExplosionVo, BomVo } from '@/types/product/Bom'
import Selector, { type BomTreeQuery } from './components/selector.vue'
import ProPageTitle from '@/components/ProPageTitle.vue'

defineOptions({ name: 'BomTreeQuery' })

interface BomTreeNode extends Omit<BomExplosionVo, 'children'> {
  id: string
  label: string
  bomId?: string
  children: BomTreeNode[]
}

const queryData = reactive<BomTreeQuery>({
  materialId: null,
  quantity: 1,
})
const treeData = ref<BomTreeNode[]>([])
const selectedNode = ref<BomTreeNode | null>(null)
const tablePage = ref(1)
const tablePageSize = ref(10)
const treeLoading = ref(false)

const columns: ProColumn[] = [
  { label: '物料编码', prop: 'materialCode', width: 240 },
  { label: '物料名称', prop: 'materialName', minWidth: 200 },
  { label: '需求数量', prop: 'quantity', width: 160 },
  { label: '层级', prop: 'level', width: 80 },
]

const childMaterials = computed(() => selectedNode.value?.children ?? [])
const tableData = computed(() => {
  const start = (tablePage.value - 1) * tablePageSize.value
  return childMaterials.value.slice(start, start + tablePageSize.value)
})

const buildTree = (nodes: BomExplosionVo[], parentPath = 'root'): BomTreeNode[] => nodes.map((node, index) => {
  const id = `${parentPath}-${index}-${node.materialId}`
  return {
    ...node,
    id,
    label: node.materialName || node.materialCode,
    children: buildTree(node.children ?? [], id),
  }
})

const buildFlatTree = (nodes: BomExplosionVo[], parentPath: string): BomTreeNode[] => {
  const roots: BomTreeNode[] = []
  const stack: BomTreeNode[] = []

  nodes.forEach((node, index) => {
    const treeNode: BomTreeNode = {
      ...node,
      id: `${parentPath}-${index}-${node.materialId}`,
      label: node.materialName || node.materialCode,
      children: [],
    }
    while (stack.length && stack[stack.length - 1]!.level >= treeNode.level) {
      stack.pop()
    }
    const parent = stack[stack.length - 1]
    if (parent) {
      parent.children.push(treeNode)
    } else {
      roots.push(treeNode)
    }
    stack.push(treeNode)
  })

  return roots
}

const getExplosionChildren = (result: BomExplosionVo[], materialId: string): BomTreeNode[] => {
  if (!result.length) return []
  // 新接口包含 level=0 的根节点；兼容尚未重启时旧接口返回的 level>=1 扁平数组。
  if (result[0]?.level === 0) {
    return buildTree(result, `material-${materialId}`)[0]?.children ?? []
  }
  return buildFlatTree(result, `material-${materialId}`)
}

const buildBomRoot = (bom: BomVo): BomTreeNode => ({
  id: `bom-${bom.id}`,
  bomId: bom.id,
  label: bom.materialName || bom.materialCode,
  materialId: bom.materialId,
  materialCode: bom.materialCode,
  materialName: bom.materialName,
  quantity: 1,
  level: 0,
  children: [],
})

const loadBomTree = async () => {
  treeLoading.value = true
  try {
    const firstPage = await getPageBom({
      pageNum: 1,
      pageSize: 100,
      bomNo: null,
      materialId: null,
      status: 'ACTIVE',
    })
    const total = Number(firstPage.total ?? 0)
    const pageCount = Math.ceil(total / 100)
    const remainingPages = pageCount > 1
      ? await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) => getPageBom({
        pageNum: index + 2,
        pageSize: 100,
        bomNo: null,
        materialId: null,
        status: 'ACTIVE',
      })))
      : []
    treeData.value = [firstPage, ...remainingPages]
      .flatMap(page => page.records ?? [])
      .map(buildBomRoot)
  } catch {
    treeData.value = []
  } finally {
    treeLoading.value = false
  }
}

const loadBomChildren = async (materialId: string, quantity: number) => {
  const result = await getBomExplosion(materialId, quantity)
  const children = getExplosionChildren(result, materialId)
  const root = treeData.value.find(node => node.materialId === materialId)
  if (root) {
    const updatedRoot: BomTreeNode = {
      ...root,
      quantity,
      children,
    }
    treeData.value = treeData.value.map(node => node.materialId === materialId ? updatedRoot : node)
    selectedNode.value = updatedRoot
  } else {
    const resultRoot = buildTree(result, `material-${materialId}`)[0]
    if (resultRoot?.level === 0) {
      resultRoot.bomId = materialId
      treeData.value.unshift(resultRoot)
      selectedNode.value = resultRoot
    } else {
      selectedNode.value = null
    }
  }
  tablePage.value = 1
}

const handleQuery = async (params: BomTreeQuery) => {
  if (!params.materialId) {
    ElMessage.warning('请选择BOM')
    return
  }
  if (!params.quantity || params.quantity <= 0) {
    ElMessage.warning('展开数量必须大于0')
    return
  }

  try {
    await loadBomChildren(params.materialId, params.quantity)
  } catch {
    selectedNode.value = null
  }
}

const handleReset = () => {
  queryData.materialId = null
  queryData.quantity = 1
  selectedNode.value = null
  tablePage.value = 1
}

const handleTreeClick = async (node: BomTreeNode) => {
  if (node.bomId) {
    queryData.materialId = node.materialId
    try {
      await loadBomChildren(node.materialId, queryData.quantity)
    } catch {
      selectedNode.value = null
    }
    return
  }
  selectedNode.value = node
  tablePage.value = 1
}

onMounted(loadBomTree)
</script>

<template>
  <div class="bom-tree-container round">
    <ProPageTitle title="BOM 树形查询" description="按层级查看产品物料组成与用量" />
    <div class="page-body">
      <div class="tree round">
        <div v-loading="treeLoading" class="tree-content">
          <ProTree :data="treeData" :tree-props="{ label: 'label', children: 'children' }" :default-expand-all="true"
            @node-click="handleTreeClick" />
        </div>
      </div>

      <div class="content">
        <div class="selector round">
          <Selector :query-data="queryData" @query="handleQuery" @reset="handleReset"
            @update:query-data="(params) => Object.assign(queryData, params)" />
        </div>

        <div class="table round">
          <ProTable :data="tableData" :columns="columns" :total="childMaterials.length" :page="tablePage"
            :page-size="tablePageSize" :show-selection="false" @update:page="(page) => { tablePage = page }"
            @update:page-size="(size) => { tablePageSize = size; tablePage = 1 }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bom-tree-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 8px;
}

.tree {
  width: 240px;
  flex: 0 0 240px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e4e7ed;
}

.tree-content {
  height: 100%;
}

.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector {
  width: 100%;
  background: #ffffff;
  border: 1px solid #e4e7ed;
}

.table {
  flex: 1;
  min-height: 0;
  width: 100%;
}
</style>
