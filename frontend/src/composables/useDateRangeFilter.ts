import { reactive, ref } from 'vue';
import {
  buildApiDateRangeParams,
  validateDateRange,
  type ApiDateRangeParams,
} from '@/utils/dateRange';

type UseDateRangeFilterOptions = {
  maxDays?: number;
};

/**
 * Shared date-range filter state for report/list pages.
 * Use `toQueryParams()` when calling APIs so end date includes the whole day.
 */
export function useDateRangeFilter(options: UseDateRangeFilterOptions = {}) {
  const maxDays = options.maxDays ?? 365;

  const filters = reactive({
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  const dateRangeError = ref('');

  const validate = (): boolean => {
    dateRangeError.value = validateDateRange(filters.startDate, filters.endDate, maxDays) ?? '';
    return !dateRangeError.value;
  };

  const toQueryParams = (): ApiDateRangeParams =>
    buildApiDateRangeParams(filters.startDate, filters.endDate);

  const reset = () => {
    filters.startDate = null;
    filters.endDate = null;
    dateRangeError.value = '';
  };

  return {
    filters,
    dateRangeError,
    validate,
    toQueryParams,
    reset,
  };
}
