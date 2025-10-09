import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';
import ReusableButton from './ReusableButton';
import { Sizes } from '@/constants/Sizes';

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({
  visible,
  onClose,
  onAccept
}) => {
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Check if the user has scrolled to the middle (50% of content)
    const scrollPercentage = (contentOffset.y + layoutMeasurement.height) / contentSize.height;
    const isAtMiddle = scrollPercentage >= 0.5; // 50% threshold
    
    if (isAtMiddle && !isScrolledToEnd) {
      setIsScrolledToEnd(true);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.modalContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Üyelik Sözleşmesi</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              ref={scrollViewRef}
              style={styles.scrollView} 
              contentContainerStyle={styles.contentContainer}
              onScroll={handleScroll}
              scrollEventThrottle={400}
            >
             <Text style={styles.termsTitle}>FASONARA ÜYELİK SÖZLEŞMESİ</Text>
              
              <Text style={styles.termsSectionTitle}>1. TANIMLAR</Text>
              
              <Text style={styles.termsText}>
                <Text style={styles.termsBold}>"ŞİRKET":</Text> İşbu "fasonara.com"un sahibi "Eğitim Mah. Şehit Kamil Özdemir Sok. No:31/B Balçova/İzmir" adresinde mukim FASONARA ARACILIK VE PAZARLAMA LİMİTED ŞİRKETİ (bundan böyle kısaca "ŞİRKET/SATICI" anlamı taşımaktadır).
              </Text>
              
              <Text style={styles.termsText}>
                <Text style={styles.termsBold}>"Portal":</Text> www.fasonara.com isimli alan adından ve bu alan adına bağlı alt alan adlarından oluşan "ŞİRKET"in "Hizmetlerini sunduğu internet sitesi ve mobil uygulamaları kapsar.
              </Text>
              
              <Text style={styles.termsText}>
                <Text style={styles.termsBold}>"Kullanıcı":</Text> "Portal"a erişen her Gerçek veya Tüzel kişi.
              </Text>
              
              <Text style={styles.termsText}>
                <Text style={styles.termsBold}>"Üye":</Text> "fasonara.com"a üye olan ve "fasonara.com" dahilinde sunulan hizmetlerden işbu sözleşmede belirtilen koşullar dahilinde yararlanan "Kullanıcı"(Kurumsal ve Bireysel Üye).
              </Text>
              
              <Text style={styles.termsText}>
                <Text style={styles.termsBold}>"Üye olmayan Kullanıcı":</Text> Üye olmaksızın Anasayfa'da ve portal içerisinde bulunan fason firma ilanlarını görüntüleyerek, Fason İş İlanları ve Eleman İlanları ile ilgili arama yapabilen ziyaretçi kullanıcılardır.
              </Text>
              
              <Text style={styles.termsSectionTitle}>2. KULLANIM KOŞULLARI</Text>
              
              <Text style={styles.termsText}>
                www.fasonara.com alan adlı internet sitesini kullanmak için lütfen aşağıda yazılı koşulları okuyunuz. www.fasonara.com internet sitesini ziyaret ederek ve/veya mobil uygulamalarını kullanarak işbu "Kullanım Koşulları"nı okuduğunuzu, içeriğini tamamen anladığınızı kabul, beyan ve taahhüt ediyorsunuz.
              </Text>
              
              <Text style={styles.termsText}>
                Kullanıcı Üyeler tarafından fasonara.com platformunda iş ve hizmet kategorisi iki ana bölümden oluşmaktadır: FASON FİRMA İLANLARI
              </Text>
              
              <Text style={styles.termsSectionTitle}>2.1. Genel Hükümler</Text>
              
              <Text style={styles.termsText}>
                "ŞİRKET/SATICI" işbu "Kullanım Koşulları"nı, "Portal"da yer alan her tür bilgi ve "İçerik"i, "KULLANICI ÜYE/ALICI"ya herhangi bir ihbarda veya bildirimde bulunmadan dilediği zaman değiştirebilir.
              </Text>
              
              <Text style={styles.termsText}>
                "ŞİRKET/SATICI" dilediğinde, tek taraflı olarak işbu "Kullanım Koşulları"nı herhangi bir zamanda "Portal"da ilan ederek değiştirebilir.
              </Text>
              
              <Text style={styles.termsSectionTitle}>2.3. FASONARA.COM HİZMETLERİ</Text>
              
              <Text style={styles.termsText}>
                "ŞİRKET/SATICI", "Üye/Kullanıcılar yada Üye Olmayan/Kullanıcılar" tarafından "FASONARA.COM Veritabanı"na yüklenen içeriklerin görüntülenebilmesini temin etmektedir.
              </Text>
              
              <Text style={styles.termsSectionTitle}>2.3.2. İLAN HİZMETLERİ</Text>
              
              <Text style={styles.termsText}>
                "Üye", "FASONARA Üyelik Hesabı" üzerinden "PORTAL"da belirlenen kurallara uygun olarak ilanlarını yaratacak ve FASONARA.COM Veritabanı'na yükleyecektir.
              </Text>
              
              <Text style={styles.termsText}>
                "ŞİRKET", "Portal"da yayınlanan ilanların hukuka ve ahlaka aykırı olması durumunda "Üye/Kullanıcı"ye herhangi bir ihtarda bulunmadan ilgili ilanının yayınını geçici veya sürekli olarak durdurabilir.
              </Text>
              
              <Text style={styles.termsSectionTitle}>2.3.3. İLAN KATEGORİLERİ</Text>
              
              <Text style={styles.termsText}>
                <Text style={styles.termsBold}>PAKETLER:</Text> Kurumsal Üye/Kullanıcı'nın ilan yayınlayabilmek için süre kısıtlaması bulunan paketlerden herhangi birini satın almasını ifade eder.
              </Text>
              
              <Text style={styles.termsText}>
                <Text style={styles.termsBold}>DOPİNGLER:</Text>
              </Text>
              <Text style={styles.termsText}>
                • Ana Sayfa Vitrini: İlanı listelenen firma Anasayfa Vitrini ve Öne Çıkan Firmalar alanlarında yer alır
              </Text>
              <Text style={styles.termsText}>
                • Kategori Vitrini: İlanı listelenen firma kendi kategorilerinde üst sıralarda yer alır
              </Text>
              <Text style={styles.termsText}>
                • Kalın Yazı: İlanı listelenen firma kategori ve arama sayfalarında kalın yazı ile gösterilir
              </Text>
              <Text style={styles.termsText}>
                • Güncel Firma: İlanı listelenen firma belirli periyotlar ile otomatik güncellenerek ilgili kategorinin ve ana sayfada bulunan firmalar alanında yer alır
              </Text>
              
              <Text style={styles.termsSectionTitle}>2.4. PORTAL KULLANIMINA İLİŞKİN KOŞULLAR</Text>
              
              <Text style={styles.termsText}>
                "Kullanıcılar" hukuka uygun amaçlarla "Portal" üzerinde işlem yapabilirler. "Üyelerin/Kullanıcıların" "Portal" dahilinde yaptığı her işlem ve eylemdeki hukuki ve cezai sorumluluk kendilerine ait olacaktır.
              </Text>
              
              <Text style={styles.termsText}>
                "Portal", "Kullanıcılar" tarafından "FASONARA Veritabanı"na yüklenen "İçerik"lerin görüntülenmesi esasıyla çalışmaktadır. "ŞİRKET", "Kullanıcı"lar tarafından görüntülenen ilan ve "İçerik"lerin doğruluğunu, gerçekliği, güvenliğini ve hukuka uygunluğunu garanti etmemektedir.
              </Text>
              
              <Text style={styles.termsSectionTitle}>3. Gizlilik ve Kişisel Veriler</Text>
              
              <Text style={styles.termsText}>
                "ŞİRKET", "Kullanıcı" bilgilerini kullanabilir, işleyebilir, paylaşabilir, tanıtım ve bilgilendirme amaçlı iletişim faaliyetlerinde, pazarlama faaliyetlerinde ve istatistikî analizler yapmak amacıyla kullanabilir.
              </Text>
              
              <Text style={styles.termsText}>
                KVKK ile ilgili olarak ŞİRKET'in Veri Politikası ve Aydınlatma Beyanları internet sitesinde yayınlanmıştır.
              </Text>
              
              <Text style={styles.termsSectionTitle}>4. Fikri Mülkiyet Hakları</Text>
              
              <Text style={styles.termsText}>
                "Portal" üzerinden erişilen ve/veya görüntülenen içeriğin depolandığı veritabanına yalnızca ilgili içeriklerin görüntülenmesi amacıyla erişilmesi hukuka uygundur. Bunun dışındaki erişimler hukuka aykırı olup; "ŞİRKET"in her tür talep, dava ve takip hakları saklıdır.
              </Text>
              
              <Text style={styles.termsSectionTitle}>5. Sorumluluk Sınırlaması</Text>
              
              <Text style={styles.termsText}>
                "Portal"da verilen hizmetin kesintiye uğraması, bilgi iletiminde aksaklıklar, gecikmeler, başarısızlıklar yaşanması, veri kaybı halinde oluşabilecek her türlü doğrudan ve dolaylı zararlardan "ŞİRKET"in sorumlu tutulamayacağını "Kullanıcı" kabul ve taahhüt etmektedir.
              </Text>
              
              <Text style={styles.termsSectionTitle}>6. Uygulanacak Hukuk</Text>
              
              <Text style={styles.termsText}>
                Bu Sözleşme, Türkiye Cumhuriyeti kanunlarına tabi olacak ve İzmir Mahkemelerinde görülecektir.
              </Text>
              
              <Text style={styles.termsText}>
                Bu Kullanım Sözleşmesi'ni kabul ederek, yukarıda belirtilen tüm şartlara uymayı kabul etmiş olursunuz.
              </Text>
            </ScrollView>
            
            <View style={styles.footer}>
              {!isScrolledToEnd && (
                <Text style={styles.scrollHint}>
                  Sözleşmeyi kabul etmek için ortalarına kadar okuyunuz
                </Text>
              )}
              
              {isScrolledToEnd && (
                <ReusableButton
                  btnText="Kabul Ediyorum"
                  width={Sizes.screenWidth - 80}
                  height={45}
                  borderRadius={10}
                  backgroundColor={Colors.lightBlack}
                  textColor={Colors.lightWhite}
                  textFontFamily="regular"
                  onPress={onAccept}
                />
              )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.lightWhite,
    borderRadius: 20,
    marginHorizontal: 20,
    maxHeight: '90%',
    flex: 1,
    marginVertical: 40,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  termsTitle: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.black,
    textAlign: 'center',
  },
  termsSectionTitle: {
    fontSize: FontSizes.small,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: Colors.black,
  },
  termsText: {
    fontSize: FontSizes.xSmall,
    color: Colors.black,
    marginBottom: 10,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    alignItems: 'center',
    height: 70,
    justifyContent: 'center',
  },
  scrollHint: {
    fontSize: FontSizes.xSmall,
    color: Colors.description,
    fontStyle: 'italic',
  },
  termsBold: {
    fontWeight: 'bold',
  },
  
});

export default TermsModal; 