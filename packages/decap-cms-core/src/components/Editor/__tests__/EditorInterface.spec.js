import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { fromJS, List, Map } from 'immutable';

import EditorInterface from '../EditorInterface';

// both modules pull in the config schema, which hits a circular import when
// EditorInterface is the first thing loaded
jest.mock('../../../reducers/collections', () => ({ getFileFromSlug: jest.fn() }));
jest.mock('../../../lib/i18n', () => ({
  hasI18n: () => false,
  getI18nInfo: () => ({}),
  getPreviewEntry: entry => entry,
}));
jest.mock('../EditorControlPane/EditorControlPane', () => {
  const React = require('react');
  return class MockControlPane extends React.Component {
    validate = jest.fn();
    switchToDefaultLocale = jest.fn(() => Promise.resolve());
    render() {
      return <div data-testid="control-pane" />;
    }
  };
});
jest.mock('../EditorPreviewPane/EditorPreviewPane', () => {
  return function MockPreviewPane() {
    return <div data-testid="preview-pane" />;
  };
});
jest.mock('../EditorNotesPane/EditorNotesPane', () => {
  return function MockNotesPane() {
    return <div data-testid="notes-pane" />;
  };
});
jest.mock('../EditorToolbar', () => {
  return function MockToolbar({ onPersist }) {
    return <button onClick={() => onPersist()}>save</button>;
  };
});

function mockMatchMedia(matches) {
  window.matchMedia = jest.fn(() => ({
    matches,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}

describe('EditorInterface', () => {
  const props = {
    collection: fromJS({ name: 'posts', editor: { preview: true } }),
    entry: fromJS({ slug: 'post', data: {} }),
    fields: List(),
    fieldsMetaData: Map(),
    fieldsErrors: Map(),
    onChange: jest.fn(),
    onValidate: jest.fn(),
    onPersist: jest.fn(),
    showDelete: false,
    onDelete: jest.fn(),
    onDeleteUnpublishedChanges: jest.fn(),
    onPublish: jest.fn(),
    unPublish: jest.fn(),
    onDuplicate: jest.fn(),
    onChangeStatus: jest.fn(),
    onLogoutClick: jest.fn(),
    loadDeployPreview: jest.fn(),
    draftKey: 'draft',
    t: key => key,
  };

  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('should show the editor and preview side by side on wide screens', () => {
    mockMatchMedia(false);
    const { getByTestId } = render(<EditorInterface {...props} />);

    expect(getByTestId('control-pane')).toBeVisible();
    expect(getByTestId('preview-pane')).toBeVisible();
  });

  describe('on narrow screens', () => {
    beforeEach(() => {
      mockMatchMedia(true);
    });

    it('should show only the editor by default', () => {
      const { getByTestId, queryByTestId } = render(<EditorInterface {...props} />);

      expect(getByTestId('control-pane')).toBeVisible();
      expect(queryByTestId('preview-pane')).not.toBeInTheDocument();
    });

    it('should switch between the editor and preview with the preview toggle', () => {
      const { getByTestId, queryByTestId, getByTitle } = render(<EditorInterface {...props} />);
      const toggle = getByTitle('editor.editorInterface.togglePreview');

      fireEvent.click(toggle);
      expect(getByTestId('preview-pane')).toBeVisible();
      // the editor stays mounted so saving can still validate it
      expect(getByTestId('control-pane')).not.toBeVisible();

      fireEvent.click(toggle);
      expect(getByTestId('control-pane')).toBeVisible();
      expect(queryByTestId('preview-pane')).not.toBeInTheDocument();
    });

    it('should not persist the narrow pane choice', () => {
      const { getByTitle } = render(<EditorInterface {...props} />);

      fireEvent.click(getByTitle('editor.editorInterface.togglePreview'));

      expect(localStorage.getItem('cms.preview-visible')).toBeNull();
    });

    it('should still save while the preview is showing', async () => {
      const { getByTitle, getByText } = render(<EditorInterface {...props} />);

      fireEvent.click(getByTitle('editor.editorInterface.togglePreview'));
      fireEvent.click(getByText('save'));

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(props.onPersist).toHaveBeenCalledTimes(1);
    });
  });
});
