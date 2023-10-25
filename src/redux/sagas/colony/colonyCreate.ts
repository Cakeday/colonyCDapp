import { all, call, put } from 'redux-saga/effects';
import {
  getExtensionHash,
  Extension,
  ClientType,
  Id,
  getPermissionProofs,
  ColonyRole,
} from '@colony/colony-js';
import { poll } from 'ethers/lib/utils';
import { utils } from 'ethers';
import { Network as EthersNetwork } from '@ethersproject/networks';

import {
  CreateColonyMetadataDocument,
  CreateColonyMetadataMutation,
  CreateColonyMetadataMutationVariables,
  CreateColonyTokensDocument,
  CreateColonyTokensMutation,
  CreateColonyTokensMutationVariables,
  CreateDomainDocument,
  CreateDomainMetadataDocument,
  CreateDomainMetadataMutation,
  CreateDomainMetadataMutationVariables,
  CreateDomainMutation,
  CreateDomainMutationVariables,
  CreateUniqueColonyDocument,
  CreateUniqueColonyMutation,
  CreateUniqueColonyMutationVariables,
  CreateUserTokensDocument,
  CreateUserTokensMutation,
  CreateUserTokensMutationVariables,
  CreateWatchedColoniesDocument,
  CreateWatchedColoniesMutation,
  CreateWatchedColoniesMutationVariables,
  DomainColor,
  GetTokenFromEverywhereDocument,
  GetTokenFromEverywhereQuery,
  GetTokenFromEverywhereQueryVariables,
} from '~gql';
import { ColonyManager, ContextModule, getContext } from '~context';
import { DEFAULT_TOKEN_DECIMALS } from '~constants';
import { ActionTypes, Action, AllActions } from '~redux/index';
import { createAddress } from '~utils/web3';
import { toNumber } from '~utils/numbers';
import { getDomainDatabaseId } from '~utils/databaseId';

import {
  transactionAddParams,
  transactionAddIdentifier,
  transactionLoadRelated,
  transactionPending,
} from '../../actionCreators';
import {
  putError,
  takeFrom,
  takeLatestCancellable,
  getColonyManager,
  initiateTransaction,
} from '../utils';
import {
  ChannelDefinition,
  createGroupTransaction,
  createTransactionChannels,
} from '../transactions';
import { getOneTxPaymentVersion } from '../utils/extensionVersion';
import { updateTransaction } from '../transactions/transactionsToDb';

