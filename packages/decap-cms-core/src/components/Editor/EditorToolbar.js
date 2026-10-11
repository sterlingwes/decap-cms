import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import {
  Icon,
  Dropdown,
  DropdownItem,
  StyledDropdownButton,
  colorsRaw,
  colors,
  components,
  buttons,
  zIndex,
} from 'decap-cms-ui-default';

import { status } from '../../constants/publishModes';
import { SettingsDropdown } from '../UI';

// Matches the editor's narrow (single pane) layout in EditorInterface
const NARROW_QUERY = '(max-width: 799px)';

const styles = {
  noOverflow: css`
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  buttonMargin: css`
    margin: 0 10px;
  `,
  toolbarSection: css`
    height: 100%;
    display: flex;
    align-items: center;
    border: 0 solid ${colors.textFieldBorder};
  `,
  publishedButton: css`
    background-color: ${colorsRaw.tealLight};
    color: ${colorsRaw.tealDark};
  `,
};

const TooltipText = styled.div`
  visibility: hidden;
  width: 321px;
  background-color: #555;
  color: #fff;
  text-align: unset;
  border-radius: 6px;
  padding: 5px;

  /* Position the tooltip text */
  position: absolute;
  z-index: 1;
  top: 145%;
  left: 50%;
  margin-left: -320px;

  /* Fade in tooltip */
  opacity: 0;
  transition: opacity 0.3s;
`;

const Tooltip = styled.div`
  position: relative;
  display: inline-block;
  &:hover + ${TooltipText} {
    visibility: visible;
    opacity: 0.9;
  }
`;

const TooltipContainer = styled.div`
  position: relative;
`;

const DropdownButton = styled(StyledDropdownButton)`
  ${styles.noOverflow}
  @media (max-width: 1200px) {
    padding-left: 10px;
  }
`;

const ToolbarContainer = styled.div`
  box-shadow: 0 2px 6px 0 rgba(68, 74, 87, 0.05), 0 1px 3px 0 rgba(68, 74, 87, 0.1),
    0 2px 54px rgba(0, 0, 0, 0.1);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: ${zIndex.zIndex300};
  background-color: #fff;
  height: 66px;
  display: flex;
  justify-content: space-between;

  @media ${NARROW_QUERY} {
    /* EditorInterface stacks the toolbar in normal flow on narrow screens so
       it can grow when the controls wrap onto a second row */
    position: relative;
    flex: none;
    height: auto;
    min-height: 66px;
  }
`;

const ToolbarSectionMain = styled.div`
  ${styles.toolbarSection};
  flex: 10;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;

  @media ${NARROW_QUERY} {
    height: auto;
    flex-wrap: wrap;
    padding: 6px 4px;
  }
`;

const ToolbarSubSectionFirst = styled.div`
  display: flex;
  align-items: center;

  @media ${NARROW_QUERY} {
    flex-wrap: wrap;
    row-gap: 6px;
  }
`;

const ToolbarSubSectionLast = styled(ToolbarSubSectionFirst)`
  justify-content: flex-end;
`;

const ToolbarSectionBackLink = styled(Link)`
  ${styles.toolbarSection};
  border-right-width: 1px;
  font-weight: normal;
  padding: 0 20px;

  &:hover,
  &:focus {
    background-color: #f1f2f4;
  }

  @media ${NARROW_QUERY} {
    height: auto;
    padding: 0 14px;
  }
`;

const ToolbarSectionMeta = styled.div`
  ${styles.toolbarSection};
  border-left-width: 1px;
  padding: 0 7px;

  @media ${NARROW_QUERY} {
    display: none;
  }
`;

const ToolbarDropdown = styled(Dropdown)`
  ${styles.buttonMargin};

  @media ${NARROW_QUERY} {
    margin: 0 4px;
  }

  ${Icon} {
    color: ${colorsRaw.teal};
  }
`;

const BackArrow = styled.div`
  color: ${colors.textLead};
  font-size: 21px;
  font-weight: 600;
  margin-right: 16px;

  @media ${NARROW_QUERY} {
    margin-right: 0;
  }
`;

const BackText = styled.div`
  @media ${NARROW_QUERY} {
    display: none;
  }
`;

const BackCollection = styled.div`
  color: ${colors.textLead};
  font-size: 14px;
`;

const BackStatus = styled.div`
  margin-top: 6px;
`;

const BackStatusUnchanged = styled(BackStatus)`
  ${components.textBadgeSuccess};
`;

const BackStatusChanged = styled(BackStatus)`
  ${components.textBadgeDanger};
`;

const ToolbarButton = styled.button`
  ${buttons.button};
  ${buttons.default};
  ${styles.buttonMargin};
  ${styles.noOverflow};
  display: block;

  @media (max-width: 1200px) {
    padding: 0 10px;
  }

  @media ${NARROW_QUERY} {
    margin: 0 4px;
  }
`;

const DeleteButton = styled(ToolbarButton)`
  ${buttons.lightRed};
`;

const SaveButton = styled(ToolbarButton)`
  ${buttons.lightBlue};
  &[disabled] {
    ${buttons.disabled};
  }
`;

const PublishedToolbarButton = styled(DropdownButton)`
  ${styles.publishedButton}
`;

const PublishedButton = styled(ToolbarButton)`
  ${styles.publishedButton}
`;

const PublishButton = styled(DropdownButton)`
  background-color: ${colorsRaw.teal};
`;

const StatusButton = styled(DropdownButton)`
  background-color: ${colorsRaw.tealLight};
  color: ${colorsRaw.teal};
`;

const PreviewButtonContainer = styled.div`
  margin-right: 12px;
  color: ${colorsRaw.blue};
  display: flex;
  align-items: center;

  a,
  ${Icon} {
    color: ${colorsRaw.blue};
  }

  ${Icon} {
    position: relative;
    top: 1px;
  }
`;

const RefreshPreviewButton = styled.button`
  background: none;
  border: 0;
  cursor: pointer;
  color: ${colorsRaw.blue};

  span {
    margin-right: 6px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  ${Icon} {
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

const PreviewLink = RefreshPreviewButton.withComponent('a');

// How often to re-check a publish's CI run while it's pending or running
const PUBLISH_STATUS_POLL_INTERVAL = 10000;

const publishStatusStyles = {
  pending: { color: colors.infoText, icon: 'refresh', spinning: true },
  running: { color: colors.infoText, icon: 'refresh', spinning: true },
  success: { color: colors.successText, icon: 'check' },
  failure: { color: colors.errorText, icon: 'info-circle' },
  cancelled: { color: colors.controlLabel, icon: 'close' },
};

const PublishStatusLink = styled.a`
  display: flex;
  align-items: center;
  margin-right: 12px;
  white-space: nowrap;
  color: ${props => props.$color};

  span {
    margin-right: 6px;
  }

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

const PublishDropDownItem = styled(DropdownItem)`
  min-width: initial;
`;

const StatusDropdownItem = styled(DropdownItem)`
  ${Icon} {
    color: ${colors.infoText};
  }
`;

export class EditorToolbar extends React.Component {
  static propTypes = {
    isPersisting: PropTypes.bool,
    isPublishing: PropTypes.bool,
    isUpdatingStatus: PropTypes.bool,
    isDeleting: PropTypes.bool,
    onPersist: PropTypes.func.isRequired,
    onPersistAndNew: PropTypes.func.isRequired,
    onPersistAndDuplicate: PropTypes.func.isRequired,
    showDelete: PropTypes.bool.isRequired,
    onDelete: PropTypes.func.isRequired,
    onDeleteUnpublishedChanges: PropTypes.func.isRequired,
    onChangeStatus: PropTypes.func.isRequired,
    onPublish: PropTypes.func.isRequired,
    unPublish: PropTypes.func.isRequired,
    onDuplicate: PropTypes.func.isRequired,
    onPublishAndNew: PropTypes.func.isRequired,
    onPublishAndDuplicate: PropTypes.func.isRequired,
    user: PropTypes.object,
    hasChanged: PropTypes.bool,
    displayUrl: PropTypes.string,
    collection: ImmutablePropTypes.map.isRequired,
    hasWorkflow: PropTypes.bool,
    useOpenAuthoring: PropTypes.bool,
    hasUnpublishedChanges: PropTypes.bool,
    isNewEntry: PropTypes.bool,
    isModification: PropTypes.bool,
    currentStatus: PropTypes.string,
    onLogoutClick: PropTypes.func.isRequired,
    deployPreview: PropTypes.object,
    loadDeployPreview: PropTypes.func.isRequired,
    loadPublishStatus: PropTypes.func,
    t: PropTypes.func.isRequired,
    editorBackLink: PropTypes.string.isRequired,
  };

  componentDidMount() {
    // Manually validate PropTypes - React 19 breaking change
    PropTypes.checkPropTypes(EditorToolbar.propTypes, this.props, 'prop', 'EditorToolbar');

    const { isNewEntry, loadDeployPreview } = this.props;
    if (!isNewEntry) {
      // 24 attempts × 5s interval = ~2 min polling window.
      // With editorial workflow, saving remounts the component (navigates to
      // the unpublished entry view), so componentDidMount is the primary
      // polling trigger — not componentDidUpdate.
      this._pollController = new AbortController();
      loadDeployPreview({ maxAttempts: 24, signal: this._pollController.signal });
      this.loadPublishStatus();
    }
  }

  componentDidUpdate(prevProps) {
    const { isNewEntry, isPersisting, isPublishing, hasWorkflow, loadDeployPreview } = this.props;

    // Publishing (or saving, which publishes without the editorial workflow)
    // kicks off a new CI run, so start checking for it.
    const finishedPublishing = prevProps.isPublishing && !isPublishing;
    const finishedSimplePublish = !hasWorkflow && prevProps.isPersisting && !isPersisting;
    if (!isNewEntry && (finishedPublishing || finishedSimplePublish)) {
      this.loadPublishStatus();
    }

    if (!isNewEntry && prevProps.isPersisting && !isPersisting) {
      // Abort any in-flight poll before starting a new one.
      this._pollController?.abort();
      this._pollController = new AbortController();
      // Fires on subsequent saves when the component survives (no remount).
      // In editorial workflow the first save remounts, so this mainly
      // covers the second-save-and-beyond case.
      loadDeployPreview({ maxAttempts: 3, signal: this._pollController.signal });
    }
  }

  componentWillUnmount() {
    this._pollController?.abort();
    this._unmounted = true;
    clearTimeout(this._publishStatusTimer);
  }

  state = { publishStatus: null };

  loadPublishStatus = async () => {
    const { loadPublishStatus } = this.props;
    if (!loadPublishStatus) {
      return;
    }
    clearTimeout(this._publishStatusTimer);
    // ignore responses from requests that a newer one has superseded
    const request = (this._publishStatusRequest || 0) + 1;
    this._publishStatusRequest = request;

    const publishStatus = await loadPublishStatus();
    if (this._unmounted || request !== this._publishStatusRequest) {
      return;
    }
    this.setState({ publishStatus });
    if (publishStatus && ['pending', 'running'].includes(publishStatus.state)) {
      this._publishStatusTimer = setTimeout(this.loadPublishStatus, PUBLISH_STATUS_POLL_INTERVAL);
    }
  };

  renderPublishStatus = () => {
    const { publishStatus } = this.state;
    const { t } = this.props;
    if (!publishStatus) {
      return null;
    }

    const { state, url, name } = publishStatus;
    const { color, icon, spinning } = publishStatusStyles[state];
    const label = t(`editor.editorToolbar.publishStatus.${state}`);
    return (
      <PublishStatusLink
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={name ? `${name}: ${label}` : label}
        $color={color}
        $spinning={spinning}
      >
        <span>{label}</span>
        <Icon type={icon} size="xsmall" />
      </PublishStatusLink>
    );
  };

  renderSimpleControls = () => {
    const { collection, hasChanged, isNewEntry, showDelete, onDelete, t } = this.props;
    const canCreate = collection.get('create');

    return (
      <>
        {!isNewEntry && !hasChanged
          ? this.renderExistingEntrySimplePublishControls({ canCreate })
          : this.renderNewEntrySimplePublishControls({ canCreate })}
        <div>
          {showDelete ? (
            <DeleteButton onClick={onDelete}>{t('editor.editorToolbar.deleteEntry')}</DeleteButton>
          ) : null}
        </div>
      </>
    );
  };

  renderDeployPreviewControls = label => {
    const { deployPreview = {}, loadDeployPreview, t } = this.props;
    const { url, status, isFetching } = deployPreview;

    if (!status) {
      return;
    }

    const deployPreviewReady = status === 'SUCCESS' && !isFetching;
    return (
      <PreviewButtonContainer>
        {deployPreviewReady ? (
          <PreviewLink rel="noopener noreferrer" target="_blank" href={url}>
            <span>{label}</span>
            <Icon type="new-tab" size="xsmall" />
          </PreviewLink>
        ) : (
          <RefreshPreviewButton
            onClick={loadDeployPreview}
            disabled={isFetching}
            $spinning={isFetching}
          >
            <span>{t('editor.editorToolbar.deployPreviewPendingButtonLabel')}</span>
            <Icon type="refresh" size="xsmall" />
          </RefreshPreviewButton>
        )}
      </PreviewButtonContainer>
    );
  };

  renderStatusInfoTooltip = () => {
    const { t, currentStatus } = this.props;

    const statusToLocaleKey = {
      [status.get('DRAFT')]: 'statusInfoTooltipDraft',
      [status.get('PENDING_REVIEW')]: 'statusInfoTooltipInReview',
    };

    const statusKey = Object.keys(statusToLocaleKey).find(key => key === currentStatus);
    return (
      <TooltipContainer>
        <Tooltip>
          <Icon type="info-circle" size="small" className="tooltip" />
        </Tooltip>
        {statusKey && (
          <TooltipText>{t(`editor.editorToolbar.${statusToLocaleKey[statusKey]}`)}</TooltipText>
        )}
      </TooltipContainer>
    );
  };

  renderWorkflowStatusControls = () => {
    const { isUpdatingStatus, onChangeStatus, currentStatus, t, useOpenAuthoring } = this.props;

    const statusToTranslation = {
      [status.get('DRAFT')]: t('editor.editorToolbar.draft'),
      [status.get('PENDING_REVIEW')]: t('editor.editorToolbar.inReview'),
      [status.get('PENDING_PUBLISH')]: t('editor.editorToolbar.ready'),
    };

    const buttonText = isUpdatingStatus
      ? t('editor.editorToolbar.updating')
      : t('editor.editorToolbar.status', { status: statusToTranslation[currentStatus] });

    return (
      <>
        <ToolbarDropdown
          dropdownTopOverlap="40px"
          dropdownWidth="120px"
          renderButton={() => <StatusButton>{buttonText}</StatusButton>}
        >
          <StatusDropdownItem
            label={t('editor.editorToolbar.draft')}
            onClick={() => onChangeStatus('DRAFT')}
            icon={currentStatus === status.get('DRAFT') ? 'check' : null}
          />
          <StatusDropdownItem
            label={t('editor.editorToolbar.inReview')}
            onClick={() => onChangeStatus('PENDING_REVIEW')}
            icon={currentStatus === status.get('PENDING_REVIEW') ? 'check' : null}
          />
          {useOpenAuthoring ? (
            ''
          ) : (
            <StatusDropdownItem
              label={t('editor.editorToolbar.ready')}
              onClick={() => onChangeStatus('PENDING_PUBLISH')}
              icon={currentStatus === status.get('PENDING_PUBLISH') ? 'check' : null}
            />
          )}
        </ToolbarDropdown>
        {useOpenAuthoring && this.renderStatusInfoTooltip()}
      </>
    );
  };

  renderNewEntryWorkflowPublishControls = ({ canCreate, canPublish }) => {
    const { isPublishing, onPublish, onPublishAndNew, onPublishAndDuplicate, t } = this.props;

    return canPublish ? (
      <ToolbarDropdown
        dropdownTopOverlap="40px"
        dropdownWidth="200px"
        renderButton={() => (
          <PublishButton>
            {isPublishing
              ? t('editor.editorToolbar.publishing')
              : t('editor.editorToolbar.publish')}
          </PublishButton>
        )}
      >
        <PublishDropDownItem
          label={t('editor.editorToolbar.publishNow')}
          icon="arrow"
          iconDirection="right"
          onClick={onPublish}
        />
        {canCreate ? (
          <>
            <PublishDropDownItem
              label={t('editor.editorToolbar.publishAndCreateNew')}
              icon="add"
              onClick={onPublishAndNew}
            />
            <PublishDropDownItem
              label={t('editor.editorToolbar.publishAndDuplicate')}
              icon="add"
              onClick={onPublishAndDuplicate}
            />
          </>
        ) : null}
      </ToolbarDropdown>
    ) : (
      ''
    );
  };

  renderExistingEntryWorkflowPublishControls = ({ canCreate, canPublish, canDelete }) => {
    const { unPublish, onDuplicate, isPersisting, t } = this.props;

    return canPublish || canCreate ? (
      <ToolbarDropdown
        dropdownTopOverlap="40px"
        dropdownWidth="max-content"
        key="td-publish-create"
        renderButton={() => (
          <PublishedToolbarButton>
            {isPersisting
              ? t('editor.editorToolbar.unpublishing')
              : t('editor.editorToolbar.published')}
          </PublishedToolbarButton>
        )}
      >
        {canDelete && canPublish && (
          <DropdownItem
            label={t('editor.editorToolbar.unpublish')}
            icon="arrow"
            iconDirection="right"
            onClick={unPublish}
          />
        )}
        {canCreate && (
          <DropdownItem
            label={t('editor.editorToolbar.duplicate')}
            icon="add"
            onClick={onDuplicate}
          />
        )}
      </ToolbarDropdown>
    ) : (
      ''
    );
  };

  renderExistingEntrySimplePublishControls = ({ canCreate }) => {
    const { onDuplicate, t } = this.props;
    return canCreate ? (
      <ToolbarDropdown
        dropdownTopOverlap="40px"
        dropdownWidth="max-content"
        renderButton={() => (
          <PublishedToolbarButton>{t('editor.editorToolbar.published')}</PublishedToolbarButton>
        )}
      >
        {
          <DropdownItem
            label={t('editor.editorToolbar.duplicate')}
            icon="add"
            onClick={onDuplicate}
          />
        }
      </ToolbarDropdown>
    ) : (
      <PublishedButton>{t('editor.editorToolbar.published')}</PublishedButton>
    );
  };

  renderNewEntrySimplePublishControls = ({ canCreate }) => {
    const { onPersist, onPersistAndNew, onPersistAndDuplicate, isPersisting, t } = this.props;

    return (
      <div>
        <ToolbarDropdown
          dropdownTopOverlap="40px"
          dropdownWidth="max-content"
          renderButton={() => (
            <PublishButton>
              {isPersisting
                ? t('editor.editorToolbar.publishing')
                : t('editor.editorToolbar.publish')}
            </PublishButton>
          )}
        >
          <DropdownItem
            label={t('editor.editorToolbar.publishNow')}
            icon="arrow"
            iconDirection="right"
            onClick={onPersist}
          />
          {canCreate ? (
            <>
              <DropdownItem
                label={t('editor.editorToolbar.publishAndCreateNew')}
                icon="add"
                onClick={onPersistAndNew}
              />
              <DropdownItem
                label={t('editor.editorToolbar.publishAndDuplicate')}
                icon="add"
                onClick={onPersistAndDuplicate}
              />
            </>
          ) : null}
        </ToolbarDropdown>
      </div>
    );
  };

  renderSimpleDeployPreviewControls = () => {
    const { hasChanged, isNewEntry, t } = this.props;

    if (!isNewEntry && !hasChanged) {
      return this.renderDeployPreviewControls(t('editor.editorToolbar.deployButtonLabel'));
    }
  };

  renderWorkflowControls = () => {
    const {
      onPersist,
      onDelete,
      onDeleteUnpublishedChanges,
      showDelete,
      hasChanged,
      hasUnpublishedChanges,
      useOpenAuthoring,
      isPersisting,
      isDeleting,
      isNewEntry,
      isModification,
      currentStatus,
      collection,
      t,
    } = this.props;

    const canCreate = collection.get('create');
    const canPublish = collection.get('publish') && !useOpenAuthoring;
    const canDelete = collection.get('delete', true);

    const deleteLabel =
      (hasUnpublishedChanges &&
        isModification &&
        t('editor.editorToolbar.deleteUnpublishedChanges')) ||
      (hasUnpublishedChanges &&
        (isNewEntry || !isModification) &&
        t('editor.editorToolbar.deleteUnpublishedEntry')) ||
      (!hasUnpublishedChanges && !isModification && t('editor.editorToolbar.deletePublishedEntry'));

    return [
      <SaveButton
        disabled={!hasChanged}
        key="save-button"
        onClick={() => hasChanged && onPersist()}
      >
        {isPersisting ? t('editor.editorToolbar.saving') : t('editor.editorToolbar.save')}
      </SaveButton>,
      currentStatus
        ? [
            <React.Fragment key="workflow-status-controls">
              {this.renderWorkflowStatusControls()}
              {!hasChanged && this.renderNewEntryWorkflowPublishControls({ canCreate, canPublish })}
            </React.Fragment>,
          ]
        : !isNewEntry && (
            <React.Fragment key="existing-entry-workflow-publish-controls">
              {this.renderExistingEntryWorkflowPublishControls({
                canCreate,
                canPublish,
                canDelete,
              })}
            </React.Fragment>
          ),
      (!showDelete || useOpenAuthoring) && !hasUnpublishedChanges && !isModification ? null : (
        <DeleteButton
          key="delete-button"
          onClick={hasUnpublishedChanges ? onDeleteUnpublishedChanges : onDelete}
        >
          {isDeleting ? t('editor.editorToolbar.deleting') : deleteLabel}
        </DeleteButton>
      ),
    ];
  };

  renderWorkflowDeployPreviewControls = () => {
    const { currentStatus, isNewEntry, t } = this.props;

    if (currentStatus) {
      return this.renderDeployPreviewControls(t('editor.editorToolbar.deployPreviewButtonLabel'));
    }

    /**
     * Publish control for published workflow entry.
     */
    if (!isNewEntry) {
      return this.renderDeployPreviewControls(t('editor.editorToolbar.deployButtonLabel'));
    }
  };

  render() {
    const {
      user,
      hasChanged,
      displayUrl,
      collection,
      hasWorkflow,
      onLogoutClick,
      t,
      editorBackLink,
    } = this.props;

    return (
      <ToolbarContainer>
        <ToolbarSectionBackLink to={editorBackLink}>
          <BackArrow>←</BackArrow>
          <BackText>
            <BackCollection>
              {t('editor.editorToolbar.backCollection', {
                collectionLabel: collection.get('label'),
              })}
            </BackCollection>
            {hasChanged ? (
              <BackStatusChanged>{t('editor.editorToolbar.unsavedChanges')}</BackStatusChanged>
            ) : (
              <BackStatusUnchanged>{t('editor.editorToolbar.changesSaved')}</BackStatusUnchanged>
            )}
          </BackText>
        </ToolbarSectionBackLink>
        <ToolbarSectionMain>
          <ToolbarSubSectionFirst>
            {hasWorkflow ? this.renderWorkflowControls() : this.renderSimpleControls()}
          </ToolbarSubSectionFirst>
          <ToolbarSubSectionLast>
            {this.renderPublishStatus()}
            {hasWorkflow
              ? this.renderWorkflowDeployPreviewControls()
              : this.renderSimpleDeployPreviewControls()}
          </ToolbarSubSectionLast>
        </ToolbarSectionMain>
        <ToolbarSectionMeta>
          <SettingsDropdown
            displayUrl={displayUrl}
            imageUrl={user?.avatar_url}
            onLogoutClick={onLogoutClick}
          />
        </ToolbarSectionMeta>
      </ToolbarContainer>
    );
  }
}

export default translate()(EditorToolbar);
