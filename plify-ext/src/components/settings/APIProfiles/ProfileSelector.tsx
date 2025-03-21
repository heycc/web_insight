import React from 'react';
import { Button } from '../../ui/button';
import { Plus, Pencil, Trash2, ArrowUpToLine } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../ui/popover";
import { Profile } from '../types';
import { Label } from "../../ui/label";

interface ProfileSelectorProps {
  activeProfile: Profile;
  profiles: Profile[];
  onProfileChange: (profile: Profile) => void;
  onAddNewProfile: () => void;
  onEditProfile: () => void;
  onDeleteProfile: () => void;
  onMoveToTop: (profile: Profile) => void;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  activeProfile,
  profiles,
  onProfileChange,
  onAddNewProfile,
  onEditProfile,
  onDeleteProfile,
  onMoveToTop
}) => {
  const [isDeletePopoverOpen, setIsDeletePopoverOpen] = React.useState(false);
  const selectId = React.useId();

  return (
    <div className="mb-4 flex flex-col gap-0">
      
      <div className="flex justify-between items-center mb-1">
        <div className="flex-1 mr-4">
          <Label htmlFor={selectId} className="sr-only">Select Profile</Label>
          <Select
            onValueChange={(value: string) => {
              const selectedProfile = profiles.find(p => p.index === parseInt(value));
              if (selectedProfile) {
                onProfileChange(selectedProfile);
              }
            }}
            value={activeProfile.index.toString()}
          >
            <SelectTrigger 
              id={selectId} 
              className="w-full bg-gray-100 border-0 hover:bg-gray-200 focus:ring-0 focus:ring-offset-0"
            >
              <SelectValue placeholder="Select a profile" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.index} value={profile.index.toString()}>
                  {profile.profile_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-x-1 flex-shrink-0">
          {activeProfile.index !== profiles[0]?.index && (
            <Button
              onClick={() => onMoveToTop(activeProfile)}
              size="icon"
              variant="ghost"
              title="Prioritize this profile"
              aria-label="Move profile to top"
            >
              <ArrowUpToLine className="h-4 w-4 text-blue-700" />
            </Button>
          )}
          <Button
            onClick={onAddNewProfile}
            size="icon"
            variant="ghost"
            title="Add new profile"
            aria-label="Add new profile"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            onClick={onEditProfile}
            size="icon"
            variant="ghost"
            title="Edit profile"
            aria-label="Edit profile"
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Popover open={isDeletePopoverOpen} onOpenChange={setIsDeletePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-500"
                title="Delete profile"
                aria-label="Delete profile"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4">
              <div className="space-y-2">
                <h4 className="font-bold">Confirm Deletion</h4>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete the profile?
                </p>
                <p className="text-sm text-blue-500">
                  {activeProfile.profile_name}
                </p>
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeletePopoverOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onDeleteProfile();
                      setIsDeletePopoverOpen(false);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        The first profile will be used as by default. Click 'Top' to prioritize your preferred profile.
      </p>
    </div>
  );
};

export default ProfileSelector; 