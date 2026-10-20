export function canManageProducts(principal) {
  return principal?.role === 'WAREHOUSE_MANAGER'
}

export function canViewInternalStock(principal) {
  return principal?.role === 'WAREHOUSE_MANAGER' || principal?.role === 'WAREHOUSE_STAFF'
}
