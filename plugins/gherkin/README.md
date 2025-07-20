# GherkinPlugin

Welcome to the Gherkin plugin!

This plugin allows you to explore Gherkin specifications  associated with your entities.


## Setup

1. Install this plugin:

```bash
# From your Backstage root directory
yarn --cwd packages/app add @backstage-community/plugin-gherkin
```

2. Make sure the [Gherkin backend plugin](../gherkin-backend/README.md) is installed.

3. [Configure integrations](https://backstage.io/docs/integrations/) for all sites you would like to pull ADRs from.

### Entity Pages

1. Add the plugin as a tab to your Entity pages:

```jsx
// In packages/app/src/components/catalog/EntityPage.tsx
import { EntityAdrContent, isGherkinAvailable } from '@backstage-community/plugin-gherkin';

...
// Note: Add to any other Pages as well (e.g. defaultEntityPage and websiteEntityPage)
const serviceEntityPage = (
  <EntityLayout>
    {/* other tabs... */}
    <EntityLayout.Route if={isGherkinAvailable} path="/gherkin" title="Gherkin">
      <EntityAdrContent />
    </EntityLayout.Route>
  </EntityLayout>
```

2. Add `backstage.io/gherkin-location` annotation to your `catalog-info.yaml`:

```yaml
metadata:
  annotations:
    backstage.io/gherkin-location: <RELATIVE_PATH_TO_GHERKIN_FILES_DIR>
```

The value for `backstage.io/gherkin-location` should be a path relative to your `catalog-info.yaml` file or a absolute URL to the directory which contains your ADR markdown files.

For example, if you have the following directory structure, you would set `backstage.io/gherkin-location: docs/gherkin`:

```
repo-root/
  README.md
  src/
  catalog-info.yaml
  docs/
    gherkin/
      example.feature
```
