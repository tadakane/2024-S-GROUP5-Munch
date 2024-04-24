import { Subtitle } from '@/tamagui.config';
import { Byte, Recipe } from '@/types/post';
import { getDateDifference } from '@/utils/getCurrentDateTime';
import { isByte, isRecipe } from '@/utils/typeGuard';
import { Link, useRouter } from 'expo-router';
import React, { FC, useContext, useEffect, useRef, useState } from 'react';
import { Dimensions, Linking, Platform, SafeAreaView } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { Button, Image, Text, XStack, YStack } from 'tamagui';
import ButtonIcon from './ButtonIcon';
import DeletePostDialog from './DeletePostDialog';
import { EditPostDialog } from './EditPostDialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserContext } from '@/contexts/UserContext';
import { useAuth } from '@clerk/clerk-expo';
import axios from 'axios';
import { AntDesign } from '@expo/vector-icons';

interface PostProps {
  post: Byte | Recipe;
}

const Post: FC<PostProps> = ({ post }) => {
  const {
    author,
    comments,
    creation_date,
    description,
    likes,
    pictures,
    username,
    key,
  } = post;

  const byte = isByte(post) ? post : null;
  const recipe = isRecipe(post) ? post : null;
  const router = useRouter();
  const { height, width } = Dimensions.get('screen');

  const openMaps = async () => {
    const iosLink = `maps://0,0?q=${byte?.location}`;
    const androidLink = `geo:0,0?q=${byte?.location}`;
    Linking.openURL(Platform.OS === 'ios' ? iosLink : androidLink);
  };

  // Used to query and mutate
  const queryClient = useQueryClient();
  const { token, user_data } = useContext(UserContext);
  const { getToken, userId } = useAuth();
  const postId = key.split('/')[1];

  // Used to skip events on the first render
  const isFirstRender = useRef(false);
  useEffect(() => {
    isFirstRender.current = true;
  }, []);

  // Like button state
  const [liked, setLiked] = useState(user_data.likes.includes(key));
  // Only update the like count locally to reduce API calls
  const [localLikes, setLocalLikes] = useState(likes);

  // Data that will be passed in order to change the post's likes
  const likeData = {
    user_id: userId,
    post_id: postId,
  };
  // Get number of likes
  const getLikes = async () => {
    const response = await axios.get(
      `${process.env.EXPO_PUBLIC_IP_ADDR}/api/posts/${postId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data.likes;
  };
  const {
    data: likesCount,
    error: likesError,
    isLoading: likesLoading,
  } = useQuery({
    queryKey: ['likes'],
    queryFn: getLikes,
  });

  // Like/Unlike a post
  const {
    mutateAsync: changeLikes,
    isPending,
    data,
    error,
  } = useMutation({
    mutationFn: async () => {
      // Determine whether to like or unlike the post
      const likeAction = liked ? 'like' : 'unlike';

      // Status message to show the API call
      console.log(
        `${process.env.EXPO_PUBLIC_IP_ADDR}/api/users/${userId}/${likeAction}/${postId}`,
      );

      // Do the API call
      const response = await axios.patch(
        `${process.env.EXPO_PUBLIC_IP_ADDR}/api/users/${userId}/${likeAction}/${postId}`,
        likeData,
        {
          headers: { Authorization: `Bearer: ${await getToken()}` },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      // Update the local like count
      setLocalLikes(liked ? localLikes + 1 : localLikes - 1);
      // Update the like count
      //queryClient.invalidateQueries({ queryKey: ['likes'] });
    },
    // Show error message in console
    onError: () => {
      console.log('error:', error.message);
    },
  });

  // Helper to handle a like interaction
  useEffect(
    () => {
      // Do not run on the first render
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      // Status message
      liked
        ? console.log('Liking the post!')
        : console.log('Unliking the post!');
      changeLikes();
    },
    [liked], // effect only activates when liked is updated
  );

  // Handle user liking the post
  const handleLike = async () => {
    // Invert the like state
    setLiked(!liked);
    // Rest of handling done in useEffect
  };
  const handleBookmark = async () => {};
  const carouselConfig = {
    width: width,
    height: height / 1.5,
    vertical: false,
    mode: 'parallax',
    snapEnabled: true,
    modeConfig: {
      parallaxScrollingScale: 1,
      parallaxScrollingOffset: 50,
    },
  } as const;
  return (
    <SafeAreaView>
      <Carousel
        {...carouselConfig}
        data={pictures}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item, cache: 'force-cache' }}
            height={height / 1.5}
            borderRadius={'$2'}
          />
        )}
      />
      <YStack display='flex' rowGap={'$1'} marginBottom={'$10'}>
        {userId === author.split('/')[1] && (
          <XStack display='flex' justifyContent='space-around'>
            <EditPostDialog post={post} />
            <DeletePostDialog postId={postId} />
          </XStack>
        )}
        <XStack display='flex' justifyContent='center'>
          <XStack alignItems='center' justifyContent='space-evenly'>
            {/*Like*/}
            <Button
              size={'$4'}
              circular
              animation={'bouncy'}
              animateOnly={['transform']}
              icon={
                <AntDesign
                  size={22}
                  name={liked ? 'heart' : 'hearto'}
                  color={liked ? 'red' : 'black'}
                />
              }
              justifyContent='center'
              alignItems='center'
              onPress={handleLike}
              pressStyle={{ scale: 0.4 }}
              padding={10}
              unstyled
            />
            {/*Display number of likes*/}
            <Text>
              {likesLoading ? 'Loading' : likesError ? '-1' : localLikes}
            </Text>
          </XStack>
          {/*Comment*/}
          <ButtonIcon
            iconName='comment-o'
            onPress={() => {
              router.push('/(modals)/comments');
            }}
          />
          {/*Bookmark*/}
          <ButtonIcon iconName='bookmark-o' onPress={handleBookmark} />
          {/*Location*/}
          {byte?.location && <ButtonIcon iconName='map-o' onPress={openMaps} />}
        </XStack>
        {/*USER INFO*/}
        <YStack px={'$2.5'} gap={'$1'}>
          <XStack gap={'$2'} rowGap={'$5'}>
            <Link href={'/'}>
              <Text fontWeight={'800'}>{username}</Text>
            </Link>
            <Text>{description}</Text>
          </XStack>
          <Subtitle unstyled size={'$1'}>
            {getDateDifference(creation_date)}
          </Subtitle>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
};
export default Post;
