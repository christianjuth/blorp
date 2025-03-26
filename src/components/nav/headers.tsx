import {
  CommentSortSelect,
  // CommunityFilter,
  // CommunitySortSelect,
  // HomeFilter,
  // PostSortBar,
} from "../lemmy-sort";
// import {
//   ChevronLeft,
//   X,
//   User,
//   LogOut,
//   ChevronDown,
//   ChevronUp,
//   PlusCircle,
//   Search,
//   Bookmark,
// } from "@tamagui/lucide-icons";
import { useState } from "react";
import { useLinkContext } from "./link-context";
import { parseAccountInfo, useAuth } from "~/src/stores/auth";
import { useRequireAuth } from "../auth-context";
import { Dropdown } from "../ui/dropdown";
import {
  useCreatePost,
  useLogout,
  useMostRecentPost,
  usePosts,
} from "~/src/lib/lemmy/index";
import { useCreatePostStore } from "~/src/stores/create-post";
import * as React from "react";
import { encodeApId } from "~/src/lib/lemmy/utils";
import { useFiltersStore } from "~/src/stores/filters";
import { scrollToTop } from "~/src/features/home-feed";

import { IonButton, IonHeader, IonToolbar, useIonRouter } from "@ionic/react";

const EMPTY_ARR = [];

interface HeaderGuttersProps {
  darkBackground?: boolean;
}

function HeaderGutters({
  // darkBackground,
  children,
  ...props
}: React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>) {
  // const { height, insetTop } = useCustomHeaderHeight();

  const [first, second, third] = React.Children.toArray(children);

  return (
    <IonHeader>
      <IonToolbar>
        <div
          className="max-w-[1050px] w-full flex flex-row mx-auto gap-5 md:px-4"
          // pt={insetTop}
          // h={height - 0.5}
          // bbw={0.5}
          // bbc={darkBackground ? "#02024E" : "$color3"}
          // bg={darkBackground ? "#02024E" : "$background"}
          // {...props}
          // $theme-dark={{
          //   bg: "$background",
          //   bbc: "$color3",
          //   ...props["$theme-dark"],
          // }}
          // $gtMd={{
          //   h: height - 1,
          //   bbw: 1,
          //   bg: "$background",
          //   bbc: "$color3",
          //   ...props.$gtMd,
          // }}
          data-tauri-drag-region
        >
          <div
            // flex={1}
            // maxWidth={1050}
            // w="100%"
            // mx="auto"
            // gap="$3"
            // px="$3"
            // ai="center"
            // $gtMd={{ px: "$4" }}
            // $gtLg={{ px: "$5" }}
            data-tauri-drag-region
          >
            <div
              // ai="center"
              // gap="$3"
              // $gtMd={{ flex: 1, gap: "$4" }}
              data-tauri-drag-region
            >
              {first}
            </div>

            <div
              // flex={1}
              // ai="center"
              // $gtMd={{ jc: "center" }}
              data-tauri-drag-region
            >
              {second}
            </div>

            <div
              // jc="flex-end"
              // ai="center"
              // gap="$3"
              // $gtMd={{ flex: 1, gap: "$4" }}
              data-tauri-drag-region
            >
              {third}
            </div>
          </div>
        </div>
      </IonToolbar>
    </IonHeader>
  );
}

const MemoedUserAvatar = React.memo(UserAvatar);