function* colonyCreate({
  meta,
  payload: {
    colonyName: givenColonyName,
    displayName,
    tokenAddress: givenTokenAddress,
    tokenChoice,
    tokenName,
    tokenSymbol,
    inviteCode,
  },
}: Action<ActionTypes.CREATE>) {
  const apolloClient = getContext(ContextModule.ApolloClient);
  const wallet = getContext(ContextModule.Wallet);
  const walletAddress = utils.getAddress(wallet.address);
  const colonyManager: ColonyManager = yield getColonyManager();
  const { networkClient } = colonyManager;
  const channelNames: string[] = [];

  /*
   * If the user opted to create a token, define a tx to create the token.
   */
  if (tokenChoice === 'create') {
    channelNames.push('createToken');
  }
  channelNames.push('createColony');
  /*
   * If the user opted to create a token, define txs to manage the token.
   */
  if (tokenChoice === 'create') {
    channelNames.push('deployTokenAuthority');
    channelNames.push('setTokenAuthority');
    channelNames.push('setOwner');
  }

  channelNames.push('deployOneTx');
  channelNames.push('setOneTxRoleAdministration');
  channelNames.push('setOneTxRoleFunding');

  /*
   * Define a manifest of transaction ids and their respective channels.
   */

  const channels: { [id: string]: ChannelDefinition } = yield call(
    createTransactionChannels,
    meta.id,
    channelNames,
  );
  const {
    createColony,
    createToken,
    deployOneTx,
    setOneTxRoleAdministration,
    setOneTxRoleFunding,
    deployTokenAuthority,
    setTokenAuthority,
    setOwner,
  } = channels;

  const batchKey = 'createColony';

  /*
   * Create all transactions for the group.
   */
  try {
    if (createToken) {
      yield createGroupTransaction(createToken, batchKey, meta, {
        context: ClientType.NetworkClient,
        methodName: 'deployToken',
        params: [tokenName, tokenSymbol, DEFAULT_TOKEN_DECIMALS],
      });
    }

    if (createColony) {
      yield createGroupTransaction(createColony, batchKey, meta, {
        context: ClientType.NetworkClient,
        methodName: 'createColony(address,uint256,string,string)',
        ready: false,
      });
    }

    if (deployTokenAuthority) {
      yield createGroupTransaction(deployTokenAuthority, batchKey, meta, {
        context: ClientType.NetworkClient,
        methodName: 'deployTokenAuthority',
        ready: false,
      });
    }

    if (setTokenAuthority) {
      yield createGroupTransaction(setTokenAuthority, batchKey, meta, {
        context: ClientType.TokenClient,
        methodName: 'setAuthority',
        ready: false,
      });
    }

    if (setOwner) {
      yield createGroupTransaction(setOwner, batchKey, meta, {
        context: ClientType.TokenClient,
        methodName: 'setOwner',
        ready: false,
      });
    }

    if (deployOneTx) {
      yield createGroupTransaction(deployOneTx, batchKey, meta, {
        context: ClientType.ColonyClient,
        methodName: 'installExtension',
        ready: false,
      });
    }

    if (setOneTxRoleAdministration) {
      yield createGroupTransaction(setOneTxRoleAdministration, batchKey, meta, {
        context: ClientType.ColonyClient,
        methodContext: 'setOneTxRoles',
        methodName: 'setAdministrationRole',
        ready: false,
      });
    }

    if (setOneTxRoleFunding) {
      yield createGroupTransaction(setOneTxRoleFunding, batchKey, meta, {
        context: ClientType.ColonyClient,
        methodContext: 'setOneTxRoles',
        methodName: 'setFundingRole',
        ready: false,
      });
    }

    /*
     * Wait until all transactions are created.
     */
    const transactionCreatedActions = yield all(
      Object.keys(channels).map((id) =>
        takeFrom(channels[id].channel, ActionTypes.TRANSACTION_CREATED),
      ),
    );

    /*
     * Dispatch a success action; this progresses to next wizard step,
     * where transactions can get processed.
     */
    yield put<AllActions>({
      type: ActionTypes.CREATE_SUCCESS,
      meta,
      payload: undefined,
    });

    /*
     * For transactions that rely on the receipt/event data of previous transactions,
     * wait for these transactions to succeed, collect the data, and apply it to
     * the pending transactions.
     */
    let tokenAddress: string;
    if (createToken) {
      yield initiateTransaction({ id: createToken.id });

      const {
        payload: {
          deployedContractAddress,
          eventData: {
            TokenDeployed: {
              tokenAddress: metatransactionsDeployedContractAddress,
            } = { tokenAddress: '' },
          },
        },
      } = yield takeFrom(
        createToken.channel,
        ActionTypes.TRANSACTION_SUCCEEDED,
      );
      tokenAddress = createAddress(
        deployedContractAddress || metatransactionsDeployedContractAddress,
      );
    } else {
      if (!givenTokenAddress) {
        throw new Error('Token address not provided');
      }
      tokenAddress = createAddress(givenTokenAddress);
    }
    /*
     * Add token to db.
     * The query is resolved by "fetchTokenFromChain", which handles the mutation.
     */
    yield apolloClient.query<
      GetTokenFromEverywhereQuery,
      GetTokenFromEverywhereQueryVariables
    >({
      query: GetTokenFromEverywhereDocument,
      variables: {
        input: { tokenAddress },
      },
    });

    /*
     * Add token to current user's token list.
     */
    yield apolloClient.mutate<
      CreateUserTokensMutation,
      CreateUserTokensMutationVariables
    >({
      mutation: CreateUserTokensDocument,
      variables: {
        input: {
          userID: walletAddress,
          tokenID: tokenAddress,
        },
      },
    });

    let colonyAddress;
    if (createColony) {
      const currentColonyVersion =
        yield networkClient.getCurrentColonyVersion();

      yield put(
        transactionAddParams(createColony.id, [
          tokenAddress,
          currentColonyVersion,
          givenColonyName,
          '', // we aren't using ipfs to store metadata in the CDapp
        ]),
      );
      yield initiateTransaction({ id: createColony.id });

      const {
        payload: {
          eventData: {
            ColonyAdded: { colonyAddress: createdColonyAddress },
          },
        },
      } = yield takeFrom(
        createColony.channel,
        ActionTypes.TRANSACTION_SUCCEEDED,
      );

      /*
       * Update transactions saved in the db with the new colony address
       * This is so that the Create Colony action group persists in the user's transaction history
       */
      yield all(
        transactionCreatedActions.map(({ meta: { id } }) =>
          updateTransaction({ id, colonyAddress: createdColonyAddress }),
        ),
      );

      colonyAddress = createdColonyAddress;

      if (!colonyAddress) {
        return yield putError(
          ActionTypes.CREATE_ERROR,
          new Error('Missing colony address'),
          meta,
        );
      }
      const network: EthersNetwork = yield colonyManager.provider.getNetwork();
      const colonyClient = yield colonyManager.getClient(
        ClientType.ColonyClient,
        colonyAddress,
      );
      const isTokenLocked = yield colonyClient.tokenClient.locked();

      /*
       * Create colony in db
       */
      yield apolloClient.mutate<
        CreateUniqueColonyMutation,
        CreateUniqueColonyMutationVariables
      >({
        mutation: CreateUniqueColonyDocument,
        variables: {
          input: {
            id: colonyAddress,
            name: givenColonyName,
            colonyNativeTokenId: tokenAddress,
            version: toNumber(currentColonyVersion),
            chainMetadata: {
              chainId: network.chainId,
            },
            status: {
              nativeToken: {
                unlockable: tokenChoice === 'create',
                unlocked: !isTokenLocked,
                mintable: tokenChoice === 'create',
              },
            },
            inviteCode,
          },
        },
      });

      /**
       * Save colony metadata to the db
       */
      yield apolloClient.mutate<
        CreateColonyMetadataMutation,
        CreateColonyMetadataMutationVariables
      >({
        mutation: CreateColonyMetadataDocument,
        variables: {
          input: {
            id: colonyAddress,
            displayName,
            isWhitelistActivated: false,
          },
        },
      });

      /*
       * Add token to colony's token list
       */
      yield apolloClient.mutate<
        CreateColonyTokensMutation,
        CreateColonyTokensMutationVariables
      >({
        mutation: CreateColonyTokensDocument,
        variables: {
          input: {
            colonyID: colonyAddress,
            tokenID: tokenAddress,
          },
        },
      });

      /*
       * Subscribe user to colony
       */
      yield apolloClient.mutate<
        CreateWatchedColoniesMutation,
        CreateWatchedColoniesMutationVariables
      >({
        mutation: CreateWatchedColoniesDocument,
        variables: {
          input: {
            colonyID: colonyAddress,
            userID: walletAddress,
          },
        },
      });

      /*
       * Save root domain metadata to the database
       */
      yield apolloClient.mutate<
        CreateDomainMetadataMutation,
        CreateDomainMetadataMutationVariables
      >({
        mutation: CreateDomainMetadataDocument,
        variables: {
          input: {
            id: getDomainDatabaseId(colonyAddress, Id.RootDomain),
            color: DomainColor.LightPink,
            name: 'Root',
            description: '',
          },
        },
      });
      /**
       * Create root domain in the database
       * @NOTE: This is a temporary solution and this mutation should be called by block-ingestor on ColonyAdded event
       */
      const [skillId, fundingPotId] = yield colonyClient.getDomain(
        Id.RootDomain,
      );
      yield apolloClient.mutate<
        CreateDomainMutation,
        CreateDomainMutationVariables
      >({
        mutation: CreateDomainDocument,
        variables: {
          input: {
            id: getDomainDatabaseId(colonyAddress, Id.RootDomain),
            colonyId: colonyAddress,
            isRoot: true,
            nativeId: Id.RootDomain,
            nativeSkillId: toNumber(skillId),
            nativeFundingPotId: toNumber(fundingPotId),
          },
        },
      });

      yield put(transactionLoadRelated(createColony.id, true));
    }

    if (createColony) {
      yield put(transactionLoadRelated(createColony.id, false));
    }
    /*
     * Add a colonyAddress identifier to all pending transactions.
     */
    yield all(
      [
        deployTokenAuthority,
        deployOneTx,
        setOneTxRoleAdministration,
        setOneTxRoleFunding,
      ]
        .filter(Boolean)
        .map(({ id }) => put(transactionAddIdentifier(id, colonyAddress))),
    );
    yield all(
      [setTokenAuthority, setOwner]
        .filter(Boolean)
        .map(({ id }) => put(transactionAddIdentifier(id, tokenAddress))),
    );

    if (deployTokenAuthority) {
      /*
       * Deploy TokenAuthority
       */
      const tokenLockingAddress = yield networkClient.getTokenLocking();
      yield put(
        transactionAddParams(deployTokenAuthority.id, [
          tokenAddress,
          colonyAddress,
          [tokenLockingAddress],
        ]),
      );
      yield initiateTransaction({ id: deployTokenAuthority.id });

      const {
        payload: {
          eventData: {
            TokenAuthorityDeployed: {
              tokenAuthorityAddress: deployedContractAddress,
            },
          },
        },
      } = yield takeFrom(
        deployTokenAuthority.channel,
        ActionTypes.TRANSACTION_SUCCEEDED,
      );

      /*
       * Set Token authority (to deployed TokenAuthority)
       */
      yield put(
        transactionAddParams(setTokenAuthority.id, [deployedContractAddress]),
      );
      yield initiateTransaction({ id: setTokenAuthority.id });

      yield takeFrom(
        setTokenAuthority.channel,
        ActionTypes.TRANSACTION_SUCCEEDED,
      );
    }

    if (setOwner) {
      yield put(transactionAddParams(setOwner.id, [colonyAddress]));
      yield initiateTransaction({ id: setOwner.id });
      yield takeFrom(setOwner.channel, ActionTypes.TRANSACTION_SUCCEEDED);
    }

    if (deployOneTx) {
      /*
       * Deploy OneTx
       */
      const oneTxHash = getExtensionHash(Extension.OneTxPayment);
      const oneTxVersion = yield call(getOneTxPaymentVersion);
      yield put(
        transactionAddParams(deployOneTx.id, [oneTxHash, oneTxVersion]),
      );
      yield initiateTransaction({ id: deployOneTx.id });

      yield takeFrom(deployOneTx.channel, ActionTypes.TRANSACTION_SUCCEEDED);

      /*
       * Set OneTx administration role
       */
      yield put(transactionPending(setOneTxRoleAdministration.id));

      /*
       * Generate proofs for setting permissions the the newly deployed OneTxPayment extension
       */
      const colonyClient = yield colonyManager.getClient(
        ClientType.ColonyClient,
        colonyAddress,
      );

      let oneTxPaymentRoleProofs;
      // This has two potential permissions, so we try both of them
      try {
        oneTxPaymentRoleProofs = yield getPermissionProofs(
          colonyClient.networkClient,
          colonyClient,
          Id.RootDomain,
          ColonyRole.Architecture,
        );
      } catch (error) {
        oneTxPaymentRoleProofs = yield getPermissionProofs(
          colonyClient.networkClient,
          colonyClient,
          Id.RootDomain,
          ColonyRole.Root,
        );
      }
      const [permissionDomainId, childSkillIndex] = oneTxPaymentRoleProofs;

      const oneTxPaymentExtension = yield poll(
        async () => {
          try {
            const client = await colonyManager.getClient(
              ClientType.OneTxPaymentClient,
              colonyAddress,
            );
            return client;
          } catch (err) {
            return undefined;
          }
        },
        {
          timeout: 30000,
        },
      );

      const extensionAddress = oneTxPaymentExtension.address;

      yield put(
        transactionAddParams(setOneTxRoleAdministration.id, [
          permissionDomainId,
          childSkillIndex,
          extensionAddress,
          Id.RootDomain,
          true,
        ]),
      );
      yield initiateTransaction({ id: setOneTxRoleAdministration.id });

      yield takeFrom(
        setOneTxRoleAdministration.channel,
        ActionTypes.TRANSACTION_SUCCEEDED,
      );

      /*
       * Set OneTx funding role
       */

      yield put(
        transactionAddParams(setOneTxRoleFunding.id, [
          permissionDomainId,
          childSkillIndex,
          extensionAddress,
          Id.RootDomain,
          true,
        ]),
      );
      yield initiateTransaction({ id: setOneTxRoleFunding.id });

      yield takeFrom(
        setOneTxRoleFunding.channel,
        ActionTypes.TRANSACTION_SUCCEEDED,
      );
    }

    return null;
  } catch (error) {
    yield putError(ActionTypes.CREATE_ERROR, error, meta);
    /*
     * For non-transaction errors (where something is probably irreversibly wrong),
     * cancel the saga.
     */
    return null;
  } finally {
    /*
     * Close all transaction channels.
     */
    yield all(
      Object.keys(channels).map((id) =>
        call([channels[id].channel, channels[id].channel.close]),
      ),
    );
  }
}

export default function* colonyCreateSaga() {
  yield takeLatestCancellable(
    ActionTypes.CREATE,
    ActionTypes.CREATE_CANCEL,
    colonyCreate,
  );
}
