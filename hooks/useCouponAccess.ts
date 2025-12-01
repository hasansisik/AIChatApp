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
  }, [dispatch, user?._id]); // Re-check when user changes

  // Demo kontrolü: expiresAt varsa ve gelecekteyse aktif demo var
  // expiresAt geçmişteyse demo süresi dolmuş demektir
  const expiresAtDate = demoStatus?.expiresAt ? new Date(demoStatus.expiresAt) : null;
  const now = new Date();
  const hasActiveDemo = demoStatus?.hasDemo && expiresAtDate && expiresAtDate > now;
  
  // Purchase kontrolü: activeCouponCode, courseCode varsa veya demoStatus'ta hasPurchase true ise
  const hasActivePurchase = 
    (user?.activeCouponCode && user?.activeCouponCode.trim() !== '') || 
    (user?.courseCode && user?.courseCode.trim() !== '') ||
    demoStatus?.hasPurchase === true;

  return {
    hasAccess: hasActiveDemo || hasActivePurchase,
    isDemo: hasActiveDemo, // Sadece aktif demo varsa true
    isPurchase: hasActivePurchase,
    expiresAt: expiresAtDate,
    loading,
  };
};

