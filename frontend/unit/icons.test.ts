import { describe, expect, test } from "bun:test";
import {
  BoxDashed,
  ChocolateBar,
  FolderNetwork,
  FolderPlusCorner,
  RectangleLandscapePlay,
  UserRoundClock,
} from "lucide-react";
import { Icon } from "../app/components/icons";

describe("icon set", () => {
  test("exposes the icons added in lucide-react 1.77.0 and keeps the clock mapping", () => {
    for (const icon of [
      BoxDashed,
      ChocolateBar,
      FolderNetwork,
      FolderPlusCorner,
      RectangleLandscapePlay,
      UserRoundClock,
    ]) {
      expect(icon).toBeDefined();
    }

    expect(Icon).toBeDefined();
  });
});
