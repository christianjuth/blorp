import { ContentGutters } from "../components/gutters";
import { useRecentCommunitiesStore } from "../stores/recent-communities";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Draft, NEW_DRAFT, useCreatePostStore } from "../stores/create-post";
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
  IonModal,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonAlert,
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
import { cn } from "../lib/utils";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Link } from "react-router-dom";
import { v4 as uuid, validate as validateUuid } from "uuid";
import { MdDelete } from "react-icons/md";
import { useMedia, useUrlSearchState } from "../lib/hooks";
import { createSlug } from "../lib/lemmy/utils";
import { RelativeTime } from "../components/relative-time";
import { Deferred } from "../lib/deferred";

dayjs.extend(localizedFormat);

const EMPTY_ARR = [];

function DraftsSidebar({
  createPostId,
  onClickDraft,
}: {
  createPostId: string;
  onClickDraft: () => void;
}) {
  const [alrt] = useIonAlert();
  const drafts = useCreatePostStore((s) => s.drafts);
  const deleteDraft = useCreatePostStore((s) => s.deleteDraft);
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-bold">Other Drafts</h2>
      {_.entries(drafts)
        .filter(([key]) => key !== createPostId)
        .sort(([_a, a], [_b, b]) => b.createdAt - a.createdAt)
        .map(([key, draft]) => {
          const slug = draft.community
            ? createSlug(draft.community)?.slug
            : undefined;
          return (
            <div key={key} className="relative">
              <Link
                to={`/create?id=${key}`}
                className="bg-muted border px-3 py-2 gap-1 rounded-lg flex flex-col"
                onClickCapture={onClickDraft}
              >
                <div className="text-muted-foreground flex flex-row items-center text-sm gap-1 pr-3.5">
                  <RelativeTime time={draft.createdAt} />
                  {slug && (
                    <>
                      <span>•</span>
                      <span className="flex-1 overflow-hidden text-ellipsis">
                        {slug}
                      </span>
                    </>
                  )}
                </div>
                <span
                  className={cn(
                    "font-medium line-clamp-1",
                    !draft.name && "italic",
                  )}
                >
                  {draft.name || "Untitiled"}
                </span>
              </Link>
              <button
                className="absolute top-2 right-2 text-destructive text-xl"
                onClick={async () => {
                  try {
                    const deferred = new Deferred();
                    alrt({
                      message: "Delete draft",
                      buttons: [
                        {
                          text: "Cancel",
                          role: "cancel",
                          handler: () => deferred.reject(),
                        },
                        {
                          text: "OK",
                          role: "confirm",
                          handler: () => deferred.resolve(),
                        },
                      ],
                    });
                    await deferred.promise;
                    deleteDraft(key);
                  } catch {}
                }}
              >
                <MdDelete />
              </button>
            </div>
          );
        })}
    </div>
  );
}

