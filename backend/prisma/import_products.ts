
import { PrismaClient, Prisma } from '@prisma/client';

// Используем String.raw чтобы избежать проблем с обратными слэшами в тексте
const rawText = String.raw`
	 Артикул 	 Наименование 	 К-во, 
 шт 	 Цена, руб. 	 примечание 
 1 	 2 	 3 	 5 	 6 	 7 
 1 	 7228 	 Картина Земля целинная Куприянов Е.А. 1959г. 33х47 к.м. этюд 	 - 	 320 000/ 
 170000 	 
 2 	 7226 	 Картина Хлеб всему голова Лапин Е.А. 1985г.р. х.м. 65х110 рук. Солодухина В.А. 	 1 	 40000 	 
 3 	 7483 	 Картина (Весна березки  проталины) 	 1 	 25000 	 
 4 	 7229 	 Картина Город, которого нет  БабаевГ.Б.. 1992г. 	 1 	 	 
 5 	 7230 	 Картина Джаз Бабаев Г.Б. 1956г. х.м. 62х42 подписная 	 1 	 25000 	 
 6 	 7223 	 Картина А.Аппина /Апич (Омск ул.Лермонтова) 	 1 	 32000 	 
 	 	 	 	 	 
 	 	 КартинаГлаза опускаем до 7000 	 	 10000 	 
 	 
 
 	 	 	 	 
 1 	 7401 	 Картина – Эскиз к театральной пьесе, Э.Бенуа Акварель. 1949 год №7401 	 1 	 200000 	 
 2 	 7227 
 выкуп 	 Картина Снег выпал Заболотько 1966 к/м 30х40 см Омск 1993  Бутакова№1\22 была №7221 	 1 	 18000 	 
 4 	 7281 	 Картина На берегу, Г.Белов 1998г. холст, масло, 33х50 см 	 1 	 7000 	 
 5 	 7279 	 Картина Уфимцев В, 1929 паспарту, подписная (мозаика) 21х32 см 	 1 	 250000 	 
 6 	 000 	 Картина шоколадница 	 1 	 110000 	 
 7 	 7309 	 Картина Осеннее солнце Маиса Бакаева СХ  1974г. картон, масло, 45х60,5 см (дороже по России) 	 1 	 80000 
 100000 сайт 	 
 8 	 7229 	 Картина Гордеева Е. 2002г. х.м. 30х40 см (зима.лодка дерево домики, слева речка) 	 1 	 	 
 9 	 7485 	 Картина Церковь, Т.Д.. картон, масло, 30х30 см (омский художник- до военная) подписана Ерофеева 1990 	 1 	 	 
 10 	 	 Картина Дама в шляпе, Сапожников Александр 2001г., картон, масло, 30х40 см 	 - 	 70000 
 Музей 	 
 11 	 7315 	 Картина В ожидании,  Сапожников 2001г., холст, масло, 	 1 	 70000 	 Комиссия 
 12 	 7290 	 Картина бумага, акварель (музыканты -трио) 25х18см 
 Музыканты В.И.Уфимцев 	 1 	 200 000 	 
 13 	 7203 	 Картина, Г.Г.Олиферов 1991г., холст на картоне, масло, 23,5х30см 	 - 	 35000 	 24.11.07 пр. 
 	 7202 	 Картина, Можаров 1998г.22х30 см (Озерко и луна) 	 1 	 20000 \25000 	 
 14 	 7498 	 Картина Пейзаж с березкой, без подписи, холст, масло, середина 20 века (с вороной на ручье)       На комиссии 	 1 	 90000 	 12000 
 комиссия 
 15 	 7206 	 Картина В лесу 1978г., Сивохин Я.р1920г, картон, масло, 49х35 см,  дарственная надпись 1992г 	 1 	 75000 	 
 16 	 7222 	 Картина Старый Омск в марте Тютина А.В.1984г х.м. 100х800,2007 руководитель:Кравцов Т.А. 	 1 	 35000 	 
 	 7402 
 26.03.19 	 Картина,  холст, масло, 52х77 см, (Лошади и колодец) 
 Академический рисунок –прорисованы детали 	 	 90 000 	 
 	 7221 	 Картина Зима в Таре 1985г. Вильде В.Г. 1953г. 90х80см 	 	 350000 	 
 	 7488 	 Картина, Румянцев Николай, картон, масло, 45х65 см, (Девочка с куклой) 	 	 60 000 	 
 	 7205 	 Картина  Вид Тобольска, холст, масло, 1940-1950 гг., омский художник  (Кондратий Белов?) №7205 	 	 400000 	 
 	 7211 	 Картина В.Кукуйцев  На краю земли. Крым 1977 год  акварель 	 	 55000 	 
 	 7224\ 
 7314 	 Картина Школьники, Шурпин Ф.С., картон, масло, 41х70 см 	 	 	 
 	 7225 	 Картина Перед грозой 1981г. г.Горький Либеров Ю.Д. х/т,м 51х83см 	 	 	 
 	 7313 	 Картина Распутин, холст, масло 56х79см подписная  «Алеше Димитриевичу от питерских цыган 23.03.73» 	 	 700 000
`;

