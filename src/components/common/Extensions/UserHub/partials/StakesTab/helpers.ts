import { MotionState as NetworkMotionState } from '@colony/colony-js';

import { UserStake, UserStakeStatus } from '~types';
import { MotionStatesMap } from '~hooks/useNetworkMotionState';

import { StakesFilterType } from './types';
import { stakesFilterOptions } from './consts';

export const getStakesTabItems = (
  stakesByFilterType: Record<StakesFilterType, UserStake[]>,
  motionStatesLoading: boolean,
  activeFilterType: StakesFilterType,
) =>
  stakesFilterOptions.map((option) => {
    if (
      !option.showNotificationNumber ||
      (option.requiresMotionState && motionStatesLoading)
    ) {
      return option;
    }

    const notificationNumber = stakesByFilterType[option.type].length;

    return {
      ...option,
      notificationNumber,
      active: option.type === activeFilterType,
    };
  });

export const getStakeStatus = (
  stake: UserStake,
  statesMap: MotionStatesMap,
) => {
  if (stake.isClaimed) {
    return UserStakeStatus.Claimed;
  }

  const motionState = statesMap.get(
    stake.action?.motionData?.nativeMotionId ?? '',
  );
  if (!motionState) {
    return UserStakeStatus.Unknown;
  }

  if (motionState === NetworkMotionState.Finalizable) {
    return UserStakeStatus.Finalizable;
  }
  if (
    motionState === NetworkMotionState.Finalized ||
    motionState === NetworkMotionState.Failed
  ) {
    return UserStakeStatus.Claimable;
  }

  return UserStakeStatus.Unknown;
};
