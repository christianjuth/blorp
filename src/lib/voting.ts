import { Haptics, ImpactStyle } from "@capacitor/haptics";

export async function voteHaptics(score: number) {
  await Haptics.impact({
    style: score === 0 ? ImpactStyle.Medium : ImpactStyle.Heavy,
  });
}
