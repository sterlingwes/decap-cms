import { useEffect, useState } from 'react';
// import { translate } from 'react-polyglot';
import { injectStyle } from 'react-toastify/dist/inject-style';
import { toast, ToastContainer } from 'react-toastify';
import { connect, useDispatch } from 'react-redux';
import { useTranslate } from 'react-polyglot';
import { css, Global } from '@emotion/react';

import { dismissNotification } from '../../actions/notifications';

import type { Id, ToastItem } from 'react-toastify';
import type { State } from '../../types/redux';
import type { Notification } from '../../reducers/notifications';

injectStyle();

/**
 * On narrow screens react-toastify stretches the container across the full
 * width and pins it to the top of the viewport, which covers the app and
 * editor toolbars (including the back button) until the toast is dismissed.
 * Anchor it to the bottom instead so navigation stays reachable. The 480px
 * breakpoint matches react-toastify's own mobile breakpoint.
 */
const mobileContainerStyles = css`
  @media only screen and (max-width: 480px) {
    .notif__container.Toastify__toast-container--top-right {
      top: auto;
      bottom: 0;
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
`;

interface Props {
  notifications: Notification[];
}

type IdMap = {
  [id: string]: Id;
};

function Notifications({ notifications }: Props) {
  const t = useTranslate();
  const dispatch = useDispatch();
  const [idMap, setIdMap] = useState<IdMap>({});

  useEffect(() => {
    notifications
      .filter(notification => !idMap[notification.id])
      .forEach(notification => {
        const toastId = toast(
          typeof notification.message == 'string'
            ? notification.message
            : t(notification.message.key, { ...notification.message }),
          {
            autoClose: notification.dismissAfter,
            type: notification.type,
          },
        );

        idMap[notification.id] = toastId;
        setIdMap(idMap);

        if (notification.dismissAfter) {
          setTimeout(() => {
            dispatch(dismissNotification(notification.id));
          }, notification.dismissAfter);
        }
      });

    Object.entries(idMap).forEach(([id, toastId]) => {
      if (!notifications.find(notification => notification.id === id)) {
        toast.dismiss(toastId);
        delete idMap[id];
        setIdMap(idMap);
      }
    });
  }, [notifications]);

  toast.onChange((payload: ToastItem) => {
    if (payload.status == 'removed') {
      const id = Object.entries(idMap).find(([, toastId]) => toastId === payload.id)?.[0];
      if (id) {
        dispatch(dismissNotification(id));
      }
    }
  });

  return (
    <>
      <Global styles={mobileContainerStyles} />
      <ToastContainer
        position="top-right"
        theme="colored"
        className="notif__container"
        closeOnClick
        draggable
      />
    </>
  );
}

function mapStateToProps({ notifications }: State): Props {
  return { notifications: notifications.notifications };
}

export default connect(mapStateToProps)(Notifications);