function UserAvatar() {
  const linkCtx = useLinkContext();
  const logout = useLogout();
  const requireAuth = useRequireAuth();

  const isLoggedIn = useAuth((s) => s.isLoggedIn());
  const selectedAccount = useAuth((s) => s.getSelectedAccount());
  const accounts = useAuth((s) => s.accounts);
  const setAccountIndex = useAuth((s) => s.setAccountIndex);

  const { person, instance } = parseAccountInfo(selectedAccount);

  const [accountSwitcher, setAccountSwitcher] = useState(false);

  if (!isLoggedIn && accounts.length === 1) {
    return (
      <IonButton
        // br="$12" size="$3"
        onClick={() => requireAuth()}
        size="small"
      >
        Login
      </IonButton>
    );
  }

  return null;

  // return (
  //   <Dropdown
  //     placement="bottom-end"
  //     trigger={
  //       <Avatar size="$2.5">
  //         <Avatar.Image src={person?.avatar} borderRadius="$12" />
  //         <Avatar.Fallback
  //           backgroundColor="$color8"
  //           borderRadius="$12"
  //           ai="center"
  //           jc="center"
  //         >
  //           {person ? (
  //             <Text fontSize="$3">
  //               {person.name?.substring(0, 1).toUpperCase()}
  //             </Text>
  //           ) : (
  //             <User size="$1" />
  //           )}
  //         </Avatar.Fallback>
  //       </Avatar>
  //     }
  //     onOpenChange={() => setAccountSwitcher(false)}
  //   >
  //     {({ close }) => (
  //       <YStack minWidth={250}>
  //         <YStack ai="center" bbw={1} bbc="$color6" py="$2.5" gap="$2">
  //           <Avatar size="$5">
  //             <Avatar.Image src={person?.avatar} borderRadius="$12" />
  //             <Avatar.Fallback
  //               backgroundColor="$color8"
  //               borderRadius={99999}
  //               ai="center"
  //               jc="center"
  //             >
  //               {person ? (
  //                 <Text fontSize="$5">
  //                   {person.name?.substring(0, 1).toUpperCase()}
  //                 </Text>
  //               ) : (
  //                 <User size="$2" />
  //               )}
  //             </Avatar.Fallback>
  //           </Avatar>
  //           <XStack
  //             onPress={() => setAccountSwitcher((b) => !b)}
  //             tag="button"
  //             ai="center"
  //             gap="$1"
  //             pl="$4.5"
  //           >
  //             <YStack ai="center">
  //               <Text fontSize="$4">
  //                 {person?.display_name ?? person?.name}
  //               </Text>
  //               <Text fontSize="$3" col="$color10">
  //                 {instance}
  //               </Text>
  //             </YStack>
  //             {accountSwitcher ? (
  //               <ChevronUp size="$1" col="$accentColor" />
  //             ) : (
  //               <ChevronDown size="$1" col="$accentColor" />
  //             )}
  //           </XStack>
  //         </YStack>
  //         <YStack py="$1.5">
  //           {accountSwitcher ? (
  //             <>
  //               {accounts.map((a, index) => {
  //                 const { person, instance } = parseAccountInfo(a);
  //                 return (
  //                   <XStack
  //                     py="$1.5"
  //                     tag="button"
  //                     ai="center"
  //                     px="$2.5"
  //                     gap="$2.5"
  //                     onPress={() => {
  //                       close();
  //                       setAccountIndex(index);
  //                     }}
  //                     key={instance + index}
  //                   >
  //                     <Avatar size="$2.5">
  //                       <Avatar.Image src={person?.avatar} borderRadius="$12" />
  //                       <Avatar.Fallback
  //                         backgroundColor="$color8"
  //                         borderRadius="$12"
  //                         ai="center"
  //                         jc="center"
  //                       >
  //                         {person ? (
  //                           <Text fontSize="$4">
  //                             {person.name?.substring(0, 1).toUpperCase()}
  //                           </Text>
  //                         ) : (
  //                           <User size="$1" />
  //                         )}
  //                       </Avatar.Fallback>
  //                     </Avatar>
  //                     <YStack ai="flex-start">
  //                       <Text fontSize="$4">
  //                         {person?.display_name ?? person?.name}
  //                       </Text>
  //                       <Text fontSize="$3" col="$color11">
  //                         {instance}
  //                       </Text>
  //                     </YStack>
  //                   </XStack>
  //                 );
  //               })}

  //               <XStack
  //                 py="$2"
  //                 tag="button"
  //                 ai="center"
  //                 px="$2.5"
  //                 gap="$2.5"
  //                 onPress={() => {
  //                   close();
  //                   requireAuth({ addAccount: true });
  //                 }}
  //               >
  //                 <PlusCircle size="$2" px="$1" col="$color9" />
  //                 <Text fontSize="$4" col="$color10">
  //                   Add account
  //                 </Text>
  //               </XStack>
  //             </>
  //           ) : (
  //             <>
  //               {isLoggedIn && (
  //                 <Link href={`${linkCtx.root}saved`} push asChild>
  //                   <XStack
  //                     py="$2"
  //                     tag="a"
  //                     ai="center"
  //                     px="$2.5"
  //                     gap="$2.5"
  //                     onPress={close}
  //                   >
  //                     <Bookmark size="$1.5" col="$color10" />
  //                     <Text>Saved</Text>
  //                   </XStack>
  //                 </Link>
  //               )}

  //               {person && (
  //                 <Link
  //                   href={`${linkCtx.root}u/${encodeApId(person.actor_id)}`}
  //                   push
  //                   asChild
  //                 >
  //                   <XStack
  //                     py="$2"
  //                     tag="a"
  //                     ai="center"
  //                     px="$2.5"
  //                     gap="$2.5"
  //                     onPress={close}
  //                   >
  //                     <User size="$1.5" col="$color10" />
  //                     <Text>Profile</Text>
  //                   </XStack>
  //                 </Link>
  //               )}

  //               <XStack
  //                 py="$2"
  //                 ai="center"
  //                 px="$2.5"
  //                 gap="$2.5"
  //                 bg="transparent"
  //                 tag="button"
  //                 bw={0}
  //                 onPress={() => {
  //                   logout();
  //                   close();
  //                 }}
  //               >
  //                 <LogOut size="$1.5" col="$color10" />
  //                 <Text>Logout</Text>
  //               </XStack>
  //             </>
  //           )}
  //         </YStack>
  //       </YStack>
  //     )}
  //   </Dropdown>
  // );
}

