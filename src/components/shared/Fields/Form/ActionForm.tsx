import { FormikBag, FormikConfig } from 'formik';
import React from 'react';
import { defineMessages } from 'react-intl';

import { ActionTypeString } from '~redux';
import { ActionTransformFnType } from '~utils/actions';
import { useAsyncFunction } from '~hooks';
import Form from './Form';

const MSG = defineMessages({
  defaultError: {
    id: 'ActionForm.defaultError',
    defaultMessage:
      "Something went wrong with the thing you just wanted to do. It's not your fault. Promise!",
  },
});

const displayName = 'Form.ActionForm';

export type OnError = (
  error: any,
  bag: FormikBag<any, any>,
  values?: any,
) => void;
export type OnSuccess = (
  result: any,
  bag: FormikBag<any, any>,
  values: any,
) => void;

interface Props<V> extends Omit<FormikConfig<V>, 'onSubmit'> {
  /** Redux action to dispatch on submit (e.g. CREATE_XXX) */
  submit: ActionTypeString;

  /** Redux action listener for successful action (e.g. CREATE_XXX_SUCCESS) */
  success: ActionTypeString;

  /** Redux action listener for unsuccessful action (e.g. CREATE_XXX_ERROR) */
  error: ActionTypeString;

  /** Function to call after successful action was dispatched */
  onSuccess?: OnSuccess;

  /** Function to call after error action was dispatched */
  onError?: OnError;

  /** A function to transform the action after the form data was passed in (as payload) */
  transform?: ActionTransformFnType;
}

const defaultOnError: OnError = (err, { setStatus }) => {
  console.error(err);
  setStatus({ error: MSG.defaultError });
};

const defaultOnSuccess: OnSuccess = (err, { setStatus }) => {
  setStatus({});
};

const ActionForm = <V,>({
  submit,
  success,
  error,
  onSuccess = defaultOnSuccess,
  onError = defaultOnError,
  transform,
  ...props
}: Props<V>) => {
  const asyncFunction = useAsyncFunction({
    submit,
    error,
    success,
    transform,
  });
  const handleSubmit = (values, formikBag) => {
    formikBag.setStatus({});
    asyncFunction(values).then(
      (res) => {
        formikBag.setSubmitting(false);
        if (typeof onSuccess === 'function') {
          onSuccess(res, formikBag, values);
        }
      },
      (err) => {
        formikBag.setSubmitting(false);
        if (typeof onError === 'function') onError(err, formikBag, values);
      },
    );
  };
  return <Form {...props} onSubmit={handleSubmit} />;
};

ActionForm.displayName = displayName;

export default ActionForm;
