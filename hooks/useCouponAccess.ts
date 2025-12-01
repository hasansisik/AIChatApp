import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { checkDemoStatus } from '@/redux/actions/couponActions';

interface CouponAccess {
  hasAccess: boolean;
  isDemo: boolean;
  isPurchase: boolean;
  expiresAt: Date | null;
  demoTotalMinutes: number | null;
  demoMinutesUsed: number;
  remainingMinutes: number;
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

  // Yeni sistem: demoTotalMinutes ve demoMinutesUsed kullan
  const demoTotalMinutes = demoStatus?.demoTotalMinutes || null;
  const demoMinutesUsed = demoStatus?.demoMinutesUsed || 0;
  const remainingMinutes = demoTotalMinutes ? (demoTotalMinutes - demoMinutesUsed) : 0;
  const hasActiveDemo = remainingMinutes > 0;
  
  // Eski sistem kontrolü (geriye dönük uyumluluk)
  const expiresAtDate = demoStatus?.expiresAt ? new Date(demoStatus.expiresAt) : null;
  const now = new Date();
  const hasActiveDemoOld = demoStatus?.hasDemo && expiresAtDate && expiresAtDate > now;
  
  // Purchase kontrolü: activeCouponCode, courseCode varsa veya demoStatus'ta hasPurchase true ise
  const hasActivePurchase = 
    (user?.activeCouponCode && user?.activeCouponCode.trim() !== '') || 
    (user?.courseCode && user?.courseCode.trim() !== '') ||
    demoStatus?.hasPurchase === true;

  return {
    hasAccess: hasActiveDemo || hasActiveDemoOld || hasActivePurchase,
    isDemo: hasActiveDemo || hasActiveDemoOld, // Her iki sistem de kontrol ediliyor
    isPurchase: hasActivePurchase,
    expiresAt: expiresAtDate, // Geriye dönük uyumluluk için
    demoTotalMinutes: demoTotalMinutes,
    demoMinutesUsed: demoMinutesUsed,
    remainingMinutes: remainingMinutes,
    loading,
  };
};

