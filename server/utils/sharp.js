const sharp = require('sharp');
const fs = require('fs').promises;

const convertToJpeg = async (imagePath, outputPath) => {
    try {
        await sharp(imagePath).toFormat('jpeg').toFile(outputPath);
        await fs.unlink(imagePath);
        
    } catch (err) {
        console.error(`Error converting image to jpeg format or deleting image file: ${err}`);
    }
}

module.exports = {
    convertToJpeg
}