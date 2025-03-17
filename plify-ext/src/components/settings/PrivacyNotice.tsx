import React from 'react';

const PrivacyNotice: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
      <h3 className="text-blue-800 text-xl mb-1">Privacy Notice</h3>
      <p className="text-sm text-blue-700">
        All settings, including your API keys, are stored locally in your browser and are never sent to our servers.
        Your credentials remain private and secure on your device.
      </p>
    </div>
  );
};

export default PrivacyNotice; 