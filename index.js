const fs = require('fs');
const csvParser = require('csv-parser');
const PDFDocument = require('pdfkit');
const path = require('path');

const photoDirectory = 'Photos';
const templateImage = 'ute_id_template.png';
const csvFilePath = 'employees.csv';
const outputFilePath = 'id_cards.pdf';

function isImageValid(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile();
  } catch (error) {
    return false;
  }
}

async function generateIDCards() {
  const doc = new PDFDocument();
  let isFirstRow = true;

  const outputStream = fs.createWriteStream(outputFilePath);
  doc.pipe(outputStream);

  fs.createReadStream(csvFilePath)
    .pipe(csvParser({
        mapHeaders: ({ header }) => header.trim().toLowerCase() // Trim and convert to lowercase
    }))
    .on('headers', (headers) => {
        console.log('CSV Headers:', headers); // Log the headers to verify
    })
    .on('data', async (row) => {
        console.log('Row keys and values:', Object.keys(row).map(key => `${key}: ${row[key]}`)); // Detailed key-value pair logging
        if (!isFirstRow) {
            doc.addPage();
        }
        isFirstRow = false;

        const name = row.name;
        const title = row.title;
        const photo = row.photo;

        console.log(`Extracted Data: Name = ${name}, Title = ${title}, Photo = ${photo}`);

        const photoPath = path.join(photoDirectory, photo);

        if (!isImageValid(photoPath)) {
            console.log(`Error: Photo not found or invalid: ${photoPath}`);
            return;
        }

        try {
            doc.image(templateImage, 0, 0, { width: 600 });
            doc.fontSize(20).text(`Name: ${name}`, 100, 310);
            doc.fontSize(20).text(`Title: ${title}`, 100, 330);
            doc.image(photoPath, 350, 100, { width: 200, height: 150 });
        } catch (error) {
            console.error('Error during PDF generation:', error);
        }
    })
    .on('end', () => {
        doc.end();
        console.log('PDF generated successfully');
    })
    .on('error', (error) => {
        console.error('Error parsing CSV file:', error);
    });
}

generateIDCards();
