import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import classnames from 'classnames';

import { Tooltip } from '~shared/Popover';
import TransactionLink from '~shared/TransactionLink';
import { SpinnerLoader } from '~shared/Preloaders';
import Icon from '~shared/Icon';

import { DEFAULT_NETWORK_INFO } from '~constants';
import { TRANSACTION_STATUSES } from '~types';

import styles from './TransactionStatus.css';

const displayName = 'frame.GasStation.TransactionStatus';

const MSG = defineMessages({
  transactionState: {
    id: `${displayName}.transactionState`,
    defaultMessage: `{status, select,
      FAILED {Failed transaction. Try again}
      SUCCEEDED {Transaction succeeded}
      READY {{groupCount, number} {groupCount, plural,
        one {transaction}
        other {transactions}
      } to sign}
      other {Can't report any status}
    }`,
  },
  transactionBlockExplorer: {
    id: `${displayName}.transactionBlockExplorer`,
    defaultMessage: '{blockExplorerName}',
  },
});

interface Props {
  groupCount?: number;
  hash?: string;
  status: TRANSACTION_STATUSES;
  loadingRelated?: boolean;
}

const TransactionStatus = ({
  hash,
  status,
  groupCount,
  loadingRelated,
}: Props) => (
  <div
    className={classnames(styles.main, {
      [styles.mainStatusReady]: TRANSACTION_STATUSES.READY === status,
    })}
  >
    {hash && (
      <TransactionLink
        className={styles.interaction}
        hash={hash}
        text={MSG.transactionBlockExplorer}
        textValues={{
          blockExplorerName: DEFAULT_NETWORK_INFO.blockExplorerName,
        }}
      />
    )}
    <Tooltip
      /* Because it's in an overflow window */
      popperOptions={{ strategy: 'fixed' }}
      content={
        <span>
          <FormattedMessage
            {...MSG.transactionState}
            values={{
              status,
              groupCount: groupCount || 1,
            }}
          />
        </span>
      }
    >
      {/*
       * The tooltip content needs to be wrapped inside a block
       * element (otherwise it won't detect the hover event)
       */}
      <div
        className={classnames(styles.statusIconContainer, {
          [styles.statusIconContainerReady]:
            TRANSACTION_STATUSES.READY === status,
        })}
      >
        {groupCount && status === TRANSACTION_STATUSES.READY && (
          <span className={styles.counter}>
            <span>{groupCount}</span>
          </span>
        )}
        {status === TRANSACTION_STATUSES.SUCCEEDED && !loadingRelated && (
          <span
            className={styles.completed}
            data-test="gasStationTransactionSucceeded"
          >
            <Icon
              appearance={{ size: 'tiny' }}
              name="check-mark"
              /*
               * @NOTE We disable the title since we already
               * have a tooltip around it
               */
              title=""
            />
          </span>
        )}
        {(status === TRANSACTION_STATUSES.PENDING || loadingRelated) && (
          <div data-test="gasStationTransactionPending">
            <SpinnerLoader appearance={{ size: 'small', theme: 'primary' }} />
          </div>
        )}
        {status === TRANSACTION_STATUSES.FAILED && (
          <span className={styles.failed}>!</span>
        )}
      </div>
    </Tooltip>
  </div>
);

TransactionStatus.displayName = displayName;

export default TransactionStatus;
