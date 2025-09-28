import React from 'react';
import encryptionService from '../services/encryptionService';

interface EncryptionStatusProps {
  className?: string;
}

const EncryptionStatus: React.FC<EncryptionStatusProps> = ({ className = '' }) => {
  const isEncrypted = encryptionService.isEncryptionReady();

  return (
    <div className={`flex items-center space-x-1 text-sm ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${
          isEncrypted ? 'bg-green-500' : 'bg-gray-400'
        }`}
        title={isEncrypted ? 'End-to-end encryption active' : 'Messages not encrypted'}
      />
      <span className={`text-xs ${
        isEncrypted ? 'text-green-400' : 'text-gray-400'
      }`}>
        {isEncrypted ? 'E2EE' : 'Unencrypted'}
      </span>
    </div>
  );
};

export default EncryptionStatus;