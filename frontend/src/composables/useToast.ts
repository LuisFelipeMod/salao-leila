import { useUiStore } from '../stores/ui.store'

export function useToast() {
  const uiStore = useUiStore()

  function success(message: string) {
    uiStore.addToast(message, 'success')
  }

  function error(message: string) {
    uiStore.addToast(message, 'error')
  }

  function warning(message: string) {
    uiStore.addToast(message, 'warning')
  }

  function info(message: string) {
    uiStore.addToast(message, 'info')
  }

  return { success, error, warning, info }
}