interface ParsedProduct {
  sku: string;
  name: string;
  description: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  needsReview: boolean;
  reviewReason?: string;
}

function processEntry(sku: string, fullName: string, qtyStr: string, priceStr: string, note: string): ParsedProduct | null {
    if (!sku && !fullName) return null;

    let needsReview = false;
    let reviewReason = '';

    // Чистим SKU - оставляем цифры и обратные слеши (они важны для артикулов типа 7224\7314)
    let cleanSku = sku.replace(/[^\d\\]/g, '').trim();
    if (!cleanSku) {
        cleanSku = 'CHECK_' + Math.floor(Math.random() * 10000);
        needsReview = true;
        reviewReason = 'Отсутствует артикул';
    }

    // Краткое название и описание
    let name = fullName;
    let description = '';
    const nameMatch = fullName.match(/^([^,.(]+)(.*)/);
    if (nameMatch) {
        name = nameMatch[1].trim();
        description = nameMatch[2].trim();
    }

    // Количество
    let quantity = 1;
    if (qtyStr === '-' || qtyStr === '0' || !qtyStr) {
        quantity = 0;
    } else {
        const parsedQty = parseInt(qtyStr.replace(/[^\d]/g, ''));
        if (!isNaN(parsedQty)) quantity = parsedQty;
    }

    // Цены
    let purchasePrice = 0;
    let salePrice = 0;

    if (priceStr) {
        let cleanPrice = priceStr.replace(/\s/g, '').replace(/сайт|Музей|пр\.|руб/gi, '');
        
        const multMatch = cleanPrice.match(/(\d+)x(\d+)/i);
        if (multMatch) {
            const p = parseFloat(multMatch[1]);
            purchasePrice = p;
            salePrice = p;
            needsReview = true;
            reviewReason = 'Цена в формате NxM';
        } else {
            const prices = cleanPrice.split(/[\/\\,]/).map(s => {
                const n = parseFloat(s.replace(/[^\d.]/g, ''));
                return isNaN(n) ? null : n;
            }).filter(n => n !== null) as number[];

            if (prices.length >= 2) {
                purchasePrice = Math.min(...prices);
                salePrice = Math.max(...prices);
            } else if (prices.length === 1) {
                salePrice = prices[0];
                purchasePrice = prices[0]; 
                needsReview = true;
                reviewReason = 'Указана только одна цена';
            } else {
                needsReview = true;
                reviewReason = 'Цена не распознана';
            }
        }
    } else {
        needsReview = true;
        reviewReason = 'Цена отсутствует';
    }

    return {
        sku: cleanSku,
        name,
        description: (description + ' ' + note).trim(),
        quantity,
        purchasePrice,
        salePrice,
        needsReview,
        reviewReason
    };
}

function parseProducts(text: string): ParsedProduct[] {
  const lines = text.split('\n');
  const products: ParsedProduct[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('Артикул') || line.startsWith('1 \t 2') || /^\d+ \t \d+ \t \d+/.test(line)) continue;

    const parts = lines[i].split('\t').map(p => p.trim());
    if (parts.length < 3) continue;

    let sku = parts[1] || '';
    let fullName = parts[2] || '';
    let qtyStr = parts[3] || '';
    let priceStr = parts[4] || '';
    let note = parts[5] || '';

    if (!sku && parts[0] && parts[0].length > 2) {
        sku = parts[0];
    }

    if (sku || fullName) {
        const product = processEntry(sku, fullName, qtyStr, priceStr, note);
        if (product) products.push(product);
    }
  }

  return products;
}

const productsData = parseProducts(rawText);

async function seedDatabase() {
    const prisma = new PrismaClient();
    console.log('--- НАЧАЛО ИМПОРТА В БД ---');

    for (const p of productsData) {
        try {
            await prisma.product.upsert({
                where: { sku: p.sku },
                update: {
                    name: p.name,
                    description: p.description,
                    quantity: p.quantity,
                    purchasePrice: new Prisma.Decimal(p.purchasePrice),
                    salePrice: new Prisma.Decimal(p.salePrice),
                },
                create: {
                    sku: p.sku,
                    name: p.name,
                    description: p.description,
                    quantity: p.quantity,
                    purchasePrice: new Prisma.Decimal(p.purchasePrice),
                    salePrice: new Prisma.Decimal(p.salePrice),
                }
            });
            console.log(`OK: ${p.sku}`);
        } catch (e) {
            console.error(`ERROR ${p.sku}:`, e.message);
        }
    }

    const reviewList = productsData.filter(p => p.needsReview).map(p => p.sku);
    console.log('\n--- АРТИКУЛЫ ДЛЯ ПРОВЕРКИ ---');
    console.log(reviewList.join(', '));
    
    await prisma.$disconnect();
}

seedDatabase();
