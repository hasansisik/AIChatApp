import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from 'react-i18next';
import { Colors } from "@/hooks/useThemeColor";
import { getSessions, updateCourseCode } from "@/redux/actions/eduActions";
import { loadUser } from "@/redux/actions/userActions";
import ReusableText from "@/components/ui/ReusableText";
import { FontSizes } from "@/constants/Fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PurchaseModal from "@/components/ui/PurchaseModal";
import CouponModal from "@/components/ui/CouponModal";
import CouponSelectionModal from "@/components/ui/CouponSelectionModal";
import { useCouponAccess } from "@/hooks/useCouponAccess";

const Edu = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.user);
  const { sessions, loading, error, code } = useSelector((state: any) => state.edu);
  const [refreshing, setRefreshing] = useState(false);
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [courseCode, setCourseCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [couponSelectionModalVisible, setCouponSelectionModalVisible] = useState(false);
  
  // Check coupon access - sadece purchase kuponu kontrolü (demo edu için geçerli değil)
  const { hasAccess, loading: accessLoading, isPurchase } = useCouponAccess();

  useEffect(() => {
    // Sadece purchase kuponu varsa erişim ver
    if (user?.courseCode && isPurchase) {
      dispatch<any>(getSessions({ code: user.courseCode }));
    }
  }, [dispatch, user?.courseCode, isPurchase]);

  // Check access separately to avoid infinite loops - sadece purchase kuponu kontrolü
  useEffect(() => {
    if (!accessLoading && !isPurchase && user && !purchaseModalVisible && !couponModalVisible && !couponSelectionModalVisible) {
      // User doesn't have purchase coupon, show selection modal (only once)
      setCouponSelectionModalVisible(true);
    }
  }, [accessLoading, isPurchase, user?._id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.courseCode) {
      await dispatch<any>(getSessions({ code: user.courseCode }));
    }
    setRefreshing(false);
  };

  const handleCodeSubmit = async () => {
    if (!courseCode.trim()) {
      Alert.alert(t('common.error'), t('edu.code.enterCode'));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await dispatch<any>(updateCourseCode(courseCode.trim().toUpperCase()));
      if (updateCourseCode.fulfilled.match(result)) {
        await dispatch<any>(loadUser());
        setCodeModalVisible(false);
        setCourseCode("");
        Alert.alert(t('common.success'), t('edu.code.updateSuccess'));
        // Refresh sessions with new code
        if (courseCode.trim()) {
          await dispatch<any>(getSessions({ code: courseCode.trim().toUpperCase() }));
        }
      } else {
        Alert.alert(t('common.error'), result.payload || t('edu.code.updateError'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('common.errorOccurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHasCoupon = () => {
    // User has coupon, show coupon modal
    setCouponModalVisible(true);
  };

  const handleNoCoupon = () => {
    // User doesn't have coupon, show purchase modal
    setPurchaseModalVisible(true);
  };

  const handleCouponSuccess = async () => {
    setCouponModalVisible(false);
    // Reload user to get updated courseCode
    await dispatch<any>(loadUser());
  };

  // Show access check message if no purchase coupon
  if (!accessLoading && !isPurchase && user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="lock-outline"
            size={64}
            color={Colors.lightGray}
          />
          <ReusableText
            text={t('edu.empty.accessRequired')}
            family="medium"
            size={FontSizes.medium}
            color={Colors.black}
          />
          <ReusableText
            text={t('edu.empty.enterCouponCode')}
            family="regular"
            size={FontSizes.small}
            color={Colors.description}
          />
          <TouchableOpacity
            style={styles.accessButton}
            onPress={() => setCouponSelectionModalVisible(true)}
          >
            <ReusableText
              text={t('edu.empty.getAccess')}
              family="medium"
              size={FontSizes.small}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Coupon Selection Modal */}
        <CouponSelectionModal
          visible={couponSelectionModalVisible}
          onClose={() => setCouponSelectionModalVisible(false)}
          onHasCoupon={handleHasCoupon}
          onNoCoupon={handleNoCoupon}
        />

        {/* Purchase Modal */}
        <PurchaseModal
          visible={purchaseModalVisible}
          onClose={() => setPurchaseModalVisible(false)}
        />

        {/* Coupon Modal */}
        <CouponModal
          visible={couponModalVisible}
          onClose={() => setCouponModalVisible(false)}
          onSuccess={handleCouponSuccess}
        />
      </View>
    );
  }

  if (!user?.courseCode) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="school-outline"
            size={64}
            color={Colors.lightGray}
          />
          <ReusableText
            text={t('edu.empty.codeNotFound')}
            family="medium"
            size={FontSizes.medium}
            color={Colors.black}
          />
          <ReusableText
            text={t('edu.empty.enterCode')}
            family="regular"
            size={FontSizes.small}
            color={Colors.description}
          />
        </View>

        {/* Coupon Selection Modal */}
        <CouponSelectionModal
          visible={couponSelectionModalVisible}
          onClose={() => setCouponSelectionModalVisible(false)}
          onHasCoupon={handleHasCoupon}
          onNoCoupon={handleNoCoupon}
        />

        {/* Purchase Modal */}
        <PurchaseModal
          visible={purchaseModalVisible}
          onClose={() => setPurchaseModalVisible(false)}
        />

        {/* Coupon Modal */}
        <CouponModal
          visible={couponModalVisible}
          onClose={() => setCouponModalVisible(false)}
          onSuccess={handleCouponSuccess}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <ReusableText
              text={t('edu.loading')}
              family="regular"
              size={FontSizes.small}
              color={Colors.description}
            />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={48}
              color={Colors.error}
            />
            <ReusableText
              text={error}
              family="medium"
              size={FontSizes.small}
              color={Colors.error}
            />
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={64}
              color={Colors.lightGray}
            />
            <ReusableText
              text={t('edu.empty.noSessions')}
              family="medium"
              size={FontSizes.medium}
              color={Colors.black}
            />
          </View>
        ) : (
          <View style={styles.sessionsContainer}>
            <View style={styles.header}>
              <ReusableText
                text={t('edu.title')}
                family="bold"
                size={FontSizes.large}
                color={Colors.black}
              />
              {code && (
                <TouchableOpacity
                  style={styles.codeBadge}
                  onPress={() => {
                    setCourseCode(code);
                    setCodeModalVisible(true);
                  }}
                >
                  <ReusableText
                    text={code}
                    family="medium"
                    size={FontSizes.small}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {sessions.map((session: any, index: number) => (
              <View key={index} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <MaterialCommunityIcons
                    name="book-open-variant"
                    size={24}
                    color={Colors.primary}
                  />
                  <ReusableText
                    text={session.courseName}
                    family="bold"
                    size={FontSizes.medium}
                    color={Colors.black}
                  />
                </View>

                <View style={styles.sessionInfo}>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="calendar-week"
                      size={20}
                      color={Colors.description}
                    />
                    <ReusableText
                      text={session.days}
                      family="regular"
                      size={FontSizes.small}
                      color={Colors.description}
                    />
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={20}
                      color={Colors.description}
                    />
                    <ReusableText
                      text={session.hours}
                      family="regular"
                      size={FontSizes.small}
                      color={Colors.description}
                    />
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name="calendar-start"
                      size={20}
                      color={Colors.description}
                    />
                    <ReusableText
                      text={t('edu.session.startDate', { date: session.startDate })}
                      family="regular"
                      size={FontSizes.small}
                      color={Colors.description}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Code Change Modal */}
      <Modal
        visible={codeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCodeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ReusableText
              text={t('edu.code.changeTitle')}
              family="bold"
              size={FontSizes.large}
              color={Colors.black}
            />
            <TextInput
              style={styles.codeInput}
              placeholder={t('tabs.courseCode.placeholder')}
              placeholderTextColor={Colors.lightGray}
              value={courseCode}
              onChangeText={setCourseCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setCodeModalVisible(false);
                  setCourseCode("");
                }}
              >
                <ReusableText
                  text={t('common.cancel')}
                  family="medium"
                  size={FontSizes.small}
                  color={Colors.black}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleCodeSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <ReusableText
                    text={t('common.save')}
                    family="medium"
                    size={FontSizes.small}
                    color={Colors.white}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Coupon Selection Modal */}
      <CouponSelectionModal
        visible={couponSelectionModalVisible}
        onClose={() => setCouponSelectionModalVisible(false)}
        onHasCoupon={handleHasCoupon}
        onNoCoupon={handleNoCoupon}
      />

      {/* Purchase Modal */}
      <PurchaseModal
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
      />

      {/* Coupon Modal */}
      <CouponModal
        visible={couponModalVisible}
        onClose={() => setCouponModalVisible(false)}
        onSuccess={handleCouponSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    gap: 16,
  },
  sessionsContainer: {
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  codeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    gap: 20,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: FontSizes.medium,
    color: Colors.black,
    backgroundColor: Colors.background,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.backgroundBox,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.backgroundBox,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sessionInfo: {
    gap: 8,
    paddingLeft: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accessButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
});

export default Edu;

