import { render, screen, act } from '@testing-library/react';
import { fromJS, List } from 'immutable';

import { Header } from '../Header';

jest.mock('../../UI', () => ({
  // eslint-disable-next-line react/display-name
  SettingsDropdown: props => <mock-settings-dropdown {...props} />,
}));
jest.mock('react-router-dom', () => ({
  // eslint-disable-next-line react/display-name
  NavLink: ({ to, children }) => <mock-nav-link to={to}>{children}</mock-nav-link>,
}));

describe('Header', () => {
  const props = {
    user: {},
    collections: fromJS({}),
    creatableCollections: List(),
    onCreateEntryClick: jest.fn(),
    onLogoutClick: jest.fn(),
    openMediaLibrary: jest.fn(),
    hasWorkflow: false,
    t: jest.fn(key => key),
    checkBackendStatus: jest.fn(),
  };

  async function renderWithStatus(deployStatus) {
    const loadBranchPublishStatus = jest.fn().mockResolvedValue(deployStatus);
    await act(async () => {
      render(<Header {...props} loadBranchPublishStatus={loadBranchPublishStatus} />);
    });
    return loadBranchPublishStatus;
  }

  it('should link to the failing run when deploys are failing', async () => {
    await renderWithStatus({ state: 'failure', url: 'run-url', name: 'Deploy' });

    const link = screen.getByText('app.header.deployStatus.failure').closest('a');
    expect(link).toHaveAttribute('href', 'run-url');
    expect(link).toHaveAttribute('title', 'Deploy: app.header.deployStatus.failure');
  });

  it('should show when a deploy is running', async () => {
    await renderWithStatus({ state: 'running', url: 'run-url' });

    expect(screen.getByText('app.header.deployStatus.running')).toBeInTheDocument();
  });

  it('should show nothing when deploys are going through', async () => {
    await renderWithStatus({ state: 'success', url: 'run-url' });

    expect(screen.queryByText(/app\.header\.deployStatus/)).not.toBeInTheDocument();
  });
});
