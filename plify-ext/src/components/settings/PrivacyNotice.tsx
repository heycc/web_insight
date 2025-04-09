import React from 'react';

const PrivacyNotice: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
      <h3 className="text-blue-800 text-xl mb-1">Privacy Notice</h3>
      <p className="text-sm text-blue-700">
        All settings, including your API keys, are stored locally in your browser and are never sent to our servers.
        Your credentials remain private and secure on your device.
      </p>
      <p className="text-sm text-blue-700 mt-4">
        This extension is open source. You can view the source code at <a href="https://github.com/heycc/web_insight" className="text-gray-900 hover:underline">https://github.com/heycc/web_insight</a>.
      </p>
    </div>
  );
};

export default PrivacyNotice; 