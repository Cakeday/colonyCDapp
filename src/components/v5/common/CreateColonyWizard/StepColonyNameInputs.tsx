import React from 'react';
import { useFormContext } from 'react-hook-form';
import { defineMessages } from 'react-intl';

import Input from '~v5/common/Fields/Input';
import { MAX_COLONY_DISPLAY_NAME } from '~constants';
import { formatText } from '~utils/intl';

const displayName = 'common.CreateColonyWizard.StepColonyNameInputs';

interface StepColonyNameInputsProps {
  displayName: string;
  colonyName: string;
}

const MSG = defineMessages({
  url: {
    id: 'createColonyWizard.step.colonyName.url',
    defaultMessage: 'Custom Colony URL',
  },
  urlSubLabel: {
    id: 'createColonyWizard.step.colonyName.urlSubLabel',
    defaultMessage:
      'You can change your Colony’s name, but not the URL. Choose carefully.',
  },
  urlSuccess: {
    id: 'createColonyWizard.step.colonyName.urlSuccess',
    defaultMessage: 'URL available',
  },
});

const StepColonyNameInputs = ({
  displayName: wizardDisplayName,
  colonyName: wizardColonyName,
}: StepColonyNameInputsProps) => {
  const {
    register,
    formState: { errors, isSubmitting, dirtyFields },
  } = useFormContext();

  const { colonyName: colonyNameDirty } = dirtyFields;
  const showColonyNameMessage = colonyNameDirty && !errors.colonyName?.message;

  const colonyNameSuccessMessage = formatText(MSG.urlSuccess);

  const displayNameError = errors.displayName?.message as string | undefined;

  const colonyNameError = errors.colonyName?.message as string | undefined;

  return (
    <div className="flex flex-col gap-12">
      <Input
        name="displayName"
        register={register}
        isError={!!displayNameError}
        customErrorMessage={displayNameError}
        className="text-md border-gray-300"
        maxCharNumber={MAX_COLONY_DISPLAY_NAME}
        isDisabled={isSubmitting}
        defaultValue={wizardDisplayName}
        labelMessage={{ id: 'colonyName' }}
      />
      <div className="flex flex-col gap-1">
        <label className="flex flex-col text-1" htmlFor="colonyName">
          {formatText(MSG.url)}
          <span className="text-xs text-gray-400">
            {formatText(MSG.urlSubLabel)}
          </span>
        </label>
        <div className="relative">
          <div className="text-gray-500 border rounded-s border-gray-300 border-e-0 text-md p-3 absolute">
            app.colony.io/
          </div>
          <Input
            name="colonyName"
            register={register}
            isError={!!colonyNameError}
            customErrorMessage={colonyNameError}
            className="text-md border-gray-300 lowercase rounded-s-none ml-[117px] w-[calc(100%-117px)]"
            isDisabled={isSubmitting}
            defaultValue={wizardColonyName}
            maxCharNumber={MAX_COLONY_DISPLAY_NAME}
            successfulMessage={
              showColonyNameMessage && colonyNameSuccessMessage
            }
            isDecoratedError={errors.colonyName?.type === 'isNameTaken'}
          />
        </div>
      </div>
    </div>
  );
};

StepColonyNameInputs.displayName = displayName;

export default StepColonyNameInputs;
