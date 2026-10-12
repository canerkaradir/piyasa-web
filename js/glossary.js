export const CATEGORIES = ["Faiz ve tahviller", "Merkez bankası", "Ekonomik veriler", "Endeksler ve piyasa", "Hisse değerleme", "Bilanço", "Emtia ve döviz", "Kripto", "Alım satım"];
export const TERMS = [
{
"term": "Tahvil",
"cat": "Faiz ve tahviller",
"what": "Devletin ya da şirketin borç almak için sattığı senet. Alan kişi parayı belli bir süre için ödünç verir, karşılığında düzenli faiz (kupon) alır, vade sonunda parasını geri alır.",
"meaning": "ABD devlet tahvilleri dünyanın en güvenli yatırımı kabul edilir. Faizleri bütün dünyadaki kredilerin ve hisse değerlemelerinin referansıdır.",
"effect": "Tahvilin fiyatı ile faizi ters yönde hareket eder: tahvile talep artarsa fiyatı yükselir, faizi düşer. Satış baskısı olursa fiyatı düşer, faizi yükselir."
},
{
"term": "Tahvil faizi (getiri)",
"cat": "Faiz ve tahviller",
"what": "Tahvili bugünkü fiyatından alıp vadesine kadar tutan kişinin yıllık yüzde olarak kazancı.",
"meaning": "Piyasanın o vadede borç verirken ne kadar faiz istediğini gösterir. Haberlerde '10 yıllık getiri %4,5'e çıktı' denir.",
"effect": "Yükselirse borçlanma pahalılaşır; hisseler, özellikle teknoloji hisseleri ve faiz getirmeyen altın baskı görür. Düşerse tersi olur."
},
{
"term": "2 yıllık tahvil faizi",
"cat": "Faiz ve tahviller",
"what": "ABD Hazinesi'nin 2 yıl vadeli borçlanma faizi.",
"meaning": "Fed'in önümüzdeki 1-2 yıldaki faiz kararlarına dair beklentileri en iyi yansıtan faizdir. Fed'e en duyarlı vadedir.",
"effect": "Yükselirse piyasa Fed'in faizi yüksek tutacağını ya da artıracağını düşünüyor demektir. Sert düşüşü yakında faiz indirimi beklendiğini gösterir."
},
{
"term": "5 yıllık tahvil faizi",
"cat": "Faiz ve tahviller",
"what": "ABD Hazinesi'nin 5 yıl vadeli borçlanma faizi.",
"meaning": "Orta vadeli faiz ve enflasyon beklentisini gösterir. Taşıt kredileri ve şirketlerin orta vadeli borçlanmaları buna göre fiyatlanır.",
"effect": "Yükselmesi, piyasanın önümüzdeki yıllarda da faizlerin ve enflasyonun yüksek kalacağını düşündüğü anlamına gelir. Şirketlerin borçlanması pahalılaşır, hisse değerlemeleri baskı görür. Düşmesi ekonominin yavaşlayacağı ya da enflasyonun gerileyeceği beklentisini yansıtır."
},
{
"term": "10 yıllık tahvil faizi",
"cat": "Faiz ve tahviller",
"what": "ABD Hazinesi'nin 10 yıl vadeli borçlanma faizi. Piyasanın en çok izlediği faizdir.",
"meaning": "Konut kredileri, şirket tahvilleri ve hisse değerlemeleri bu faize göre şekillenir. Uzun vadeli büyüme ve enflasyon beklentisinin özetidir.",
"effect": "Yükselirse hisseler, özellikle gelecekteki kârına göre fiyatlanan Nasdaq şirketleri baskı görür; altın genelde zayıflar, dolar güçlenir. Düşerse hisseler ve altın rahatlar. Ama faiz resesyon korkusuyla düşüyorsa hisseler yine de düşebilir."
},
{
"term": "20 yıllık tahvil faizi",
"cat": "Faiz ve tahviller",
"what": "ABD Hazinesi'nin 20 yıl vadeli borçlanma faizi.",
"meaning": "Çok uzun vadeli enflasyon ve devlet borcu endişelerini yansıtır. Emeklilik fonları ve sigortacılar bu vadeyi yakından izler.",
"effect": "Yükselmesi genelde ABD'nin borç yükü ve uzun vadeli enflasyon konusundaki kaygıları gösterir. Uzun vadeli faizlerin yükselmesi gayrimenkul ve büyüme hisseleri için olumsuzdur."
},
{
"term": "30 yıllık tahvil faizi",
"cat": "Faiz ve tahviller",
"what": "ABD Hazinesi'nin en uzun vadeli tahvilinin faizi.",
"meaning": "30 yıllık konut kredilerinin referansıdır. Devletin bütçe açığı ve borç yükü konusundaki güveni gösterir.",
"effect": "%5'in üstü gibi seviyelere çıkması 'yatırımcılar ABD'ye uzun vadeli borç vermek için daha fazla faiz istiyor' anlamına gelir. Bu, hisselerde ve doların güveninde dalgalanmaya yol açabilir."
},
{
"term": "Getiri eğrisi",
"cat": "Faiz ve tahviller",
"what": "Farklı vadelerdeki (3 ay, 2 yıl, 10 yıl, 30 yıl…) tahvil faizlerinin yan yana çizilmiş hali.",
"meaning": "Normalde uzun vadenin faizi daha yüksektir, çünkü parayı uzun süre bağlamak daha risklidir. Eğrinin şekli piyasanın ekonomiye bakışını gösterir.",
"effect": "Eğri dikleşirse (uzun vadeli faizler kısa vadelilerden daha çok artarsa) büyüme ya da enflasyon beklentisi artıyor demektir. Eğri düzleşirse ekonomik yavaşlama beklentisi güçleniyor demektir."
},
{
"term": "Ters getiri eğrisi",
"cat": "Faiz ve tahviller",
"what": "Kısa vadeli faizin uzun vadeliden yüksek olması; örneğin 2 yıllık faizin 10 yıllıktan yüksek olması.",
"meaning": "Piyasanın 'Fed şimdi faizi yüksek tutuyor ama ileride ekonomi kötüleşince indirmek zorunda kalacak' diye düşündüğünü gösterir.",
"effect": "Tarihsel olarak çoğu ABD resesyonundan önce görülmüştür. Ancak resesyon ters dönmeden bazen 1-2 yıl sonra gelir, bazen hiç gelmez. Eğrinin tekrar normale dönmesi de çoğu zaman yavaşlamanın başladığı dönemdir."
},
{
"term": "2–10 yıl farkı (spread)",
"cat": "Faiz ve tahviller",
"what": "10 yıllık faiz eksi 2 yıllık faiz.",
"meaning": "Getiri eğrisinin eğimini tek sayıyla özetler. Pozitifse eğri normal, negatifse ters demektir.",
"effect": "Negatife dönmesi resesyon uyarısı olarak okunur. Pozitife hızla dönmesi Fed'in faiz indirmeye başladığı dönemlerde görülür."
},
{
"term": "Kupon",
"cat": "Faiz ve tahviller",
"what": "Tahvilin sahibine düzenli olarak ödediği sabit faiz.",
"meaning": "Tahvil ilk çıktığında belirlenir ve değişmez. Piyasa faizi değiştikçe tahvilin fiyatı değişir.",
"effect": ""
},
{
"term": "Kredi riski primi (spread)",
"cat": "Faiz ve tahviller",
"what": "Şirket tahvillerinin, aynı vadeli devlet tahvillerine göre ne kadar fazla faiz ödediği.",
"meaning": "Yatırımcıların şirketlerin batma riskinden ne kadar endişe ettiğini gösterir.",
"effect": "Hızla açılması (artması) piyasada korkunun arttığını, şirketlerin borç bulmakta zorlandığını gösterir. Genelde hisse düşüşleriyle birlikte görülür."
},
{
"term": "Reel faiz",
"cat": "Faiz ve tahviller",
"what": "Faizden enflasyonun çıkarılmış hali. Faiz %5, enflasyon %3 ise reel faiz yaklaşık %2'dir.",
"meaning": "Paranın gerçekte ne kadar kazandırdığını gösterir.",
"effect": "Reel faiz yükselirse faiz getirmeyen altın en çok etkilenen varlıktır ve genelde düşer. Reel faiz düşerse ya da negatife dönerse altın güçlenir."
},
{
"term": "Fed (Federal Reserve)",
"cat": "Merkez bankası",
"what": "ABD Merkez Bankası.",
"meaning": "Dolar faizini belirler. Yılda 8 kez toplanır. Kararları Türkiye saatiyle genelde 21:00'de açıklanır, ardından başkan basın toplantısı yapar. Dünyadaki bütün piyasaları etkileyen en önemli kurumdur.",
"effect": "Fed faiz indirirse ya da indireceği sinyalini verirse genelde hisseler ve altın yükselir, dolar zayıflar. Faizi artırırsa ya da 'uzun süre yüksek tutacağız' derse tersi olur."
},
{
"term": "FOMC",
"cat": "Merkez bankası",
"what": "Fed'in faiz kararını veren 12 kişilik kurul (Federal Açık Piyasa Komitesi).",
"meaning": "Toplantıdan 3 hafta sonra tutanaklar (minutes) yayımlanır; piyasa bunlarda gelecek kararlara dair ipucu arar.",
"effect": ""
},
{
"term": "Politika faizi (fed funds)",
"cat": "Merkez bankası",
"what": "Fed'in belirlediği, bankaların birbirine bir gecelik borç verdiği faizin hedef aralığı (örneğin %4,25–4,50).",
"meaning": "Kredi kartından konut kredisine kadar bütün faizlerin çıkış noktasıdır.",
"effect": "Artırılması ekonomiyi yavaşlatır ve enflasyonla mücadele içindir. İndirilmesi ekonomiyi canlandırır."
},
{
"term": "Nokta grafiği (dot plot)",
"cat": "Merkez bankası",
"what": "Fed üyelerinin her birinin gelecek yıllarda faizin nerede olması gerektiğini düşündüğünü gösteren grafik. Yılda 4 toplantıda yayımlanır.",
"meaning": "Fed'in kendi beklentisini gösterir. Piyasa kendi beklentisini bununla karşılaştırır.",
"effect": "Noktalar beklenenden yüksek gelirse piyasa bunu 'şahin' okur, hisseler düşebilir. Daha düşük gelirse 'güvercin' okunur."
},
{
"term": "Şahin / güvercin",
"cat": "Merkez bankası",
"what": "Şahin: enflasyonla mücadele için faizi yüksek tutmayı savunan. Güvercin: büyümeyi desteklemek için faizi düşürmeyi savunan.",
"meaning": "Fed üyelerinin konuşmaları bu iki uca göre yorumlanır.",
"effect": "Şahin açıklamalar genelde hisseleri ve altını düşürür, doları güçlendirir. Güvercin açıklamalar tersini yapar."
},
{
"term": "Niceliksel genişleme (QE) / sıkılaştırma (QT)",
"cat": "Merkez bankası",
"what": "QE: Merkez bankasının para basıp tahvil satın alması. QT: Elindeki tahvilleri azaltarak piyasadan para çekmesi.",
"meaning": "Piyasadaki para miktarını (likiditeyi) doğrudan etkiler.",
"effect": "QE dönemleri hisse, altın ve kripto gibi varlıkları genelde yukarı taşır. QT ise likiditeyi azaltır, riskli varlıklar için olumsuzdur."
},
{
"term": "Fed faiz beklentisi (FedWatch)",
"cat": "Merkez bankası",
"what": "Vadeli işlem fiyatlarından hesaplanan, bir sonraki toplantıda faiz indirimi ya da artışı olasılığı.",
"meaning": "Piyasanın neyi beklediğini gösterir. Fed genelde piyasayı şaşırtmamaya çalışır.",
"effect": "Karar beklentiyle aynıysa piyasa genelde az tepki verir. Asıl hareket sürprizlerde ve açıklamanın tonunda olur."
},
{
"term": "Beklenti (konsensüs)",
"cat": "Ekonomik veriler",
"what": "Analistlerin bir veri ya da bilanço için ortalama tahmini.",
"meaning": "Piyasa açıklanan rakamı her zaman beklentiyle karşılaştırır.",
"effect": "'İyi' bir rakam beklentinin altında kalırsa fiyat düşebilir. Bu yüzden rakamın kendisinden çok beklentiden farkı önemlidir."
},
{
"term": "CPI (TÜFE)",
"cat": "Ekonomik veriler",
"what": "Tüketici fiyat endeksi; ABD'de enflasyonun ana göstergesi. Her ay ortasında, Türkiye saatiyle 15:30'da açıklanır.",
"meaning": "'Çekirdek CPI' gıda ve enerjiyi dışarıda bırakır; Fed buna daha çok bakar.",
"effect": "Beklentiden yüksek gelirse faiz indirimi ihtimali azalır: hisseler ve altın düşebilir, dolar ve tahvil faizleri yükselir. Düşük gelirse tersi olur."
},
{
"term": "PCE",
"cat": "Ekonomik veriler",
"what": "Kişisel tüketim harcamaları fiyat endeksi. Fed'in en çok önem verdiği enflasyon ölçüsüdür.",
"meaning": "Fed'in %2 enflasyon hedefi bu göstergeye göredir.",
"effect": "CPI ile aynı yönde etki yapar; beklentiden yüksek gelmesi faiz indirimlerini geciktirir."
},
{
"term": "PPI (ÜFE)",
"cat": "Ekonomik veriler",
"what": "Üretici fiyat endeksi; şirketlerin üretim maliyetlerindeki değişim.",
"meaning": "Üreticilerin maliyetleri birkaç ay içinde tüketici fiyatlarına yansıyabileceği için CPI'nin öncü göstergesi sayılır.",
"effect": "Yüksek gelmesi enflasyonun inatçı kalacağı endişesini artırır."
},
{
"term": "Tarım dışı istihdam (NFP)",
"cat": "Ekonomik veriler",
"what": "ABD'de bir ayda tarım dışı sektörlerde eklenen yeni iş sayısı. Genelde ayın ilk cuması 15:30'da açıklanır.",
"meaning": "Aynı raporda işsizlik oranı ve ücret artışları da yer alır. Ekonominin sağlığını gösteren en önemli veridir.",
"effect": "Çok güçlü gelirse Fed faizi indirmekte acele etmez: dolar ve faizler yükselir, altın düşebilir. Zayıf gelirse faiz indirimi ihtimali artar; ama çok zayıfsa resesyon korkusu hisseleri düşürebilir."
},
{
"term": "İşsizlik oranı",
"cat": "Ekonomik veriler",
"what": "İş arayan ama bulamayanların iş gücüne oranı.",
"meaning": "Fed'in iki görevinden biri tam istihdamdır. İşsizlik yükselirse Fed ekonomiyi desteklemek için faiz indirmeye yönelir.",
"effect": "Beklenmedik yükseliş faiz indirimi beklentisini artırır; altın için genelde olumlu, dolar için olumsuzdur. Hisseler için 'faiz düşecek' sevinci ile 'ekonomi yavaşlıyor' korkusu arasında kalır."
},
{
"term": "Haftalık işsizlik başvuruları",
"cat": "Ekonomik veriler",
"what": "Her perşembe açıklanan, o hafta işsizlik maaşı için başvuran kişi sayısı.",
"meaning": "İş piyasasındaki değişimi en hızlı gösteren veridir.",
"effect": "Sürekli yükselmesi iş piyasasının zayıfladığını gösterir."
},
{
"term": "GSYH (GDP)",
"cat": "Ekonomik veriler",
"what": "Gayrisafi yurt içi hasıla; ekonominin bir dönemde ürettiği toplam değer. Büyüme oranı yıllıklandırılarak verilir.",
"meaning": "Üst üste iki çeyrek küçülme genelde 'teknik resesyon' sayılır.",
"effect": "Güçlü büyüme şirket kârları için iyidir ama faiz indirimi ihtimalini azaltır. Zayıf büyüme resesyon korkusu yaratır."
},
{
"term": "PMI / ISM",
"cat": "Ekonomik veriler",
"what": "Satın alma yöneticileri endeksi; şirket yöneticilerine yapılan anketle sanayi ve hizmet sektörünün durumunu ölçer.",
"meaning": "50'nin üstü büyüme, altı daralma demektir. Ay başında açıklanır ve ekonominin öncü göstergesidir.",
"effect": "50'nin altına düşmesi ya da sert gerilemesi yavaşlama sinyalidir."
},
{
"term": "Perakende satışlar",
"cat": "Ekonomik veriler",
"what": "Mağazalarda ve internette yapılan toplam satışlardaki aylık değişim.",
"meaning": "ABD ekonomisinin yaklaşık %70'i tüketime dayandığı için tüketicinin gücünü gösterir.",
"effect": "Güçlü gelirse ekonomi için olumlu ama enflasyon ve faiz endişesini artırabilir."
},
{
"term": "Tüketici güveni",
"cat": "Ekonomik veriler",
"what": "Halkın ekonomiye ve kendi mali durumuna bakışını ölçen anket (Michigan, Conference Board).",
"meaning": "Gelecekteki harcamaların öncü göstergesidir. Michigan anketi ayrıca enflasyon beklentisini de ölçer.",
"effect": "Düşmesi harcamaların azalabileceğine işaret eder."
},
{
"term": "Resesyon",
"cat": "Ekonomik veriler",
"what": "Ekonominin belirgin ve yaygın şekilde daralması.",
"meaning": "Şirket kârlarını ve istihdamı düşürür.",
"effect": "Hisseler için olumsuzdur. Faiz indirimlerini hızlandırdığı ve güvenli liman talebi yarattığı için altını destekleyebilir."
},
{
"term": "Stagflasyon",
"cat": "Ekonomik veriler",
"what": "Ekonomi durgunken enflasyonun yüksek kalması.",
"meaning": "Merkez bankasını en zor durumda bırakan senaryodur: faizi düşürse enflasyon artar, artırsa ekonomi daha da kötüleşir.",
"effect": "Hisseler için çok olumsuz, altın için tarihsel olarak olumludur (1970'ler)."
},
{
"term": "S&P 500",
"cat": "Endeksler ve piyasa",
"what": "ABD'nin en büyük 500 şirketinden oluşan endeks.",
"meaning": "ABD borsasının genel durumunu en iyi gösteren ölçüdür. Şirketler piyasa değerine göre ağırlıklandırılır; birkaç dev teknoloji şirketi endeksi tek başına sürükleyebilir.",
"effect": ""
},
{
"term": "Nasdaq",
"cat": "Endeksler ve piyasa",
"what": "Teknoloji ağırlıklı borsa. 'Nasdaq' denince genelde Nasdaq Composite ya da en büyük 100 şirketi içeren Nasdaq-100 kastedilir.",
"meaning": "Gelecekteki büyümelerine göre fiyatlanan şirketler ağırlıkta olduğu için faiz değişimlerine en duyarlı endekstir.",
"effect": "Faizler düştüğünde genelde S&P 500'den daha çok yükselir, faizler arttığında daha çok düşer."
},
{
"term": "Dow Jones",
"cat": "Endeksler ve piyasa",
"what": "30 büyük ABD şirketinden oluşan en eski endeks.",
"meaning": "Şirketler hisse fiyatına göre ağırlıklandırılır (piyasa değerine göre değil). Daha geleneksel sektörleri temsil eder.",
"effect": ""
},
{
"term": "Russell 2000",
"cat": "Endeksler ve piyasa",
"what": "ABD'nin 2.000 küçük şirketinden oluşan endeks.",
"meaning": "Küçük şirketler daha çok borçla çalıştığı ve iç pazara bağlı olduğu için faizlere ve ABD ekonomisine daha duyarlıdır.",
"effect": "Faiz indirimi beklentisi arttığında genelde büyük şirketlerden daha hızlı yükselir."
},
{
"term": "BIST 30 / BIST 100",
"cat": "Endeksler ve piyasa",
"what": "Borsa İstanbul'un en büyük 30 ve 100 şirketinden oluşan endeksleri.",
"meaning": "Türk hisselerinin genel durumunu gösterir. TL bazlı olduğu için dolar bazında ayrıca değerlendirilmelidir.",
"effect": ""
},
{
"term": "VIX (korku endeksi)",
"cat": "Endeksler ve piyasa",
"what": "S&P 500 opsiyon fiyatlarından hesaplanan, piyasanın önümüzdeki 30 günde ne kadar dalgalanmasını beklediği.",
"meaning": "15'in altı sakin, 15–25 normal, 25'in üstü korku dönemidir.",
"effect": "Hisseler sert düşerken VIX yükselir. Çok yüksek VIX seviyeleri tarihsel olarak çoğu zaman korkunun zirve yaptığı dönemlere denk gelmiştir."
},
{
"term": "Boğa / ayı piyasası",
"cat": "Endeksler ve piyasa",
"what": "Boğa: fiyatların uzun süre yükseldiği dönem. Ayı: zirveden %20'den fazla düşüş yaşanan dönem.",
"meaning": "Piyasanın genel ruh halini anlatır.",
"effect": ""
},
{
"term": "Düzeltme",
"cat": "Endeksler ve piyasa",
"what": "Bir endeksin ya da hissenin zirvesinden %10–20 arası düşmesi.",
"meaning": "Yükseliş dönemlerinde sık görülen, olağan bir geri çekilmedir.",
"effect": ""
},
{
"term": "Risk iştahı (risk-on / risk-off)",
"cat": "Endeksler ve piyasa",
"what": "Risk-on: yatırımcıların hisse, kripto gibi riskli varlıklara yöneldiği dönem. Risk-off: güvenli limanlara kaçtığı dönem.",
"meaning": "Haberlerin piyasaya etkisini anlamak için kullanılan bir çerçevedir.",
"effect": "Risk-off dönemlerinde altın, dolar ve ABD tahvilleri talep görür; hisseler ve kripto düşer."
},
{
"term": "Güvenli liman",
"cat": "Endeksler ve piyasa",
"what": "Belirsizlik dönemlerinde paranın kaçtığı varlıklar: altın, ABD tahvilleri, İsviçre frangı, Japon yeni.",
"meaning": "Savaş, kriz ya da panik haberlerinde talep görürler.",
"effect": ""
},
{
"term": "Likidite",
"cat": "Endeksler ve piyasa",
"what": "Bir varlığın fiyatı fazla oynamadan ne kadar kolay alınıp satılabildiği; ayrıca piyasadaki toplam para miktarı.",
"meaning": "Az işlem gören küçük hisselerde likidite düşüktür; büyük alım ya da satım fiyatı sert oynatabilir.",
"effect": "Piyasadaki para (likidite) arttığında riskli varlıklar genelde yükselir."
},
{
"term": "Piyasa değeri",
"cat": "Hisse değerleme",
"what": "Hisse fiyatı × toplam hisse sayısı. Şirketin borsadaki toplam değeri.",
"meaning": "Şirketleri büyüklüğe göre sıralarken kullanılır. Genel olarak 10 milyar doların üstü büyük, 2–10 milyar orta, 2 milyarın altı küçük şirket sayılır.",
"effect": "Küçük şirketler daha hızlı büyüyebilir ama çok daha risklidir ve sert dalgalanır."
},
{
"term": "F/K oranı",
"cat": "Hisse değerleme",
"what": "Hisse fiyatı / hisse başına yıllık kâr.",
"meaning": "Yatırımcının şirketin 1 dolarlık kârı için kaç dolar ödediğini gösterir. F/K 20 ise şirket bugünkü kârıyla piyasa değerini yaklaşık 20 yılda kazanır.",
"effect": "Sektöre göre çok değişir: bankalarda 10–15 normalken yazılım şirketlerinde 40 ve üstü görülebilir. Çok yüksek F/K, büyük büyüme beklentisini gösterir; beklenti tutmazsa hisse sert düşebilir. F/K'nın düşük olması her zaman ucuzluk değildir, kârın düşeceği beklentisini de yansıtabilir."
},
{
"term": "İleriye dönük F/K",
"cat": "Hisse değerleme",
"what": "Bugünkü fiyat / analistlerin önümüzdeki 12 ay için beklediği hisse başına kâr.",
"meaning": "Piyasa geleceğe baktığı için çoğu zaman bugünkü F/K'dan daha anlamlıdır.",
"effect": "Bugünkü F/K'dan belirgin şekilde düşükse kârın hızla artması bekleniyor demektir."
},
{
"term": "PEG oranı",
"cat": "Hisse değerleme",
"what": "F/K oranının kâr büyüme hızına bölümü.",
"meaning": "Hızlı büyüyen şirketlerin yüksek F/K'sını adil şekilde değerlendirmeye yarar. 1 civarı makul kabul edilir.",
"effect": "1'in çok üstü büyümeye göre pahalı, altı ise büyümeye göre ucuz olabileceğini gösterir."
},
{
"term": "PD/DD (fiyat/defter değeri)",
"cat": "Hisse değerleme",
"what": "Piyasa değerinin, şirketin muhasebe kayıtlarındaki öz varlığına bölümü.",
"meaning": "Özellikle bankalarda ve sanayi şirketlerinde kullanılır. 1'in altı, şirketin varlıklarından daha ucuza işlem gördüğü anlamına gelir.",
"effect": ""
},
{
"term": "Fiyat/Satış (F/S)",
"cat": "Hisse değerleme",
"what": "Piyasa değerinin yıllık gelire bölümü.",
"meaning": "Henüz kâr etmeyen şirketlerde F/K yerine kullanılır.",
"effect": "10'un üstü çok yüksek büyüme beklentisi demektir; küçük teknoloji şirketlerinde 20-50 bile görülebilir, bu da büyük risk taşır."
},
{
"term": "FD/FAVÖK (EV/EBITDA)",
"cat": "Hisse değerleme",
"what": "Şirket değerinin (piyasa değeri + net borç), faiz, vergi ve amortisman öncesi kâra bölümü.",
"meaning": "Borç yapıları farklı şirketleri karşılaştırmak için F/K'dan daha adil bir ölçüdür.",
"effect": ""
},
{
"term": "Beta",
"cat": "Hisse değerleme",
"what": "Hissenin piyasaya göre ne kadar oynak olduğu.",
"meaning": "1 = piyasayla aynı. 2 = piyasa %1 oynadığında bu hisse ortalama %2 oynar.",
"effect": "Yüksek beta yükselişte daha çok kazandırır, düşüşte daha çok kaybettirir."
},
{
"term": "Temettü ve temettü verimi",
"cat": "Hisse değerleme",
"what": "Şirketin kârından ortaklarına dağıttığı pay ve bunun hisse fiyatına oranı.",
"meaning": "Olgun şirketler düzenli temettü dağıtır. Büyüme şirketleri kârı yeniden yatırdığı için az ya da hiç dağıtmaz.",
"effect": "Temettünün kesilmesi genelde şirketin zorda olduğu sinyalidir ve hisseyi sert düşürebilir."
},
{
"term": "Hisse geri alımı",
"cat": "Hisse değerleme",
"what": "Şirketin kendi hisselerini borsadan satın alması.",
"meaning": "Hisse sayısı azaldığı için hisse başına kâr artar. Yönetimin hisseyi ucuz bulduğu sinyali olarak da okunur.",
"effect": "Büyük geri alım programı açıklamaları genelde hisseye olumlu yansır."
},
{
"term": "Halka arz",
"cat": "Hisse değerleme",
"what": "Şirketin hisselerini ilk kez borsada satışa sunması.",
"meaning": "Şirketler büyümek için para toplar. İlk günlerde fiyat çok oynak olabilir.",
"effect": ""
},
{
"term": "Açığa satış",
"cat": "Hisse değerleme",
"what": "Sahip olmadığı hisseyi ödünç alıp satarak fiyat düşüşünden kazanmaya çalışmak.",
"meaning": "Bir hissede açığa satış oranı yüksekse birçok yatırımcı düşüş bekliyor demektir.",
"effect": "Açığa satışı yüksek bir hisse beklenmedik şekilde yükselirse açığa satanlar zarar kesmek için almak zorunda kalır; bu, sert bir yükselişe yol açabilir (short squeeze)."
},
{
"term": "Bilanço dönemi",
"cat": "Bilanço",
"what": "Şirketlerin 3 aylık mali sonuçlarını açıkladığı dönem. Ocak, nisan, temmuz ve ekim aylarının ortasında başlar.",
"meaning": "Büyük teknoloji şirketlerinin sonuçları bütün piyasanın yönünü belirleyebilir.",
"effect": ""
},
{
"term": "Gelir (ciro)",
"cat": "Bilanço",
"what": "Şirketin sattığı ürün ve hizmetlerin toplamı.",
"meaning": "Büyümenin en temel göstergesidir; maliyetler düşülmeden önceki rakamdır.",
"effect": "Gelir büyümesinin yavaşlaması, kâr iyi olsa bile hissede düşüşe yol açabilir."
},
{
"term": "Hisse başına kâr (HBK / EPS)",
"cat": "Bilanço",
"what": "Net kârın hisse sayısına bölümü.",
"meaning": "Bilançolarda en çok bakılan rakamdır ve beklentiyle karşılaştırılır.",
"effect": "Beklentiyi aşması genelde hisseyi yükseltir; ama gelecek dönem beklentisi zayıfsa yine de düşebilir."
},
{
"term": "Gelecek dönem beklentisi (guidance)",
"cat": "Bilanço",
"what": "Şirket yönetiminin önümüzdeki çeyrek ya da yıl için verdiği gelir ve kâr tahmini.",
"meaning": "Piyasa geleceği fiyatladığı için bu, çoğu zaman açıklanan sonuçlardan daha önemlidir.",
"effect": "Beklentinin yükseltilmesi hisseyi güçlü taşır; düşürülmesi sonuçlar iyi olsa bile sert düşüşe yol açabilir."
},
{
"term": "Brüt kâr marjı",
"cat": "Bilanço",
"what": "Satışlardan sadece ürünün doğrudan maliyeti düşüldükten sonra kalan pay.",
"meaning": "Şirketin fiyatlama gücünü gösterir. Yazılım ve çip şirketlerinde %60'ın üstü olağandır.",
"effect": "Marjın gerilemesi rekabetin arttığını ya da maliyetlerin yükseldiğini gösterir."
},
{
"term": "Net kâr marjı",
"cat": "Bilanço",
"what": "Her 100 dolarlık satıştan bütün giderler ve vergiler düştükten sonra kalan kâr.",
"meaning": "Şirketin genel kârlılığını gösterir.",
"effect": ""
},
{
"term": "FAVÖK (EBITDA)",
"cat": "Bilanço",
"what": "Faiz, vergi, amortisman öncesi kâr.",
"meaning": "Şirketin ana faaliyetlerinden ne kadar nakit ürettiğine dair kaba bir ölçüdür.",
"effect": ""
},
{
"term": "Serbest nakit akışı",
"cat": "Bilanço",
"what": "Şirketin faaliyetlerinden elde ettiği nakitten yatırım harcamaları düşüldükten sonra kalan para.",
"meaning": "Temettü, hisse geri alımı ve borç ödemesi bu paradan yapılır. Muhasebe kârından daha zor 'makyajlanır'.",
"effect": ""
},
{
"term": "Özsermaye kârlılığı (ROE)",
"cat": "Bilanço",
"what": "Net kârın, ortakların şirkete koyduğu sermayeye oranı.",
"meaning": "Şirketin sermayeyi ne kadar verimli kullandığını gösterir. %15'in üstü genelde iyi kabul edilir.",
"effect": ""
},
{
"term": "Borç / Özsermaye",
"cat": "Bilanço",
"what": "Şirketin borcunun, ortaklarının sermayesine oranı.",
"meaning": "Yüksek borç, faizler arttığında ve kötü dönemlerde şirketi zorlar.",
"effect": "Faiz artış dönemlerinde borcu yüksek şirketler daha çok zarar görür."
},
{
"term": "Ons",
"cat": "Emtia ve döviz",
"what": "Altın ve gümüşün uluslararası ağırlık birimi. 1 ons yaklaşık 31,1 gramdır.",
"meaning": "Dünyada altın ve gümüş fiyatı ons başına dolar olarak verilir.",
"effect": ""
},
{
"term": "Spot fiyat / vadeli fiyat",
"cat": "Emtia ve döviz",
"what": "Spot: bugün teslim için geçerli fiyat. Vadeli: ileri bir tarihte teslim için bugünden anlaşılan fiyat.",
"meaning": "Vadeli fiyat taşıma maliyeti ve faiz nedeniyle genelde spottan biraz yüksektir.",
"effect": ""
},
{
"term": "Altın / gümüş oranı",
"cat": "Emtia ve döviz",
"what": "1 ons altınla kaç ons gümüş alınabildiği.",
"meaning": "Uzun dönem ortalaması 60–70 civarıdır.",
"effect": "Oran yüksekse gümüş altına göre ucuz, düşükse pahalı kabul edilir."
},
{
"term": "Merkez bankası altın alımları",
"cat": "Emtia ve döviz",
"what": "Ülkelerin merkez bankalarının rezervlerine altın eklemesi.",
"meaning": "Son yıllarda Çin, Polonya, Türkiye, Hindistan gibi ülkeler büyük alıcılar oldu. Dolara bağımlılığı azaltma isteğiyle ilişkilidir.",
"effect": "Alımların artması altın fiyatını destekler; yavaşlaması önemli bir desteği ortadan kaldırır."
},
{
"term": "Dolar endeksi (DXY)",
"cat": "Emtia ve döviz",
"what": "Doların euro, yen, sterlin gibi 6 büyük para birimine karşı değeri.",
"meaning": "Doların genel gücünü gösterir.",
"effect": "Yükselirse dolar cinsinden fiyatlanan altın, gümüş ve petrol genelde düşer; ABD dışındaki ekonomiler zorlanır. Düşerse tersi olur."
},
{
"term": "Brent / WTI petrol",
"cat": "Emtia ve döviz",
"what": "Dünyada referans alınan iki petrol türü. Brent Avrupa, WTI ABD fiyatıdır.",
"meaning": "Petrol enflasyonu doğrudan etkilediği için merkez bankası kararlarını da etkiler.",
"effect": "Petrol yükselirse enflasyon beklentisi artar, faiz indirimleri gecikebilir. Enerji şirketleri kazanır, havayolu gibi yakıt tüketen şirketler zarar görür."
},
{
"term": "OPEC+",
"cat": "Emtia ve döviz",
"what": "Suudi Arabistan ve Rusya'nın öncülük ettiği petrol üreticisi ülkeler grubu.",
"meaning": "Üretim kotalarıyla petrol arzını ve fiyatını etkiler.",
"effect": "Üretim kesintisi kararı petrolü yükseltir, üretim artırımı düşürür."
},
{
"term": "Piyasa değeri (kripto)",
"cat": "Kripto",
"what": "Fiyat × dolaşımdaki arz.",
"meaning": "Kripto paraları büyüklüğe göre sıralamak için kullanılır.",
"effect": ""
},
{
"term": "Dolaşımdaki arz",
"cat": "Kripto",
"what": "Şu an piyasada serbestçe alınıp satılabilen coin miktarı.",
"meaning": "Piyasa değeri bu miktarla hesaplanır.",
"effect": ""
},
{
"term": "Toplam arz",
"cat": "Kripto",
"what": "Bugüne kadar oluşturulmuş bütün coinler; kilitli olanlar dahil, yakılanlar hariç.",
"meaning": "Dolaşımdaki arzdan büyükse aradaki fark kilitli ya da henüz dağıtılmamış coinlerdir.",
"effect": ""
},
{
"term": "Maksimum arz",
"cat": "Kripto",
"what": "Protokolün izin verdiği en yüksek coin sayısı.",
"meaning": "Bitcoin'de 21 milyonla sınırlıdır. Ethereum gibi bazı coinlerde sabit bir üst sınır yoktur.",
"effect": "Sınırlı arz, talep arttıkça kıtlık yaratır; bu Bitcoin'in 'dijital altın' denmesinin nedenlerinden biridir."
},
{
"term": "Tam seyreltilmiş değerleme (FDV)",
"cat": "Kripto",
"what": "Fiyat × maksimum arz. Bütün coinler bugünkü fiyattan piyasada olsaydı toplam değer.",
"meaning": "Piyasa değeriyle arasındaki fark, ileride piyasaya girecek coin miktarını gösterir.",
"effect": "FDV piyasa değerinin çok üstündeyse, kilit açıldıkça yeni arz fiyat üzerinde satış baskısı yaratabilir."
},
{
"term": "Kilit açılımı (token unlock)",
"cat": "Kripto",
"what": "Ekibe, yatırımcılara ya da vakfa ayrılmış kilitli coinlerin takvime göre serbest kalması.",
"meaning": "Büyük açılımlar önceden duyurulur.",
"effect": "Açılım öncesinde ve sırasında fiyat çoğu zaman baskı görür, çünkü yeni sahipler satabilir."
},
{
"term": "Halving (yarılanma)",
"cat": "Kripto",
"what": "Bitcoin madencilerinin aldığı ödülün yaklaşık 4 yılda bir yarıya inmesi.",
"meaning": "Yeni Bitcoin arzının hızını yavaşlatır.",
"effect": "Tarihsel olarak halving'i izleyen 12–18 ayda güçlü yükselişler görüldü, ama bunun her seferinde tekrarlanacağının garantisi yoktur."
},
{
"term": "Stablecoin",
"cat": "Kripto",
"what": "Değeri dolara sabitlenmiş kripto para (USDT, USDC gibi).",
"meaning": "Kripto piyasasında nakit gibi kullanılır.",
"effect": "Stablecoin arzının artması kripto piyasasına yeni para girdiğinin işareti olarak okunur."
},
{
"term": "Kripto ETF",
"cat": "Kripto",
"what": "Bitcoin ya da Ethereum'u takip eden, normal borsada işlem gören fon.",
"meaning": "Kurumsal yatırımcıların kriptoya girişini kolaylaştırdı.",
"effect": "ETF'lere güçlü para girişi fiyatı destekler, çıkışlar baskı yaratır."
},
{
"term": "Piyasa öncesi / kapanış sonrası",
"cat": "Alım satım",
"what": "ABD borsasının normal seansı dışında (Türkiye saatiyle yaklaşık 11:00–16:30 ve 23:00–03:00) yapılan işlemler.",
"meaning": "Bilançolar genelde kapanıştan sonra açıklandığı için büyük hareketler önce burada görülür. İşlem hacmi düşüktür.",
"effect": ""
},
{
"term": "Destek / direnç",
"cat": "Alım satım",
"what": "Destek: fiyatın düşerken durma eğiliminde olduğu seviye. Direnç: yükselirken zorlandığı seviye.",
"meaning": "Teknik analizde kullanılan, alıcıların ve satıcıların yoğunlaştığı fiyat bölgeleri.",
"effect": "Önemli bir direncin kırılması yükselişin hızlanmasına, desteğin kırılması düşüşün hızlanmasına yol açabilir."
},
{
"term": "Hareketli ortalama",
"cat": "Alım satım",
"what": "Son belli sayıda günün ortalama fiyatı (ör. 50 günlük, 200 günlük).",
"meaning": "Fiyatın genel eğilimini gösterir. Fiyat 200 günlük ortalamanın üstündeyse uzun vadeli eğilim genelde yukarı kabul edilir.",
"effect": ""
},
{
"term": "Volatilite (oynaklık)",
"cat": "Alım satım",
"what": "Fiyatın ne kadar sert ve sık dalgalandığı.",
"meaning": "Yüksek volatilite hem fırsat hem risk demektir.",
"effect": ""
},
{
"term": "Çeşitlendirme",
"cat": "Alım satım",
"what": "Parayı farklı varlıklara, sektörlere ve ülkelere dağıtmak.",
"meaning": "Tek bir yatırımın kötü gitmesinin toplam portföyü fazla etkilemesini önler.",
"effect": ""
},
{
"term": "Dolar maliyet ortalaması (DCA)",
"cat": "Alım satım",
"what": "Belirli aralıklarla sabit tutarda alım yapmak.",
"meaning": "Doğru zamanı tahmin etme baskısını azaltır; fiyat düşükken daha çok, yüksekken daha az alınmış olur.",
"effect": ""
}
];
