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
          isEncrypted ? 'bg-green-500' : 'bg-red-500 animate-pulse'
        }`}
        title={isEncrypted ? 'End-to-end encryption active - all messages secured' : 'SECURITY ERROR: Encryption not initialized'}
      />
      <span className={`text-xs font-semibold ${
        isEncrypted ? 'text-green-400' : 'text-red-400'
      }`}>
        {isEncrypted ? '🔒 E2EE Active' : '⚠️ Encryption Failed'}
      </span>
    </div>
  );
};

export default EncryptionStatus;