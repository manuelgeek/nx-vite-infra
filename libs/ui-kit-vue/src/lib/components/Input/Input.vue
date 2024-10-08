<template>
  <label class="font-semibold text-sm text-gray-600 pb-1 block">{{
    props.label
  }}</label>
  <input
    :type="props.type"
    :class="[
      'border rounded-lg px-3 py-2 mt-1 mb-5 text-sm w-full',
      props?.class,
      props?.isError ? 'border-red-400' : '',
    ]"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>
<script setup lang="ts">
const props = defineProps<{
  label: string
  type: string
  class?: string
  modelValue?: any
  isError?: boolean
}>()

defineEmits(['update:modelValue'])
</script>
