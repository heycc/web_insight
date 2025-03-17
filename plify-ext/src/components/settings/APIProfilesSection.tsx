import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { ProfileSelector, ProfileForm, NoProfiles } from './APIProfiles';
import { Profile } from './types';
import { useToast } from "../../components/ui/use-toast";

interface APIProfilesSectionProps {
  profiles: Profile[];
  activeProfile: Profile | null;
  isEditing: boolean;
  onProfileChange: (profile: Profile) => void;
  onAddNewProfile: () => void;
  onEditProfile: () => void;
  onDeleteProfile: () => void;
  onMoveToTop: (profile: Profile) => void;
  onProfileFormSubmit: (data: any) => void;
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>API Profiles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
};

export default APIProfilesSection; 