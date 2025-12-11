import { NumberOneScreen, PledgeScreen, FeaturesScreen, KidSafeModeScreen, ComparisonScreen, TrustScreen } from './info-screens';
import { ComponentType } from 'react';

export type OnboardingStepType = 'question' | 'info';

export interface OnboardingStep {
  type: OnboardingStepType;
  id: string;
  // For question type
  question?: string;
  subtitle?: string;
  options?: Array<{ id: string; label: string }>;
  // For info type
  component?: ComponentType;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  // Welcome screen (handled separately in onboarding-screen.tsx)
  
  // Info: Number One screen
  {
    type: 'info',
    id: 'number_one',
    component: NumberOneScreen,
  },
  
  // Question: Choose your team
  {
    type: 'question',
    id: 'choose_team',
    question: "Choose your team",
    subtitle: "We'll personalize your experience",
    options: [
      { id: 'clean_living_girlie', label: 'Clean-Living Girlie' },
      { id: 'holistic_health_bro', label: 'Holistic Health Bro' },
      { id: 'mama_bear_protector', label: 'Mama Bear Protector' },
      { id: 'wellness_warrior_dad', label: 'Wellness Warrior Dad' },
    ],
  },
  
  // Info: Pledge screen
  {
    type: 'info',
    id: 'pledge',
    component: PledgeScreen,
  },
  
  // Question: Have you used other scanning apps before?
  {
    type: 'question',
    id: 'used_other_apps',
    question: "Have you used other scanning apps before?",
    options: [
      { id: 'no', label: 'No' },
      { id: 'yes', label: 'Yes' },
    ],
  },
  
  // Info: Features screen
  {
    type: 'info',
    id: 'features',
    component: FeaturesScreen,
  },
  
  // Question: Why do you want to choose cleaner products?
  {
    type: 'question',
    id: 'why_cleaner',
    question: "Why do you want to choose cleaner products?",
    subtitle: "Pick one",
    options: [
      { id: 'live_healthier', label: 'Live healthier' },
      { id: 'better_sleep', label: 'Better sleep' },
      { id: 'clearer_thinking', label: 'Clearer thinking' },
      { id: 'more_energy', label: 'More energy' },
      { id: 'happier_skin', label: 'Happier skin' },
      { id: 'healthier_family', label: 'Healthier family' },
    ],
  },
  
  // Question: What frustrates you about other apps?
  {
    type: 'question',
    id: 'frustrations',
    question: "What frustrates you about other apps?",
    options: [
      { id: 'greenwashing', label: 'Greenwashing products' },
      { id: 'biased_partnerships', label: 'Biased by paid partnerships' },
      { id: 'hard_to_use', label: 'Hard to use' },
      { id: 'mainstream_nutrition', label: 'Only mainstream nutrition advice' },
      { id: 'all_above', label: 'All of the above' },
    ],
  },
  
  // Info: Comparison screen
  {
    type: 'info',
    id: 'comparison',
    component: ComparisonScreen,
  },
  
  // Question: Which additives do you want to avoid most?
  {
    type: 'question',
    id: 'additives',
    question: "Which additives do you want to avoid most?",
    options: [
      { id: 'seed_oils', label: 'Seed Oils' },
      { id: 'artificial_additives', label: 'Artificial Additives' },
      { id: 'heavy_metals', label: 'Heavy Metals' },
      { id: 'all_additives', label: 'All of the above' },
    ],
  },
  
  // Info: Kid-Safe Mode screen
  {
    type: 'info',
    id: 'kid_safe_mode',
    component: KidSafeModeScreen,
  },
  
  // Info: Trust screen
  {
    type: 'info',
    id: 'trust',
    component: TrustScreen,
  },
  
  // Question: How did you hear about Avocado?
  {
    type: 'question',
    id: 'how_hear',
    question: "How did you hear about Avocado?",
    options: [
      { id: 'medical_provider', label: 'Medical Provider' },
      { id: 'friend', label: 'From a Friend' },
      { id: 'facebook', label: 'Facebook' },
      { id: 'reddit', label: 'Reddit' },
      { id: 'instagram_post', label: 'Instagram Post/Reel' },
      { id: 'instagram_story', label: 'Instagram Story' },
      { id: 'podcast', label: 'Podcast' },
      { id: 'other', label: 'Other' },
    ],
  },
];

