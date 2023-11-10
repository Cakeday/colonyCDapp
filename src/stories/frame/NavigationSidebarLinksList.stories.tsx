import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import NavigationSidebarLinksList from '~v5/frame/NavigationSidebar/partials/NavigationSidebarLinksList';

const navigationSidebarLinksListMeta: Meta<typeof NavigationSidebarLinksList> =
  {
    title: 'Frame/Navigation Sidebar/Links List',
    component: NavigationSidebarLinksList,
    decorators: [
      (StoryContent) => (
        <MemoryRouter>
          <Routes>
            <Route path="/*" element={<StoryContent />} />
          </Routes>
        </MemoryRouter>
      ),
    ],
    parameters: {
      layout: 'padded',
    },
    args: {
      items: [
        {
          key: '1',
          label: 'Members',
          to: '/members',
          iconName: 'users-three',
        },
        {
          key: '2',
          label: 'Verified members',
          to: '/verified-members',
          iconName: 'seal-check',
          tagProps: {
            text: 'New',
            mode: 'new',
          },
        },
        {
          key: '3',
          label: 'Teams',
          to: '/teams',
          iconName: 'users-four',
          disabled: true,
          tagProps: {
            text: 'Coming soon',
          },
        },
      ],
    },
  };

export default navigationSidebarLinksListMeta;

export const Base: StoryObj<typeof NavigationSidebarLinksList> = {};
