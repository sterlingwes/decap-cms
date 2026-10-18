import { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { translate } from 'react-polyglot';
import { NavLink } from 'react-router-dom';
import {
  Icon,
  Dropdown,
  DropdownItem,
  StyledDropdownButton,
  colors,
  shadows,
  buttons,
  zIndex,
} from 'decap-cms-ui-default';
import { connect } from 'react-redux';

import { SettingsDropdown } from '../UI';
import { checkBackendStatus } from '../../actions/status';
import { loadBranchPublishStatus } from '../../actions/publishStatus';
import { selectCanCreateNewEntry } from '../../reducers';

const styles = {
  buttonActive: css`
    color: ${colors.active};
  `,
};

function AppHeader(props) {
  return (
    <header
      css={css`
        ${shadows.dropMain};
        width: 100%;
        background-color: ${colors.foreground};
        z-index: ${zIndex.zIndex300};

        @media (min-height: 500px) {
          position: sticky;
          top: 0;
        }
      `}
      {...props}
    />
  );
}

const AppHeaderContent = styled.div`
  display: flex;
  flex-direction: column-reverse;
  padding: 0 12px;
  margin: 0 auto;

  @media (min-width: 800px) {
    max-width: 1440px;
    flex-direction: row;
    justify-content: space-between;
  }
`;

const AppHeaderButton = styled.button`
  ${buttons.button};
  background: none;
  color: #7b8290;
  font-family: inherit;
  font-size: 13px;
  line-height: 1;
  font-weight: 500;
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px 10px;
  align-items: center;
  text-align: center;

  @media (min-width: 400px) {
    flex-direction: row;
    gap: 4px;
  }

  @media (min-width: 500px) {
    font-size: 16px;
    padding: 16px 20px;
  }

  ${Icon} {
    color: #b3b9c4;
  }

  &:hover,
  &:active,
  &:focus-visible {
    ${styles.buttonActive};

    ${Icon} {
      ${styles.buttonActive};
    }
  }

  ${props => css`
    &.${props.activeClassName} {
      ${styles.buttonActive};

      ${Icon} {
        ${styles.buttonActive};
      }
    }
  `};
`;

const AppHeaderNavLink = AppHeaderButton.withComponent(NavLink);

const AppHeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const AppHeaderQuickNewButton = styled(StyledDropdownButton)`
  ${buttons.button};
  ${buttons.medium};
  ${buttons.gray};
  white-space: nowrap;
  margin-right: 8px;

  &:after {
    top: 11px;
  }
`;

const AppHeaderNavList = styled.ul`
  display: flex;
  margin: 0;
  list-style: none;
  justify-content: space-around;

  @media (min-width: 800px) {
    justify-content: flex-start;
  }
`;

const AppHeaderLogo = styled.li`
  display: flex;
  align-items: center;

  img {
    padding: 12px 20px;
    max-height: 56px;
    max-width: 300px;
    object-fit: contain;
    object-position: center;
  }
`;

// How often to re-check the publish branch's CI runs, faster while one is in
// progress so a fixed deploy clears promptly
const DEPLOY_STATUS_POLL_INTERVAL = 60 * 1000;
const DEPLOY_STATUS_RUNNING_POLL_INTERVAL = 10 * 1000;

// Only show states that need attention; a healthy branch shows nothing
const deployStatusStyles = {
  running: { color: colors.infoText, icon: 'refresh', spinning: true },
  failure: { color: colors.errorText, icon: 'info-circle' },
};

const AppHeaderDeployStatus = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 12px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  color: ${props => props.$color};

  ${Icon} {
    color: ${props => props.$color};
    ${props => props.$spinning && `animation: spin 1s linear infinite;`}
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export class Header extends Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    collections: ImmutablePropTypes.map.isRequired,
    creatableCollections: ImmutablePropTypes.list.isRequired,
    onCreateEntryClick: PropTypes.func.isRequired,
    onLogoutClick: PropTypes.func.isRequired,
    openMediaLibrary: PropTypes.func.isRequired,
    hasWorkflow: PropTypes.bool.isRequired,
    displayUrl: PropTypes.string,
    logoUrl: PropTypes.string, // Deprecated, replaced by `logo.src`
    logo: PropTypes.shape({
      src: PropTypes.string.isRequired,
      show_in_header: PropTypes.bool,
    }),
    isTestRepo: PropTypes.bool,
    t: PropTypes.func.isRequired,
    checkBackendStatus: PropTypes.func.isRequired,
    loadBranchPublishStatus: PropTypes.func,
  };

  intervalId;

  state = { deployStatus: null };

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(Header.propTypes, this.props, 'prop', 'Header');

    this.intervalId = setInterval(() => {
      this.props.checkBackendStatus();
    }, 5 * 60 * 1000);
    this.loadDeployStatus();
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
    clearTimeout(this.deployStatusTimer);
    this.unmounted = true;
  }

  loadDeployStatus = async () => {
    const { loadBranchPublishStatus } = this.props;
    if (!loadBranchPublishStatus) {
      return;
    }
    const deployStatus = await loadBranchPublishStatus();
    if (this.unmounted) {
      return;
    }
    this.setState({ deployStatus });
    // a null status means the backend doesn't support it or the repo has no
    // workflows, so there's nothing to keep checking
    if (deployStatus) {
      this.deployStatusTimer = setTimeout(
        this.loadDeployStatus,
        deployStatus.state === 'running'
          ? DEPLOY_STATUS_RUNNING_POLL_INTERVAL
          : DEPLOY_STATUS_POLL_INTERVAL,
      );
    }
  };

  renderDeployStatus() {
    const { deployStatus } = this.state;
    const { t } = this.props;
    const style = deployStatus && deployStatusStyles[deployStatus.state];
    if (!style) {
      return null;
    }

    const { url, name, state } = deployStatus;
    const label = t(`app.header.deployStatus.${state}`);
    return (
      <AppHeaderDeployStatus
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={name ? `${name}: ${label}` : label}
        $color={style.color}
        $spinning={style.spinning}
      >
        <Icon type={style.icon} size="xsmall" />
        {label}
      </AppHeaderDeployStatus>
    );
  }

  handleCreatePostClick = collectionName => {
    const { onCreateEntryClick } = this.props;
    if (onCreateEntryClick) {
      onCreateEntryClick(collectionName);
    }
  };

  render() {
    const {
      user,
      creatableCollections,
      onLogoutClick,
      openMediaLibrary,
      hasWorkflow,
      displayUrl,
      logoUrl, // Deprecated, replaced by `logo.src`
      logo,
      isTestRepo,
      t,
      showMediaButton,
    } = this.props;

    const shouldShowLogo = logo?.show_in_header && logo?.src;

    return (
      <AppHeader>
        <AppHeaderContent>
          <nav>
            <AppHeaderNavList>
              {shouldShowLogo && (
                <AppHeaderLogo>
                  <img src={logo?.src || logoUrl} alt="Logo" />
                </AppHeaderLogo>
              )}
              <li>
                <AppHeaderNavLink
                  to="/"
                  activeClassName="header-link-active"
                  isActive={(match, location) => location.pathname.startsWith('/collections/')}
                >
                  <Icon type="page" />
                  {t('app.header.content')}
                </AppHeaderNavLink>
              </li>
              {hasWorkflow && (
                <li>
                  <AppHeaderNavLink to="/workflow" activeClassName="header-link-active">
                    <Icon type="workflow" />
                    {t('app.header.workflow')}
                  </AppHeaderNavLink>
                </li>
              )}
              {showMediaButton && (
                <li>
                  <AppHeaderButton onClick={openMediaLibrary}>
                    <Icon type="media-alt" />
                    {t('app.header.media')}
                  </AppHeaderButton>
                </li>
              )}
            </AppHeaderNavList>
          </nav>
          <AppHeaderActions>
            {this.renderDeployStatus()}
            {creatableCollections.size > 0 && (
              <Dropdown
                renderButton={() => (
                  <AppHeaderQuickNewButton> {t('app.header.quickAdd')}</AppHeaderQuickNewButton>
                )}
                dropdownTopOverlap="30px"
                dropdownWidth="160px"
                dropdownPosition="left"
              >
                {creatableCollections.map(collection => (
                  <DropdownItem
                    key={collection.get('name')}
                    label={collection.get('label_singular') || collection.get('label')}
                    onClick={() => this.handleCreatePostClick(collection.get('name'))}
                  />
                ))}
              </Dropdown>
            )}
            <SettingsDropdown
              displayUrl={displayUrl}
              isTestRepo={isTestRepo}
              imageUrl={user?.avatar_url}
              onLogoutClick={onLogoutClick}
            />
          </AppHeaderActions>
        </AppHeaderContent>
      </AppHeader>
    );
  }
}

const mapDispatchToProps = {
  checkBackendStatus,
  loadBranchPublishStatus,
};

function mapStateToProps(state, ownProps) {
  return {
    creatableCollections: ownProps.collections
      .filter(collection => selectCanCreateNewEntry(state, collection.get('name')))
      .toList(),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(translate()(Header));
