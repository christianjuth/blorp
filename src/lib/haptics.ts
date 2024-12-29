export enum ImpactFeedbackStyle {
  /**
   * A collision between small, light user interface elements.
   */
  Light = "light",
  /**
   * A collision between moderately sized user interface elements.
   */
  Medium = "medium",
  /**
   * A collision between large, heavy user interface elements.
   */
  Heavy = "heavy",
  /**
   * A collision between user interface elements that are soft, exhibiting a large amount of compression or elasticity.
   */
  Soft = "soft",
  /**
   * A collision between user interface elements that are rigid, exhibiting a small amount of compression or elasticity.
   */
  Rigid = "rigid",
}

export function impactAsync(style: ImpactFeedbackStyle) {}
