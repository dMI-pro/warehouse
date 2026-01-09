<template>
  <div class="quantity-input">
    <!-- Поле "Доступно" (только для чтения) -->
    <div v-if="showAvailableField" class="field mb-3">
      <label class="block mb-2">{{ availableLabel || 'Доступно на складе' }}</label>
      <InputNumber 
        :modelValue="availableQuantity+modelValue"
        disabled
        class="w-full"
        :min="0"
      />
      <small class="text-gray-500">{{ availableDescription || 'Общее количество товара' }}</small>
    </div>
    
    <!-- Поле для ввода количества -->
    <div class="field mb-3">
      <label :for="id" class="block mb-2">{{ label || 'Количество' }}<span v-if="required"> *</span></label>
      <InputNumber 
        :id="id"
        :modelValue="modelValue"
        @update:modelValue="onInput"
        :min="min"
        :max="maxQuantity"
        :disabled="disabled"
        showButtons 
        class="w-full"
        :class="{ 'p-invalid': error }"
      />
      <!-- computedHint: {{ computedHint }} -->
      <small v-if="error || error !== ''" class="p-error">{{ error }}</small>
      <small class="text-gray-500">
        {{ computedHint }}
      </small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import InputNumber from 'primevue/inputnumber';

interface Props {
  modelValue: number;
  availableQuantity: number;
  label?: string;
  availableLabel?: string;
  availableDescription?: string;
  required?: boolean;
  min?: number;
  max?: number;
  disabled?: boolean;
  hint?: string | boolean;
  id?: string;
  showAvailableField?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 1,
  availableQuantity: 0,
  label: 'Количество',
  availableLabel: 'Доступно на складе',
  availableDescription: 'Общее количество товара',
  required: true,
  min: 1,
  max: undefined,
  disabled: false,
  hint: false,
  id: 'quantity',
  showAvailableField: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  'error': [error: string | null];
  'valid': [isValid: boolean];
}>();

const error = ref<string>('');
const internalValue = ref(props.modelValue);

// Максимальное количество с учетом доступного
const maxQuantity = computed(() => {
  if (props.max !== undefined) {
    return Math.min(props.max, props.availableQuantity);
  }
  return props.availableQuantity;
});

// Генерируем подсказку
const computedHint = computed(() => {
  if (props.hint) return props.hint;
  return `Можно ввести от ${props.min} до ${maxQuantity.value} шт.`;
});

// Валидация количества
const validate = (value: number): boolean => {
  error.value = '';
  
  if (props.required && value < props.min) {
    error.value = `Количество должно быть не меньше ${props.min}`;
    emit('error', error.value);
    emit('valid', false);
    return false;
  }
  
  if (value > maxQuantity.value) {
    error.value = `Нельзя указать больше ${maxQuantity.value} единиц`;
    emit('error', error.value);
    emit('valid', false);
    return false;
  }
  
  emit('error', null);
  emit('valid', true);
  return true;
};

// Обработчик ввода
const onInput = (value: number) => {
  internalValue.value = value;
  const isValid = validate(value);
  
  if (isValid) {
    emit('update:modelValue', value);
  }
};

// Начальная валидация
watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue;
  validate(newValue);
}, { immediate: true });

// Реакция на изменение доступного количества
watch(() => props.availableQuantity, () => {
  validate(internalValue.value);
});

// Метод для внешней валидации
defineExpose({
  validate: () => validate(internalValue.value),
  clearError: () => {
    error.value = '';
    emit('error', null);
    emit('valid', true);
  },
});
</script>

<style scoped>
.quantity-input .field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.quantity-input .field:last-child {
  margin-bottom: 0;
}

.quantity-input label {
  font-weight: 500;
}

.quantity-input .p-invalid {
  border-color: var(--red-500) !important;
}

.quantity-input .p-error {
  color: var(--red-500);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.quantity-input .text-gray-500 {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>