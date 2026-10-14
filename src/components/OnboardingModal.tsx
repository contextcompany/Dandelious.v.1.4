import React from 'react';
import { EngineSettings } from '../types';
import { InteractiveTour } from './InteractiveTour';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EngineSettings;
  onSaveSettings: (newSettings: EngineSettings) => void;
  step?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  setStep?: (step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) => void;
  isSettingsOpen?: boolean;
  onOpenSettings?: () => void;
  onCloseSettings?: () => void;
  onNewChat?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  step = 1,
  setStep = () => {},
  isSettingsOpen = false,
  onOpenSettings = () => {},
  onCloseSettings = () => {},
  onNewChat = () => {}
}) => {
  if (!isOpen) return null;

  return (
    <InteractiveTour
      isActive={isOpen}
      step={step}
      setStep={setStep}
      onComplete={onClose}
      onSkip={onClose}
      onOpenSettings={onOpenSettings}
      isSettingsOpen={isSettingsOpen}
      onCloseSettings={onCloseSettings}
      onNewChat={onNewChat}
    />
  );
};
