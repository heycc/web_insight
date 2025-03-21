import React, { useState } from 'react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Plus } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../ui/select";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../../../ui/form";
import { useToast } from "../../../ui/use-toast";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues, DEFAULT_PROVIDER_PRESETS } from '../../types';

interface ProfileNameFieldProps {
    form: UseFormReturn<ProfileFormValues>;
    isEditing: boolean;
    selectedPresetId: string;
    setSelectedPresetId: (value: string) => void;
}

const ProfileNameField: React.FC<ProfileNameFieldProps> = ({
    form,
    isEditing,
    selectedPresetId,
    setSelectedPresetId
}) => {
    const [customProfileInput, setCustomProfileInput] = useState<boolean>(false);
    const { toast } = useToast();

    // Update fields when a PRESET is selected. Should check if it is a preset or a custom profile.
    const handlePresetSelect = (value: string) => {
        const selectedPreset = DEFAULT_PROVIDER_PRESETS.find(preset => preset.display_name === value);

        if (selectedPreset) {
            setSelectedPresetId(selectedPreset.id);
            form.setValue('profile_name', selectedPreset.display_name);
            form.setValue('provider_type', selectedPreset.provider_type);
            form.setValue('api_endpoint', selectedPreset.api_endpoint);

            if (selectedPreset.models.length > 0) {
                form.setValue('model_name', selectedPreset.models[0] || '');
            } else {
                form.setValue('model_name', '');
            }
        } else {
            setSelectedPresetId('');
        }
    };

    return (
        <FormField
            control={form.control}
            name="profile_name"
            render={({ field }) => (
                <FormItem className='space-y-1'>
                    <FormLabel className="text-base font-normal">Profile Name</FormLabel>
                    {!isEditing && (
                        <FormControl>
                            <Input
                                placeholder="Name this profile"
                                {...field}
                                disabled={true}
                            />
                        </FormControl>
                    )}
                    {isEditing && customProfileInput && (
                        <div className="flex items-center">
                            <div className="flex-grow">
                                <FormControl>
                                    <Input
                                        placeholder="Enter custom profile name"
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        disabled={false}
                                    />
                                </FormControl>
                            </div>
                            <div className="flex ml-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className='text-red-500'
                                    onClick={() => {
                                        setCustomProfileInput(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (field.value && field.value.trim() !== '') {
                                            setCustomProfileInput(false);
                                        } else {
                                            toast({
                                                title: "Invalid profile name",
                                                description: "Please enter a valid profile name",
                                                variant: "destructive",
                                            });
                                        }
                                    }}
                                >
                                    OK
                                </Button>
                            </div>
                        </div>
                    )}
                    {isEditing && !customProfileInput && (
                        <div className="flex items-center">
                            <div className="flex-grow">
                                <Select
                                    onValueChange={(value) => {
                                        handlePresetSelect(value);
                                    }}
                                    value={field.value || ""}
                                    disabled={false}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select provider profile, or click to add custom profile 👉" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {DEFAULT_PROVIDER_PRESETS.map((preset) => (
                                            <SelectItem key={preset.id} value={preset.display_name}>
                                                {preset.display_name}
                                            </SelectItem>
                                        ))}
                                        {field.value && !DEFAULT_PROVIDER_PRESETS.some(preset =>
                                            preset.display_name === field.value
                                        ) && (
                                                <SelectItem key={field.value} value={field.value}>
                                                    {field.value}
                                                </SelectItem>
                                            )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="ml-2"
                                onClick={() => setCustomProfileInput(true)}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

export default ProfileNameField; 