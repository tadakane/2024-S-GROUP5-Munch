import { FontAwesome } from '@expo/vector-icons';
import { FC } from 'react';
import { Button, Paragraph, Tooltip } from 'tamagui';
import { IconNames } from './icons';

interface ButtonProps {
  iconName: IconNames;
  onPress: () => void;
}
const ButtonIcon: FC<ButtonProps> = ({ iconName, onPress }) => {
  return (
    <Tooltip placement='top-start'>
      <Tooltip.Trigger>
        <Button
          size={'$4'}
          circular
          animation={'bouncy'}
          icon={<FontAwesome name={iconName} size={25} />}
          display='flex'
          justifyContent='center'
          alignItems='center'
          onPress={onPress}
          pressStyle={{ scale: 0.4 }}
          unstyled
        />
      </Tooltip.Trigger>
      <Tooltip.Content
        enterStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
        scale={1}
        x={0}
        y={0}
        opacity={1}
        animation={['quick', { opacity: { overshootClamping: true } }]}
      >
        <Tooltip.Arrow />
        <Paragraph size='$2' lineHeight={'$1'}>
          Hello World
        </Paragraph>
      </Tooltip.Content>
    </Tooltip>
  );
};
export default ButtonIcon;
