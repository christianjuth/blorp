// Copied from
// https://github.com/aeharding/voyager/blob/f123ad405d61e79e52c99241bda4cac349f92695/src/features/share/asImage/ShareAsImageModal.tsx#L19

import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { privilegedFetch } from "./privileged-fetch";
import { env } from "../env";
import _ from "lodash";
import { useEffect, useState } from "react";

const DEFAULT_HEADERS = {
  // lemmy.ml will reject requests if
  // User-Agent header is not present
  "User-Agent": env.REACT_APP_NAME.toLowerCase(),
};

function blobToString(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = btoa(reader.result as string);
      resolve(base64String);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsBinaryString(blob);
  });
}

export async function shareImage(name: string, imageUrl: string) {
  // Fetch the image as a blob.
  const response = await privilegedFetch(imageUrl, {
    headers: DEFAULT_HEADERS,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${imageUrl}`);
  }
  const blob = await response.blob();

  if (!blob) return;

  const filename = `${name
    .replace(/^https:\/\//, "")
    .replaceAll(/\//g, "-")}.png`;

  const file = new File([blob], filename, {
    type: "image/png",
  });

  const webSharePayload: ShareData = { files: [file] };

  if (Capacitor.isNativePlatform()) {
    const data = await blobToString(blob);
    const file = await Filesystem.writeFile({
      data,
      directory: Directory.Cache,
      path: filename,
    });
    await Share.share({ files: [file.uri] });
    await Filesystem.deleteFile({ path: file.uri });
  } else if ("canShare" in navigator && navigator.canShare(webSharePayload)) {
    navigator.share(webSharePayload);
  } else {
    const link = document.createElement("a");
    link.download = filename;
    link.href = URL.createObjectURL(file);
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

const canShare = _.memoize(async () => {
  return _.isFunction(navigator.share) || (await Share.canShare()).value;
});

export function useCanShare() {
  const [share, setShare] = useState(false);
  useEffect(() => {
    canShare().then(setShare);
  }, []);
  return share;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.error("Error copying URL:", e);
  }
}

export async function copyRouteToClipboard(route: string) {
  const url = `https://blorpblorp.xyz${route}`;
  copyToClipboard(url);
}

export async function shareRoute(route: string) {
  const url = `https://blorpblorp.xyz${route}`;
  try {
    const canShare = await Share.canShare();
    if (canShare.value) {
      await Share.share({ url });
    } else if (_.isFunction(navigator.share)) {
      // Probably unnecessary since Share.share uses navigator.share
      await navigator.share({ url });
    }
  } catch (e) {
    console.error("Error sharing URL:", e);
  }
}
