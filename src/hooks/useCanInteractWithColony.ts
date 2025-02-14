import { Colony } from '~types';
import { DEFAULT_NETWORK_INFO, NETWORK_AVAILABLE_CHAINS } from '~constants';

import useAppContext from './useAppContext';

export const useUserAccountRegistered = (): boolean => {
  const { user } = useAppContext();
  /*
   * Short circuit early
   */
  if (!user) {
    return false;
  }
  return !!user.name;
};

export const useCanInteractWithNetwork = (): boolean => {
  const { wallet } = useAppContext();
  const userAccountRegistered = useUserAccountRegistered();

  /*
   * Short circuit early
   */
  if (!wallet) {
    return false;
  }
  const [{ id: walletHexChainId }] = wallet.chains;
  const userWalletChain = parseInt(walletHexChainId.slice(2), 16);

  const networkContractsAvailable = Object.keys(NETWORK_AVAILABLE_CHAINS).find(
    (networkName) =>
      NETWORK_AVAILABLE_CHAINS[networkName].chainId === userWalletChain,
  );
  return userAccountRegistered && !!networkContractsAvailable;
};

/*
 * @TODO Eventually, this should
 * - Include roles / permissions into the check
 */
export const useCanInteractWithColony = (colony?: Colony): boolean => {
  const { wallet } = useAppContext();
  const canInteractWithNetwork = useCanInteractWithNetwork();

  /*
   * Short circuit early
   */
  if (!wallet || !colony) {
    return false;
  }
  const [{ id: walletHexChainId }] = wallet.chains;
  const colonyChain = colony?.meta?.chainId || DEFAULT_NETWORK_INFO.chainId;
  const userWalletChain = parseInt(walletHexChainId.slice(2), 16);
  return colonyChain === userWalletChain && canInteractWithNetwork;
};

export default useCanInteractWithColony;
