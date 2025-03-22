import React from 'react';

const About = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">About</h2>
        <p className="text-base text-gray-700 mb-3">
          Plify AI Insight leverages cutting-edge AI to instantly analyze discussions from Reddit, YouTube, and other platforms, transforming content overload into trusted insights. 🚀 Get to the heart of conversations faster with smart summarization that respects your time.
        </p>
        <p className="text-base text-gray-700 mb-3">
          ✓ Cut through the noise with precision insights<br/>
          ✓ Discover key perspectives valuable for you<br/>
          ✓ Expand the boundaries of your cognitive thinking<br/>
        </p>
        <p className="text-base text-gray-700 mb-3">
          Learn faster, dig deeper, and stay informed - all while keeping full control of your data and privacy.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Contacts</h3>
        <ul className="space-y-2">
          <li>
            <a 
              href="https://plify.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center text-sm"
            >
              Visit our website
            </a>
          </li>
          <li>
            <a 
              href="mailto:cc.changchun@gmail.com" 
              className="text-blue-600 hover:underline text-sm"
            >
              Contact me
            </a>
          </li>
        </ul>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Version: 0.2.3
        </p>
      </div>
    </div>
  );
};

export default About; 