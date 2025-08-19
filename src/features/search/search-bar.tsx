import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import { useSearch } from "@/src/lib/api";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/stores/auth";
import { usePostsStore } from "@/src/stores/posts";
import { useEffect, useMemo, useRef, useState } from "react";
import _ from "lodash";
import { useProfilesStore } from "@/src/stores/profiles";
import removeMd from "remove-markdown";
import { useLinkContext } from "@/src/routing/link-context";
import { useIonRouter } from "@ionic/react";
import { resolveRoute } from "@/src/routing";
import { encodeApId } from "@/src/lib/api/utils";
import { useCommunitiesStore } from "@/src/stores/communities";
import type { Forms } from "@/src/lib/api/adapters/api-blueprint";

function CommunitySearchResult({ apId }: { apId: string }) {
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const community = useCommunitiesStore(
    (s) => s.communities[getCachePrefixer()(apId)]?.data,
  );

  const router = useIonRouter();
  const linkCtx = useLinkContext();

  if (!community) {
    return null;
  }

  return (
    <CommandItem
      value={apId}
      keywords={[community.communityView.slug]}
      className="line-clamp-1"
      onSelect={() =>
        router.push(
          resolveRoute(`${linkCtx.root}c/:communityName`, {
            communityName: community.communityView.slug,
          }),
        )
      }
    >
      {community.communityView.slug}
    </CommandItem>
  );
}

function PostSearchResult({ apId }: { apId: string }) {
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const post = usePostsStore((s) => s.posts[getCachePrefixer()(apId)]?.data);

  const router = useIonRouter();
  const linkCtx = useLinkContext();

  if (!post) {
    return null;
  }

  return (
    <CommandItem
      value={apId}
      keywords={[post.title]}
      className="line-clamp-1"
      onSelect={() =>
        router.push(
          resolveRoute(`${linkCtx.root}c/:communityName/posts/:post`, {
            communityName: post.communitySlug,
            post: encodeApId(apId),
          }),
        )
      }
    >
      {post.title}
    </CommandItem>
  );
}

function UserSearchResult({ apId }: { apId: string }) {
  const getCachePrefixer = useAuth((s) => s.getCachePrefixer);
  const post = useProfilesStore(
    (s) => s.profiles[getCachePrefixer()(apId)]?.data,
  );

  const router = useIonRouter();
  const linkCtx = useLinkContext();

  if (!post) {
    return null;
  }

  return (
    <CommandItem
      value={apId}
      keywords={[post.slug]}
      className="line-clamp-1"
      onSelect={() =>
        router.push(
          resolveRoute(`${linkCtx.root}u/:userId`, {
            userId: encodeApId(apId),
          }),
        )
      }
    >
      {post.slug}
    </CommandItem>
  );
}

export function SearchBar({
  type,
  communitySlug,
  ...props
}: React.ComponentProps<typeof CommandInput> & { onSubmit?: () => any } & {
  type?: Forms.Search["type"];
  communitySlug?: Forms.Search["communitySlug"];
}) {
  const router = useIonRouter();
  const linkCtx = useLinkContext();

  const ref = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const [deboucedValue, _setDebouncedValue] = useState(props.value);

  const setDebouncedValue = useMemo(
    () =>
      _.debounce((newSearch: string) => {
        _setDebouncedValue(newSearch);
      }, 500),
    [],
  );

  const searchResults = useSearch({
    q: deboucedValue ?? "",
    type: type ?? "All",
    limit: type ? 10 : 3,
    communitySlug,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { posts, users, comments, communities } = useMemo(() => {
    const posts = _.uniq(searchResults.data?.pages.flatMap((p) => p.posts));
    const users = _.uniq(searchResults.data?.pages.flatMap((p) => p.users));
    const comments = searchResults.data?.pages.flatMap((p) => p.comments);
    const communities = searchResults.data?.pages.flatMap((p) => p.communities);
    return { posts, users, comments, communities };
  }, [searchResults.data]);

  return (
    <Command
      className={cn(
        "max-md:hidden max-w-md relative mx-auto overflow-visible",
        open && !!props.value && "rounded-b-none",
      )}
    >
      <CommandInput
        placeholder="Search..."
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        ref={ref}
        {...props}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            ref.current?.blur();
          }
          props.onKeyDown?.(e);
        }}
        onValueChange={(value) => {
          setDebouncedValue(value);
          props.onValueChange?.(value);
        }}
        data-tauri-drag-region
      />
      <CommandList
        className={cn(
          "absolute top-full w-full z-50 bg-popover rounded-b-md",
          !open && "hidden",
        )}
      >
        {props.value && (
          <CommandGroup forceMount>
            <CommandItem
              className="line-clamp-1"
              value={props.value}
              onSelect={props.onSubmit}
            >
              Search {props.value.trim()}...
            </CommandItem>
          </CommandGroup>
        )}

        {props.value && communities && communities.length > 0 && (
          <CommandGroup heading="Communities">
            {communities.map((apId) => (
              <CommunitySearchResult key={apId} apId={apId} />
            ))}
          </CommandGroup>
        )}
        {props.value && posts && posts.length > 0 && (
          <CommandGroup heading="Posts">
            {posts.map((apId) => (
              <PostSearchResult key={apId} apId={apId} />
            ))}
          </CommandGroup>
        )}
        {props.value && users && users.length > 0 && (
          <CommandGroup heading="Users">
            {users.map((apId) => (
              <UserSearchResult key={apId} apId={apId} />
            ))}
          </CommandGroup>
        )}
        {props.value && comments && comments.length > 0 && (
          <CommandGroup heading="Comments">
            {comments.map((comment) => (
              <CommandItem
                key={comment.apId}
                value={comment.apId}
                keywords={[comment.body]}
                className="line-clamp-1"
                onSelect={() =>
                  router.push(
                    resolveRoute(
                      `${linkCtx.root}c/:communityName/posts/:post/comments/:comment`,
                      {
                        communityName: comment.communitySlug,
                        post: encodeApId(comment.postApId),
                        comment: String(comment.id),
                      },
                    ),
                  )
                }
              >
                {removeMd(comment.body)}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
}
