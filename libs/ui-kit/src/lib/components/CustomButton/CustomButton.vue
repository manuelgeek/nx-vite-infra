<template>
  <button
    :type="props.type"
    :disabled="props.disabled"
    :class="[
      'transition duration-200  focus:shadow-sm focus:ring-4  focus:ring-opacity-50 w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block',
      color,
      props.color === 'default' ? 'text-black' : 'text-white',
    ]"
  >
    <slot />
  </button>
</template>
<script setup lang="ts">
import { type PropType } from "vue"

type ButtonType = "button" | "submit"
type ButtonColor = "primary" | "secondary" | "default" | "success" | "danger"

export interface Book {
  title: string
  author: string
  year: number
}

const props = defineProps({
  type: {
    type: String as PropType<ButtonType>,
    default: "button",
  },
  color: {
    type: String as PropType<ButtonColor>,
    default: "default",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

console.log(props)

const color =
  props.color === "primary"
    ? "bg-blue-500 hover:bg-blue-600 focus:bg-blue-700 focus:ring-blue-500"
    : props.color === "secondary"
    ? "bg-yellow-500 hover:bg-yellow-600 focus:bg-yellow-700 focus:ring-yellow-500"
    : props.color === "danger"
    ? "bg-red-500 hover:bg-red-600 focus:bg-red-700 focus:ring-red-500"
    : props.color === "success"
    ? "bg-green-500 hover:bg-green-600 focus:bg-green-700 focus:ring-green-500"
    : "bg-gray-300 hover:bg-gray-400 focus:bg-gray-400 focus:ring-gray-500 border-gray-300"
</script>
