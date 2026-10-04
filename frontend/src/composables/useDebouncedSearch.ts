import { onBeforeUnmount, ref } from 'vue';

type UseDebouncedSearchOptions = {
  delayMs?: number;
  /** Called after debounce delay with the current query */
  onDebounced: (value: string) => void | Promise<void>;
  /** Called immediately when a new keystroke schedules a search (e.g. abort in-flight) */
  onSchedule?: () => void;
};

/**
 * Debounced text search for list filters.
 * Clears the timer on unmount; call `clear()` before other filter actions.
 */
export function useDebouncedSearch(options: UseDebouncedSearchOptions) {
  const delayMs = options.delayMs ?? 400;
  const searchQuery = ref('');
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  };

  const schedule = () => {
    clear();
    options.onSchedule?.();
    timer = setTimeout(() => {
      timer = null;
      void options.onDebounced(searchQuery.value);
    }, delayMs);
  };

  const flush = () => {
    clear();
    void options.onDebounced(searchQuery.value);
  };

  const reset = (next = '') => {
    clear();
    searchQuery.value = next;
  };

  onBeforeUnmount(clear);

  return {
    searchQuery,
    scheduleSearch: schedule,
    clearSearchDebounce: clear,
    flushSearch: flush,
    resetSearch: reset,
  };
}
