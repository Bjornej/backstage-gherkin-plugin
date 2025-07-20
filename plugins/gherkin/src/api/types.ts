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

import { createApiRef } from '@backstage/core-plugin-api';

/**
 * Contains information about an Gherkin file.
 *
 * @public
 */
export type GherkinFileInfo = {
  /** The file type. */
  type: string;

  /** The relative path of the Gherkin file. */
  path: string;

  /** The name of the Gherkin file. */
  name: string;

  /** The title of the Gherkin. */
  title?: string;
};

/**
 * The result of listing Gherkins.
 *
 * @public
 */
export type GherkinListResult = {
  data: GherkinFileInfo[];
};

/**
 * The result of reading an Gherkin.
 *
 * @public
 */
export type GherkinReadResult = {
  /** The contents of the read Gherkin file. */
  data: string;
};
/**
 * The API used by the gherkin plugin to list and read Gherkins.
 *
 * @public
 */
export interface GherkinApi {
  /** Lists the Gherkins at the provided url. */
  listGherkins(url: string): Promise<GherkinListResult>;

  /** Reads the contents of the gherkin at the provided url. */
  readGherkin(url: string): Promise<GherkinReadResult>;
}

/**
 * ApiRef for the GherkinApi.
 *
 * @public
 */
export const gherkinApiRef = createApiRef<GherkinApi>({
  id: 'plugin.gherkin.api',
});
