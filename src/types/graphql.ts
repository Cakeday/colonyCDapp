import {
  UserFragment,
  ColonyFragment,
  WatcherFragment,
  TokenFragment,
  WatchListItemFragment,
  WatchedColonyFragment,
  ExtensionFragment,
} from '~gql';

export type User = UserFragment;

export type Colony = ColonyFragment;

export type ColonyWatcher = WatcherFragment;

export type Token = TokenFragment;

export type WatchListItem = WatchListItemFragment;

export type WatchedColony = WatchedColonyFragment;

export type ColonyExtension = ExtensionFragment;
