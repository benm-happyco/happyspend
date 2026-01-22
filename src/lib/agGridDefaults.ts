export const AG_GRID_DEFAULT_COL_DEF = {
  sortable: true,
  filter: 'agSetColumnFilter',
  filterParams: {
    buttons: [],
    closeOnApply: true,
    suppressAndOrCondition: true,
  },
  menuTabs: ['filterMenuTab'],
  resizable: true,
  flex: 1,
  minWidth: 140,
}

export const AG_GRID_DEFAULT_GRID_PROPS = {
  theme: 'legacy',
  animateRows: true,
  suppressMenuHide: false,
  enableFilterMenuButton: true,
  headerHeight: 48,
  rowHeight: 60,
  pagination: true,
  paginationPageSize: 25,
  paginationPageSizeSelector: [10, 25, 50, 100],
}
