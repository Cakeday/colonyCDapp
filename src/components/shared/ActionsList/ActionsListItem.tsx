import React, { useMemo, useCallback, useEffect } from 'react';
import { BigNumber, BigNumberish } from 'ethers';
import { AddressZero } from '@ethersproject/constants';
import {
  FormattedDateParts,
  FormattedMessage,
  defineMessages,
  useIntl,
} from 'react-intl';
import { ColonyRoles } from '@colony/colony-js';
import Decimal from 'decimal.js';

import HookedUserAvatar from '~users/HookedUserAvatar';
import Numeral from '~shared/Numeral';
import Icon from '~shared/Icon';
import FriendlyName from '~shared/FriendlyName';
import Tag, { Appearance as TagAppearance } from '~shared/Tag';
import CountDownTimer from '~dashboard/ActionsPage/CountDownTimer';

import { getMainClasses, removeValueUnits } from '~utils/css';
import {
  getFormattedTokenValue,
  getTokenDecimalsWithFallback,
} from '~utils/tokens';
import {
  useUser,
  Colony,
  useColonyHistoricRolesQuery,
  useTokenInfoLazyQuery,
  useNetworkContracts,
} from '~data/index';
import { createAddress } from '~utils/web3';
import { FormattedAction, ColonyActions, ColonyMotions } from '~types';
import { useDataFetcher } from '~utils/hooks';
import { parseDomainMetadata } from '~utils/colonyActions';
import { useFormatRolesTitle } from '~utils/hooks/useFormatRolesTitle';
import { useEnabledExtensions } from '~utils/hooks/useEnabledExtensions';
import {
  getUpdatedDecodedMotionRoles,
  MotionState,
  MOTION_TAG_MAP,
} from '~utils/colonyMotions';
import { ipfsDataFetcher } from '../../../core/fetchers';

import { ClickHandlerProps } from './ActionsList';

import styles, { popoverWidth, popoverDistance } from './ActionsListItem.css';

const displayName = 'ActionsList.ActionsListItem';

const UserAvatar = HookedUserAvatar();

const MSG = defineMessages({
  domain: {
    id: 'ActionsList.ActionsListItem.domain',
    defaultMessage: 'Team {domainId}',
  },
  titleCommentCount: {
    id: 'ActionsList.ActionsListItem.titleCommentCount',
    defaultMessage: `{formattedCommentCount} {commentCount, plural,
      one {comment}
      other {comments}
    }`,
  },
});

export enum ItemStatus {
  NeedAction = 'NeedAction',
  NeedAttention = 'NeedAttention',
  /*
   * Default status, does not do anything
   */
  Defused = 'Defused',
}

interface Props {
  item: FormattedAction;
  colony: Colony;
  handleOnClick?: (handlerProps: ClickHandlerProps) => void;
}

