import { addons } from 'storybook/manager-api';
import { create, getPreferredColorScheme } from 'storybook/theming';

addons.setConfig({
  theme: create({
    // `create()` types `base` as required, but at runtime a missing base falls
    // back to this same call, so the manager has always followed the reader's
    // OS colour scheme. Naming it keeps that, where 'light' or 'dark' would
    // pin one scheme for everybody.
    base: getPreferredColorScheme(),
    brandTitle: 'Pitchfork UI',
    brandImage: './pitchfork.png',
  }),
});
