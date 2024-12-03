import { useState, useEffect } from "react";
import { Image as RNImage } from "react-native";
import { Image as TImage } from "@tamagui/image-next";

export function Image({
  imageUrl,
  priority,
  loading,
}: {
  imageUrl: string;
  priority?: boolean;
  loading?: boolean;
}) {
  return (
    <img
      src={imageUrl}
      style={{
        width: "100%",
      }}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
