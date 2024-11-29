import { Image } from '@tamagui/image-next'
import { Text, YStack } from 'tamagui'
import { Feed } from '~/src/features/feed'


export function HomePage() {
  return <Feed />;

  //   <YStack bg="$color1" mih="100%" gap="$4" ai="center" jc="center" f={1}>
  // return (
  //     <Text fontSize={20}>Hello, world</Text>
  //   </YStack>
  // )
}
