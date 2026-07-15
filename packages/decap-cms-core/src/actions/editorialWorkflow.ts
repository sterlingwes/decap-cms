import get from 'lodash/get';
import { Map, List } from 'immutable';
import { EDITORIAL_WORKFLOW_ERROR } from 'decap-cms-lib-util';

import { currentBackend, slugFromCustomPath } from '../backend';
import {
  selectPublishedSlugs,
  selectUnpublishedSlugs,
  selectEntry,
  selectUnpublishedEntry,
  selectUnpublishedEntriesByStatus,
} from '../reducers';
import { selectEditingDraft } from '../reducers/entries';
import { EDITORIAL_WORKFLOW, status } from '../constants/publishModes';
import {
  loadEntry,
  entryDeleted,
  getMediaAssets,
  createDraftFromEntry,
  loadEntries,
  getSerializedEntry,
} from './entries';
import { createAssetProxy } from '../valueObjects/AssetProxy';
import { addAssets } from './media';
import { loadMedia } from './mediaLibrary';
import ValidationErrorTypes from '../constants/validationErrorTypes';
import { navigateToEntry } from '../routing/history';
import { addNotification } from './notifications';

import type {
  Collection,
  EntryMap,
  State,
  Collections,
  EntryDraft,
  MediaFile,
} from '../types/redux';
import type { AnyAction } from 'redux';
import type { EntryValue } from '../valueObjects/Entry';
import type { Status } from '../constants/publishModes';
import type { ThunkDispatch } from 'redux-thunk';

/*
 * Constant Declarations
 */
export const UNPUBLISHED_ENTRY_REQUEST = 'UNPUBLISHED_ENTRY_REQUEST';
export const UNPUBLISHED_ENTRY_SUCCESS = 'UNPUBLISHED_ENTRY_SUCCESS';
export const UNPUBLISHED_ENTRY_REDIRECT = 'UNPUBLISHED_ENTRY_REDIRECT';

export const UNPUBLISHED_ENTRIES_REQUEST = 'UNPUBLISHED_ENTRIES_REQUEST';
export const UNPUBLISHED_ENTRIES_SUCCESS = 'UNPUBLISHED_ENTRIES_SUCCESS';
export const UNPUBLISHED_ENTRIES_FAILURE = 'UNPUBLISHED_ENTRIES_FAILURE';

export const UNPUBLISHED_ENTRY_PERSIST_REQUEST = 'UNPUBLISHED_ENTRY_PERSIST_REQUEST';
export const UNPUBLISHED_ENTRY_PERSIST_SUCCESS = 'UNPUBLISHED_ENTRY_PERSIST_SUCCESS';
export const UNPUBLISHED_ENTRY_PERSIST_FAILURE = 'UNPUBLISHED_ENTRY_PERSIST_FAILURE';

export const UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST';
export const UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS';
export const UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE = 'UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE';

export const UNPUBLISHED_ENTRY_PUBLISH_REQUEST = 'UNPUBLISHED_ENTRY_PUBLISH_REQUEST';
export const UNPUBLISHED_ENTRY_PUBLISH_SUCCESS = 'UNPUBLISHED_ENTRY_PUBLISH_SUCCESS';
export const UNPUBLISHED_ENTRY_PUBLISH_FAILURE = 'UNPUBLISHED_ENTRY_PUBLISH_FAILURE';

export const UNPUBLISHED_ENTRY_DELETE_REQUEST = 'UNPUBLISHED_ENTRY_DELETE_REQUEST';
export const UNPUBLISHED_ENTRY_DELETE_SUCCESS = 'UNPUBLISHED_ENTRY_DELETE_SUCCESS';
export const UNPUBLISHED_ENTRY_DELETE_FAILURE = 'UNPUBLISHED_ENTRY_DELETE_FAILURE';

/*
 * Simple Action Creators (Internal)
 */

function unpublishedEntryLoading(collection: Collection, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntryLoaded(
  collection: Collection,
  entry: EntryValue & { mediaFiles: MediaFile[] },
) {
  return {
    type: UNPUBLISHED_ENTRY_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry,
    },
  };
}

