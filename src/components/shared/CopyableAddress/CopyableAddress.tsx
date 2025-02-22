import React, { useCallback } from 'react';
import { splitAddress } from '~utils/strings';

import { Address } from '~types';

import { getMainClasses } from '~utils/css';
import MaskedAddress from '~shared/MaskedAddress';
import ClipboardCopy from '~shared/ClipboardCopy';

import styles from './CopyableAddress.css';

interface Appearance {
  theme: 'big';
}

interface Props {
  /** Appearance object */
  appearance?: Appearance;
  /** Address to display */
  children: Address;
  /** Indicates that the full address should be shown instead of an abbreviated one */
  full?: boolean;
  /** In some occasions we want to show the button to copy only */
  hideAddress?: boolean;
}

const displayName = 'CopyableAddress';

const CopyableAddress = ({
  appearance,
  children: address,
  full,
  hideAddress = false,
}: Props) => {
  const getAddress = useCallback(() => {
    const addressElements = splitAddress(address);
    if (full && !(addressElements instanceof Error)) {
      return <MaskedAddress address={address} full />;
    }
    return <MaskedAddress address={address} />;
  }, [address, full]);
  return (
    <div className={getMainClasses(appearance, styles)}>
      <div className={styles.addressContainer}>
        {!hideAddress && getAddress()}
      </div>
      <span className={styles.copyButton}>
        <ClipboardCopy value={address} />
      </span>
    </div>
  );
};

CopyableAddress.displayName = displayName;

export default CopyableAddress;
