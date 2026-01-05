/**
 * Get AG Grid theme configuration based on Mantine theme
 * This function returns AG Grid gridOptions with styling that matches the Mantine theme
 */
export function getAgGridThemeConfig() {
  return {
    // Header styling
    headerHeight: 40,
    groupHeaderHeight: 40,
    
    // Row styling
    rowHeight: 40,
    
    // Enable features
    enableRangeSelection: true,
    enableFillHandle: true,
    enableCharts: false,
    
    // Default column definitions
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 100,
    },
    
    // Styling classes - these will be applied via CSS
    getRowClass: (params: any) => {
      return 'ag-grid-row-custom'
    },
    
    getHeaderRowClass: () => {
      return 'ag-grid-header-custom'
    },
  }
}

