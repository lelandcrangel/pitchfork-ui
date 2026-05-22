import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    brandTitle: 'Pitchfork UI',
    brandImage: '/pitchfork.png',
  }),
});
