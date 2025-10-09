import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  FlatList,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: string; // Format: YYYY-MM-DD or YYYY-MM-DD HH:MM
  onDateSelect: (date: string) => void;
  onClose: () => void;
  showTime?: boolean; // Default: false
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  selectedDate,
  onDateSelect,
  onClose,
  showTime = false
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(new Date().getMinutes());

  // Generate years from 1970 to current year + 5 years
  const currentYear = new Date().getFullYear();
  const startYear = 1970;
  const endYear = currentYear + 5;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
  
  // Generate months
  const months = [
    { value: 1, label: 'Ocak' },
    { value: 2, label: 'Şubat' },
    { value: 3, label: 'Mart' },
    { value: 4, label: 'Nisan' },
    { value: 5, label: 'Mayıs' },
    { value: 6, label: 'Haziran' },
    { value: 7, label: 'Temmuz' },
    { value: 8, label: 'Ağustos' },
    { value: 9, label: 'Eylül' },
    { value: 10, label: 'Ekim' },
    { value: 11, label: 'Kasım' },
    { value: 12, label: 'Aralık' },
  ];

  // Generate hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate minutes (0-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Generate days based on selected month and year
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const days = Array.from(
    { length: getDaysInMonth(selectedMonth, selectedYear) }, 
    (_, i) => i + 1
  );

  // Initialize selected values from selectedDate
  useEffect(() => {
    if (selectedDate) {
      if (showTime) {
        // Format: YYYY-MM-DD HH:MM
        const [datePart, timePart] = selectedDate.split(' ');
        if (datePart) {
          const [year, month, day] = datePart.split('-').map(Number);
          if (year && month && day) {
            setSelectedYear(year);
            setSelectedMonth(month);
            setSelectedDay(day);
          }
        }
        if (timePart) {
          const [hour, minute] = timePart.split(':').map(Number);
          if (hour !== undefined && minute !== undefined) {
            setSelectedHour(hour);
            setSelectedMinute(minute);
          }
        }
      } else {
        // Format: YYYY-MM-DD
        const [year, month, day] = selectedDate.split('-').map(Number);
        if (year && month && day) {
          setSelectedYear(year);
          setSelectedMonth(month);
          setSelectedDay(day);
        }
      }
    }
  }, [selectedDate, showTime]);

  const handleConfirm = () => {
    const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    if (showTime) {
      const formattedTime = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
      onDateSelect(`${formattedDate} ${formattedTime}`);
    } else {
      onDateSelect(formattedDate);
    }
    onClose();
  };

  const renderYearItem = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        selectedYear === item && styles.selectedOptionItem
      ]}
      onPress={() => setSelectedYear(item)}
    >
      <Text style={[
        styles.optionText,
        selectedYear === item && styles.selectedOptionText
      ]}>
        {item}
      </Text>
      {selectedYear === item && (
        <Ionicons name="checkmark" size={20} color="#1877F2" />
      )}
    </TouchableOpacity>
  );

  const renderMonthItem = ({ item }: { item: { value: number; label: string } }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        selectedMonth === item.value && styles.selectedOptionItem
      ]}
      onPress={() => setSelectedMonth(item.value)}
    >
      <Text style={[
        styles.optionText,
        selectedMonth === item.value && styles.selectedOptionText
      ]}>
        {item.label}
      </Text>
      {selectedMonth === item.value && (
        <Ionicons name="checkmark" size={20} color="#1877F2" />
      )}
    </TouchableOpacity>
  );

  const renderDayItem = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        selectedDay === item && styles.selectedOptionItem
      ]}
      onPress={() => setSelectedDay(item)}
    >
      <Text style={[
        styles.optionText,
        selectedDay === item && styles.selectedOptionText
      ]}>
        {item}
      </Text>
      {selectedDay === item && (
        <Ionicons name="checkmark" size={20} color="#1877F2" />
      )}
    </TouchableOpacity>
  );

  const renderHourItem = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        selectedHour === item && styles.selectedOptionItem
      ]}
      onPress={() => setSelectedHour(item)}
    >
      <Text style={[
        styles.optionText,
        selectedHour === item && styles.selectedOptionText
      ]}>
        {item.toString().padStart(2, '0')}
      </Text>
      {selectedHour === item && (
        <Ionicons name="checkmark" size={20} color="#1877F2" />
      )}
    </TouchableOpacity>
  );

  const renderMinuteItem = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        selectedMinute === item && styles.selectedOptionItem
      ]}
      onPress={() => setSelectedMinute(item)}
    >
      <Text style={[
        styles.optionText,
        selectedMinute === item && styles.selectedOptionText
      ]}>
        {item.toString().padStart(2, '0')}
      </Text>
      {selectedMinute === item && (
        <Ionicons name="checkmark" size={20} color="#1877F2" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        
        <View style={styles.modalContainer}>
          <SafeAreaView>
            <View style={styles.handle} />
            
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {showTime ? 'Tarih ve Saat Seçin' : 'Doğum Tarihi Seçin'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              {/* Day Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Gün</Text>
                <FlatList
                  data={days}
                  keyExtractor={(item) => item.toString()}
                  renderItem={renderDayItem}
                  style={styles.pickerList}
                  showsVerticalScrollIndicator={false}
                />
              </View>

              {/* Month Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Ay</Text>
                <FlatList
                  data={months}
                  keyExtractor={(item) => item.value.toString()}
                  renderItem={renderMonthItem}
                  style={styles.pickerList}
                  showsVerticalScrollIndicator={false}
                />
              </View>

              {/* Year Picker */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Yıl</Text>
                <FlatList
                  data={years}
                  keyExtractor={(item) => item.toString()}
                  renderItem={renderYearItem}
                  style={styles.pickerList}
                  showsVerticalScrollIndicator={false}
                />
              </View>

              {/* Time Pickers - Only show when showTime is true */}
              {showTime && (
                <>
                  {/* Hour Picker */}
                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerLabel}>Saat</Text>
                    <FlatList
                      data={hours}
                      keyExtractor={(item) => item.toString()}
                      renderItem={renderHourItem}
                      style={styles.pickerList}
                      showsVerticalScrollIndicator={false}
                    />
                  </View>

                  {/* Minute Picker */}
                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerLabel}>Dakika</Text>
                    <FlatList
                      data={minutes}
                      keyExtractor={(item) => item.toString()}
                      renderItem={renderMinuteItem}
                      style={styles.pickerList}
                      showsVerticalScrollIndicator={false}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Selected Date Display */}
            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateText}>
                {showTime 
                  ? `Seçilen Tarih: ${selectedDay} ${months[selectedMonth - 1].label} ${selectedYear} ${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`
                  : `Seçilen Tarih: ${selectedDay} ${months[selectedMonth - 1].label} ${selectedYear}`
                }
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Onayla</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: Colors.lightWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
    shadowColor: 'Colors.black',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    color: Colors.black,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: Colors.lightWhite,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 300,
    paddingHorizontal: 16,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontSize: FontSizes.small,
    fontWeight: 'bold',
    color: Colors.black,
    textAlign: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.lightInput,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  pickerList: {
    flex: 1,
    backgroundColor: Colors.lightWhite,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  selectedOptionItem: {
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
  },
  optionText: {
    fontSize: FontSizes.small,
    color: Colors.black,
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: '#1877F2',
  },
  selectedDateContainer: {
    padding: 16,
    backgroundColor: Colors.lightInput,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    color: Colors.black,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FontSizes.medium,
    color: Colors.gray,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.blue,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: FontSizes.medium,
    color: Colors.lightWhite,
    fontWeight: 'bold',
  },
});

export default DatePickerModal;