function unpublishedEntryRedirected(collection: Collection, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_REDIRECT,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntriesLoading() {
  return {
    type: UNPUBLISHED_ENTRIES_REQUEST,
  };
}

function unpublishedEntriesLoaded(entries: EntryValue[], pagination: number) {
  return {
    type: UNPUBLISHED_ENTRIES_SUCCESS,
    payload: {
      entries,
      pages: pagination,
    },
  };
}

function unpublishedEntriesFailed(error: Error) {
  return {
    type: UNPUBLISHED_ENTRIES_FAILURE,
    error: 'Failed to load entries',
    payload: error,
  };
}

function unpublishedEntryPersisting(collection: Collection, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_REQUEST,
    payload: {
      collection: collection.get('name'),
      slug,
    },
  };
}

function unpublishedEntryPersisted(collection: Collection, entry: EntryMap) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_SUCCESS,
    payload: {
      collection: collection.get('name'),
      entry,
    },
  };
}

function unpublishedEntryPersistedFail(error: Error, collection: Collection, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_PERSIST_FAILURE,
    payload: {
      error,
      collection: collection.get('name'),
      slug,
    },
    error,
  };
}

function unpublishedEntryStatusChangeRequest(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_REQUEST,
    payload: {
      collection,
      slug,
    },
  };
}

function unpublishedEntryStatusChangePersisted(
  collection: string,
  slug: string,
  newStatus: Status,
) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_SUCCESS,
    payload: {
      collection,
      slug,
      newStatus,
    },
  };
}

function unpublishedEntryStatusChangeError(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_STATUS_CHANGE_FAILURE,
    payload: { collection, slug },
  };
}

function unpublishedEntryPublishRequest(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_REQUEST,
    payload: { collection, slug },
  };
}

function unpublishedEntryPublished(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_SUCCESS,
    payload: { collection, slug },
  };
}

function unpublishedEntryPublishError(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_PUBLISH_FAILURE,
    payload: { collection, slug },
  };
}

function unpublishedEntryDeleteRequest(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_DELETE_REQUEST,
    payload: { collection, slug },
  };
}

function unpublishedEntryDeleted(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_DELETE_SUCCESS,
    payload: { collection, slug },
  };
}

function unpublishedEntryDeleteError(collection: string, slug: string) {
  return {
    type: UNPUBLISHED_ENTRY_DELETE_FAILURE,
    payload: { collection, slug },
  };
}

/*
 * Exported Thunk Action Creators
 */

export function loadUnpublishedEntry(collection: Collection, slug: string) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const entriesLoaded = get(state.editorialWorkflow.toJS(), 'pages.ids', false);
    //run possible unpublishedEntries migration
    if (!entriesLoaded) {
      try {
        const { entries, pagination } = await backend.unpublishedEntries(state.collections);
        dispatch(unpublishedEntriesLoaded(entries, pagination));
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }

    dispatch(unpublishedEntryLoading(collection, slug));

    try {
      const entry = (await backend.unpublishedEntry(state, collection, slug)) as EntryValue;
      const assetProxies = await Promise.all(
        entry.mediaFiles
          .filter(file => file.draft)
          .map(({ url, file, path }) =>
            createAssetProxy({
              path,
              url,
              file,
            }),
          ),
      );
      dispatch(addAssets(assetProxies));
      dispatch(unpublishedEntryLoaded(collection, entry));
      dispatch(createDraftFromEntry(entry));
    } catch (error) {
      if (error.name === EDITORIAL_WORKFLOW_ERROR && error.notUnderEditorialWorkflow) {
        dispatch(unpublishedEntryRedirected(collection, slug));
        dispatch(loadEntry(collection, slug));
      } else {
        dispatch(
          addNotification({
            message: {
              key: 'ui.toast.onFailToLoadEntries',
              details: error,
            },
            type: 'error',
            dismissAfter: 8000,
          }),
        );
      }
    }
  };
}

