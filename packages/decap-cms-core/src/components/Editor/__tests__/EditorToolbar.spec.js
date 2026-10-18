import { render, act } from '@testing-library/react';
import { fromJS } from 'immutable';

import { EditorToolbar } from '../EditorToolbar';

jest.mock('../../UI', () => ({
  // eslint-disable-next-line react/display-name
  SettingsDropdown: props => <mock-settings-dropdown {...props} />,
}));
jest.mock('react-router-dom', () => {
  return {
    // eslint-disable-next-line react/display-name
    Link: props => <mock-link {...props} />,
  };
});

describe('EditorToolbar', () => {
  const props = {
    isPersisting: false,
    isPublishing: false,
    isUpdatingStatus: false,
    isDeleting: false,
    onPersist: jest.fn(),
    onPersistAndNew: jest.fn(),
    onPersistAndDuplicate: jest.fn(),
    showDelete: true,
    onDelete: jest.fn(),
    onDeleteUnpublishedChanges: jest.fn(),
    onChangeStatus: jest.fn(),
    onPublish: jest.fn(),
    unPublish: jest.fn(),
    onDuplicate: jest.fn(),
    onPublishAndNew: jest.fn(),
    onPublishAndDuplicate: jest.fn(),
    hasChanged: false,
    collection: fromJS({ name: 'posts' }),
    hasWorkflow: false,
    useOpenAuthoring: false,
    hasUnpublishedChanges: false,
    isNewEntry: false,
    isModification: false,
    onLogoutClick: jest.fn(),
    loadDeployPreview: jest.fn(),
    t: jest.fn(key => key),
    editorBackLink: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default props', () => {
    const { asFragment } = render(<EditorToolbar {...props} />);
    expect(asFragment()).toMatchSnapshot();
  });

  [false, true].forEach(useOpenAuthoring => {
    it(`should render with workflow controls hasUnpublishedChanges=true,isNewEntry=false,isModification=true,useOpenAuthoring=${useOpenAuthoring}`, () => {
      const { asFragment } = render(
        <EditorToolbar
          {...props}
          hasWorkflow={true}
          hasUnpublishedChanges={true}
          isNewEntry={false}
          isModification={true}
          useOpenAuthoring={useOpenAuthoring}
        />,
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it(`should render with workflow controls hasUnpublishedChanges=true,isNewEntry=false,isModification=false,useOpenAuthoring=${useOpenAuthoring}`, () => {
      const { asFragment } = render(
        <EditorToolbar
          {...props}
          hasWorkflow={true}
          hasUnpublishedChanges={true}
          isNewEntry={false}
          isModification={false}
          useOpenAuthoring={useOpenAuthoring}
        />,
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it(`should render with workflow controls hasUnpublishedChanges=false,isNewEntry=false,isModification=false,useOpenAuthoring=${useOpenAuthoring}`, () => {
      const { asFragment } = render(
        <EditorToolbar
          {...props}
          hasWorkflow={true}
          hasUnpublishedChanges={false}
          isNewEntry={false}
          isModification={false}
          useOpenAuthoring={useOpenAuthoring}
        />,
      );
      expect(asFragment()).toMatchSnapshot();
    });

    ['draft', 'pending_review', 'pending_publish'].forEach(status => {
      it(`should render with status=${status},useOpenAuthoring=${useOpenAuthoring}`, () => {
        const { asFragment } = render(
          <EditorToolbar
            {...props}
            hasWorkflow={true}
            currentStatus={status}
            useOpenAuthoring={useOpenAuthoring}
          />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });

    it(`should render normal save button`, () => {
      const { asFragment } = render(<EditorToolbar {...props} hasChanged={true} />);
      expect(asFragment()).toMatchSnapshot();
    });
  });

  describe('deploy preview polling', () => {
    it('should poll with maxAttempts: 24 and an AbortSignal on mount for existing entries', () => {
      render(<EditorToolbar {...props} isNewEntry={false} />);
      expect(props.loadDeployPreview).toHaveBeenCalledTimes(1);
      const opts = props.loadDeployPreview.mock.calls[0][0];
      expect(opts.maxAttempts).toBe(24);
      expect(opts.signal).toBeInstanceOf(AbortSignal);
    });

    it('should not poll on mount for new entries', () => {
      render(<EditorToolbar {...props} isNewEntry={true} />);
      expect(props.loadDeployPreview).not.toHaveBeenCalled();
    });

    it('should poll with maxAttempts: 3 after a save completes', () => {
      const { rerender } = render(<EditorToolbar {...props} isPersisting={true} />);
      props.loadDeployPreview.mockClear();
      rerender(<EditorToolbar {...props} isPersisting={false} />);
      expect(props.loadDeployPreview).toHaveBeenCalledTimes(1);
      const opts = props.loadDeployPreview.mock.calls[0][0];
      expect(opts.maxAttempts).toBe(3);
      expect(opts.signal).toBeInstanceOf(AbortSignal);
    });

    it('should abort polling on unmount', () => {
      const { unmount } = render(<EditorToolbar {...props} isNewEntry={false} />);
      const signal = props.loadDeployPreview.mock.calls[0][0].signal;
      expect(signal.aborted).toBe(false);
      unmount();
      expect(signal.aborted).toBe(true);
    });

    it('should abort previous poll when a new save triggers a new poll', () => {
      const { rerender } = render(<EditorToolbar {...props} isPersisting={false} />);
      const firstSignal = props.loadDeployPreview.mock.calls[0][0].signal;

      // Simulate save completing
      rerender(<EditorToolbar {...props} isPersisting={true} />);
      rerender(<EditorToolbar {...props} isPersisting={false} />);

      expect(firstSignal.aborted).toBe(true);
      const secondSignal = props.loadDeployPreview.mock.calls[1][0].signal;
      expect(secondSignal.aborted).toBe(false);
    });
  });

  describe('publish status', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should load the publish status on mount for existing entries', async () => {
      const loadPublishStatus = jest.fn().mockResolvedValue({
        state: 'failure',
        url: 'https://github.com/owner/repo/actions/runs/1',
        name: 'Deploy',
      });
      const { findByText } = render(
        <EditorToolbar {...props} loadPublishStatus={loadPublishStatus} />,
      );

      const label = await findByText('editor.editorToolbar.publishStatus.failure');
      expect(loadPublishStatus).toHaveBeenCalledTimes(1);
      expect(label.closest('a')).toHaveAttribute(
        'href',
        'https://github.com/owner/repo/actions/runs/1',
      );
      expect(label.closest('a')).toHaveAttribute(
        'title',
        'Deploy: editor.editorToolbar.publishStatus.failure',
      );
    });

    it('should not load the publish status for new entries', () => {
      const loadPublishStatus = jest.fn().mockResolvedValue(null);
      render(<EditorToolbar {...props} isNewEntry={true} loadPublishStatus={loadPublishStatus} />);
      expect(loadPublishStatus).not.toHaveBeenCalled();
    });

    it('should render nothing when there is no status', async () => {
      const loadPublishStatus = jest.fn().mockResolvedValue(null);
      const { queryByText } = render(
        <EditorToolbar {...props} loadPublishStatus={loadPublishStatus} />,
      );
      await act(() => Promise.resolve());
      expect(queryByText(/publishStatus/)).not.toBeInTheDocument();
    });

    it('should keep polling while the run is in progress and stop once it finishes', async () => {
      jest.useFakeTimers();
      const loadPublishStatus = jest
        .fn()
        .mockResolvedValueOnce({ state: 'running', url: 'run-url' })
        .mockResolvedValueOnce({ state: 'success', url: 'run-url' });
      const { findByText } = render(
        <EditorToolbar {...props} loadPublishStatus={loadPublishStatus} />,
      );

      await findByText('editor.editorToolbar.publishStatus.running');
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });
      await findByText('editor.editorToolbar.publishStatus.success');
      expect(loadPublishStatus).toHaveBeenCalledTimes(2);

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });
      expect(loadPublishStatus).toHaveBeenCalledTimes(2);
    });

    it('should reload the status after an entry is published', async () => {
      const loadPublishStatus = jest.fn().mockResolvedValue(null);
      const { rerender } = render(
        <EditorToolbar
          {...props}
          hasWorkflow={true}
          isPublishing={true}
          loadPublishStatus={loadPublishStatus}
        />,
      );
      await act(() => Promise.resolve());
      loadPublishStatus.mockClear();

      rerender(
        <EditorToolbar
          {...props}
          hasWorkflow={true}
          isPublishing={false}
          loadPublishStatus={loadPublishStatus}
        />,
      );
      await act(() => Promise.resolve());
      expect(loadPublishStatus).toHaveBeenCalledTimes(1);
    });

    it('should stop polling on unmount', async () => {
      jest.useFakeTimers();
      const loadPublishStatus = jest.fn().mockResolvedValue({ state: 'running' });
      const { findByText, unmount } = render(
        <EditorToolbar {...props} loadPublishStatus={loadPublishStatus} />,
      );
      await findByText('editor.editorToolbar.publishStatus.running');
      unmount();

      jest.advanceTimersByTime(30000);
      expect(loadPublishStatus).toHaveBeenCalledTimes(1);
    });
  });
});
