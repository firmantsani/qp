const puppeteer = require('puppeteer');
const path = require('path');
const readline = require('readline');
const axios = require('axios');
async function kirimPesanTelegram(pesan) {
    const botToken = '7703648204:AAFQcr2bqGqbKJ4fhnBi_Bpdi5ny02fuHuc';
    const chatId = '-4648493371';
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        await axios.post(url, { chat_id: chatId, text: pesan });
    } catch (error) {
        console.error('Gagal mengirim log ke Telegram:', error.message);
    }
}
const phoneNumber = process.argv[2];
if (!phoneNumber) {
  console.error("Silakan masukkan nomor telepon.");
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Pilih nomial voucher alfa (100k/50k/25k): ', async (answer) => {
  let productId, skuId;
  switch(answer) {
    case '100k':
      productId = '1827';
      skuId = '1827';
      break;
    case '50k':
      productId = '1826';
      skuId = '1826';
      break;
    case '25k':
      productId = '1828';
      skuId = '1828';
      break;
    default:
      console.error("pilihan tidak valid.");
      process.exit(1);
  }
  rl.close();

  const USER_DATA_DIR = path.resolve(__dirname, `user_data_${phoneNumber}`);

  (async () => {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-geolocation',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      userDataDir: USER_DATA_DIR
    });
    const page = await browser.newPage();

    const setMobileViewport = async (page) => {
      await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; M2101K6G Build/TKQ1.221114.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/133.0.6943.23 Mobile Safari/537.36 QponApp/40.8.38.1');
      await page.setViewport({
        width: 320,
        height: 640,
        isMobile: true,
        hasTouch: true
      });
    };

    await setMobileViewport(page);
    await page.goto('https://www.qpon.id/platform/home/account');
    await page.waitForSelector('body');

    const inputSelector = 'input[type="tel"]';
    const inputVisible = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element && element.offsetParent !== null;
    }, inputSelector);

    if (inputVisible) {
      await page.focus(inputSelector);
      await page.type(inputSelector, phoneNumber);

      const buttonSelector = 'button._send-btn_1dhmh_5';
      await page.waitForSelector(buttonSelector);
      await page.evaluate((buttonSelector) => {
        document.querySelector(buttonSelector).click();
      }, buttonSelector);

      const waitForEnterPress = () => {
        return new Promise((resolve) => {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          rl.question('Selesaikan captcha lalu tekan Enter untuk melanjutkan', () => {
            rl.close();
            resolve();
          });
        });
      };

      await waitForEnterPress();
      console.log('lanjutkan..');
    }

    const waitUntilEnabled = async (page, selector) => {
      while (true) {
        const buttonState = await page.evaluate((selector) => {
          const button = document.querySelector(selector);
          if (button && button.classList.contains('adm-button-disabled')) {
            console.log('Habis');
            return "disabled";
          }
          return "enabled";
        }, selector);

        if (buttonState === "enabled") {
          break;
        }

        console.log('Habis, refresh...');

        await new Promise(resolve => setTimeout(resolve, 1000));

        await page.reload();
        await page.waitForSelector('body', { timeout: 2000 });
      }
    };

    while (true) {
      try {
        await setMobileViewport(page);
        await page.goto(`https://www.qpon.id/platform/groupCouponDetail?skuId=${skuId}&productId=${productId}&storeId=`);
        await page.waitForSelector('body');

        const buyButtonSelector = 'button.adm-button._publicButton_1p6a9_38._publicButtonActive_1p6a9_58';
        await waitUntilEnabled(page, buyButtonSelector);
        await page.waitForSelector(buyButtonSelector, { timeout: 2000 });
        await page.evaluate((buyButtonSelector) => {
          const buyButton = document.querySelector(buyButtonSelector);
          if (buyButton) {
            buyButton.click();
          } else {
            console.error("'Beli Sekarang' tidak ditemukan");
          }
        }, buyButtonSelector);

        const confirmButtonSelector = 'div._foot_8iskh_45 > button._publicButton_1p6a9_38._publicButtonActive_1p6a9_58';
        await waitUntilEnabled(page, confirmButtonSelector);
        await page.waitForSelector(confirmButtonSelector, { timeout: 5000 });
        await page.evaluate((confirmButtonSelector) => {
          const confirmButton = document.querySelector(confirmButtonSelector);
          if (confirmButton) {
            confirmButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            confirmButton.click();
          } else {
            console.error("'Konfirmasi Pesanan' tidak ditemukan");
          }
        }, confirmButtonSelector);

        const payButtonSelector = 'div._bottomContainer_ce6si_1 > div._footer_16yrr_1 > button._publicButton_1ak8j_1._publicButtonActive_1ak8j_21';

        const isFlashSale = await page.evaluate(() => {
          const flashSaleElement = document.querySelector('div._LabelContainer_1swud_84 > div._productLabel_fcfci_38');
          return !!flashSaleElement; 
        });

        if (isFlashSale) {
          await waitUntilEnabled(page, payButtonSelector);
          await page.waitForSelector(payButtonSelector, { timeout: 300000 });
          await page.evaluate((payButtonSelector) => {
            const payButton = document.querySelector(payButtonSelector);
            if (payButton) {
              payButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
              payButton.click();
              kirimPesanTelegram(phoneNumber+' Cek Pesanan')
            } else {
              console.error("'Bayar' tidak ditemukan");
            }
          }, payButtonSelector);
        } else {
          console.log("kaga 'Flash Sale'.");
        }

      } catch (error) {
        console.error("Terjadi kesalahan selama proses", error);
      }
    }
  })();
});
