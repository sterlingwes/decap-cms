import { currentBackend } from '../backend';

import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { PublishStatus } from 'decap-cms-lib-util';
import type { EntryMap, State } from '../types/redux';

/**
 * Fetches the status of the CI run(s) (e.g. a GitHub Actions deploy) for the
 * latest published change to an entry. The result isn't stored: the editor
 * toolbar polls it while a run is in progress and keeps it in local state.
 */
export function loadPublishStatus(entry: EntryMap) {
  return async (
    _dispatch: ThunkDispatch<State, undefined, AnyAction>,
    getState: () => State,
  ): Promise<PublishStatus | null> => {
    const backend = currentBackend(getState().config);
    try {
      return await backend.getPublishStatus(entry);
    } catch (error) {
      console.error(error);
      return null;
    }
  };
}
