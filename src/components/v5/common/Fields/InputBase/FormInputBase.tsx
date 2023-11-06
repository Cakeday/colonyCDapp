import React, { FC } from 'react';
import { useController } from 'react-hook-form';

import { useAdditionalFormOptionsContext } from '~context/AdditionalFormOptionsContext/AdditionalFormOptionsContext';

import { FormInputBaseProps } from './types';
import { FIELD_STATE } from '../consts';
import InputBase from './InputBase';

const displayName = 'v5.common.Fields.FormInputBase';

const FormInputBase: FC<FormInputBaseProps> = ({
  name,
  type,
  value: initialValue,
  ...rest
}) => {
  const {
    field: { onChange, value },
    fieldState: { invalid, error },
  } = useController({
    name,
  });
  const { readonly } = useAdditionalFormOptionsContext();

  return (
    <InputBase
      message={error?.message}
      {...rest}
      readOnly={readonly}
      type={type}
      value={value?.toString() || initialValue}
      onChange={(event) => {
        const { value: inputValue, valueAsNumber } = event.target;

        if (type === 'number') {
          onChange(Number.isNaN(valueAsNumber) ? 0 : valueAsNumber);
        } else {
          onChange(inputValue);
        }
      }}
      state={invalid ? FIELD_STATE.Error : undefined}
    />
  );
};

FormInputBase.displayName = displayName;

export default FormInputBase;
