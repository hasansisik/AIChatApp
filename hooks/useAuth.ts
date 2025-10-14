import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

export const useAuth = () => {
  const { isAuthenticated, user, loading, error, isOnboardingCompleted } = useSelector((state: RootState) => state.user);
  
  return {
    isAuthenticated: !!isAuthenticated,
    user,
    loading,
    error,
    isLoggedIn: !!isAuthenticated && !!user,
    isOnboardingCompleted: !!isOnboardingCompleted,
  };
};
