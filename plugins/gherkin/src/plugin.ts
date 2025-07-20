/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { gherkinApiRef, GherkinClient } from './api';
import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { rootRouteRef } from './routes';

/**
 * The Backstage plugin that holds Gherkin specific components
 * @public
 */
export const gherkinPlugin = createPlugin({
  id: 'gherkin',
  apis: [
    createApiFactory({
      api: gherkinApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory({ discoveryApi, fetchApi }) {
        return new GherkinClient({ discoveryApi, fetchApi });
      },
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

/**
 * An extension for browsing Gherkins on an entity page.
 * @public
 */
export const EntityGherkinContent = gherkinPlugin.provide(
  createRoutableExtension({
    name: 'EntityGherkinContent',
    component: () =>
      import('./components/EntityGherkinContent').then(m => m.EntityGherkinContent),
    mountPoint: rootRouteRef,
  }),
);
