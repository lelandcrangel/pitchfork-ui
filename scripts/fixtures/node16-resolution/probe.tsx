/*
 * Resolves the BUILT package the way a consumer on Node's own resolver does.
 *
 * `moduleResolution: "bundler"` -- what most apps and this repo's own configs
 * use -- forgives two things the published package got wrong in 0.15.1: a
 * `types` path that pointed at a file the build never wrote, and declarations
 * whose relative specifiers carried no extension. Neither is forgiven under
 * node16, and with `skipLibCheck` on both fail silently, leaving consumers
 * with a module that appears to export nothing.
 *
 * Run against dist, after a build. A regression shows up here as
 * "has no exported member".
 */
import { Badge, Button, Icon, type BadgeProps } from '@pitchfork-ui/react';

export const badge: BadgeProps['variant'] = 'success';

export const probe = (
  <>
    <Badge variant={badge}>shipped</Badge>
    <Button variant="primary" size="sm">
      Go
    </Button>
    <Icon name="circle-check" />
  </>
);