function NavbarRightSide({ children }: { children?: React.ReactNode }) {
  return (
    <>
      {children}
      <MemoedUserAvatar />
    </>
  );
}

function SearchBar({
  defaultValue,
  hideOnMd,
}: {
  defaultValue?: string;
  hideOnMd?: boolean;
}) {
  const linkCtx = useLinkContext();
  // const router = useRouter();
  const [search, setSearch] = useState(defaultValue ?? "");

  return null;

  // return (
  //   <Input
  //     bg="$color3"
  //     bw={0}
  //     $gtMd={{
  //       opacity: 0.7,
  //     }}
  //     br="$12"
  //     h="$3"
  //     bc="$color3"
  //     placeholder={`Search`}
  //     flex={1}
  //     value={search}
  //     onChangeText={setSearch}
  //     onSubmitEditing={() => {
  //       if (linkCtx.root !== "/inbox/") {
  //         router.push(`${linkCtx.root}s/${search}`);
  //       }
  //     }}
  //     $md={{
  //       display: hideOnMd ? "none" : "flex",
  //     }}
  //   />
  // );
}

export function HomeHeader() {
  const postSort = useFiltersStore((s) => s.postSort);
  const listingType = useFiltersStore((s) => s.listingType);

  const posts = usePosts({
    limit: 50,
    sort: postSort,
    type_: listingType,
  });

  const mostRecentPost = useMostRecentPost({
    limit: 50,
    sort: postSort,
    type_: listingType,
  });

  const data = posts.data?.pages.flatMap((res) => res.posts) ?? EMPTY_ARR;
  const hasNewPost = data[0] && mostRecentPost?.data?.post.ap_id !== data[0];

  return (
    <HeaderGutters>
      {/* <HomeFilter /> */}
      <SearchBar hideOnMd />
      <>
        {/* {hasNewPost && ( */}
        {/*   <RefreshButton */}
        {/*     hideOnGtMd */}
        {/*     onPress={() => { */}
        {/*       scrollToTop.current.scrollToOffset(); */}
        {/*       posts.refetch(); */}
        {/*     }} */}
        {/*   /> */}
        {/* )} */}
        {/* <PostSortBar hideOnGtMd /> */}
        <NavbarRightSide />
      </>
    </HeaderGutters>
  );
}

function BackButton({ onPress }: { onPress?: () => any }) {
  const router = useIonRouter();
  const linkCtx = useLinkContext();

  if (!onPress) {
    onPress = () => {
      router.goBack();
      // router.replace(linkCtx.root);
    };
  }

  return (
    <button
    // unstyled
    // p={2}
    // px={0}
    // bg="transparent"
    // borderRadius="$12"
    // dsp="flex"
    // fd="row"
    // ai="center"
    // bw={0}
    // onPress={onPress}
    // h="auto"
    // w="auto"
    // mx={-7}
    >
      Back
      {/* <ChevronLeft color="$accentColor" size="$2" /> */}
    </button>
  );
}