export function loadUnpublishedEntries(collections: Collections) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const entriesLoaded = get(state.editorialWorkflow.toJS(), 'pages.ids', false);

    if (state.config.publish_mode !== EDITORIAL_WORKFLOW || entriesLoaded) {
      return;
    }

    dispatch(unpublishedEntriesLoading());
    backend
      .unpublishedEntries(collections)
      .then(response => dispatch(unpublishedEntriesLoaded(response.entries, response.pagination)))
      .catch((error: Error) => {
        dispatch(
          addNotification({
            message: {
              key: 'ui.toast.onFailToLoadEntries',
              details: error,
            },
            type: 'error',
            dismissAfter: 8000,
          }),
        );
        dispatch(unpublishedEntriesFailed(error));
        Promise.reject(error);
      });
  };
}

export function persistUnpublishedEntry(
  collection: Collection,
  existingUnpublishedEntry: boolean,
  // When provided, the entry is persisted straight into the batch at this
  // workflow status (e.g. "pending_publish") instead of the default initial
  // status. Used by the change-batching workflow.
  queueStatus?: string,
) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const entryDraft = state.entryDraft;
    const fieldsErrors = entryDraft.get('fieldsErrors');
    const unpublishedSlugs = selectUnpublishedSlugs(state, collection.get('name'));
    const publishedSlugs = selectPublishedSlugs(state, collection.get('name'));
    const usedSlugs = publishedSlugs.concat(unpublishedSlugs) as List<string>;
    const entriesLoaded = get(state.editorialWorkflow.toJS(), 'pages.ids', false);
    const existingEntry = selectUnpublishedEntry(
      state,
      collection.get('name'),
      state.entryDraft.getIn(['entry', 'slug']),
    );
    const currentStatus = existingEntry && existingEntry.get('status');

    //load unpublishedEntries
    !entriesLoaded && dispatch(loadUnpublishedEntries(state.collections));

    // Early return if draft contains validation errors
    if (!fieldsErrors.isEmpty()) {
      const hasPresenceErrors = fieldsErrors.some(errors =>
        errors.some(error => error.type && error.type === ValidationErrorTypes.PRESENCE),
      );

      if (hasPresenceErrors) {
        dispatch(
          addNotification({
            message: {
              key: 'ui.toast.missingRequiredField',
            },
            type: 'error',
            dismissAfter: 8000,
          }),
        );
      }
      return Promise.reject();
    }

    const backend = currentBackend(state.config);
    const entry = entryDraft.get('entry');
    const assetProxies = getMediaAssets({
      entry,
    });

    const serializedEntry = getSerializedEntry(collection, entry);
    const serializedEntryDraft = entryDraft.set('entry', serializedEntry);

    dispatch(unpublishedEntryPersisting(collection, entry.get('slug')));
    const persistAction = existingUnpublishedEntry
      ? backend.persistUnpublishedEntry
      : backend.persistEntry;

    try {
      const newSlug = await persistAction.call(backend, {
        config: state.config,
        collection,
        entryDraft: serializedEntryDraft,
        assetProxies,
        usedSlugs,
        status: queueStatus,
      });

      // For an entry that's already in the workflow the persist path commits to
      // its existing branch without touching the PR label, so bump the status
      // explicitly to move it into the batch.
      if (queueStatus && existingUnpublishedEntry && currentStatus !== queueStatus) {
        await backend.updateUnpublishedEntryStatus(collection.get('name'), newSlug, queueStatus);
        dispatch(
          unpublishedEntryStatusChangePersisted(
            collection.get('name'),
            newSlug,
            queueStatus as Status,
          ),
        );
      }

      dispatch(
        addNotification({
          message: {
            key: queueStatus ? 'ui.toast.entryQueued' : 'ui.toast.entrySaved',
          },
          type: 'success',
          dismissAfter: 4000,
        }),
      );
      dispatch(unpublishedEntryPersisted(collection, serializedEntry));

      if (entry.get('slug') !== newSlug) {
        await dispatch(loadUnpublishedEntry(collection, newSlug));
        navigateToEntry(collection.get('name'), newSlug);
      }
    } catch (error) {
      dispatch(
        addNotification({
          message: {
            key: 'ui.toast.onFailToPersist',
            details: error,
          },
          type: 'error',
          dismissAfter: 8000,
        }),
      );
      return Promise.reject(
        dispatch(unpublishedEntryPersistedFail(error, collection, entry.get('slug'))),
      );
    }
  };
}

