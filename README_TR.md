# Maç Oran Analiz — Android PWA (ilk sürüm)

## Neler var?
- CSV dosyasını cihazdan içe aktarma
- MS1 / MSX / MS2 oranlarını üçlü olarak karşılaştırma
- Tam eşleşme ve yakın eşleşmeyi ayrı gösterme
- Seçilebilir oran toleransı (±0,05 / 0,10 / 0,20 / 0,30 / 0,50)
- Lig filtresi
- Maç tarihi, ev/deplasman takımı, ilk yarı ve maç sonu skorlarını gösterme
- Sonucu hesaplanabilen maçlar üzerinden MS1/MSX/MS2 yüzdeleri
- Eşleşen satırları CSV olarak dışa aktarma
- Service worker ile temel çevrimdışı arayüz önbelleği

## Önemli veri sınırı
Bu uygulama Maçkolik'e bağlanmaz ve kendiliğinden internetten maç veya oran indirmez. Kullanıcı kendi CSV dosyasını yüklemelidir. Gerçek veri olmadan sonuç üretilmez. Veri kaynağının lisansını ve kullanım koşullarını kontrol edin.

## CSV sütunları
Otomatik tanıma için önerilen sütun başlıkları:
- `Date`: tarih
- `Div`: lig
- `HomeTeam`: ev sahibi
- `AwayTeam`: deplasman
- `B365H`, `B365D`, `B365A`: MS1, MSX, MS2 oranları
- `FTHG`, `FTAG`: maç sonu ev/deplasman golü
- `HTHG`, `HTAG`: ilk yarı ev/deplasman golü

Türkçe başlıklar için de otomatik tanıma denenir. Uygulama içindeki sütun eşleştirme alanından manuel seçim yapabilirsiniz. Dosya virgülle ayrılmış CSV olmalıdır. Excel'de **Farklı Kaydet > CSV UTF-8** ile kaydedin.

## Android'de kurulum
PWA kurulum için dosyaların bir HTTPS web adresinde yayınlanması gerekir; `file://` ile açmak kurulum ve çevrimdışı özellikleri için yeterli değildir.

Ücretsiz yayınlama seçenekleri:
1. GitHub hesabında yeni bir depo oluşturun.
2. ZIP içindeki dosyaları depo köküne yükleyin.
3. Depo ayarlarında **Pages** bölümünü açıp `main` dalı ve `/ (root)` klasörünü seçin.
4. Yayınlanan HTTPS adresini Android Chrome'da açın.
5. Chrome menüsü `⋮` > **Ana ekrana ekle** veya **Uygulamayı yükle** seçeneğini kullanın.

Alternatif: HTTPS destekleyen başka bir statik barındırma hizmeti kullanabilirsiniz. Bu dosya paketi herhangi bir hesaba yüklenmiş değildir.

## Kullanım
1. Güvenilir ve kullanımına izin verilen bir kaynaktan geçmiş maç CSV dosyası alın.
2. Uygulamayı açıp CSV dosyasını seçin.
3. Otomatik eşleştirilen sütunları kontrol edin.
4. MS1, MSX ve MS2 oranlarını girin.
5. Toleransı ve isterseniz ligi seçin.
6. **Maçları analiz et** düğmesine basın.
7. Sonuçları görüntüleyin ve isterseniz eşleşmeleri CSV olarak dışa aktarın.

## Eşleştirme mantığı
- Tam eşleşme: her üç oran, iki ondalık basamakta aynı değere yuvarlanır.
- Yakın eşleşme: her üç oran hedef orana ayrı ayrı seçilen tolerans kadar yakın olmalıdır.
- Yakın grup, tam eşleşmeleri tekrar içermez.
- Yüzdeler yalnızca maç sonu ev/deplasman golü mevcut olan kayıtlar üzerinden hesaplanır.
- Eksik skor kayıtları sonuç yüzdesinin paydasına girmez.

## Sınırlamalar
- İlk sürüm yalnızca virgülle ayrılmış CSV okur. Excel `.xlsx` dosyasını doğrudan okumaz; CSV UTF-8 olarak dışa aktarın.
- Farklı veri sağlayıcılarının sütun adları değişebilir; manuel eşleştirme gerekebilir.
- PWA arayüzü çevrimdışı açılabilir; veri dosyasını yükleme ve dışa aktarma cihazda yapılır.
- İlk sürüm otomatik Maçkolik taraması, zamanlanmış veri güncellemesi, API bağlantısı veya APK içermez.
