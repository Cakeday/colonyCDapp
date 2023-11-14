import { useCallback, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { DeepPartial } from 'utility-types';
import { Id } from '@colony/colony-js';

import { ActionTypes } from '~redux';
import { mapPayload, pipe } from '~utils/actions';
import { useColonyContext } from '~hooks';
import { getCreateDomainDialogPayload } from '~common/Dialogs/CreateDomainDialog/helpers';
import { DECISION_METHOD_FIELD_NAME } from '~v5/common/ActionSidebar/consts';

import { ActionFormBaseProps } from '../../../types';
import {
  DecisionMethod,
  DECISION_METHOD,
  useActionFormBaseHook,
} from '../../../hooks';
import { validationSchema, CreateNewTeamFormValues } from './consts';

export const useCrateNewTeam = (
  getFormOptions: ActionFormBaseProps['getFormOptions'],
) => {
  const { colony } = useColonyContext();
  const decisionMethod: DecisionMethod | undefined = useWatch({
    name: DECISION_METHOD_FIELD_NAME,
  });

  useActionFormBaseHook({
    actionType:
      decisionMethod === DECISION_METHOD.Reputation
        ? ActionTypes.MOTION_DOMAIN_CREATE_EDIT
        : ActionTypes.ACTION_DOMAIN_CREATE,
    defaultValues: useMemo<DeepPartial<CreateNewTeamFormValues>>(
      () => ({
        createdIn: Id.RootDomain.toString(),
      }),
      [],
    ),
    getFormOptions,
    validationSchema,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    transform: useCallback(
      pipe(
        mapPayload((payload: CreateNewTeamFormValues) => {
          const values = {
            domainName: payload.teamName,
            domainPurpose: payload.domainPurpose,
            domainColor: payload.domainColor,
            motionDomainId: payload.createdIn,
            decisionMethod: payload.decisionMethod,
            annotation: payload.description,
          };

          if (colony) {
            return getCreateDomainDialogPayload(colony, values);
          }

          return null;
        }),
      ),
      [colony],
    ),
  });
};