/**
 * Persist the current draft straight into the batch (the "Ready to publish"
 * queue) in a single action, saving it first if needed. This is the editor
 * shorthand for the manual "save, then drag to Ready on the workflow board"
 * flow. Since a single batch is assumed, the batch is simply the set of
 * unpublished entries at the `pending_publish` status.
 */
export function queueUnpublishedEntry(collection: Collection, existingUnpublishedEntry: boolean) {
  return persistUnpublishedEntry(
    collection,
    existingUnpublishedEntry,
    status.get('PENDING_PUBLISH'),
  );
}

export function updateUnpublishedEntryStatus(
  collection: string,
  slug: string,
  oldStatus: Status,
  newStatus: Status,
) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    if (oldStatus === newStatus) return;
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(unpublishedEntryStatusChangeRequest(collection, slug));
    backend
      .updateUnpublishedEntryStatus(collection, slug, newStatus)
      .then(() => {
        dispatch(
          addNotification({
            message: {
              key: 'ui.toast.entryUpdated',
            },
            type: 'success',
            dismissAfter: 4000,
          }),
        );
        dispatch(unpublishedEntryStatusChangePersisted(collection, slug, newStatus));
      })
      .catch((error: Error) => {
        dispatch(
          addNotification({
            message: {
              key: 'ui.toast.onFailToUpdateStatus',
              details: error,
            },
            type: 'error',
            dismissAfter: 8000,
          }),
        );
        dispatch(unpublishedEntryStatusChangeError(collection, slug));
      });
  };
}

export function deleteUnpublishedEntry(collection: string, slug: string) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(unpublishedEntryDeleteRequest(collection, slug));
    return backend
      .deleteUnpublishedEntry(collection, slug)
      .then(() => {
        dispatch(
          addNotification({
            message: { key: 'ui.toast.onDeleteUnpublishedChanges' },
            type: 'success',
            dismissAfter: 4000,
          }),
        );
        dispatch(unpublishedEntryDeleted(collection, slug));
      })
      .catch((error: Error) => {
        dispatch(
          addNotification({
            message: { key: 'ui.toast.onDeleteUnpublishedChanges', details: error },
            type: 'error',
            dismissAfter: 8000,
          }),
        );
        dispatch(unpublishedEntryDeleteError(collection, slug));
      });
  };
}

export function publishUnpublishedEntry(collectionName: string, slug: string) {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const collections = state.collections;
    const backend = currentBackend(state.config);
    const entry = selectUnpublishedEntry(state, collectionName, slug);
    dispatch(unpublishedEntryPublishRequest(collectionName, slug));
    try {
      await backend.publishUnpublishedEntry(entry);
      // re-load media after entry was published
      dispatch(loadMedia());
      dispatch(
        addNotification({
          message: { key: 'ui.toast.entryPublished' },
          type: 'success',
          dismissAfter: 4000,
        }),
      );
      dispatch(unpublishedEntryPublished(collectionName, slug));
      const collection = collections.get(collectionName);
      if (collection.has('nested')) {
        dispatch(loadEntries(collection));
        const newSlug = slugFromCustomPath(collection, entry.get('path'));
        loadEntry(collection, newSlug);
        if (slug !== newSlug && selectEditingDraft(state.entryDraft)) {
          navigateToEntry(collection.get('name'), newSlug);
        }
      } else {
        return dispatch(loadEntry(collection, slug));
      }
    } catch (error) {
      dispatch(
        addNotification({
          message: { key: 'ui.toast.onFailToPublishEntry', details: error },
          type: 'error',
          dismissAfter: 8000,
        }),
      );
      dispatch(unpublishedEntryPublishError(collectionName, slug));
    }
  };
}

/**
 * Publishes a single unpublished entry and refreshes the affected state,
 * re-throwing on failure so a batch can stop on the first error. Media
 * reloading and success notifications are intentionally left to the caller so
 * the batch can summarize rather than emit one of each per entry.
 */
