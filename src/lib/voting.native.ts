import * as Haptics from "expo-haptics";

export async function voteHaptics(score: number) {
  await Haptics.impactAsync(
    score === 0
      ? Haptics.ImpactFeedbackStyle.Medium
      : Haptics.ImpactFeedbackStyle.Rigid,
  );
}
