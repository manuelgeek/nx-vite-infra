import MyInput from "./Input.vue"
import { Story } from "@storybook/vue3"

// More on default export: https://storybook.js.org/docs/vue/writing-stories/introduction#default-export
export default {
  title: "Example/Input",
  component: MyInput,
  // More on argTypes: https://storybook.js.org/docs/vue/api/argtypes
  argTypes: {},
}

// More on component templates: https://storybook.js.org/docs/vue/writing-stories/introduction#using-args
const Template: Story<InputProps> = (args) => ({
  // Components used in your story `template` are defined in the `components` object
  components: { MyInput },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup() {
    return { args }
  },
  // And then the `args` are bound to your component with `v-bind="args"`
  template: '<my-input v-bind="args" />',
})

export const Text = Template.bind({})
// More on args: https://storybook.js.org/docs/vue/writing-stories/args
Text.args = {
  type: "text",
  label: "Name",
}

export const Password = Template.bind({})
Password.args = {
  type: "password",
  label: "Password",
}

export const Email = Template.bind({})
Email.args = {
  type: "email",
  label: "Email",
}

export const Error = Template.bind({})
Error.args = {
  type: "text",
  label: "Error",
  isError: true,
}

interface InputProps {
  type: string
  label: string
  class?: string
  isError?: boolean
}
