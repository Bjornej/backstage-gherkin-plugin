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

import { useMemo } from 'react';
import {
  InfoCard,
  MarkdownContent,
  Progress,
  WarningPanel,
} from '@backstage/core-components';
import { discoveryApiRef, useApi } from '@backstage/core-plugin-api';
import { scmIntegrationsApiRef } from '@backstage/integration-react';
import { getGherkinLocationUrl } from '@backstage-community/plugin-gherkin-common';
import { useEntity } from '@backstage/plugin-catalog-react';
import { CookieAuthRefreshProvider } from '@backstage/plugin-auth-react';

import { gherkinDecoratorFactories } from './decorators';
import { GherkinContentDecorator } from './types';
import { gherkinApiRef } from '../../api';
import useAsync from 'react-use/esm/useAsync';

/**
 * Component to fetch and render an Gherkin.
 *
 * @public
 */
export const GherkinReader = (props: {
  gherkin: string;
  decorators?: GherkinContentDecorator[];
}) => {
  const { gherkin, decorators } = props;
  const { entity } = useEntity();
  const scmIntegrations = useApi(scmIntegrationsApiRef);
  const gherkinApi = useApi(gherkinApiRef);
  const gherkinLocationUrl = getGherkinLocationUrl(entity, scmIntegrations);
  const gherkinFileLocationUrl = getGherkinLocationUrl(entity, scmIntegrations, gherkin);
  const discoveryApi = useApi(discoveryApiRef);

  const { value, loading, error } = useAsync(
    async () => gherkinApi.readGherkin(gherkinFileLocationUrl),
    [gherkinFileLocationUrl],
  );

  const {
    value: backendUrl,
    loading: backendUrlLoading,
    error: backendUrlError,
  } = useAsync(async () => discoveryApi.getBaseUrl('gherkin'), []);
  const gherkinContent = useMemo(() => {
    if (!value?.data) {
      return '';
    }
    const gherkinDecorators = decorators ?? [
      // adrDecoratorFactories.createRewriteRelativeLinksDecorator(),
      // adrDecoratorFactories.createRewriteRelativeEmbedsDecorator(),
      // adrDecoratorFactories.createFrontMatterFormatterDecorator(),
    ];

    return gherkinDecorators.reduce(
      (content, decorator) =>
        decorator({ baseUrl: gherkinLocationUrl, content }).content,
      value.data,
    );
  }, [gherkinLocationUrl, decorators, value]);

  return (
    <CookieAuthRefreshProvider pluginId="gherkin">
      <InfoCard>
        {loading && <Progress />}

        {!loading && error && (
          <WarningPanel title="Failed to fetch Gherkin" message={error?.message} />
        )}

        {!backendUrlLoading && backendUrlError && (
          <WarningPanel
            title="Failed to fetch Gherkin images"
            message={backendUrlError?.message}
          />
        )}

        {!loading &&
          !backendUrlLoading &&
          !error &&
          !backendUrlError &&
          value?.data && (
            <MarkdownContent
              content={gherkinContent}
              linkTarget="_blank"
              transformImageUri={href => {
                return `${backendUrl}/image?url=${href}`;
              }}
            />
          )}
      </InfoCard>
    </CookieAuthRefreshProvider>
  );
};

GherkinReader.decorators = gherkinDecoratorFactories;
