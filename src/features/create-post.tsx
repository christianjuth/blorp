import { ContentGutters } from "../components/gutters";
import { useRecentCommunitiesStore } from "../stores/recent-communities";
import { useCallback, useId, useState } from "react";
import { useCreatePostStore } from "../stores/create-post";
import { FlashList } from "@/src/components/flashlist";
import { CommunityCard } from "../components/communities/community-card";
import {
  useCreatePost,
  useListCommunities,
  useSearch,
  useUploadImage,
} from "../lib/lemmy";
import _ from "lodash";
import { Community } from "lemmy-js-client";
import { parseOgData } from "../lib/html-parsing";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { MarkdownEditor } from "../components/markdown/editor";
import { Button } from "../components/ui/button";
import { close } from "ionicons/icons";
import { FaCheck, FaChevronDown } from "react-icons/fa6";
import { LuLoaderCircle } from "react-icons/lu";
import { Input } from "../components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { useDropzone } from "react-dropzone";
import { UserDropdown } from "../components/nav";
import { Skeleton } from "../components/ui/skeleton";
import { FaRegImage } from "react-icons/fa6";
import { Label } from "@/src/components/ui/label";

const EMPTY_ARR = [];

export default function CreatePost() {
  const id = useId();

  const uploadImage = useUploadImage();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (files.length > 0) {
        uploadImage
          .mutateAsync({ image: files[0] })
          .then((res) => {
            console.log(res);
            setThumbnailUrl(res.url);
          })
          .catch((err) => console.log(err));
      }
    },
  });

  const [chooseCommunity, setChooseCommunity] = useState(false);

  const community = useCreatePostStore((s) => s.community);

  // const editorKey = useCreatePostStore((s) => s.key);

  const reset = useCreatePostStore((s) => s.reset);

  const type = useCreatePostStore((s) => s.type);
  const setType = useCreatePostStore((s) => s.setType);

  const title = useCreatePostStore((s) => s.title);
  const setTitle = useCreatePostStore((s) => s.setTitle);

  const url = useCreatePostStore((s) => s.url);
  const setUrl = useCreatePostStore((s) => s.setUrl);

  const content = useCreatePostStore((s) => s.content);
  const setContent = useCreatePostStore((s) => s.setContent);

  const thumbnailUrl = useCreatePostStore((s) => s.thumbnailUrl);
  const setThumbnailUrl = useCreatePostStore((s) => s.setThumbnailUrl);

  const createPost = useCreatePost();

  const parseUrl = (url: string) => {
    if (url) {
      try {
        fetch(url)
          .then((res) => res.text())
          .then((body) => {
            const ogData = parseOgData(body);

            if (!title && ogData.title) {
              setTitle(ogData.title);
            }

            if (ogData.image) {
              setThumbnailUrl(ogData.image);
            }
          });
      } catch {}
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Create post</IonTitle>

          <IonButtons slot="end" className="md:gap-4 gap-3.5">
            <Button
              size="sm"
              onClick={() => {
                if (!community) {
                  setChooseCommunity(true);
                } else {
                  createPost
                    .mutateAsync({
                      name: title,
                      community_id: community.id,
                      body: content,
                      url: type === "media" ? thumbnailUrl : url || undefined,
                      custom_thumbnail: thumbnailUrl,
                    })
                    .then(() => reset());
                }
              }}
              disabled={!community}
            >
              Post
              {createPost.isPending && (
                <LuLoaderCircle className="animate-spin" />
              )}
            </Button>
            <UserDropdown />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <ChooseCommunity
          isOpen={chooseCommunity}
          closeModal={() => setChooseCommunity(false)}
        />

        <ContentGutters className="h-full">
          <div className="flex flex-col py-4 gap-5">
            {
              <button
                onClick={() => setChooseCommunity(true)}
                className="flex flex-row items-center gap-2 h-9 self-start"
              >
                {community ? (
                  <CommunityCard communityView={community} disableLink />
                ) : (
                  <span className="font-bold">Select a community</span>
                )}
                <FaChevronDown className="text-brand" />
              </button>
            }

            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={type}
              onValueChange={(val) =>
                val && setType(val as "text" | "media" | "link")
              }
            >
              <ToggleGroupItem value="text">Text</ToggleGroupItem>
              <ToggleGroupItem value="media">Image</ToggleGroupItem>
              <ToggleGroupItem value="link">Link</ToggleGroupItem>
            </ToggleGroup>

            {type === "link" && (
              <div className="gap-2 flex flex-col">
                <Label htmlFor={`${id}-link`}>Link</Label>
                <Input
                  id={`${id}-link`}
                  placeholder="Link"
                  className="border-b border-border"
                  value={url ?? ""}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={() => url && parseUrl(url)}
                />
              </div>
            )}

            {type === "media" && (
              <div className="gap-2 flex flex-col">
                <Label htmlFor={`${id}-media`}>Image</Label>
                <div
                  {...getRootProps()}
                  className="border-2 border-dashed flex flex-col items-center justify-center gap-2 p-2 cursor-pointer rounded-md min-h-32"
                >
                  <input id={`${id}-media`} {...getInputProps()} />
                  {thumbnailUrl && !uploadImage.isPending && (
                    <img src={thumbnailUrl} className="h-40 rounded-md" />
                  )}
                  {uploadImage.isPending && (
                    <Skeleton className="h-40 aspect-square flex items-center justify-center">
                      <FaRegImage className="text-muted-foreground text-4xl" />
                    </Skeleton>
                  )}
                  {isDragActive ? (
                    <p>Drop the files here ...</p>
                  ) : (
                    <p className="text-muted-foreground">
                      Drop or upload image here
                      {thumbnailUrl && " to replace"}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="gap-2 flex flex-col">
              <Label htmlFor={`${id}-title`}>Title</Label>
              <Input
                id={`${id}-title`}
                placeholder="Title"
                value={title}
                onInput={(e) => setTitle(e.currentTarget.value ?? "")}
              />
            </div>

            <div className="gap-2 flex flex-col">
              <Label htmlFor={`${id}-body`}>Body</Label>
              <MarkdownEditor
                id={`${id}-body`}
                content={content}
                onChange={setContent}
                className="border rounded-lg shadow-xs"
                placeholder="Write something..."
              />
            </div>
          </div>
          <></>
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}

function ChooseCommunity({
  isOpen,
  closeModal,
}: {
  isOpen: boolean;
  closeModal: () => void;
}) {
  const recentCommunities = useRecentCommunitiesStore();

  const [search, setSearch] = useState("");
  const debouncedSetSearch = useCallback(_.debounce(setSearch, 500), []);

  const selectedCommunity = useCreatePostStore((s) => s.community);

  const setCommunity = useCreatePostStore((s) => s.setCommunity);

  const subscribedCommunitiesRes = useListCommunities({
    type_: "Subscribed",
    limit: 50,
  });
  const subscribedCommunities =
    subscribedCommunitiesRes.data?.pages
      .flatMap((p) => p.communities)
      .sort((a, b) => a.community.name.localeCompare(b.community.name))
      .map(({ community }) => community) ?? EMPTY_ARR;

  const searchResultsRes = useSearch({
    q: search,
    type_: "Communities",
    sort: "TopAll",
  });

  const searchResultsCommunities =
    searchResultsRes.data?.pages.flatMap((p) =>
      p.communities.map(({ community }) => community),
    ) ?? EMPTY_ARR;

  let data: (
    | Pick<Community, "name" | "id" | "title" | "icon" | "actor_id">
    | "Selected"
    | "Recent"
    | "Subscribed"
    | "Search results"
  )[] = [
    "Recent",
    ...recentCommunities.recentlyVisited.slice(0, 5),
    "Subscribed",
    ...subscribedCommunities,
  ];

  if (search) {
    data = ["Search results", ...searchResultsCommunities];
  }
  if (selectedCommunity) {
    data = ["Selected", selectedCommunity, ...data];
  }

  data = _.uniqBy(data, (item) => {
    if (typeof item === "string") {
      return item;
    }
    return item.actor_id;
  });

  return (
    <IonModal isOpen={isOpen} onWillDismiss={closeModal}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={closeModal}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>

          <IonTitle>Choose Community</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent scrollY={false}>
        <FlashList
          className="h-full"
          data={data}
          stickyHeaderIndices={[0]}
          header={
            <ContentGutters className="bg-background">
              <div className="border-b-[.5px] py-2">
                <Input
                  placeholder="Search communities"
                  value={search}
                  onChange={(e) => debouncedSetSearch(e.target.value)}
                />
              </div>
            </ContentGutters>
          }
          renderItem={({ item }) => {
            if (typeof item === "string") {
              return (
                <ContentGutters className="py-2">
                  <span className="text-muted-foreground text-sm">{item}</span>
                </ContentGutters>
              );
            }

            return (
              <ContentGutters className="cursor-pointer">
                <button
                  onClick={() => {
                    setCommunity(item);
                    closeModal();
                  }}
                  className="flex flex-row items-center gap-2"
                >
                  <CommunityCard communityView={item} disableLink />
                  {selectedCommunity &&
                    item.actor_id === selectedCommunity?.actor_id && (
                      <FaCheck className="text-brand" />
                    )}
                </button>
              </ContentGutters>
            );
          }}
          estimatedItemSize={50}
        />
      </IonContent>
    </IonModal>
  );
}
