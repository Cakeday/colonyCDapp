import { SelectProps } from '../../types';

export type CleaveChangeEvent = React.ChangeEvent<
  HTMLInputElement & { rawValue: string }
>;

export interface AmountFieldProps extends Pick<SelectProps, 'name'> {
  defaultToken?: string;
  isError?: boolean;
  tokenFieldName?: string;
}
