/*
 * Copyright 2023 The Backstage Authors
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

import {
  ApiBlueprint,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
  createFrontendPlugin,
} from '@backstage/frontend-plugin-api';
import {
  compatWrapper,
  convertLegacyRouteRef,
} from '@backstage/core-compat-api';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';
import {
  GherkinDocument,
  isGherkinAvailable,
} from '@backstage-community/plugin-adr-common';
import { rootRouteRef } from './routes';
import { gherkinApiRef, GherkinClient } from './api';

export * from './translations';

function isGherkinDocument(result: any): result is GherkinDocument {
  return result.entityRef;
}

/** @alpha */
export const gherkinEntityContentExtension = EntityContentBlueprint.make({
  name: 'entity',
  params: {
    defaultPath: '/gherkins',
    defaultTitle: 'Gherkins',
    filter: isGherkinAvailable,
    routeRef: convertLegacyRouteRef(rootRouteRef),
    loader: async () => {
      const { EntityGherkinContent } = await import(
        './components/EntityGherkinContent'
      );
      return <EntityGherkinContent />;
    },
  },
});

/** @alpha */
export const gherkinApiExtension = ApiBlueprint.make({
  name: 'gherkin-api',
  params: {
    factory: createApiFactory({
      api: gherkinApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory({ discoveryApi, fetchApi }) {
        return new GherkinClient({ discoveryApi, fetchApi });
      },
    }),
  },
});

/** @alpha */
export default createFrontendPlugin({
  id: 'gherkin',
  extensions: [
    gherkinEntityContentExtension,
    gherkinApiExtension,
  ],
});
