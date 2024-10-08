import MyButton from './CustomButton.vue'
import { Story } from '@storybook/vue3'
import ButtonText from './ButtonText'

// More on default export: https://storybook.js.org/docs/vue/writing-stories/introduction#default-export
export default {
  title: 'Example/CustomButton',
  component: MyButton,
  // More on argTypes: https://storybook.js.org/docs/vue/api/argtypes
  argTypes: {},
}

// More on component templates: https://storybook.js.org/docs/vue/writing-stories/introduction#using-args
const Template: Story<ButtonProps> = (args) => ({
  // Components used in your story `template` are defined in the `components` object
  components: { MyButton },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup() {
    return { args }
  },
  // And then the `args` are bound to your component with `v-bind="args"`
  template: '<my-button v-bind="args" v-html="args.slotTemplate"></my-button>',
})

export const Primary = Template.bind({})
// More on args: https://storybook.js.org/docs/vue/writing-stories/args
Primary.args = {
  color: 'primary',
  slotTemplate: ButtonText.template2,
}

export const Secondary = Template.bind({})
Secondary.args = {
  color: 'secondary',
  slotTemplate: ButtonText.template,
}

export const Default = Template.bind({})
Default.args = {
  color: 'default',
  slotTemplate: ButtonText.template,
}

export const Success = Template.bind({})
Success.args = {
  color: 'success',
  slotTemplate: ButtonText.template,
}

export const Danger = Template.bind({})
Danger.args = {
  color: 'danger',
  slotTemplate: ButtonText.template,
}

export const Disabled = Template.bind({})
Disabled.args = {
  color: 'default',
  disabled: true,
  slotTemplate: ButtonText.template,
}

interface ButtonProps {
  type?: string
  color?: string
  disabled?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  slotTemplate?: any
}
