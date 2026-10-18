'use client';

import { useState, useEffect } from 'react';
import {
  getSessionUserId,
  setSessionUserId,
  getSessionUserName,
  setSessionUserName,
  setSessionUser,
} from '@/lib/apiClient';

export function useUserSession() {
  const [userId, setUserIdState] = useState<string>('user-123');
  const [userName, setUserNameState] = useState<string>('Sirijoy');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setUserIdState(getSessionUserId());
    setUserNameState(getSessionUserName());
    setIsLoaded(true);

    const handleUserChange = () => {
      setUserIdState(getSessionUserId());
      setUserNameState(getSessionUserName());
    };

    window.addEventListener('yukthi-user-changed', handleUserChange);
    window.addEventListener('finova-user-changed', handleUserChange);
    return () => {
      window.removeEventListener('yukthi-user-changed', handleUserChange);
      window.removeEventListener('finova-user-changed', handleUserChange);
    };
  }, []);

  const changeUserId = (newUserId: string) => {
    setSessionUserId(newUserId);
    setUserIdState(newUserId);
  };

  const changeUserName = (newUserName: string) => {
    setSessionUserName(newUserName);
    setUserNameState(newUserName);
  };

  return {
    userId,
    userName,
    isLoaded,
    changeUserId,
    changeUserName,
    setSessionUser,
  };
}
