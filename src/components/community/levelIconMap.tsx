import type React from "react"
import {
  SproutIcon, MapIcon, CompassIcon, PassportIcon, BackpackIcon,
  TrainIcon, ShinkansenIcon, OnsenIcon, SakuraIcon, ToriiIcon,
  CastleIcon, MatsuriIcon, SamuraiIcon, NinjaIcon, DragonIcon,
  FujiIcon, AuroraIcon, CrownIcon, DiamondIcon, LegendIcon,
} from "./LevelIcons"

export const LEVEL_ICONS: Record<number, (size?: number) => React.ReactNode> = {
  1:  (s) => <SproutIcon size={s} />,
  2:  (s) => <MapIcon size={s} />,
  3:  (s) => <CompassIcon size={s} />,
  4:  (s) => <PassportIcon size={s} />,
  5:  (s) => <BackpackIcon size={s} />,
  6:  (s) => <TrainIcon size={s} />,
  7:  (s) => <ShinkansenIcon size={s} />,
  8:  (s) => <OnsenIcon size={s} />,
  9:  (s) => <SakuraIcon size={s} />,
  10: (s) => <ToriiIcon size={s} />,
  11: (s) => <CastleIcon size={s} />,
  12: (s) => <MatsuriIcon size={s} />,
  13: (s) => <SamuraiIcon size={s} />,
  14: (s) => <NinjaIcon size={s} />,
  15: (s) => <DragonIcon size={s} />,
  16: (s) => <FujiIcon size={s} />,
  17: (s) => <AuroraIcon size={s} />,
  18: (s) => <CrownIcon size={s} />,
  19: (s) => <DiamondIcon size={s} />,
  20: (s) => <LegendIcon size={s} />,
}
