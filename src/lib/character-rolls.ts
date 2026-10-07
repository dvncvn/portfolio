export type CharacterRoll = {
  id: string;
  group: string;
  label: string;
  sides: number;
  modifier: number;
};

// Bonuses transcribed from Perrin's supplied character sheet.
const abilities = [
  ['Strength', 0, 0], ['Dexterity', 2, 2], ['Constitution', 2, 2],
  ['Intelligence', -1, -1], ['Wisdom', 3, 6], ['Charisma', 1, 4],
] as const;

export const characterRolls: CharacterRoll[] = [
  { id: 'd20', group: 'Dice', label: 'Plain d20', sides: 20, modifier: 0 },
  ...abilities.map(([name, modifier]) => ({ id: `check-${name}`, group: 'Ability checks', label: `${name} check`, sides: 20, modifier })),
  ...abilities.map(([name, , modifier]) => ({ id: `save-${name}`, group: 'Saving throws', label: `${name} save`, sides: 20, modifier })),
  ...([
    ['Insight', 6], ['Survival', 6], ['Persuasion', 4], ['Perception', 3], ['Stealth', 2],
  ] as const).map(([name, modifier]) => ({ id: `skill-${name}`, group: 'Skills', label: name, sides: 20, modifier })),
  { id: 'initiative', group: 'Combat', label: 'Initiative', sides: 20, modifier: 2 },
  { id: 'mace', group: 'Combat', label: 'Mace attack', sides: 20, modifier: 3 },
  { id: 'unarmed', group: 'Combat', label: 'Unarmed attack', sides: 20, modifier: 3 },
  { id: 'mace-damage', group: 'Damage', label: 'Mace damage', sides: 6, modifier: 0 },
];

export function rollFormula(roll: CharacterRoll) {
  return `1d${roll.sides}${roll.modifier === 0 ? '' : ` ${roll.modifier > 0 ? '+' : '−'} ${Math.abs(roll.modifier)}`}`;
}

export function rollCharacterDie(roll: CharacterRoll, random = Math.random) {
  const face = Math.floor(random() * roll.sides) + 1;
  return { ...roll, face, total: face + roll.modifier };
}
