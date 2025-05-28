import {
  useInfiniteQuery,
  InfiniteData,
  useQueryClient,
  UseInfiniteQueryOptions,
  DefaultError,
  QueryKey,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import _ from "lodash";
import { useThrottleQueue } from "../throttle-queue";
import { create } from "zustand/react";
import { useEffect, useRef } from "react";

const useWarmedKeysStore = create<{
  warmedKeys: string[];
  addWarmedKey: (key: string) => void;
}>()((set) => ({
  warmedKeys: [],
  addWarmedKey: (key) => {
    set((prev) => ({
      warmedKeys: _.uniq([...prev.warmedKeys, key]),
    }));
  },
}));

export function isInfiniteQueryData(data: any): data is InfiniteData<any> {
  return (
    data &&
    typeof data === "object" &&
    Array.isArray(data.pages) &&
    Array.isArray(data.pageParams)
  );
}

export function useThrottledInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  >,
) {
  const queryClient = useQueryClient();
  const throttleQueue = useThrottleQueue(options.queryKey);
  const queryFn = options.queryFn;

  const truncate = () => {
    const data = queryClient.getQueryData<InfiniteData<any>>(options.queryKey);
    if (data && isInfiniteQueryData(data)) {
      queryClient.setQueryData<InfiniteData<any>>(options.queryKey, {
        pages: data.pages.slice(0, 3),
        pageParams: data.pageParams.slice(0, 3),
      });
    }
  };

  const query = useInfiniteQuery({
    ...options,
    ...(_.isFunction(queryFn)
      ? {
          queryFn: (ctx: any) => {
            return throttleQueue.enqueue<TQueryFnData>(async () => {
              return await queryFn(ctx);
            });
          },
        }
      : {}),
  });
  const extendedQuery: UseInfiniteQueryResult<TData, TError> = {
    ...query,
    fetchNextPage: () => {
      const p = query.fetchNextPage();
      throttleQueue.flush();
      return p;
    },
    refetch: (refetchOptions) => {
      truncate();
      const p = query.refetch(refetchOptions);
      throttleQueue.flush();
      return p;
    },
  };

  return extendedQuery;
}
