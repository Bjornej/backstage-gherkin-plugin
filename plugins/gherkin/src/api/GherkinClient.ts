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

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { GherkinApi, GherkinListResult, GherkinReadResult } from './types';

/**
 * Options for creating an AdrClient.
 *
 * @public
 */
export interface GherkinClientOptions {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
}

const readEndpoint = 'file';
const listEndpoint = 'list';

/**
 * An implementation of the AdrApi that communicates with the ADR backend plugin.
 *
 * @public
 */
export class GherkinClient implements GherkinApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: GherkinClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async fetchGherkinApi<T>(endpoint: string, fileUrl: string): Promise<T> {
    const baseUrl = await this.discoveryApi.getBaseUrl('gherkin');
    const targetUrl = `${baseUrl}/${endpoint}?url=${encodeURIComponent(
      fileUrl,
    )}`;

    const result = await this.fetchApi.fetch(targetUrl);
    const data = await result.json();

    if (!result.ok) {
      throw new Error(`${data.message}`);
    }
    return data;
  }

  async listGherkins(url: string): Promise<GherkinListResult> {
    return this.fetchGherkinApi<GherkinListResult>(listEndpoint, url);
  }

  async readGherkin(url: string): Promise<GherkinReadResult> {
    return this.fetchGherkinApi<GherkinReadResult>(readEndpoint, url);
  }
}