const ActionsListItem = ({
  item: {
    id,
    actionType,
    initiator,
    recipient,
    amount,
    symbol: colonyTokenSymbol,
    decimals: colonyTokenDecimals,
    fromDomain: fromDomainId,
    toDomain: toDomainId,
    transactionHash,
    createdAt,
    commentCount = 0,
    metadata,
    roles,
    newVersion,
    status = ItemStatus.Defused,
    motionState,
    motionId,
    blockNumber,
    totalNayStake,
    requiredStake,
    transactionTokenAddress,
    reputationChange,
  },
  colony,
  handleOnClick,
}: Props) => {
  const { formatMessage, formatNumber } = useIntl();
  const { data: metadataJSON } = useDataFetcher(
    ipfsDataFetcher,
    [metadata as string],
    [metadata],
  );

  const { isVotingExtensionEnabled } = useEnabledExtensions({
    colonyAddress: colony.colonyAddress,
  });

  const { data: historicColonyRoles } = useColonyHistoricRolesQuery({
    variables: {
      colonyAddress: colony.colonyAddress,
      blockNumber,
    },
  });

  const [fetchTokenInfo, { data: tokenData }] = useTokenInfoLazyQuery();

  useEffect(() => {
    if (transactionTokenAddress) {
      fetchTokenInfo({ variables: { address: transactionTokenAddress } });
    }
  }, [fetchTokenInfo, transactionTokenAddress]);

  const initiatorUserProfile = useUser(createAddress(initiator || AddressZero));
  const recipientAddress = createAddress(recipient);
  const isColonyAddress = recipientAddress === colony.colonyAddress;
  const fallbackRecipientProfile = useUser(
    isColonyAddress ? '' : recipientAddress,
  );

  const fromDomain = colony.domains.find(
    ({ ethDomainId }) => ethDomainId === parseInt(fromDomainId, 10),
  );
  const toDomain = colony.domains.find(
    ({ ethDomainId }) => ethDomainId === parseInt(toDomainId, 10),
  );

  const updatedRoles = getUpdatedDecodedMotionRoles(
    fallbackRecipientProfile,
    parseInt(fromDomainId, 10),
    historicColonyRoles?.historicColonyRoles as unknown as ColonyRoles,
    roles || [],
  );
  const { roleMessageDescriptorId, roleTitle } = useFormatRolesTitle(
    actionType === ColonyMotions.SetUserRolesMotion ? updatedRoles : roles,
    actionType,
  );

  const popoverPlacement = useMemo(() => {
    const offsetSkid = (-1 * removeValueUnits(popoverWidth)) / 2;
    return [offsetSkid, removeValueUnits(popoverDistance)];
  }, []);

  const handleSyntheticEvent = useCallback(
    () => handleOnClick && handleOnClick({ id, transactionHash }),
    [handleOnClick, id, transactionHash],
  );

  const totalNayStakeValue = BigNumber.from(totalNayStake || 0);
  const isFullyNayStaked = totalNayStakeValue.gte(
    BigNumber.from(requiredStake || 0),
  );

  let domainName;
  if (
    metadataJSON &&
    (actionType === ColonyActions.EditDomain ||
      actionType === ColonyActions.CreateDomain ||
      actionType === ColonyMotions.CreateDomainMotion)
  ) {
    const domainObject = parseDomainMetadata(metadataJSON);
    domainName = domainObject.domainName;
  }
  const motionStyles =
    MOTION_TAG_MAP[
      motionState ||
        (isVotingExtensionEnabled &&
          !actionType?.endsWith('Motion') &&
          MotionState.Forced) ||
        MotionState.Invalid
    ];

  const decimals =
    tokenData?.tokenInfo?.decimals || Number(colonyTokenDecimals);
  const symbol = tokenData?.tokenInfo?.symbol || colonyTokenSymbol;
  const formattedReputationChange = getFormattedTokenValue(
    new Decimal(reputationChange || '0').abs().toString(),
    decimals,
  );

  const isMotionFinished =
    motionState === MotionState.Passed ||
    motionState === MotionState.Failed ||
    motionState === MotionState.FailedNoFinalizable;

  const stopPropagation = (event) => event.stopPropagation();

  const { feeInverse: networkFeeInverse } = useNetworkContracts();
  const feePercentage = networkFeeInverse
    ? BigNumber.from(100).div(networkFeeInverse)
    : undefined;

  // In case it is a Payment Motion or Action, calculate the payment the recipient gets, after network fees
  const paymentReceivedFn = feePercentage
    ? (paymentAmount: BigNumberish) =>
        BigNumber.from(paymentAmount)
          .mul(BigNumber.from(100).sub(feePercentage))
          .div(100)
    : (x: any) => x;

  return (
    <li data-test="actionItem">
      <div
        /*
         * @NOTE This is non-interactive element to appease the DOM Nesting Validator
         *
         * We're using a lot of nested components here, which themselves render interactive
         * elements.
         * So if this were say... a button, it would try to render a button under a button
         * and the validator would just yell at us some more.
         *
         * The other way to solve this, would be to make this list a table, and have the
         * click handler on the table row.
         * That isn't a option for us since I couldn't make the text ellipsis
         * behave nicely (ie: work) while using our core <Table /> components
         */
        role="button"
        tabIndex={0}
        className={getMainClasses({}, styles, {
          noPointer: !handleOnClick,
          [ItemStatus[status]]: !!status,
        })}
        onClick={handleSyntheticEvent}
        onKeyPress={handleSyntheticEvent}
      >
        <div
          /*
           * Clicking on UserAvatar would redirect to Actions page and stop
           * interaction with popover.
           * stopPropagation prevents event being inherited by child
           */
          onClick={stopPropagation}
          onKeyPress={stopPropagation}
          role="button"
          tabIndex={0}
          className={styles.avatar}
        >
          {initiator && (
            <UserAvatar
              colony={colony}
              size="s"
              address={initiator}
              user={initiatorUserProfile}
              notSet={false}
              showInfo
              popperOptions={{
                showArrow: false,
                placement: 'bottom',
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: popoverPlacement,
                    },
                  },
                ],
              }}
            />
          )}
        </div>
        <div className={styles.content}>
          <div className={styles.titleWrapper}>
            <span className={styles.title}>
              <FormattedMessage
                id={roleMessageDescriptorId || 'action.title'}
                values={{
                  actionType,
                  initiator: (
                    <span className={styles.titleDecoration}>
                      <FriendlyName
                        user={initiatorUserProfile}
                        autoShrinkAddress
                      />
                    </span>
                  ),
                  /*
                   * @TODO Add user mention popover back in
                   */
                  recipient: (
                    <span className={styles.titleDecoration}>
                      <FriendlyName
                        user={fallbackRecipientProfile}
                        autoShrinkAddress
                        colony={colony}
                      />
                    </span>
                  ),
                  amount: (
                    <Numeral
                      value={
                        actionType === ColonyActions.Payment ||
                        actionType === ColonyMotions.PaymentMotion
                          ? paymentReceivedFn(amount)
                          : amount
                      }
                      decimals={getTokenDecimalsWithFallback(decimals)}
                    />
                  ),
                  tokenSymbol: symbol,
                  decimals: getTokenDecimalsWithFallback(decimals),
                  fromDomain: domainName || fromDomain?.name || '',
                  toDomain: toDomain?.name || '',
                  roles: roleTitle,
                  newVersion: newVersion || '0',
                  reputationChange: formattedReputationChange,
                  reputationChangeNumeral: (
                    <Numeral value={formattedReputationChange} />
                  ),
                }}
              />
            </span>
            {(motionState || isVotingExtensionEnabled) && (
              <div className={styles.motionTagWrapper}>
                <Tag
                  text={motionStyles.name}
                  appearance={{
                    theme: motionStyles.theme as TagAppearance['theme'],
                    colorSchema:
                      motionStyles.colorSchema as TagAppearance['colorSchema'],
                  }}
                />
              </div>
            )}
          </div>
          <div className={styles.meta}>
            <FormattedDateParts value={createdAt} month="short" day="numeric">
              {(parts) => (
                <>
                  <span className={styles.day}>{parts[2].value}</span>
                  <span>{parts[0].value}</span>
                </>
              )}
            </FormattedDateParts>
            {fromDomain && (
              <span className={styles.domain}>
                {domainName || fromDomain.name ? (
                  domainName || fromDomain.name
                ) : (
                  <FormattedMessage
                    {...MSG.domain}
                    values={{ domainId: fromDomain.id }}
                  />
                )}
              </span>
            )}
            {!!commentCount && (
              <span className={styles.commentCount}>
                <Icon
                  appearance={{ size: 'extraTiny' }}
                  className={styles.commentCountIcon}
                  name="comment"
                  title={formatMessage(MSG.titleCommentCount, {
                    commentCount,
                    formattedCommentCount: formatNumber(commentCount),
                  })}
                />
                <Numeral
                  value={commentCount}
                  title={formatMessage(MSG.titleCommentCount, {
                    commentCount,
                    formattedCommentCount: formatNumber(commentCount),
                  })}
                />
              </span>
            )}
          </div>
        </div>
        {motionId && !isMotionFinished && (
          <div className={styles.countdownTimerContainer}>
            <CountDownTimer
              colony={colony}
              state={motionState as MotionState}
              motionId={Number(motionId)}
              isFullyNayStaked={isFullyNayStaked}
            />
          </div>
        )}
      </div>
    </li>
  );
};

ActionsListItem.displayName = displayName;

export default ActionsListItem;
