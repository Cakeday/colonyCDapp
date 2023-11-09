import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import clsx from 'clsx';

import Heading from '~shared/Heading';
import CreateAColonyBanner from '~images/create-colony-banner.png';
import CreateAProfileBanner from '~images/create-profile-banner.png';
import { useAppContext } from '~hooks';
import InvitationBlock from '~common/InvitationBlock';
import { clearLastWallet } from '~utils/autoLogin';

import LandingPageItem from './LandingPageItem';

const displayName = 'frame.LandingPage';

const MSG = defineMessages({
  headerTitle: {
    id: `${displayName}.callToAction`,
    defaultMessage: 'Welcome to Colony',
  },
  privateBetaLabel: {
    id: `${displayName}.privateBetaLabel`,
    defaultMessage: 'Private Beta',
  },
  headerDescription: {
    id: `${displayName}.headerDescription`,
    defaultMessage:
      'The best way to build your online organization. Create a new colony, create a profile so you can contribute to other colonies or start with exploring the Metacolony.',
  },
  createColonyTitle: {
    id: `${displayName}.createColonyTitle`,
    defaultMessage: 'Create a Colony',
  },
  createColonyDescription: {
    id: `${displayName}.createColonyDescription`,
    defaultMessage:
      'Assemble your team, distribute authority, manage the money.',
  },
  createColonyButtonText: {
    id: `${displayName}.createColonyButtonText`,
    defaultMessage: 'Get Started',
  },
  createUserProfileTitle: {
    id: `${displayName}.createUserProfile`,
    defaultMessage: 'Create a profile',
  },
  createUserProfileButtonText: {
    id: `${displayName}.createUserProfileButtonText`,
    defaultMessage: 'Create',
  },
  viewUserProfileTitle: {
    id: `${displayName}.viewUserProfile`,
    defaultMessage: 'View profile',
  },
  viewUserProfileDescription: {
    id: `${displayName}.viewUserProfileDescription`,
    defaultMessage:
      'Define your identity, track your contributions, build your reputation.',
  },
  viewUserProfileButtonText: {
    id: `${displayName}.viewUserProfileButtonText`,
    defaultMessage: 'View',
  },
  exploreMetacolonyTitle: {
    id: `${displayName}.exploreMetacolony`,
    defaultMessage: 'Explore the Metacolony',
  },
  exploreMetacolonyDescription: {
    id: `${displayName}.exploreMetacolonyDescription`,
    defaultMessage: 'The Colony using Colony to build Colony.',
  },
  exploreMetacolonyButtonText: {
    id: `${displayName}.exploreMetacolonyButtonText`,
    defaultMessage: 'Explore',
  },
  inviteBlockTitle: {
    id: `${displayName}.inviteBlockTitle`,
    defaultMessage: 'Invite 1 person to create a Colony',
  },
  inviteBlockDescription: {
    id: `${displayName}.inviteBlockDescription`,
    defaultMessage:
      'You can invite only one member to create a colony of their own using the new app during the private beta with this custom invite link: app.colony.io/createcolony/{invitationCode}',
  },
});

const LandingPage = () => {
  const [hoveredItem, setHoveredItem] = useState<number>(1);
  const navigate = useNavigate();
  const { user, connectWallet, wallet, userLoading } = useAppContext();
  const onUserLogin = () => {
    clearLastWallet();
    connectWallet?.();
  };

  const landingPageItems = [
    {
      buttonText: MSG.createColonyButtonText,
      headingText: MSG.createColonyTitle,
      headingDescription: MSG.createColonyDescription,
      iconName: 'layout',
      // @TODO: Connect with real invitation code
      onClick: () => navigate('/create-colony/asd'),
      imgSrc: CreateAColonyBanner,
      disabled: true,
    },
    {
      buttonText: user
        ? MSG.viewUserProfileButtonText
        : MSG.createUserProfileButtonText,
      headingText: user ? MSG.viewUserProfileTitle : MSG.createUserProfileTitle,
      headingDescription: MSG.viewUserProfileDescription,
      iconName: 'user-circle',
      onClick: !wallet
        ? onUserLogin
        : () => navigate(user ? '/my/profile' : '/create-user'),
      imgSrc: CreateAProfileBanner,
      disabled: userLoading,
    },
    {
      buttonText: MSG.exploreMetacolonyButtonText,
      headingText: MSG.exploreMetacolonyTitle,
      headingDescription: MSG.exploreMetacolonyDescription,
      iconName: 'colony-icon',
      onClick: () => navigate('/colony/meta'),
      disabled: true,
    },
  ];
  const hasShareableInvitationCode =
    !!user?.privateBetaInviteCode?.shareableInvites;

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Heading
            text={MSG.headerTitle}
            className="font-semibold text-gray-900 text-3xl"
          />
          <span className="font-medium text-blue-400 text-sm px-3 py-1 bg-blue-100 rounded-3xl ml-3">
            <FormattedMessage {...MSG.privateBetaLabel} />
          </span>
        </div>
        <p className="text-md text-gray-600">
          <FormattedMessage {...MSG.headerDescription} />
        </p>
      </div>
      <div className="w-full flex justify-center gap-4  max-w-[1286px]">
        <div className="w-1/2 flex flex-col gap-4">
          {landingPageItems.map((item, index) => (
            <LandingPageItem
              key={nanoid()}
              {...item}
              itemIndex={index}
              onHover={setHoveredItem}
            />
          ))}
        </div>
        <div
          className={clsx(
            'flex justify-center w-1/2 bg-gray-100 rounded-lg max-h-[395px] border border-gray-200 shadow-sm',
            { 'pl-9 pt-7': hoveredItem === 0 },
          )}
        >
          <img
            src={landingPageItems[1].imgSrc} // @TODO: Change to hoveredItem once we enable the create colony landing page item
            alt=""
            className={clsx('object-cover relative', {
              'rounded-br-[10px] rounded-tl-[10px]': hoveredItem === 0,
              'left-3 top-7': hoveredItem === 1,
            })}
          />
        </div>
      </div>
      {hasShareableInvitationCode && <InvitationBlock />}
    </div>
  );
};

LandingPage.displayName = displayName;

export default LandingPage;