async function publishBatchEntry(
  dispatch: ThunkDispatch<State, {}, AnyAction>,
  getState: () => State,
  collectionName: string,
  slug: string,
) {
  const state = getState();
  const collections = state.collections;
  const backend = currentBackend(state.config);
  const entry = selectUnpublishedEntry(state, collectionName, slug);
  dispatch(unpublishedEntryPublishRequest(collectionName, slug));
  try {
    await backend.publishUnpublishedEntry(entry);
    dispatch(unpublishedEntryPublished(collectionName, slug));
    const collection = collections.get(collectionName);
    if (collection.has('nested')) {
      dispatch(loadEntries(collection));
      const newSlug = slugFromCustomPath(collection, entry.get('path'));
      loadEntry(collection, newSlug);
      if (slug !== newSlug && selectEditingDraft(state.entryDraft)) {
        navigateToEntry(collection.get('name'), newSlug);
      }
    } else {
      await dispatch(loadEntry(collection, slug));
    }
  } catch (error) {
    dispatch(unpublishedEntryPublishError(collectionName, slug));
    throw error;
  }
}

/**
 * Publishes every entry currently in the batch (all unpublished entries at the
 * `pending_publish` status). Entries are published sequentially since each one
 * merges its own pull request into the base branch; on the first failure
 * (e.g. a merge conflict) the batch stops and reports which entry failed,
 * leaving the remaining entries queued.
 */
export function publishBatch() {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    let state = getState();
    const backend = currentBackend(state.config);

    // Make sure the unpublished entries are loaded so the batch is complete.
    const entriesLoaded = get(state.editorialWorkflow.toJS(), 'pages.ids', false);
    if (!entriesLoaded) {
      try {
        const { entries, pagination } = await backend.unpublishedEntries(state.collections);
        dispatch(unpublishedEntriesLoaded(entries, pagination));
        // eslint-disable-next-line no-empty
      } catch (e) {}
      state = getState();
    }

    const readyEntries = selectUnpublishedEntriesByStatus(
      state,
      status.get('PENDING_PUBLISH') as Status,
    );
    const pending = readyEntries ? readyEntries.toArray() : [];

    if (pending.length === 0) {
      dispatch(
        addNotification({
          message: { key: 'ui.toast.onBatchEmpty' },
          type: 'info',
          dismissAfter: 4000,
        }),
      );
      return;
    }

    let publishedCount = 0;
    for (const entry of pending) {
      const collectionName = entry.get('collection');
      const slug = entry.get('slug');
      try {
        await publishBatchEntry(dispatch, getState, collectionName, slug);
        publishedCount += 1;
      } catch (error) {
        dispatch(
          addNotification({
            message: { key: 'ui.toast.onFailToPublishBatchEntry', details: error, slug },
            type: 'error',
            dismissAfter: 8000,
          }),
        );
        break;
      }
    }

    if (publishedCount > 0) {
      // re-load media after entries were published
      dispatch(loadMedia());
      dispatch(
        addNotification({
          message: { key: 'ui.toast.batchPublished', count: publishedCount },
          type: 'success',
          dismissAfter: 4000,
        }),
      );
    }
  };
}

export function unpublishPublishedEntry(collection: Collection, slug: string) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    const entry = selectEntry(state, collection.get('name'), slug);
    const entryDraft = Map().set('entry', entry) as unknown as EntryDraft;
    dispatch(unpublishedEntryPersisting(collection, slug));
    return backend
      .deleteEntry(state, collection, slug)
      .then(() =>
        backend.persistEntry({
          config: state.config,
          collection,
          entryDraft,
          assetProxies: [],
          usedSlugs: List(),
          status: status.get('PENDING_PUBLISH'),
        }),
      )
      .then(() => backend.reopenIssueForUnpublishedEntry(collection.get('name'), slug))
      .then(() => {
        dispatch(unpublishedEntryPersisted(collection, entry));
        dispatch(entryDeleted(collection, slug));
        dispatch(loadUnpublishedEntry(collection, slug));
        dispatch(
          addNotification({
            message: { key: 'ui.toast.entryUnpublished' },
            type: 'success',
            dismissAfter: 4000,
          }),
        );
      })
      .catch((error: Error) => {
        dispatch(
          addNotification({
            message: { key: 'ui.toast.onFailToUnpublishEntry', details: error },
            type: 'error',
            dismissAfter: 8000,
          }),
        );
        dispatch(unpublishedEntryPersistedFail(error, collection, entry.get('slug')));
      });
  };
}
