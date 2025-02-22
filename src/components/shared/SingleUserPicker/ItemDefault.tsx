import React, { ReactNode } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import cx from 'classnames';

import { AnyUser } from '~data/index';
import { Address } from '~types';
import { ItemDataType } from '~shared/OmniPicker';
import MaskedAddress from '~shared/MaskedAddress';
import UserMention from '~shared/UserMention';
import styles from './ItemDefault.css';

const MSG = defineMessages({
  ownName: {
    id: 'SingleUserPicker.ItemWithYouText.youText',
    defaultMessage: '(you)',
  },
});

interface Props {
  walletAddress?: Address;
  itemData: ItemDataType<AnyUser>;
  renderAvatar: (address: Address, user: ItemDataType<AnyUser>) => ReactNode;
  selected?: boolean;
  showAddress?: boolean;

  /*
   * Same as showAddress, just display a masked (shortened) address instead
   */
  showMaskedAddress?: boolean;
  dataTest?: string;
}
const ItemDefault = ({
  walletAddress,
  itemData: {
    profile: { walletAddress: userAddress, displayName, username } = {
      /*
       * @NOTE This is a last resort default!
       *
       * If the app ever gets to use this value, the SingleUserPickerItem
       * compontn will display: _Address format is wrong!_
       */
      walletAddress: '',
    },
  },
  itemData,
  renderAvatar,
  showAddress,
  showMaskedAddress,
  dataTest,
}: Props) => (
  <span
    className={cx(styles.main, {
      [styles.showAddress]: showAddress || showMaskedAddress,
    })}
    data-test={dataTest}
  >
    {renderAvatar(userAddress, itemData)}
    <span className={styles.dataContainer}>
      {displayName && (
        <span className={styles.displayName}>
          {displayName}
          {walletAddress === userAddress && (
            <span className={styles.thatsYou}>
              &nbsp;
              <FormattedMessage {...MSG.ownName} />
            </span>
          )}
          &nbsp;
        </span>
      )}
      {username && <UserMention username={username} hasLink={false} />}
      {showAddress && <span className={styles.address}>{userAddress}</span>}
      {!showAddress && showMaskedAddress && (
        <span className={styles.address}>
          <MaskedAddress address={userAddress} />
        </span>
      )}
    </span>
  </span>
);

ItemDefault.displayName = 'SingleUserPicker.ItemDefault';

export default ItemDefault;
