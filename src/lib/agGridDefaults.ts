import type { ColumnMenuTab } from 'ag-grid-community'

export const AG_GRID_DEFAULT_COL_DEF = {
  sortable: true,
  filter: 'agTextColumnFilter',
  filterParams: {
    buttons: [],
    closeOnApply: true,
    suppressAndOrCondition: true,
  },
  menuTabs: ['filterMenuTab'] as ColumnMenuTab[],
  resizable: true,
  flex: 1,
  minWidth: 140,
}

const getPopupParentMetrics = (popup: HTMLElement) => {
  const parent = popup.parentElement
  const parentRect = parent?.getBoundingClientRect()
  const isBody = parent === document.body || parent === document.documentElement
  return {
    parent,
    parentRect,
    isBody,
    parentLeft: isBody ? 0 : parentRect?.left ?? 0,
    parentTop: isBody ? 0 : parentRect?.top ?? 0,
    maxWidth: isBody ? window.innerWidth : parentRect?.width ?? window.innerWidth,
    maxHeight: isBody ? window.innerHeight : parentRect?.height ?? window.innerHeight,
  }
}

const applyPopupBaseStyles = (popup: HTMLElement, isBody: boolean) => {
  popup.style.position = isBody ? 'fixed' : 'absolute'
  popup.style.zIndex = '10000'
  popup.style.transform = ''
  popup.style.height = 'auto'
  popup.style.overflowY = 'auto'
}

const positionPopupAtPoint = (popup: HTMLElement, x: number, y: number) => {
  const { parentLeft, parentTop, maxWidth, maxHeight, isBody } = getPopupParentMetrics(popup)

  applyPopupBaseStyles(popup, isBody)

  const applyPosition = () => {
    const popupRect = popup.getBoundingClientRect()
    const maxLeft = maxWidth - popupRect.width - 8
    const minLeft = 8
    const nextLeft = Math.max(minLeft, Math.min(x - parentLeft, maxLeft))

    const maxTop = maxHeight - popupRect.height - 8
    const minTop = 8
    const nextTop = Math.max(minTop, Math.min(y - parentTop, maxTop))

    popup.style.left = `${nextLeft}px`
    popup.style.top = `${nextTop}px`
    popup.style.maxHeight = `calc(100% - ${nextTop + 8}px)`
  }

  requestAnimationFrame(applyPosition)
}

const positionPopup = (popup: HTMLElement, anchor: HTMLElement | null) => {
  if (!anchor) return

  const anchorRect = anchor.getBoundingClientRect()
  const { parentLeft, parentTop, maxWidth, maxHeight, isBody } = getPopupParentMetrics(popup)

  applyPopupBaseStyles(popup, isBody)

  const applyPosition = () => {
    const popupRect = popup.getBoundingClientRect()
    const maxLeft = maxWidth - popupRect.width - 8
    const minLeft = 8
    const nextLeft = Math.max(minLeft, Math.min(anchorRect.left - parentLeft, maxLeft))

    const anchorBottom = anchorRect.bottom - parentTop
    const anchorTop = anchorRect.top - parentTop
    const availableBelow = maxHeight - anchorBottom - 8
    const availableAbove = anchorTop - 8
    const preferAbove = popupRect.height > availableBelow && availableAbove > availableBelow

    const nextTop = preferAbove
      ? Math.max(8, anchorTop - popupRect.height - 8)
      : anchorBottom

    popup.style.left = `${nextLeft}px`
    popup.style.top = `${nextTop}px`
    popup.style.maxHeight = `calc(100% - ${nextTop + 8}px)`

    if (popup.classList.contains('ag-select-list')) {
      popup.style.minWidth = `${anchorRect.width}px`
      popup.style.maxHeight = '240px'
    }
  }

  requestAnimationFrame(applyPosition)
}

export const AG_GRID_DEFAULT_GRID_PROPS = {
  theme: 'legacy' as const,
  animateRows: true,
  columnMenu: 'legacy' as const,
  suppressMenuHide: false,
  headerHeight: 48,
  rowHeight: 60,
  pagination: true,
  paginationPageSize: 25,
  paginationPageSizeSelector: [10, 25, 50, 100],
  popupParent: typeof document === 'undefined' ? undefined : document.body,
  postProcessPopup: (params: {
    ePopup: HTMLElement
    eventSource?: HTMLElement | null
    mouseEvent?: MouseEvent | Touch | null
  }) => {
    const eventSource = params.eventSource ?? null
    if (eventSource) {
      positionPopup(params.ePopup, eventSource)
      return
    }

    const mouseEvent = params.mouseEvent
    if (mouseEvent && 'clientX' in mouseEvent) {
      positionPopupAtPoint(params.ePopup, mouseEvent.clientX, mouseEvent.clientY)
      return
    }
  },
  rowSelection: {
    mode: 'multiRow',
    checkboxes: true,
    headerCheckbox: true,
    enableClickSelection: false,
  },
}
