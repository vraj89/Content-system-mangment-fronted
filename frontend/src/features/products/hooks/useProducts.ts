import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi, type CreateProductBody, type Product } from '../api/products.api'
import { queryKeys } from '@/app/queryClient'

export function useProducts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => productsApi.list(params),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => productsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateProductBody) => productsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Omit<CreateProductBody, 'clientId'>>) => productsApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.product(id) })
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export type { Product } from '../api/products.api'
