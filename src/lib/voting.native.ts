import * as Haptics from "expo-haptics";

export function voteHaptics(score: number) {
  Haptics.impactAsync(
    score === 0
      ? Haptics.ImpactFeedbackStyle.Medium
      : Haptics.ImpactFeedbackStyle.Rigid,
  );
}
