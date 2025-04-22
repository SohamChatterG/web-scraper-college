const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeFlipkart(term) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const searchUrl = `https://www.flipkart.com/search?q=${term}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    await page.waitForSelector('a.CGtC98'); // Wait for product cards

    const products = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('a.CGtC98'));
        return items.map(product => {
            const name = product.querySelector('.KzDlHZ')?.innerText || 'N/A';
            const currentPrice = product.querySelector('div._4b5DiR')?.innerText || 'N/A';
            const originalPrice = product.querySelector('div.ZYYwLA')?.innerText || 'N/A';
            const discount = product.querySelector('div.UkUFwK span')?.innerText || 'N/A';
            const rating = product.querySelector('div.XQDdHH')?.innerText || 'N/A';
            const ratingCount = product.querySelector('span.Wphh3N')?.innerText || 'N/A';
            const specs = Array.from(product.querySelectorAll('ul.G4BRas li')).map(li => li.innerText);

            return {
                "Product Name": name,
                "Current Price": currentPrice,
                "Original Price": originalPrice,
                "Discount": discount,
                "Rating": rating,
                "Rating and Reviews": ratingCount,
                "Specifications": specs.join(' | ')
            };
        });
    });

    await browser.close();

    const fileName = `${term}_products.csv`;
    const headers = [
        "Product Name", "Current Price", "Original Price",
        "Discount", "Rating", "Rating and Reviews", "Specifications"
    ];

    const csvContent = [headers.join(',')];
    products.forEach(prod => {
        csvContent.push(headers.map(h => `"${prod[h]}"`).join(','));
    });

    fs.writeFileSync(fileName, csvContent.join('\n'), 'utf-8');
    console.log(`✅ Scraped ${products.length} products and saved to '${fileName}'`);
}

// Entry point
const term = process.argv[2];
if (!term) {
    console.log("❌ Please provide a search term (e.g., 'mobile')");
    process.exit(1);
}
scrapeFlipkart(term);
