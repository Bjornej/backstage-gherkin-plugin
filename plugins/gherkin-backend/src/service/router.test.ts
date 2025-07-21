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

import express from 'express';
import request from 'supertest';
import { createRouter } from './router';
import {
  CacheService,
  LoggerService,
  UrlReaderService,
  UrlReaderServiceReadTreeResponse,
  UrlReaderServiceReadTreeResponseFile,
  UrlReaderServiceReadUrlResponse,
} from '@backstage/backend-plugin-api';

const listEndpointName = '/list';
const fileEndpointName = '/file';

const makeBufferFromString = (string: string) => async () =>
  Buffer.from(string);

const makeEtagFromString = (string: string) => {
  const crypto = require('crypto');
  return crypto.createHash('md5', string).digest('hex');
};

const testingUrlFakeFileTree: UrlReaderServiceReadTreeResponseFile[] = [
  {
    path: 'folder/testFile001.txt',
    content: makeBufferFromString('folder/testFile001.txt content'),
  },
  {
    path: 'testFile001.txt',
    content: makeBufferFromString('testFile002.txt content'),
  },
  {
    path: 'testFile002.txt',
    content: makeBufferFromString('testFile001.txt content'),
  },
  {
    path: '.gitkeep',
    content: makeBufferFromString(''),
  },
];

const makeFileContent = async (fileContent: string) => {
  const result: UrlReaderServiceReadUrlResponse = {
    buffer: makeBufferFromString(fileContent),
    etag: makeEtagFromString(fileContent),
  };
  return result;
};

const testFileOneContent = 'testFileOne content';
const testFileTwoContent = 'testFileTwo content';
const genericFileContent = 'file content';
const testImageContent = 'image content';

const mockUrlReader: UrlReaderService = {
  readUrl(url: string) {
    switch (url) {
      case 'testFileOne':
        return makeFileContent(testFileOneContent);
      case 'testFileTwo':
        return makeFileContent(testFileTwoContent);
      case 'testImage.png':
        return makeFileContent(testImageContent);
      default:
        return makeFileContent(genericFileContent);
    }
  },
  readTree() {
    const result: UrlReaderServiceReadTreeResponse = {
      files: async () => testingUrlFakeFileTree,
      archive() {
        throw new Error('Function not implemented.');
      },
      dir() {
        throw new Error('Function not implemented.');
      },
      etag: '',
    };

    const resultPromise = async () => result;
    return resultPromise();
  },
  search() {
    throw new Error('search not implemented.');
  },
};

class MockCacheClient implements CacheService {
  private itemRegistry: { [key: string]: any };

  constructor() {
    this.itemRegistry = {};
  }

  async get(key: string) {
    return this.itemRegistry[key];
  }

  async set(key: string, value: any) {
    this.itemRegistry[key] = value;
  }

  async delete(key: string) {
    delete this.itemRegistry[key];
  }

  withOptions = () => this;
}

describe('createRouter', () => {
  let app: express.Express;
  const routerErrorLoggerMock = jest.fn((message: string) => message);

  beforeEach(async () => {
    jest.resetAllMocks();

    const router = await createRouter({
      reader: mockUrlReader,
      cacheClient: new MockCacheClient(),
      logger: {
        error: routerErrorLoggerMock as unknown,
      } as LoggerService,
    });
    app = express().use(router);
  });

  describe(`GET ${listEndpointName}`, () => {
    it('returns bad request (400) when no url is provided', async () => {
      const urlNotSpecifiedRequest = await request(app).get(listEndpointName);
      const urlNotSpecifiedStatus = urlNotSpecifiedRequest.status;
      const urlNotSpecifiedMessage = urlNotSpecifiedRequest.body.message;

      const urlNotFilledRequest = await request(app).get(
        `${listEndpointName}?url=`,
      );
      const urlNotFilledStatus = urlNotFilledRequest.status;
      const urlNotFilledMessage = urlNotFilledRequest.body.message;

      const expectedStatusCode = 400;
      const expectedErrorMessage = 'No URL provided';

      expect(urlNotSpecifiedStatus).toBe(expectedStatusCode);
      expect(urlNotSpecifiedMessage).toBe(expectedErrorMessage);

      expect(urlNotFilledStatus).toBe(expectedStatusCode);
      expect(urlNotFilledMessage).toBe(expectedErrorMessage);
    });

    it('returns the correct listing when reading a url', async () => {
      const result = await request(app).get(`${listEndpointName}?url=testing`);
      const { status, body, error } = result;

      const expectedStatusCode = 200;
      const expectedBody = {
        data: [
          {
            type: 'file',
            name: 'testFile002.txt',
            path: 'testFile002.txt',
          },
          {
            type: 'file',
            name: 'testFile001.txt',
            path: 'testFile001.txt',
          },
          {
            type: 'file',
            name: 'testFile001.txt',
            path: 'folder/testFile001.txt',
          },
        ],
      };

      expect(error).toBeFalsy();
      expect(status).toBe(expectedStatusCode);
      expect(body).toEqual(expectedBody);
      expect(routerErrorLoggerMock.mock.calls).toHaveLength(1);
      expect(routerErrorLoggerMock.mock.calls[0][0]).toBe(
        'Failed to parse .gitkeep: Gherkin has no content',
      );
    });
  });

  describe(`GET ${fileEndpointName}`, () => {
    it('returns bad request (400) when no url is provided', async () => {
      const urlNotSpecifiedRequest = await request(app).get(fileEndpointName);
      const urlNotSpecifiedStatus = urlNotSpecifiedRequest.status;
      const urlNotSpecifiedMessage = urlNotSpecifiedRequest.body.message;

      const urlNotFilledRequest = await request(app).get(
        `${fileEndpointName}?url=`,
      );
      const urlNotFilledStatus = urlNotFilledRequest.status;
      const urlNotFilledMessage = urlNotFilledRequest.body.message;

      const expectedStatusCode = 400;
      const expectedErrorMessage = 'No URL provided';

      expect(urlNotSpecifiedStatus).toBe(expectedStatusCode);
      expect(urlNotSpecifiedMessage).toBe(expectedErrorMessage);

      expect(urlNotFilledStatus).toBe(expectedStatusCode);
      expect(urlNotFilledMessage).toBe(expectedErrorMessage);
    });

    it('returns the correct file contents when reading a url', async () => {
      const fileOneResponse = await request(app).get(
        `${fileEndpointName}?url=testFileOne`,
      );
      const fileOneStatus = fileOneResponse.status;
      const fileOneBody = fileOneResponse.body;
      const fileOneError = fileOneResponse.error;

      const fileTwoResponse = await request(app).get(
        `${fileEndpointName}?url=testFileTwo`,
      );
      const fileTwoStatus = fileTwoResponse.status;
      const fileTwoBody = fileTwoResponse.body;
      const fileTwoError = fileTwoResponse.error;

      const expectedStatusCode = 200;

      expect(fileOneError).toBeFalsy();
      expect(fileOneStatus).toBe(expectedStatusCode);
      expect(fileOneBody.data).toBe(testFileOneContent);

      expect(fileTwoError).toBeFalsy();
      expect(fileTwoStatus).toBe(expectedStatusCode);
      expect(fileTwoBody.data).toBe(testFileTwoContent);
    });
  });
});
