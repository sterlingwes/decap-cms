import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fromJS } from 'immutable';

import { addAssets } from '../media';
import * as actions from '../editorialWorkflow';

jest.mock('../../backend');
jest.mock('../../valueObjects/AssetProxy');
jest.mock('decap-cms-lib-util');
global.crypto.randomUUID = jest.fn().mockReturnValue('000000000000000000000');

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('editorialWorkflow actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadUnpublishedEntry', () => {
    it('should load unpublished entry', () => {
      const { currentBackend } = require('../../backend');
      const { createAssetProxy } = require('../../valueObjects/AssetProxy');

      const assetProxy = { name: 'name', path: 'path' };
      const entry = { mediaFiles: [{ file: { name: 'name' }, id: '1', draft: true }] };
      const backend = {
        unpublishedEntry: jest.fn().mockResolvedValue(entry),
      };

      const store = mockStore({
        config: fromJS({
          editor: { notes: true },
        }),
        collections: fromJS({
          posts: { name: 'posts' },
        }),
        mediaLibrary: fromJS({
          isLoading: false,
        }),
        editorialWorkflow: fromJS({
          pages: { ids: [] },
        }),
      });

      currentBackend.mockReturnValue(backend);
      createAssetProxy.mockResolvedValue(assetProxy);

      const slug = 'slug';
      const collection = store.getState().collections.get('posts');

      return store.dispatch(actions.loadUnpublishedEntry(collection, slug)).then(() => {
        const actions = store.getActions();
        expect(actions).toHaveLength(4);
        expect(actions[0]).toEqual({
          type: 'UNPUBLISHED_ENTRY_REQUEST',
          payload: {
            collection: 'posts',
            slug,
          },
        });
        expect(actions[1]).toEqual(addAssets([assetProxy]));
        expect(actions[2]).toEqual({
          type: 'UNPUBLISHED_ENTRY_SUCCESS',
          payload: {
            collection: 'posts',
            entry: { ...entry, mediaFiles: [{ file: { name: 'name' }, id: '1', draft: true }] },
          },
        });
        expect(actions[3]).toEqual({
          type: 'DRAFT_CREATE_FROM_ENTRY',
          payload: {
            entry,
          },
        });
      });
    });
  });

  describe('publishUnpublishedEntry', () => {
    it('should publish unpublished entry and report success', async () => {
      const { currentBackend } = require('../../backend');

      const entry = {};
      const backend = {
        publishUnpublishedEntry: jest.fn().mockResolvedValue(),
        getEntry: jest.fn().mockResolvedValue(entry),
        getMedia: jest.fn().mockResolvedValue([]),
        getNotes: jest.fn().mockResolvedValue([]),
      };

      const store = mockStore({
        config: fromJS({}),
        integrations: fromJS([]),
        mediaLibrary: fromJS({
          isLoading: false,
        }),
        collections: fromJS({
          posts: { name: 'posts' },
        }),
      });

      currentBackend.mockReturnValue(backend);

      const slug = 'slug';

      return store.dispatch(actions.publishUnpublishedEntry('posts', slug)).then(() => {
        const actions = store.getActions();
        expect(actions).toHaveLength(8);

        expect(actions[0]).toEqual({
          type: 'UNPUBLISHED_ENTRY_PUBLISH_REQUEST',
          payload: {
            collection: 'posts',
            slug,
          },
        });
        expect(actions[1]).toEqual({
          type: 'MEDIA_LOAD_REQUEST',
          payload: {
            page: 1,
          },
        });
        expect(actions[2]).toEqual({
          type: 'NOTIFICATION_SEND',
          payload: {
            message: { key: 'ui.toast.entryPublished' },
            type: 'success',
            dismissAfter: 4000,
          },
        });
        expect(actions[3]).toEqual({
          type: 'UNPUBLISHED_ENTRY_PUBLISH_SUCCESS',
          payload: {
            collection: 'posts',
            slug,
          },
        });

        expect(actions[4]).toEqual({
          type: 'MEDIA_LOAD_SUCCESS',
          payload: {
            files: [],
          },
        });
        expect(actions[5]).toEqual({
          type: 'ENTRY_REQUEST',
          payload: {
            slug,
            collection: 'posts',
          },
        });
        expect(actions[6]).toEqual({
          type: 'ENTRY_SUCCESS',
          payload: {
            entry,
            collection: 'posts',
          },
        });
        expect(actions[7]).toEqual({
          type: 'DRAFT_CREATE_FROM_ENTRY',
          payload: {
            entry,
          },
        });
      });
    });

    it('should publish unpublished entry and report error', () => {
      const { currentBackend } = require('../../backend');

      const error = new Error('failed to publish entry');
      const backend = {
        publishUnpublishedEntry: jest.fn().mockRejectedValue(error),
      };

      const store = mockStore({
        config: fromJS({}),
        collections: fromJS({
          posts: { name: 'posts' },
        }),
      });

      currentBackend.mockReturnValue(backend);

      const slug = 'slug';

      return store.dispatch(actions.publishUnpublishedEntry('posts', slug)).then(() => {
        const actions = store.getActions();
        expect(actions).toHaveLength(3);
        expect(actions[0]).toEqual({
          type: 'UNPUBLISHED_ENTRY_PUBLISH_REQUEST',
          payload: {
            collection: 'posts',
            slug,
          },
        });
        expect(actions[1]).toEqual({
          type: 'NOTIFICATION_SEND',
          payload: {
            message: { key: 'ui.toast.onFailToPublishEntry', details: error },
            type: 'error',
            dismissAfter: 8000,
          },
        });
        expect(actions[2]).toEqual({
          type: 'UNPUBLISHED_ENTRY_PUBLISH_FAILURE',
          payload: {
            collection: 'posts',
            slug,
          },
        });
      });
    });
  });

  describe('publishBatch', () => {
    it('should notify when the batch is empty', () => {
      const { currentBackend } = require('../../backend');
      currentBackend.mockReturnValue({});

      const store = mockStore({
        config: fromJS({}),
        collections: fromJS({ posts: { name: 'posts' } }),
        editorialWorkflow: fromJS({
          pages: { ids: [] },
          entities: {},
        }),
      });

      return store.dispatch(actions.publishBatch()).then(() => {
        const dispatched = store.getActions();
        const notifications = dispatched.filter(a => a.type === 'NOTIFICATION_SEND');
        expect(notifications).toHaveLength(1);
        expect(notifications[0].payload.message.key).toEqual('ui.toast.onBatchEmpty');
      });
    });

    it('should publish every entry queued in the batch and summarize', () => {
      const { currentBackend } = require('../../backend');

      const publishUnpublishedEntry = jest.fn().mockResolvedValue();
      const backend = {
        publishUnpublishedEntry,
        getEntry: jest.fn().mockResolvedValue({}),
        getMedia: jest.fn().mockResolvedValue([]),
        getNotes: jest.fn().mockResolvedValue([]),
      };
      currentBackend.mockReturnValue(backend);

      const store = mockStore({
        config: fromJS({}),
        integrations: fromJS([]),
        mediaLibrary: fromJS({ isLoading: false }),
        collections: fromJS({ posts: { name: 'posts' } }),
        editorialWorkflow: fromJS({
          pages: { ids: ['posts.one', 'posts.two'] },
          entities: {
            'posts.one': { collection: 'posts', slug: 'one', status: 'pending_publish' },
            'posts.two': { collection: 'posts', slug: 'two', status: 'pending_publish' },
            'posts.draft': { collection: 'posts', slug: 'draft', status: 'draft' },
          },
        }),
      });

      return store.dispatch(actions.publishBatch()).then(() => {
        const dispatched = store.getActions();

        // only the two "pending_publish" entries are published, not the draft
        expect(publishUnpublishedEntry).toHaveBeenCalledTimes(2);
        const published = dispatched.filter(a => a.type === 'UNPUBLISHED_ENTRY_PUBLISH_SUCCESS');
        expect(published.map(a => a.payload.slug).sort()).toEqual(['one', 'two']);

        // media is reloaded once for the whole batch
        expect(
          dispatched.filter(a => a.type === 'MEDIA_LOAD_REQUEST'),
        ).toHaveLength(1);

        const summary = dispatched.find(
          a => a.type === 'NOTIFICATION_SEND' && a.payload.message.key === 'ui.toast.batchPublished',
        );
        expect(summary).toBeDefined();
        expect(summary.payload.message.count).toEqual(2);
      });
    });

    it('should stop on the first failure and report the failed entry', () => {
      const { currentBackend } = require('../../backend');

      const error = new Error('merge conflict');
      const publishUnpublishedEntry = jest
        .fn()
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(error);
      const backend = {
        publishUnpublishedEntry,
        getEntry: jest.fn().mockResolvedValue({}),
        getMedia: jest.fn().mockResolvedValue([]),
        getNotes: jest.fn().mockResolvedValue([]),
      };
      currentBackend.mockReturnValue(backend);

      const store = mockStore({
        config: fromJS({}),
        integrations: fromJS([]),
        mediaLibrary: fromJS({ isLoading: false }),
        collections: fromJS({ posts: { name: 'posts' } }),
        editorialWorkflow: fromJS({
          pages: { ids: ['posts.one', 'posts.two', 'posts.three'] },
          entities: {
            'posts.one': { collection: 'posts', slug: 'one', status: 'pending_publish' },
            'posts.two': { collection: 'posts', slug: 'two', status: 'pending_publish' },
            'posts.three': { collection: 'posts', slug: 'three', status: 'pending_publish' },
          },
        }),
      });

      return store.dispatch(actions.publishBatch()).then(() => {
        const dispatched = store.getActions();

        // stops after the failure: first succeeds, second fails, third never attempted
        expect(publishUnpublishedEntry).toHaveBeenCalledTimes(2);
        expect(
          dispatched.filter(a => a.type === 'UNPUBLISHED_ENTRY_PUBLISH_SUCCESS'),
        ).toHaveLength(1);

        const failure = dispatched.find(
          a =>
            a.type === 'NOTIFICATION_SEND' &&
            a.payload.message.key === 'ui.toast.onFailToPublishBatchEntry',
        );
        expect(failure).toBeDefined();
        expect(failure.payload.message.slug).toEqual('two');
      });
    });
  });
});
