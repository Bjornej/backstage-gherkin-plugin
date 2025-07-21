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

import { useEffect, useState } from 'react';

import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useAsync from 'react-use/esm/useAsync';

import groupBy from 'lodash/groupBy';

import {
  Content,
  ContentHeader,
  InfoCard,
  Progress,
  SupportButton,
  WarningPanel,
} from '@backstage/core-components';
import { configApiRef, useApi, useRouteRef } from '@backstage/core-plugin-api';
import { scmIntegrationsApiRef } from '@backstage/integration-react';
import {
  GherkinFilePathFilterFn,
  ANNOTATION_GHERKIN_LOCATION,
  getGherkinLocationUrl,
  isGherkinAvailable,
  gherkinFilePathFilter,
} from '@backstage-community/plugin-gherkin-common';
import {
  useEntity,
  MissingAnnotationEmptyState,
} from '@backstage/plugin-catalog-react';
import Collapse from '@material-ui/core/Collapse';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import { makeStyles, Theme } from '@material-ui/core/styles';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import FolderIcon from '@material-ui/icons/Folder';

import { gherkinApiRef, GherkinFileInfo } from '../../api';
import { rootRouteRef } from '../../routes';
import { GherkinContentDecorator, GherkinReader } from '../GherkinReader';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
import { gherkinTranslationRef } from '../../translations';

const useStyles = makeStyles((theme: Theme) => ({
  gherkinMenu: {
    backgroundColor: theme.palette.background.paper,
  },
  gherkinContainerTitle: {
    color: theme.palette.grey[700],
    marginBottom: theme.spacing(1),
  },
  gherkinBox: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
  },
}));

const GherkinListContainer = (props: {
  gherkins: GherkinFileInfo[];
  selectedGherkin: string;
  title: string;
}) => {
  const { gherkins, selectedGherkin, title } = props;
  const classes = useStyles();
  const rootLink = useRouteRef(rootRouteRef);
  const [open, setOpen] = React.useState(true);

  const handleClick = () => {
    setOpen(!open);
  };

  return (
    <>
      {title && (
        <ListItem
          button
          className={classes.gherkinContainerTitle}
          onClick={handleClick}
        >
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary={title} />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
      )}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List dense>
          {gherkins.map((gherkin, idx) => (
            <ListItem
              button
              component={Link}
              key={idx}
              selected={selectedGherkin === gherkin.path}
              to={`${rootLink()}?record=${gherkin.path}`}
            >
              <ListItemText
                primary={gherkin.title ?? gherkin?.name.replace(/\.md$/, '')}
                primaryTypographyProps={{
                  style: { whiteSpace: 'normal' },
                }}
              />
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  );
};

/**
 * Component for browsing gherkins on an entity page.
 * @public
 */
export const EntityGherkinContent = (props: {
  contentDecorators?: GherkinContentDecorator[];
  filePathFilterFn?: GherkinFilePathFilterFn;
}) => {
  const { contentDecorators, filePathFilterFn } = props;
  const classes = useStyles();
  const { entity } = useEntity();
  const [gherkinList, setGherkinList] = useState<GherkinFileInfo[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const scmIntegrations = useApi(scmIntegrationsApiRef);
  const gherkinApi = useApi(gherkinApiRef);
  const entityHasGherkins = isGherkinAvailable(entity);
  const { t } = useTranslationRef(gherkinTranslationRef);

  const config = useApi(configApiRef);
  const appSupportConfigured = config?.getOptionalConfig('app.support');

  const { value, loading, error } = useAsync(async () => {
    const url = getGherkinLocationUrl(entity, scmIntegrations);
    return gherkinApi.listGherkins(url);
  }, [entity, scmIntegrations]);

  const selectedGherkin =
    gherkinList.find(gherkin => gherkin.path === searchParams.get('record'))?.path ?? '';

  const gherkinSubDirectoryFunc = (gherkin: GherkinFileInfo) => {
    return gherkin.path.split('/').slice(0, -1).join('/');
  };

  useEffect(() => {
    if (gherkinList.length && !selectedGherkin) {
      searchParams.set('record', gherkinList[0].path);
      setSearchParams(searchParams, { replace: true });
    }
  });

  useEffect(() => {
    if (!value?.data) {
      return;
    }

    const gherkins: GherkinFileInfo[] = value.data.filter(
      (item: GherkinFileInfo) =>
        item.type === 'file' &&
        (filePathFilterFn
          ? filePathFilterFn(item.path)
          : gherkinFilePathFilter(item.path)),
    );

    setGherkinList(gherkins);
  }, [filePathFilterFn, value]);

  const gherkinListGrouped = Object.entries(
    groupBy(gherkinList, gherkinSubDirectoryFunc),
  ).sort();

  return (
    <Content>
      <ContentHeader title={t('contentHeaderTitle')}>
        {appSupportConfigured && <SupportButton />}
      </ContentHeader>

      {!entityHasGherkins && (
        <MissingAnnotationEmptyState annotation={ANNOTATION_GHERKIN_LOCATION} />
      )}

      {loading && <Progress />}

      {entityHasGherkins && !loading && error && (
        <WarningPanel title={t('failedToFetch')} message={error?.message} />
      )}

      {entityHasGherkins &&
        !loading &&
        !error &&
        (gherkinList.length ? (
          <Grid container direction="row">
            <Grid item xs={3}>
              <InfoCard>
                <List className={classes.gherkinMenu} dense>
                  {gherkinListGrouped.map(([title, gherkins], idx) => (
                    <GherkinListContainer
                      gherkins={gherkins}
                      key={idx}
                      selectedGherkin={selectedGherkin}
                      title={title}
                    />
                  ))}
                </List>
              </InfoCard>
            </Grid>
            <Grid item xs={9}>
              <GherkinReader gherkin={selectedGherkin} decorators={contentDecorators} />
            </Grid>
          </Grid>
        ) : (
          <Typography>{t('notFound')}</Typography>
        ))}
    </Content>
  );
};
