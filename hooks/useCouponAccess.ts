import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { checkDemoStatus } from '@/redux/actions/couponActions';

interface CouponAccess {
  hasAccess: boolean;
  isDemo: boolean;
  isPurchase: boolean;
  expiresAt: Date | null;
  loading: boolean;
}

export const useCouponAccess = (): CouponAccess => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.user);
  const [demoStatus, setDemoStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const result = await dispatch(checkDemoStatus() as any);
        if (checkDemoStatus.fulfilled.match(result)) {
          setDemoStatus(result.payload);
        }
      } catch (error) {
        console.error('Error checking demo status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
    
    // Check every minute for demo expiration
    const interval = setInterval(checkAccess, 60000);
    
    return () => clearInterval(interval);
  }, [dispatch, user?._id]); // Re-check when user changes

  const hasActiveDemo = demoStatus?.hasDemo && demoStatus?.expiresAt && new Date(demoStatus.expiresAt) > new Date();
  const hasActivePurchase = demoStatus?.hasPurchase || user?.activeCouponCode !== null;

  return {
    hasAccess: hasActiveDemo || hasActivePurchase,
    isDemo: hasActiveDemo,
    isPurchase: hasActivePurchase,
    expiresAt: demoStatus?.expiresAt ? new Date(demoStatus.expiresAt) : null,
    loading,
  };
};

