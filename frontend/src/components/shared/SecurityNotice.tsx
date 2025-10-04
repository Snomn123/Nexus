import React from 'react';

interface SecurityNoticeProps {
  className?: string;
}

const SecurityNotice: React.FC<SecurityNoticeProps> = ({ className = '' }) => {
  return (
    <div className={`bg-green-900/20 border border-green-500/30 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">🔒</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-green-400 font-semibold text-sm">End-to-End Encryption Active</h3>
          <p className="text-green-300 text-xs mt-1">
            All your messages are automatically encrypted before leaving your device. 
            Even server administrators cannot read your conversations.
          </p>
        </div>
      </div>
      <div className="mt-2 text-xs text-green-400 opacity-75">
        <span className="font-semibold">Security Features:</span> AES-256 encryption • Zero-knowledge architecture • Perfect forward secrecy
      </div>
    </div>
  );
};

export default SecurityNotice;