const puppeteer = require('puppeteer');
const readline = require('readline');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-geolocation',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  const page = await browser.newPage();

  const setMobileViewport = async (page) => {
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 10; Pixel 2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Mobile Safari/537.36');
    await page.setViewport({
      width: 320,
      height: 640,
      isMobile: true,
      hasTouch: true
    });
  };

  await setMobileViewport(page);
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://www.qpon.id', []);
  await page.goto('https://www.qpon.id/');
  await page.waitForSelector('body');
  await page.screenshot({ path: 'qpon_awal.png' });

  await setMobileViewport(page);
  await page.goto('https://www.qpon.id/platform/home/account');
  await page.waitForSelector('body');

  await page.evaluate(() => {
    const overlay = document.querySelector('.adm-mask');
    if (overlay) {
      overlay.remove();
    }
  });

  const inputSelector = 'input[type="tel"]';
  await page.waitForSelector(inputSelector);
  await page.focus(inputSelector);
  await page.type(inputSelector, '83813256237');

  await page.evaluate(() => {
    const overlay = document.querySelector('.adm-mask');
    if (overlay) {
      overlay.remove();
    }
  });

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

  const waitUntilEnabled = async (page, selector) => {
    while (true) {
      const buttonState = await page.evaluate((selector) => {
        const button = document.querySelector(selector);
        if (button && button.classList.contains('adm-button-disabled')) {
          console.log("Tombol 'Habis'");
          return "disabled";
        }
        return "enabled";
      }, selector);

      if (buttonState === "enabled") {
        break;
      }

      console.log('Habis, refresh...');
      await page.reload();
      await page.waitForSelector('body', { timeout: 5000 });
    }
  };

    await waitForEnterPress();

    console.log('lanjutkan..');

  while (true) {

    try {
      await setMobileViewport(page);
      await page.goto('https://www.qpon.id/platform/brandsHomepage?merchantId=117353540389701632&cpType=rydeen');
      await page.waitForSelector('body');
      await page.screenshot({ path: 'qpon_liat_voc.png' });

      await setMobileViewport(page);
      await page.goto('https://www.qpon.id/platform/groupCouponDetail?skuId=2191&productId=2191&storeId=');
      await page.waitForSelector('body');

      const buyButtonSelector = 'button.adm-button._publicButton_1p6a9_38._publicButtonActive_1p6a9_58';
      await waitUntilEnabled(page, buyButtonSelector);
      await page.waitForSelector(buyButtonSelector, { timeout: 5000 });
      await page.evaluate((buyButtonSelector) => {
        const buyButton = document.querySelector(buyButtonSelector);
        if (buyButton) {
          buyButton.click();
        } else {
          console.error("Elemen tombol 'Beli Sekarang' tidak ditemukan");
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
          console.error("Elemen tombol 'Konfirmasi Pesanan' tidak ditemukan");
        }
      }, confirmButtonSelector);
      await page.screenshot({ path: 'qpon_konfirmasi_beli.png' });

      const payButtonSelector = 'div._bottomContainer_ce6si_1 > div._footer_16yrr_1 > button._publicButton_1ak8j_1._publicButtonActive_1ak8j_21';
      await waitUntilEnabled(page, payButtonSelector);
      await page.waitForSelector(payButtonSelector, { timeout: 15000 });
      await page.evaluate((payButtonSelector) => {
        const payButton = document.querySelector(payButtonSelector);
        if (payButton) {
          payButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          payButton.click();
        } else {
          console.error("Elemen tombol 'Bayar' tidak ditemukan");
        }
      }, payButtonSelector);
      await page.screenshot({ path: 'qpon_klik_bayar.png' });
    } catch (error) {
      console.error("Terjadi kesalahan selama proses", error);
    }
  }
})();
