import service from "@/utils/request.ts"
import type {
  TransactionListRequest,
  TransactionListResponse
} from "@/types/inventory/transaction.ts";

export function getPageTransactionList(data: TransactionListRequest) {
  return service.get<TransactionListResponse>('inventory/transaction', {params: data})
}

export function exportTransaction() {
  return service.get<Blob>('inventory/transaction/export', {responseType: 'blob'})
}

export function importTransaction(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return service.post<void>('inventory/transaction/import', formData, {
    headers: {'Content-Type': 'multipart/form-data'}
  })
}