import React, { FC } from 'react';

import { useUnlockToken } from './hooks';
import { ActionFormBaseProps } from '../../../types';
import ActionFormRow from '~v5/common/ActionFormRow';
import { FormCardSelect } from '~v5/common/Fields/CardSelect';
import TeamsSelect from '~v5/common/ActionSidebar/partials/TeamsSelect';
import { DECISION_METHOD_OPTIONS } from '../../consts';
import { formatText } from '~utils/intl';
import DescriptionRow from '../../DescriptionRow';

const displayName = 'v5.common.ActionSidebar.partials.UnlockTokenForm';

const UnlockTokenForm: FC<ActionFormBaseProps> = ({ getFormOptions }) => {
  useUnlockToken(getFormOptions);

  return (
    <>
      <ActionFormRow
        iconName="scales"
        fieldName="decisionMethod"
        tooltips={{
          label: {
            tooltipContent: formatText({
              id: 'actionSidebar.tooltip.decisionMethod',
            }),
          },
        }}
        title={formatText({ id: 'actionSidebar.decisionMethod' })}
      >
        <FormCardSelect
          name="decisionMethod"
          options={DECISION_METHOD_OPTIONS}
          title={formatText({ id: 'actionSidebar.decisionMethod' })}
        />
      </ActionFormRow>
      <ActionFormRow
        iconName="house-line"
        fieldName="createdIn"
        tooltips={{
          label: {
            tooltipContent: formatText({
              id: 'actionSidebar.tooltip.createdIn',
            }),
          },
        }}
        title={formatText({ id: 'actionSidebar.createdIn' })}
      >
        <TeamsSelect name="createdIn" />
      </ActionFormRow>
      <DescriptionRow />
    </>
  );
};

UnlockTokenForm.displayName = displayName;

export default UnlockTokenForm;
