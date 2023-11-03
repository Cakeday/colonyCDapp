import React, { FC } from 'react';

import { MAX_INSTALLED_NUMBER } from '~constants';
import { ActiveInstallsProps } from './types';
import ExtensionStatusBadge from '~v5/common/Pills/ExtensionStatusBadge';
import { formatText } from '~utils/intl';

const displayName = 'frame.Extensions.pages.partials.ActiveInstalls';

const ActiveInstalls: FC<ActiveInstallsProps> = ({ activeInstalls }) => {
  return (
    <div className="sm:hidden md:block">
      {activeInstalls < MAX_INSTALLED_NUMBER ? (
        <ExtensionStatusBadge
          mode="new"
          text={formatText({ id: 'status.new' })}
        />
      ) : (
        <p className="text-gray-400 text-sm text-right">
          {activeInstalls.toLocaleString('en-US')}{' '}
          {formatText({ id: 'active.installs' })}
        </p>
      )}
    </div>
  );
};

ActiveInstalls.displayName = displayName;

export default ActiveInstalls;
