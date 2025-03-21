import React, { useState } from 'react';
import { ProfileSelector, ProfileForm, NoProfiles } from './APIProfiles';
import { Profile, ProfileFormValues } from './types';

interface APIProfilesSectionProps {
  profiles: Profile[];
  activeProfile: Profile | null;
  isEditing: boolean;
  onProfileChange: (profile: Profile) => void;
  onAddNewProfile: () => void;
  onEditProfile: () => void;
  onDeleteProfile: () => void;
  onMoveToTop: (profile: Profile) => void;
  onProfileFormSubmit: (data: ProfileFormValues) => void;
  onProfileCancel: () => void;
}

const APIProfilesSection: React.FC<APIProfilesSectionProps> = ({
  profiles,
  activeProfile,
  isEditing,
  onProfileChange,
  onAddNewProfile,
  onEditProfile,
  onDeleteProfile,
  onMoveToTop,
  onProfileFormSubmit,
  onProfileCancel
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl mb-4">LLM API Profiles</h2>
      <div className="space-y-4">
        {/* Case 1: No profiles configured */}
        {profiles.length === 0 && !isEditing && (
          <NoProfiles onAddNewProfile={onAddNewProfile} />
        )}

        {/* Case 2: Has profiles and not editing */}
        {profiles.length > 0 && !isEditing && activeProfile && (
          <>
            <ProfileSelector 
              activeProfile={activeProfile}
              profiles={profiles}
              onProfileChange={onProfileChange}
              onAddNewProfile={onAddNewProfile}
              onEditProfile={onEditProfile}
              onDeleteProfile={onDeleteProfile}
              onMoveToTop={onMoveToTop}
            />
            <ProfileForm 
              activeProfile={activeProfile}
              isEditing={false}
              onSubmit={onProfileFormSubmit}
              onCancel={onProfileCancel}
            />
          </>
        )}

        {/* Case 3: Is editing (either existing profile or new profile) */}
        {isEditing && (
          <ProfileForm 
            activeProfile={activeProfile}
            isEditing={true}
            onSubmit={onProfileFormSubmit}
            onCancel={onProfileCancel}
          />
        )}
      </div>
    </div>
  );
};

export default APIProfilesSection; 