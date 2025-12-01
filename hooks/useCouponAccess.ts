import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { checkDemoStatus } from '@/redux/actions/couponActions';

interface CouponAccess {
  hasAccess: boolean;
  isDemo: boolean;
  isPurchase: boolean;
  minutesRemaining: number | null; // Minutes remaining (not Date)
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
        // checkDemoStatus bir createAsyncThunk, fulfilled type'ını kontrol et
        if (result.type === 'coupon/checkDemoStatus/fulfilled') {
          setDemoStatus(result.payload);
        } else if (result.type === 'coupon/checkDemoStatus/rejected') {
          // Hata durumunda demo status'u sıfırla
          setDemoStatus(null);
        }
      } catch (error) {
        console.error('Error checking demo status:', error);
        setDemoStatus(null);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
    
    // Check every minute for demo expiration
    const interval = setInterval(checkAccess, 60000);
    
    return () => clearInterval(interval);
  }, [dispatch, user?._id, user?.activeCouponCode, user?.courseCode]); // Re-check when user or coupon codes change

  // Demo kontrolü: minutesRemaining > 0 ise aktif demo var
  const minutesRemaining = demoStatus?.minutesRemaining ?? null;
  const hasActiveDemo = minutesRemaining !== null && minutesRemaining > 0;
  
  // Purchase kontrolü: activeCouponCode, courseCode varsa veya demoStatus'ta hasPurchase true ise
  const hasActivePurchase = 
    (user?.activeCouponCode && user?.activeCouponCode.trim() !== '') || 
    (user?.courseCode && user?.courseCode.trim() !== '') ||
    demoStatus?.hasPurchase === true;

  return {
    hasAccess: hasActiveDemo || hasActivePurchase,
    isDemo: hasActiveDemo, // Sadece aktif demo varsa true
    isPurchase: hasActivePurchase,
    minutesRemaining: minutesRemaining,
    loading,
  };
};

