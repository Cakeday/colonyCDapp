import React, {
  createContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';

type SingleTransactionAlert = { wasSeen?: boolean; isOpen?: boolean };
type TransactionAlerts = Record<string, SingleTransactionAlert>;

export const GasStationContext = createContext<{
  transactionAlerts: TransactionAlerts;
  updateTransactionAlert: (
    transactionId: string,
    alertPayload: SingleTransactionAlert,
  ) => void;
}>({
  transactionAlerts: {},
  updateTransactionAlert: () => {},
});

interface Props {
  children: ReactNode;
}

const GasStationProvider = ({ children }: Props) => {
  const [transactionAlerts, updateTransactionAlerts] =
    useState<TransactionAlerts>({});

  const updateTransactionAlert = useCallback(
    (
      transactionId: string,
      /*
       * @NOTE This was thought about being extendable, so that more props can
       * be tracked for a transactions from component land (eg: isOpen)
       */
      alertPayload: SingleTransactionAlert,
    ) => {
      return updateTransactionAlerts({
        ...transactionAlerts,
        [transactionId]: {
          ...(transactionAlerts[transactionId] || {}),
          ...alertPayload,
        },
      });
    },
    [transactionAlerts],
  );

  const value = useMemo(
    () => ({
      transactionAlerts,
      updateTransactionAlert,
    }),
    [transactionAlerts, updateTransactionAlert],
  );
  return (
    <GasStationContext.Provider value={value}>
      {children}
    </GasStationContext.Provider>
  );
};

export default GasStationProvider;
