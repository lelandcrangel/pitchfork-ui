import { addons } from 'storybook/manager-api';
import { create, getPreferredColorScheme } from 'storybook/theming';

// `create()` types `base` as required, but at runtime a missing base falls
// back to this same call, so the manager has always followed the reader's OS
// colour scheme. Naming it keeps that, where 'light' or 'dark' would pin one
// scheme for everybody.
const scheme = getPreferredColorScheme();

addons.setConfig({
  theme: create({
    base: scheme,
    brandTitle: 'Pitchfork UI',
    // The wordmark is one colour, so it has to follow the scheme too: the white
    // lettering is 1.06:1 against the light sidebar and all but disappears.
    // pitchfork-dark.png is the same artwork with the same alpha mask,
    // recoloured to the favicon's #0f172a.
    brandImage: scheme === 'dark' ? './pitchfork.png' : './pitchfork-dark.png',
  }),
});
