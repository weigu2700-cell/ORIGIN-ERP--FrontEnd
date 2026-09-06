<script setup lang="ts">
  import {reactive, ref} from "vue";
  import ParentDeptSelector from "@/views/system/dept/components/parentDeptSelector.vue";
  import {CircleClose, Search} from "@element-plus/icons-vue";
  import type {getUserListRequest, UserStatus} from "@/types/system/user.ts";
  import ProSearch from "@/components/ProSearch.vue";

  defineOptions({name: 'UserQuerySelector'})

  const emit = defineEmits<{
    (e: 'query', params: Omit<getUserListRequest, 'page' | 'pageSize'>): void
    (e: 'reset'): void
  }>()

  const queryData = reactive<{
    username: string | null
    realName: string | null
    phone: string | null
    deptId: string | null
    deptName: string | null
    status: UserStatus | null
  }>({
    username: null,
    realName: null,
    phone: null,
    deptId: null,
    deptName: null,
    status: null,
  })

  const deptSelectorVisible = ref(false)

  const openDeptSelector = () => {
    deptSelectorVisible.value = true
  }

  const clearDept = () => {
    queryData.deptId = null
    queryData.deptName = null
  }

  const handleDeptSelect = (dept: {id: string, name: string}) => {
    queryData.deptId = dept.id
    queryData.deptName = dept.name
    deptSelectorVisible.value = false
  }

  const statusOptions = [
    {label: '正常', value: 1},
    {label: '锁定', value: 2},
    {label: '注销', value: 3}
  ]

  const handleQuery = () => {
    // 后端只接收 id，deptName 仅用于展示，不发出去
    emit('query', {
      username: queryData.username || null,
      realName: queryData.realName || null,
      phone: queryData.phone || null,
      deptId: queryData.deptId,
      status: queryData.status,
    })
  }

  const handleReset = () => {
    queryData.username = null
    queryData.realName = null
    queryData.phone = null
    queryData.deptId = null
    queryData.deptName = null
    queryData.status = null
    emit('reset')
  }
</script>

<template>
  <ProSearch class="user-selector" @search="handleQuery" @reset="handleReset">
    <el-input v-model="queryData.username" placeholder="用户名" clearable style="width: 160px; flex: 0 0 160px" />
    <el-input v-model="queryData.realName" placeholder="真实姓名" clearable style="width: 160px; flex: 0 0 160px" />
    <el-input v-model="queryData.phone" placeholder="手机号" clearable style="width: 160px; flex: 0 0 160px" />
    <el-input
      :model-value="queryData.deptName"
      readonly
      placeholder="点击选择部门"
      @click="openDeptSelector"
      style="width: 160px; flex: 0 0 160px"
    >
      <template #suffix>
        <el-icon v-if="queryData.deptName" class="field-icon" @click.stop="clearDept">
          <CircleClose />
        </el-icon>
        <el-icon v-else class="field-icon" @click.stop="openDeptSelector">
          <Search />
        </el-icon>
      </template>
    </el-input>
    <el-select v-model="queryData.status" placeholder="请选择状态" clearable style="width: 120px; flex: 0 0 120px">
      <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </ProSearch>
  <ParentDeptSelector :visible="deptSelectorVisible" @select="handleDeptSelect" />
</template>

<style scoped>
  .user-selector {

    .field-icon {
      cursor: pointer;
    }
  }
</style>
