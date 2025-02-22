import BN from 'bn.js';
import { getAddress, hexlify } from 'ethers/lib.esm/utils';
import { ClientType, TokenClientType } from '@colony/colony-js';

import { Address, ExtendedClientType } from '~types';
import { TransactionError } from '~redux/immutable/Transaction';
import { NETWORK_DATA } from '~constants';

export const createAddress = (address: string): Address => getAddress(address);

// @TODO ethers v5 will have an isAddress utility function
export const isAddress = (address: string) => {
  try {
    getAddress(address);
  } catch {
    return false;
  }
  return true;
};

export const toHex = hexlify;

export type Unit =
  | 'noether'
  | 'wei'
  | 'kwei'
  | 'Kwei'
  | 'babbage'
  | 'femtoether'
  | 'mwei'
  | 'Mwei'
  | 'lovelace'
  | 'picoether'
  | 'gwei'
  | 'Gwei'
  | 'shannon'
  | 'nanoether'
  | 'nano'
  | 'szabo'
  | 'microether'
  | 'micro'
  | 'finney'
  | 'milliether'
  | 'milli'
  | 'ether'
  | 'kether'
  | 'grand'
  | 'mether'
  | 'gether'
  | 'tether';

export const isTransactionFormat = (
  potentialTransactionHash?: string,
): boolean => {
  const hexStringRegex = /^0x([A-Fa-f0-9]{64})$/;
  if (!potentialTransactionHash) {
    return false;
  }
  return !!potentialTransactionHash.match(hexStringRegex);
};

export const generateMetatransactionErrorMessage = (
  emmitentClient: any, // Disregard the `any`. The new ColonyJS messed up all the types
) =>
  `Contract does not support MetaTransactions. ${emmitentClient.clientType}${
    emmitentClient.clientType === ClientType.TokenClient
      ? ` of type ${emmitentClient.tokenClientType}`
      : ''
  } at ${emmitentClient.address}`;

export const generateMetamaskTypedDataSignatureErrorMessage = (
  chainId: number,
) =>
  `Please switch your wallet's network to ${NETWORK_DATA?.[chainId]?.name} in order to sign this typed data`;

export function intArrayToBytes32(arr: Array<number>) {
  return `0x${new BN(
    arr.map((num) => new BN(1).shln(num)).reduce((a, b) => a.or(b), new BN(0)),
  ).toString(16, 64)}`;
}

export const isGasStationMetatransactionError = (
  error?: TransactionError,
): boolean =>
  !!error?.message.includes('Contract does not support MetaTransactions');

/*
 * Attempt to detect, poorly, if the error originated from our own contracts
 * because we know they support Metatransactions, hence they're out of date.
 *
 * If the error originated from other contracts, it means they most likely
 * don't support metatransactions
 *
 * Also, as a side note, this can only happen, currently, for the TokenClient
 * contracts
 */
export const isMetatransactionErrorFromColonyContract = (
  error?: TransactionError,
): boolean => {
  if (!error?.message) {
    return false;
  }
  const CLIENT_ADDRESS_REGEX = /\.\s(.*Client)\s/;
  const TOKEN_TYPE_REGEX = /of\stype\s(.*)\sat/;
  const [, clientType] = error.message.match(CLIENT_ADDRESS_REGEX) || [];
  /*
   * @NOTE Shortcut it early if it's the Vesting Contract or the Wrapped Token Contract
   * While technically ours, they don't support metatransactions and they're
   * not upgradable either, so no such functionality can be added to them
   */
  if (
    clientType === ExtendedClientType.VestingSimpleClient ||
    clientType === ExtendedClientType.WrappedTokenClient
  ) {
    return false;
  }
  let tokenType: string = TokenClientType.Erc20;
  if (clientType === ClientType.TokenClient) {
    [, tokenType] = error.message.match(TOKEN_TYPE_REGEX) || [];
  }
  /*
   * @NOTE All ColonyJS client types (if correct version) support Metatransactions
   * Locally defined clients (in Dapp) may not. Out of them, the only one currently
   * supporting that is the `Light Token Client` hence why it's singled out
   */
  const isCorrectClient = [
    ...Object.values(ClientType),
    ExtendedClientType.LightTokenClient,
  ].includes(clientType as ClientType);
  const isCorrectToken = tokenType === TokenClientType.Colony;
  if (clientType === ClientType.TokenClient) {
    return isCorrectClient && isCorrectToken;
  }
  return isCorrectClient;
};