export function SavedPostsHeader() {
  return (
    <HeaderGutters>
      {/* <BackButton */}
      {/*   onPress={ */}
      {/*     "back" in props && props.back */}
      {/*       ? () => props.navigation.pop(1) */}
      {/*       : undefined */}
      {/*   } */}
      {/* /> */}

      <span>Saved</span>

      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function CommunityHeader() {
  const linkCtx = useLinkContext();

  // const params = props.route.params;
  // const communityName =
  //   params &&
  //   "communityName" in params &&
  //   typeof params.communityName === "string"
  //     ? params.communityName
  //     : undefined;

  // const initSearch =
  //   params && "search" in params && typeof params.search === "string"
  //     ? params.search
  //     : undefined;
  //

  const initSearch = "";

  const [search, setSearch] = useState(initSearch);

  return (
    <HeaderGutters>
      {/* <BackButton */}
      {/*   onPress={ */}
      {/*     "back" in props && props.back */}
      {/*       ? () => props.navigation.pop(1) */}
      {/*       : undefined */}
      {/*   } */}
      {/* /> */}

      <>
        <input
        // bg="$color3"
        // br="$12"
        // h="$3"
        // bc="$color3"
        // placeholder={`Search ${communityName}`}
        // flex={1}
        // maxWidth={500}
        // value={search}
        // onChangeText={setSearch}
        // onSubmitEditing={() => {
        //   router.push(`${linkCtx.root}c/${communityName}/s/${search}`);
        // }}
        />
        <span
        // col="white" fontSize="$5" fontWeight="bold"
        >
          Community
          {/* {communityName} */}
        </span>
      </>

      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function SearchHeader() {
  // const params = props.route.params;
  // const initSearch =
  //   params && "search" in params && typeof params.search === "string"
  //     ? params.search
  //     : undefined;

  const initSearch = "";

  return (
    <HeaderGutters
    // $md={{ bbc: "transparent", bbw: 0 }}
    >
      <>
        <button
        // unstyled
        // p={0}
        // bg="transparent"
        // borderRadius="$12"
        // dsp="flex"
        // fd="row"
        // ai="center"
        // bw={0}
        // onPress={() => props.navigation.pop(1)}
        // h="auto"
        >
          back
          {/* <ChevronLeft color="$accentColor" size="$1.5" /> */}
        </button>
      </>
      <SearchBar defaultValue={initSearch} />
      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function CommunitiesHeader() {
  return (
    <HeaderGutters>
      {/* <CommunityFilter /> */}
      <SearchBar />
      <NavbarRightSide>{/* <CommunitySortSelect /> */}</NavbarRightSide>
    </HeaderGutters>
  );
}

export function UserHeader() {
  return (
    <HeaderGutters>
      <>
        <button
        // unstyled
        // p={2}
        // bg="transparent"
        // borderRadius="$12"
        // dsp="flex"
        // fd="row"
        // ai="center"
        // bw={0}
        // onPress={() => props.navigation.pop(1)}
        // h="auto"
        >
          back
          {/* <ChevronLeft color="$accentColor" size="$2" /> */}
        </button>
      </>
      <span
      // fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative"
      >
        User
        {/* {props.options.title} */}
      </span>
      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function PostHeader() {
  // const params = props.route.params;
  // const communityName =
  //   params &&
  //   "communityName" in params &&
  //   typeof params.communityName === "string"
  //     ? params.communityName
  //     : undefined;

  return (
    <HeaderGutters>
      {/* <BackButton */}
      {/*   onPress={ */}
      {/*     "back" in props && props.back */}
      {/*       ? () => props.navigation.pop(1) */}
      {/*       : undefined */}
      {/*   } */}
      {/* /> */}
      <span
      // fontWeight="bold"
      // fontSize="$5"
      // overflow="hidden"
      // pos="relative"
      // numberOfLines={1}
      // col="white"
      >
        Community
        {/* {communityName} */}
      </span>
      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function ModalHeader() {
  return (
    <div
    // bg="$background"
    // bbc={BBC}
    // bbw={BBW}
    // btw={0}
    // btc="transparent"
    // w="unset"
    // px="$3"
    // ai="center"
    // pt={insetTop}
    // h={height - BBW}
    >
      <div
      // flex={1} flexBasis={0} ai="flex-start"
      >
        <button
        // unstyled
        // p={0}
        // bg="transparent"
        // dsp="flex"
        // fd="row"
        // ai="center"
        // bw={0}
        // onPress={props.navigation.goBack}
        // h="auto"
        >
          close
          {/* <X color="$accentColor" /> */}
        </button>
      </div>
      <span
      // fontWeight="bold" fontSize="$5" overflow="hidden"
      >
        Modal
        {/* {props.options.title} */}
      </span>
      {/* <View flex={1} flexBasis={0} ai="flex-end"></View> */}
    </div>
  );
}

export function StackHeader() {
  return (
    <HeaderGutters>
      <>
        <button
        // unstyled
        // p={2}
        // bg="transparent"
        // borderRadius="$12"
        // dsp="flex"
        // fd="row"
        // ai="center"
        // bw={0}
        // onPress={() => props.navigation.pop(1)}
        // h="auto"
        >
          back
          {/* <ChevronLeft color="$accentColor" size="$2" /> */}
        </button>

        <span
        // fontWeight={900} fontSize="$5" overflow="hidden" pos="relative"
        >
          Stack
          {/* {props.options.title ?? props.route.name} */}
        </span>
      </>

      <></>

      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function BottomTabBarHeader() {
  return (
    <HeaderGutters>
      <>
        <button
        // unstyled
        // p={2}
        // bg="transparent"
        // borderRadius="$12"
        // dsp="flex"
        // fd="row"
        // ai="center"
        // bw={0}
        // onPress={() => props.navigation.goBack()}
        // h="auto"
        >
          back
          {/* <ChevronLeft color="$accentColor" size="$2" /> */}
        </button>

        <span
        // fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative"
        >
          Bottom tab bar
          {/* {props.options.title ?? props.route.name} */}
        </span>
      </>
      <></>
      <NavbarRightSide />
    </HeaderGutters>
  );
}

export function CreatePostHeaderStepOne() {
  const selectedCommunity = useCreatePostStore((s) => s.community);
  const isPostReady = useCreatePostStore(
    (s) => s.community && s.title.length > 0 && s.content.length > 0,
  );
  const createPost = useCreatePost();
  const reset = useCreatePostStore((s) => s.reset);
  const title = useCreatePostStore((s) => s.title);
  const content = useCreatePostStore((s) => s.content);
  const url = useCreatePostStore((s) => s.url);

  return (
    <HeaderGutters>
      <>
        <button
        // unstyled
        // p={2}
        // bg="transparent"
        // borderRadius="$12"
        // dsp="flex"
        // fd="row"
        // ai="center"
        // bw={0}
        // onPress={() => props.navigation.goBack()}
        // h="auto"
        >
          close
          {/* <X color="$accentColor" size="$2" /> */}
        </button>
      </>
      <span
      // fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative"
      >
        Title
        {/* {props.options.title ?? props.route.name} */}
      </span>
      {selectedCommunity ? (
        <button
        // bg={isPostReady ? "$accentColor" : "$color3"}
        // br="$12"
        // size="$3"
        // onPress={() => {
        //   createPost
        //     .mutateAsync({
        //       community_id: selectedCommunity.id,
        //       name: title,
        //       body: content ? content : undefined,
        //       url: url ? url : undefined,
        //     })
        //     .then(() => {
        //       reset();
        //     });
        // }}
        // disabled={!isPostReady || createPost.isPending}
        >
          Post
        </button>
      ) : (
        // Web seems to erase stack history on page reload,
        // so replace works better on web, but on native
        // it negativly impacts the modal animation
        // so we replace on web and push on native
        // <Link href="/create/choose-community" asChild replace={isWeb}>
        <button
        // bg="$accentColor" br="$12" size="$3"
        >
          Next
        </button>
        // </Link>
      )}
    </HeaderGutters>
  );
}

export function CreatePostHeaderStepTwo() {
  return (
    <HeaderGutters>
      <>
        <button
        // unstyled
        // p={2}
        // bg="transparent"
        // borderRadius="$12"
        // dsp="flex"
        // fd="row"
        // ai="center"
        // bw={0}
        // onPress={() => {
        //   // Web seems to erase stack history on page reload,
        //   // so replace works better on web, but on native
        //   // it negativly impacts the modal animation
        //   // so we replace on web and pop on native
        //   // if (isWeb) {
        //   //   router.replace("/create");
        //   // } else {
        //   //   props.navigation.goBack();
        //   // }
        // }}
        // h="auto"
        >
          close
          {/* <X color="$accentColor" size="$2" /> */}
        </button>
      </>
      <span
      // fontWeight="bold" fontSize="$5" overflow="hidden" pos="relative"
      >
        Create post step 2{/* {props.options.title ?? props.route.name} */}
      </span>
    </HeaderGutters>
  );
}

export function SettingsHeader() {
  return (
    <HeaderGutters>
      <span
      // fontWeight={900} fontSize="$5" overflow="hidden" pos="relative"
      >
        Settings
      </span>
      <></>
      <NavbarRightSide />
    </HeaderGutters>
  );
}
