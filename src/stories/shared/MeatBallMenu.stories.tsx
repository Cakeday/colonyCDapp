import type { Meta, StoryObj } from '@storybook/react';

import MeatBallMenu from '~v5/shared/MeatBallMenu';

const meatBallMenuMeta: Meta<typeof MeatBallMenu> = {
  title: 'Shared/Meat Ball Menu',
  component: MeatBallMenu,
  parameters: {
    layout: 'centered',
  },
};

export default meatBallMenuMeta;

export const Base: StoryObj<typeof MeatBallMenu> = {
  args: {
    items: [
      {
        label: 'Add token',
        iconName: 'coin-vertical',
        onClick: () => alert('Add token'),
      },
      {
        label: 'Duplicate row',
        iconName: 'copy-simple',
        onClick: () => alert('Duplicate row'),
      },
    ],
  },
};
