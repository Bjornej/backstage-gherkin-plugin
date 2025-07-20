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
/**
 * Common types and functionalities for the gherkin plugin.
 * @packageDocumentation
 */
import { Entity, getEntitySourceLocation } from '@backstage/catalog-model';
import { ScmIntegrationRegistry } from '@backstage/integration';

/**
 * Gherkin plugin annotation.
 * @public
 */
export const ANNOTATION_GHERKIN_LOCATION = 'backstage.io/gherkin-location';

/**
 * Utility function to get the value of an entity Gherkin annotation.
 * @public
 */
const getGherkinLocationDir = (entity: Entity) =>
  entity.metadata.annotations?.[ANNOTATION_GHERKIN_LOCATION]?.trim();

/**
 * Utility function to determine if the given entity has Gherkin.
 * @public
 */
export const isGherkinAvailable = (entity: Entity) =>
  Boolean(getGherkinLocationDir(entity));

/**
 * Utility function to extract the Gherkin location URL from an entity based off
 * its Gherkin annotation and relative to the entity source location.
 * @public
 */
export const getGherkinLocationUrl = (
  entity: Entity,
  scmIntegration: ScmIntegrationRegistry,
  gherkinFilePath?: String,
) => {
  if (!isGherkinAvailable(entity)) {
    throw new Error(`Missing Gherkin annotation: ${ANNOTATION_GHERKIN_LOCATION}`);
  }

  let url = getGherkinLocationDir(entity)!.replace(/\/$/, '');

  if (gherkinFilePath) {
    url = `${url}/${gherkinFilePath}`;
  }

  return scmIntegration.resolveUrl({
    url,
    base: getEntitySourceLocation(entity).target,
  });
};

/**
 * File path filter function type for Gherkin filenames
 * @public
 */
export type GherkinFilePathFilterFn = (path: string) => boolean;

/**
 * File path filter for gherkin filename formats
 * @public
 */
export const gherkinFilePathFilter: GherkinFilePathFilterFn = (path: string) =>
  /^(?:.*\/)?.+\.feature$/.test(path);
