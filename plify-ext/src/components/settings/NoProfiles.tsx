import React from 'react';
import { Button } from '../../components/ui/button';

interface NoProfilesProps {
  onAddNewProfile: () => void;
}

const NoProfiles: React.FC<NoProfilesProps> = ({ onAddNewProfile }) => {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500 mb-4">No profiles configured. Add a profile to get started.</p>
      <Button onClick={onAddNewProfile} className="mx-auto">
        Add New Profile
      </Button>
    </div>
  );
};

export default NoProfiles; 