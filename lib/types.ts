export interface ValorantAgent {
  uuid: string;
  displayName: string;
  description: string;
  developerName: string;
  characterTags: string[] | null;
  displayIcon: string;
  displayIconSmall: string;
  bustPortrait: string | null;
  fullPortrait: string | null;
  fullPortraitV2: string | null;
  killfeedPortrait: string;
  background: string | null;
  backgroundGradientColors: string[];
  assetPath: string;
  isFullPortraitRightFacing: boolean;
  isPlayableCharacter: boolean;
  isAvailableForTest: boolean;
  isBaseContent: boolean;
  role: {
    uuid: string;
    displayName: string;
    description: string;
    displayIcon: string;
    assetPath: string;
  } | null;
  abilities: {
    slot: string;
    displayName: string;
    description: string;
    displayIcon: string | null;
  }[];
  voiceLine: any;
}