export function CreatePost() {
  const [showDrafts, setShowDrafts] = useState(false);
  const media = useMedia();
  const [createPostId] = useUrlSearchState("id", uuid());
  const id = useId();

  useEffect(() => {
    if (media.md) {
      setShowDrafts(false);
    }
  }, [media.md]);

  const post = useCreatePostStore((s) => s.drafts[createPostId]) ?? NEW_DRAFT;
  const patchPost = useCreatePostStore((s) => s.updateDraft);
  const deleteDraft = useCreatePostStore((s) => s.deleteDraft);

  const uploadImage = useUploadImage();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (files.length > 0) {
        uploadImage
          .mutateAsync({ image: files[0] })
          .then((res) => {
            console.log(res);
            patchPost(createPostId, {
              url: res.url,
            });
          })
          .catch((err) => console.log(err));
      }
    },
  });

  const [chooseCommunity, setChooseCommunity] = useState(false);

  const createPost = useCreatePost();

  const parseUrl = (url: string) => {
    if (url) {
      try {
        fetch(url)
          .then((res) => res.text())
          .then((body) => {
            const ogData = parseOgData(body);
            const patch: Partial<Draft> = {};
            if (!post.name && ogData.title) {
              patch.name = ogData.title;
            }
            if (ogData.image) {
              patch.custom_thumbnail = ogData.image;
            }
            patchPost(createPostId, patch);
          });
      } catch {}
    }
  };

  if (!validateUuid(createPostId)) {
    return null;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start" className="md:gap-4 gap-3.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowDrafts((s) => !s)}
              className="md:hidden"
            >
              {showDrafts ? "Back" : "Other Drafts"}
            </Button>
          </IonButtons>

          <IonTitle>Create post</IonTitle>

          <IonButtons slot="end" className="md:gap-4 gap-3.5">
            <Button
              size="sm"
              className={cn(showDrafts && "max-md:hidden")}
              onClick={() => {
                if (post.community) {
                  createPost
                    .mutateAsync({
                      name: post.name,
                      community_id: post.community.id,
                      body: post.body,
                      url:
                        post.type === "media"
                          ? post.custom_thumbnail
                          : post.url || undefined,
                      custom_thumbnail: post.custom_thumbnail,
                    })
                    .then(() => deleteDraft(createPostId));
                }
              }}
              disabled={!post.community}
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
          createPostId={createPostId}
          isOpen={chooseCommunity}
          closeModal={() => setChooseCommunity(false)}
        />

        <ContentGutters className="h-full py-4">
          {media.maxMd && showDrafts ? (
            <DraftsSidebar
              createPostId={createPostId}
              onClickDraft={() => setShowDrafts(false)}
            />
          ) : (
            <div className="flex flex-col gap-5">
              <button
                onClick={() => setChooseCommunity(true)}
                className="flex flex-row items-center gap-2 h-9 self-start"
              >
                {post.community ? (
                  <CommunityCard communityView={post.community} disableLink />
                ) : (
                  <span className="font-bold">Select a community</span>
                )}
                <FaChevronDown className="text-brand" />
              </button>

              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={post.type}
                onValueChange={(val) => {
                  if (val) {
                    patchPost(createPostId, {
                      type: val as "text" | "media" | "link",
                    });
                  }
                }}
              >
                <ToggleGroupItem value="text">Text</ToggleGroupItem>
                <ToggleGroupItem value="media">Image</ToggleGroupItem>
                <ToggleGroupItem value="link">Link</ToggleGroupItem>
              </ToggleGroup>

              {post.type === "link" && (
                <div className="gap-2 flex flex-col">
                  <Label htmlFor={`${id}-link`}>Link</Label>
                  <Input
                    id={`${id}-link`}
                    placeholder="Link"
                    className="border-b border-border"
                    value={post.url ?? ""}
                    onChange={(e) =>
                      patchPost(createPostId, { url: e.target.value })
                    }
                    onBlur={() => post.url && parseUrl(post.url)}
                  />
                </div>
              )}

              {post.type === "media" && (
                <div className="gap-2 flex flex-col">
                  <Label htmlFor={`${id}-media`}>Image</Label>
                  <div
                    {...getRootProps()}
                    className="border-2 border-dashed flex flex-col items-center justify-center gap-2 p-2 cursor-pointer rounded-md min-h-32"
                  >
                    <input id={`${id}-media`} {...getInputProps()} />
                    {post.custom_thumbnail && !uploadImage.isPending && (
                      <img
                        src={post.custom_thumbnail}
                        className="h-40 rounded-md"
                      />
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
                        {post.custom_thumbnail && " to replace"}
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
                  value={post.name ?? ""}
                  onInput={(e) =>
                    patchPost(createPostId, {
                      name: e.currentTarget.value ?? "",
                    })
                  }
                />
              </div>

              <div className="gap-2 flex flex-col">
                <Label htmlFor={`${id}-body`}>Body</Label>
                <MarkdownEditor
                  id={`${id}-body`}
                  content={post.body ?? ""}
                  onChange={(body) =>
                    patchPost(createPostId, {
                      body,
                    })
                  }
                  className="border rounded-lg shadow-xs"
                  placeholder="Write something..."
                />
              </div>
            </div>
          )}

          <DraftsSidebar
            createPostId={createPostId}
            onClickDraft={() => setShowDrafts(false)}
          />
        </ContentGutters>
      </IonContent>
    </IonPage>
  );
}

function ChooseCommunity({
  createPostId,
  isOpen,
  closeModal,
}: {
  createPostId: string;
  isOpen: boolean;
  closeModal: () => void;
}) {
  const recentCommunities = useRecentCommunitiesStore();

  const [search, setSearch] = useState("");
  const debouncedSetSearch = useCallback(_.debounce(setSearch, 500), []);

  const post = useCreatePostStore((s) => s.drafts[createPostId]) ?? NEW_DRAFT;
  const patchPost = useCreatePostStore((s) => s.updateDraft);

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
  if (post.community) {
    data = ["Selected", post.community, ...data];
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
                    patchPost(createPostId, {
                      community: item,
                    });
                    closeModal();
                  }}
                  className="flex flex-row items-center gap-2"
                >
                  <CommunityCard communityView={item} disableLink />
                  {post.community &&
                    item.actor_id === post.community?.actor_id && (
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
