import { registerIconGlyphs } from '@pitchfork-ui/core';
import {
  faBarChart,
  faBell,
  faCalendar,
  faCircleCheck,
  faCircleQuestion,
  faCircleXmark,
  faCopy,
  faCreditCard,
  faFile,
  faFolderOpen,
  faSquareCaretLeft,
  faSquareCaretRight,
  faSquareCheck,
  faStar,
  faUser,
} from '@fortawesome/free-regular-svg-icons';

/**
 * The Font Awesome regular icons this package ships, registered into the
 * shared registry on import.
 *
 * An explicit list, not the whole free-regular set, so a consumer's bundle
 * carries only these — the same policy the React library follows. It has to
 * be registered here as well as there, because a consumer using only the
 * custom elements never loads the React package.
 *
 * Anything outside the list is not "an icon the library lacks": register it
 * with `registerIconGlyphs()` from the peer dependency you already install.
 */
registerIconGlyphs({
  bell: faBell,
  calendar: faCalendar,
  'chart-bar': faBarChart,
  'circle-check': faCircleCheck,
  'circle-question': faCircleQuestion,
  'circle-xmark': faCircleXmark,
  copy: faCopy,
  'credit-card': faCreditCard,
  file: faFile,
  'folder-open': faFolderOpen,
  'square-caret-left': faSquareCaretLeft,
  'square-caret-right': faSquareCaretRight,
  'square-check': faSquareCheck,
  star: faStar,
  user: faUser,
});
